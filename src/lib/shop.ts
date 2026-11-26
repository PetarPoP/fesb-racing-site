import { useSyncExternalStore } from 'react'
import type { Lang } from '~/content'
import type { Img } from '~/lib/projects'

// The shop of the team. Products and orders live in the CMS (group "Shop"). The cart lives in the browser.
// The shop is internal: it asks for the shop password, which the browser keeps after the first right try.

export type ShopSize = { size: string; stock: number }

export type ShopProduct = {
  id: number
  slug: string
  name: string
  /** A category value of the CMS: majice, hoodie, jakne, kape, ostalo. */
  category: string
  price: number
  description: string
  images: Img[]
  /** Empty for a product without sizes. Its stock is then `stock`. */
  sizes: ShopSize[]
  /** The pieces on stock, over all sizes. */
  stock: number
}

/** trackStock off: the orders have no limit (the team collects orders before it orders the merch). */
export type ShopSettings = { enabled: boolean; pickup: string; delivery: boolean; deliveryPrice: number; trackStock: boolean }
export type ShopData = { products: ShopProduct[]; settings: ShopSettings }

export type CartLine = { id: number; size: string | null; qty: number }

export type OrderInput = {
  lang: Lang
  customer: { name: string; email: string; phone: string }
  delivery: 'pickup' | 'post'
  address: string
  note: string
  items: { product: number; size: string | null; qty: number }[]
  /** The shop password. The CMS refuses an order without the right one. */
  password: string
}
export type ShortLine = { product: number; size: string | null; available: number }
export type OrderResult = { ok: true; number: string; total: number } | { ok: false; error: 'stock' | 'invalid' | 'closed' | 'locked'; short?: ShortLine[] }

export const CATEGORIES = ['majice', 'hoodie', 'jakne', 'kape', 'ostalo'] as const
export const CATEGORY_LABEL: Record<Lang, Record<string, string>> = {
  hr: { majice: 'Majice', hoodie: 'Hoodiji', jakne: 'Jakne', kape: 'Kape', ostalo: 'Ostalo' },
  en: { majice: 'T-shirts', hoodie: 'Hoodies', jakne: 'Jackets', kape: 'Caps', ostalo: 'Other' },
}

export const formatPrice = (n: number, lang: Lang) =>
  new Intl.NumberFormat(lang === 'hr' ? 'hr-HR' : 'en-IE', { style: 'currency', currency: 'EUR', minimumFractionDigits: Number.isInteger(n) ? 0 : 2 }).format(n)

/** The pieces on stock of one size (or of a product without sizes). */
export const stockOf = (p: ShopProduct, size: string | null) => (p.sizes.length ? (p.sizes.find((s) => s.size === size)?.stock ?? 0) : p.stock)

// ---------- cart ----------

const KEY = 'fesb-shop-cart'
const MAX_QTY = 20
const listeners = new Set<() => void>()
let lines: CartLine[] | null = null

function read(): CartLine[] {
  if (lines) return lines
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? '[]') as unknown
    lines = Array.isArray(raw)
      ? raw
          .map((x) => x as CartLine)
          .filter((x) => Number.isInteger(x.id) && Number.isInteger(x.qty) && x.qty > 0)
          .map((x) => ({ id: x.id, size: typeof x.size === 'string' ? x.size : null, qty: Math.min(MAX_QTY, x.qty) }))
      : []
  } catch {
    lines = []
  }
  return lines
}

function write(next: CartLine[]) {
  lines = next
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    // Private mode or full storage: the cart lives until the page closes.
  }
  for (const l of listeners) l()
}

const EMPTY: CartLine[] = []
const subscribe = (fn: () => void) => {
  listeners.add(fn)
  // Another tab changed the cart.
  const onStorage = (e: StorageEvent) => {
    if (e.key !== KEY) return
    lines = null
    fn()
  }
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(fn)
    window.removeEventListener('storage', onStorage)
  }
}

/** The cart lines. The server render and the first client render see an empty cart. */
export const useCart = () => useSyncExternalStore(subscribe, read, () => EMPTY)

const same = (l: CartLine, id: number, size: string | null) => l.id === id && l.size === size

export const cart = {
  add(id: number, size: string | null, qty: number) {
    const cur = read()
    const hit = cur.find((l) => same(l, id, size))
    write(hit ? cur.map((l) => (l === hit ? { ...l, qty: Math.min(MAX_QTY, l.qty + qty) } : l)) : [...cur, { id, size, qty: Math.min(MAX_QTY, qty) }])
  },
  set(id: number, size: string | null, qty: number) {
    const cur = read()
    write(qty > 0 ? cur.map((l) => (same(l, id, size) ? { ...l, qty: Math.min(MAX_QTY, qty) } : l)) : cur.filter((l) => !same(l, id, size)))
  },
  clear() {
    write([])
  },
}

export const cartCount = (l: CartLine[]) => l.reduce((s, x) => s + x.qty, 0)

// ---------- password ----------

const PASS_KEY = 'fesb-shop-pass'
const passListeners = new Set<() => void>()
let pass: string | null | undefined

function readPass(): string | null {
  if (pass !== undefined) return pass
  try {
    pass = localStorage.getItem(PASS_KEY)
  } catch {
    pass = null
  }
  return pass
}

const subscribePass = (fn: () => void) => {
  passListeners.add(fn)
  return () => {
    passListeners.delete(fn)
  }
}

/** The shop password of this browser, or null. The server render sees null, so it renders the login. */
export const useShopPass = () => useSyncExternalStore(subscribePass, readPass, () => null)

export const shopPass = {
  get: readPass,
  set(value: string | null) {
    pass = value
    try {
      if (value) localStorage.setItem(PASS_KEY, value)
      else localStorage.removeItem(PASS_KEY)
    } catch {
      // Private mode: the password lives until the page closes.
    }
    for (const l of passListeners) l()
  },
}
