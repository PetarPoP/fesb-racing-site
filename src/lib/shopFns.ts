import { createServerFn } from '@tanstack/react-start'
import { isLang, type Lang } from '~/content'
import { getCmsShop, postCmsOrder } from '~/server/cms'
import { EMAIL_RE } from '~/lib/apply'
import type { OrderInput, ShopData } from '~/lib/shop'

const EMPTY: ShopData = { products: [], settings: { enabled: false, pickup: '', delivery: false, deliveryPrice: 0 } }
const langInput = (lang: unknown): Lang => (isLang(lang) ? lang : 'hr')
const str = (v: unknown, max: number) => String(v ?? '').trim().slice(0, max)

/** Products and shop settings. A CMS that is down gives an empty shop. */
export const getShop = createServerFn({ method: 'GET' })
  .validator(langInput)
  .handler(async ({ data }) => (await getCmsShop(data)) ?? EMPTY)

/** Place an order. The CMS checks it again, takes the prices from the products and lowers the stock. */
export const placeOrder = createServerFn({ method: 'POST' })
  .validator((raw: unknown): OrderInput => {
    const d = (raw ?? {}) as Record<string, unknown>
    const c = (d.customer ?? {}) as Record<string, unknown>
    const items = (Array.isArray(d.items) ? d.items : []).slice(0, 30).map((x) => {
      const i = (x ?? {}) as Record<string, unknown>
      return { product: Number(i.product), size: i.size == null ? null : str(i.size, 20), qty: Math.floor(Number(i.qty)) }
    })
    const order: OrderInput = {
      lang: langInput(d.lang),
      customer: { name: str(c.name, 200), email: str(c.email, 200), phone: str(c.phone, 50) },
      delivery: d.delivery === 'post' ? 'post' : 'pickup',
      address: str(d.address, 500),
      note: str(d.note, 2000),
      items: items.filter((i) => Number.isInteger(i.product) && i.qty > 0),
    }
    const bad = !order.customer.name || !EMAIL_RE.test(order.customer.email) || !order.customer.phone || (order.delivery === 'post' && !order.address) || !order.items.length
    if (bad) throw new Error('invalid')
    return order
  })
  .handler(({ data }) => postCmsOrder(data))
