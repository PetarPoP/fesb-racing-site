import { addDataAndFileToRequest, type CollectionBeforeChangeHook, type CollectionConfig, type PayloadRequest } from 'payload'
import { isLoggedIn } from '../access'

// Orders of the team shop. The shop is internal: the site asks for the shop password (Site settings → Shop)
// and sends it with each order to POST /api/orders/place. That endpoint takes the prices from the products
// (never from the visitor) and saves the order. With "Prati zalihu" on it also checks and lowers the stock,
// and a cancelled order puts its pieces back. GET /api/orders/summary (team only) adds up the ordered pieces.

export const ORDER_STATUSES = [
  { label: 'Nova', value: 'new' },
  { label: 'Potvrđena', value: 'confirmed' },
  { label: 'Poslana', value: 'shipped' },
  { label: 'Preuzeta', value: 'done' },
  { label: 'Otkazana', value: 'cancelled' },
]

const MAX_LINES = 30
const MAX_QTY = 20
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

type Size = { id?: string; size: string; stock: number }
type ProductDoc = { id: number; name: string; price: number; active?: boolean; sizes?: Size[] | null; stock?: number | null }
type Line = { product: number | { id: number }; name?: string; size?: string | null; qty: number; price?: number }

const str = (v: unknown, max: number) => String(v ?? '').trim().slice(0, max)
const productId = (p: Line['product']) => (typeof p === 'object' ? p.id : p)

/** Change the stock of the products of an order: -1 takes the pieces, +1 puts them back. */
async function moveStock(req: PayloadRequest, lines: Line[], sign: 1 | -1) {
  for (const line of lines) {
    const id = productId(line.product)
    const p = (await req.payload.findByID({ collection: 'products', id, depth: 0, req, overrideAccess: true, disableErrors: true })) as ProductDoc | null
    if (!p) continue
    const data = p.sizes?.length
      ? { sizes: p.sizes.map((s) => (s.size === line.size ? { ...s, stock: Math.max(0, s.stock + sign * line.qty) } : s)) }
      : { stock: Math.max(0, (p.stock ?? 0) + sign * line.qty) }
    await req.payload.update({ collection: 'products', id, data, depth: 0, req, overrideAccess: true, context: { skipRebuild: true } })
  }
}

/** A status change to or from "cancelled" moves the pieces back to stock, or takes them again. Only for an order that took stock. */
const stockOnCancel: CollectionBeforeChangeHook = async ({ data, originalDoc, operation, req }) => {
  if (operation !== 'update' || !originalDoc?.stockTaken || !data.status || data.status === originalDoc.status) return data
  const lines = (originalDoc.items ?? []) as Line[]
  if (data.status === 'cancelled') await moveStock(req, lines, 1)
  else if (originalDoc.status === 'cancelled') await moveStock(req, lines, -1)
  return data
}

/** A short order code, for example FR-7K2Q9. */
const orderCode = () => 'FR-' + Math.random().toString(36).slice(2, 7).toUpperCase()

type ShopSettings = { enabled?: boolean; delivery?: boolean; deliveryPrice?: number; password?: string | null; trackStock?: boolean }

const shopSettings = async (req: PayloadRequest) =>
  ((await req.payload.findGlobal({ slug: 'siteSettings', depth: 0, req, overrideAccess: true })) as { shop?: ShopSettings }).shop ?? {}

/** The shop password is right. A shop without a password is closed to everyone. A wrong try waits a little. */
async function passwordOk(shop: ShopSettings, given: unknown) {
  const ok = Boolean(shop.password) && String(given ?? '') === shop.password
  if (!ok) await new Promise((r) => setTimeout(r, 400))
  return ok
}

/** POST /api/orders/check: is this the shop password? */
async function checkPassword(req: PayloadRequest): Promise<Response> {
  await addDataAndFileToRequest(req)
  const body = (req.data ?? {}) as Record<string, unknown>
  const ok = await passwordOk(await shopSettings(req), body.password)
  return Response.json({ ok }, { status: ok ? 200 : 401 })
}

/** The ordered pieces per product and size, over all orders that are not cancelled. */
export async function orderSummary(req: PayloadRequest) {
  const rows = new Map<string, { product: string; size: string; qty: number; orders: number; total: number }>()
  let orders = 0
  let page = 1
  for (;;) {
    const res = await req.payload.find({ collection: 'orders', where: { status: { not_equals: 'cancelled' } }, depth: 0, limit: 200, page, req, overrideAccess: true })
    for (const o of res.docs as { items?: Line[] | null }[]) {
      orders += 1
      for (const l of o.items ?? []) {
        const key = `${l.name ?? productId(l.product)}|${l.size ?? ''}`
        const row = rows.get(key) ?? { product: String(l.name ?? productId(l.product)), size: l.size ?? '', qty: 0, orders: 0, total: 0 }
        row.qty += l.qty
        row.orders += 1
        row.total += (l.price ?? 0) * l.qty
        rows.set(key, row)
      }
    }
    if (!res.hasNextPage) break
    page += 1
  }
  const SIZE_ORDER = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', '3XL', '4XL']
  const rank = (s: string) => (SIZE_ORDER.indexOf(s.toUpperCase()) + 1 || 99)
  const list = [...rows.values()].sort((a, b) => a.product.localeCompare(b.product, 'hr') || rank(a.size) - rank(b.size) || a.size.localeCompare(b.size))
  return { orders, rows: list }
}

/** GET /api/orders/summary: the summary as JSON, for a logged-in user. */
async function summaryEndpoint(req: PayloadRequest): Promise<Response> {
  if (!req.user) return Response.json({ error: 'forbidden' }, { status: 403 })
  return Response.json(await orderSummary(req))
}

/** One CSV value. Semicolons, because Excel with Croatian settings splits on them. */
const csvCell = (v: unknown) => {
  const s = String(v ?? '')
  return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}
const csv = (rows: unknown[][]) => '\uFEFF' + rows.map((r) => r.map(csvCell).join(';')).join('\r\n') + '\r\n'
const STATUS_LABEL = Object.fromEntries(ORDER_STATUSES.map((s) => [s.value, s.label]))

/**
 * GET /api/orders/export (team only): a CSV file for Excel. Without a type: one row per ordered item with the
 * order and the member. With ?type=summary: the pieces per product and size.
 */
async function exportCsv(req: PayloadRequest): Promise<Response> {
  if (!req.user) return Response.json({ error: 'forbidden' }, { status: 403 })
  const day = new Date().toISOString().slice(0, 10)
  let body: string
  let name: string
  if (req.searchParams.get('type') === 'summary') {
    const { rows } = await orderSummary(req)
    body = csv([['Proizvod', 'Veličina', 'Komada', 'Narudžbi', 'Iznos (€)'], ...rows.map((r) => [r.product, r.size, r.qty, r.orders, r.total.toFixed(2)])])
    name = `zbroj-narudzbi-${day}.csv`
  } else {
    const out: unknown[][] = [['Narudžba', 'Datum', 'Status', 'Ime i prezime', 'E-mail', 'Telefon', 'Preuzimanje', 'Adresa', 'Proizvod', 'Veličina', 'Komada', 'Cijena (€)', 'Iznos (€)', 'Napomena']]
    let page = 1
    for (;;) {
      const res = await req.payload.find({ collection: 'orders', sort: 'createdAt', depth: 0, limit: 200, page, req, overrideAccess: true })
      for (const o of res.docs as Record<string, any>[]) {
        const date = String(o.createdAt ?? '').slice(0, 16).replace('T', ' ')
        for (const l of (o.items ?? []) as Line[]) {
          out.push([
            o.number,
            date,
            STATUS_LABEL[o.status] ?? o.status,
            o.customer?.name,
            o.customer?.email,
            o.customer?.phone,
            o.delivery === 'post' ? 'Pošta' : 'Osobno',
            o.delivery === 'post' ? o.address : '',
            l.name,
            l.size ?? '',
            l.qty,
            (l.price ?? 0).toFixed(2),
            ((l.price ?? 0) * l.qty).toFixed(2),
            o.note,
          ])
        }
      }
      if (!res.hasNextPage) break
      page += 1
    }
    body = csv(out)
    name = `narudzbe-${day}.csv`
  }
  return new Response(body, { headers: { 'content-type': 'text/csv; charset=utf-8', 'content-disposition': `attachment; filename="${name}"`, 'cache-control': 'no-store' } })
}

async function placeOrder(req: PayloadRequest): Promise<Response> {
  await addDataAndFileToRequest(req)
  const body = (req.data ?? {}) as Record<string, unknown>
  const customer = (body.customer ?? {}) as Record<string, unknown>
  const name = str(customer.name, 200)
  const email = str(customer.email, 200)
  const phone = str(customer.phone, 50)
  const delivery = body.delivery === 'post' ? 'post' : 'pickup'
  const address = str(body.address, 500)
  const note = str(body.note, 2000)
  const lang = body.lang === 'en' ? 'en' : 'hr'
  const raw = Array.isArray(body.items) ? body.items.slice(0, MAX_LINES) : []
  const wanted = raw
    .map((x) => x as Record<string, unknown>)
    .map((x) => ({ product: Number(x.product), size: str(x.size, 20) || null, qty: Math.min(MAX_QTY, Math.floor(Number(x.qty))) }))
    .filter((x) => Number.isInteger(x.product) && x.qty > 0)

  const invalid = !name || !EMAIL_RE.test(email) || !phone || (delivery === 'post' && !address) || wanted.length === 0
  if (invalid) return Response.json({ ok: false, error: 'invalid' }, { status: 400 })

  const shop = await shopSettings(req)
  if (!shop.enabled) return Response.json({ ok: false, error: 'closed' }, { status: 403 })
  if (!(await passwordOk(shop, body.password))) return Response.json({ ok: false, error: 'locked' }, { status: 401 })
  if (delivery === 'post' && !shop.delivery) return Response.json({ ok: false, error: 'invalid' }, { status: 400 })
  const track = Boolean(shop.trackStock)

  // The same product and size twice counts as one line.
  const merged = new Map<string, (typeof wanted)[number]>()
  for (const w of wanted) {
    const key = `${w.product}|${w.size ?? ''}`
    const prev = merged.get(key)
    merged.set(key, prev ? { ...prev, qty: prev.qty + w.qty } : w)
  }

  const lines: { product: number; name: string; size: string | null; qty: number; price: number }[] = []
  const short: { product: number; size: string | null; available: number }[] = []
  for (const w of merged.values()) {
    const p = (await req.payload.findByID({ collection: 'products', id: w.product, depth: 0, locale: lang, req, overrideAccess: true, disableErrors: true })) as ProductDoc | null
    if (!p || p.active === false) {
      short.push({ product: w.product, size: w.size, available: 0 })
      continue
    }
    const sized = Boolean(p.sizes?.length)
    const row = sized ? p.sizes!.find((s) => s.size === w.size) : null
    const available = sized ? (row?.stock ?? 0) : (p.stock ?? 0)
    if (track && w.qty > available) {
      short.push({ product: w.product, size: w.size, available })
      continue
    }
    lines.push({ product: p.id, name: p.name, size: sized ? w.size : null, qty: w.qty, price: p.price })
  }
  if (short.length) return Response.json({ ok: false, error: 'stock', short }, { status: 409 })

  const shipping = delivery === 'post' ? Math.max(0, shop.deliveryPrice ?? 0) : 0
  const total = Math.round((lines.reduce((s, l) => s + l.price * l.qty, 0) + shipping) * 100) / 100
  if (track) await moveStock(req, lines, -1)
  const order = await req.payload.create({
    collection: 'orders',
    data: { number: orderCode(), status: 'new', customer: { name, email, phone }, delivery, address, note, lang, items: lines, shipping, total, stockTaken: track },
    req,
    overrideAccess: true,
  })
  return Response.json({ ok: true, number: order.number, total })
}

export const Orders: CollectionConfig = {
  slug: 'orders',
  labels: { singular: 'Narudžba', plural: 'Narudžbe' },
  admin: {
    group: 'Shop',
    useAsTitle: 'number',
    defaultColumns: ['number', 'status', 'customer.name', 'total', 'createdAt'],
    description: 'Narudžbe iz shopa tima. Promijeni status kad narudžbu potvrdiš, pošalješ ili član preuzme. Koliko čega treba naručiti piše u „Zbroj narudžbi“.',
  },
  defaultSort: '-createdAt',
  access: { read: isLoggedIn, create: () => false, update: isLoggedIn, delete: isLoggedIn },
  endpoints: [
    { path: '/place', method: 'post', handler: placeOrder },
    { path: '/check', method: 'post', handler: checkPassword },
    { path: '/summary', method: 'get', handler: summaryEndpoint },
    { path: '/export', method: 'get', handler: exportCsv },
  ],
  hooks: { beforeChange: [stockOnCancel] },
  fields: [
    { name: 'number', label: 'Broj narudžbe', type: 'text', required: true, index: true, admin: { readOnly: true } },
    { name: 'status', label: 'Status', type: 'select', required: true, defaultValue: 'new', options: ORDER_STATUSES, admin: { position: 'sidebar' } },
    {
      name: 'customer',
      label: 'Kupac',
      type: 'group',
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'name', label: 'Ime i prezime', type: 'text', required: true, admin: { width: '33%' } },
            { name: 'email', label: 'E-mail', type: 'email', required: true, admin: { width: '33%' } },
            { name: 'phone', label: 'Telefon', type: 'text', admin: { width: '33%' } },
          ],
        },
      ],
    },
    {
      name: 'delivery',
      label: 'Preuzimanje',
      type: 'select',
      required: true,
      defaultValue: 'pickup',
      options: [
        { label: 'Osobno preuzimanje', value: 'pickup' },
        { label: 'Dostava poštom', value: 'post' },
      ],
    },
    { name: 'address', label: 'Adresa za dostavu', type: 'textarea', admin: { condition: (data) => data?.delivery === 'post' } },
    { name: 'note', label: 'Napomena kupca', type: 'textarea' },
    {
      name: 'items',
      label: 'Stavke',
      type: 'array',
      labels: { singular: 'Stavka', plural: 'Stavke' },
      admin: { readOnly: true },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'product', label: 'Proizvod', type: 'relationship', relationTo: 'products', admin: { width: '40%' } },
            { name: 'name', label: 'Naziv', type: 'text', admin: { width: '25%' } },
            { name: 'size', label: 'Veličina', type: 'text', admin: { width: '10%' } },
            { name: 'qty', label: 'Kom', type: 'number', admin: { width: '10%' } },
            { name: 'price', label: 'Cijena (€)', type: 'number', admin: { width: '15%' } },
          ],
        },
      ],
    },
    { name: 'shipping', label: 'Dostava (€)', type: 'number', defaultValue: 0, admin: { readOnly: true, position: 'sidebar' } },
    { name: 'total', label: 'Ukupno (€)', type: 'number', admin: { readOnly: true, position: 'sidebar' } },
    { name: 'lang', label: 'Jezik', type: 'select', defaultValue: 'hr', options: ['hr', 'en'], admin: { readOnly: true, position: 'sidebar' } },
    { name: 'internalNote', label: 'Interna bilješka', type: 'textarea', admin: { description: 'Vidi samo tim.' } },
    // The order lowered the stock ("Prati zalihu" was on). Only such an order puts its pieces back when cancelled.
    { name: 'stockTaken', type: 'checkbox', defaultValue: false, admin: { hidden: true } },
  ],
}
