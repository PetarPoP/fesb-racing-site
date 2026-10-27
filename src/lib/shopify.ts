// Small client for the Shopify Storefront API (products and cart). It runs in the browser only.
// The Storefront access token is a public token: Shopify made it for client-side use, so it may sit in the page.
// The store domain and the token come from the CMS (Site settings → Shop). Without them the shop page shows "coming soon".
import type { Lang } from '~/content'

const API_VERSION = '2025-07'
const CART_KEY = 'fesb-shop-cart'

export type ShopConfig = { domain: string; token: string }

export type Money = { amount: string; currencyCode: string }
export type ShopImage = { url: string; altText: string | null; width: number | null; height: number | null }
export type Variant = { id: string; title: string; availableForSale: boolean; price: Money; image: ShopImage | null }
export type Product = {
  id: string
  handle: string
  title: string
  description: string
  featuredImage: ShopImage | null
  images: ShopImage[]
  priceRange: { minVariantPrice: Money }
  variants: Variant[]
}
export type CartLine = {
  id: string
  quantity: number
  cost: { totalAmount: Money }
  merchandise: { id: string; title: string; product: { title: string; handle: string }; image: ShopImage | null }
}
export type Cart = { id: string; checkoutUrl: string; totalQuantity: number; cost: { subtotalAmount: Money }; lines: CartLine[] }

type Edges<T> = { edges: { node: T }[] }
const nodes = <T>(e: Edges<T> | undefined) => e?.edges.map((x) => x.node) ?? []

/** A store domain as the admin may paste it: with or without https:// and a trailing slash. */
export const cleanDomain = (d: string) => d.trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '')

async function gql<T>(cfg: ShopConfig, query: string, variables: Record<string, unknown> = {}): Promise<T> {
  const res = await fetch(`https://${cleanDomain(cfg.domain)}/api/${API_VERSION}/graphql.json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Shopify-Storefront-Access-Token': cfg.token },
    body: JSON.stringify({ query, variables }),
  })
  if (!res.ok) throw new Error(`Shopify ${res.status}`)
  const json = (await res.json()) as { data?: T; errors?: { message: string }[] }
  if (json.errors?.length || !json.data) throw new Error(json.errors?.[0]?.message ?? 'Shopify error')
  return json.data
}

const IMAGE = 'url altText width height'
const MONEY = 'amount currencyCode'
const PRODUCT = `id handle title description featuredImage { ${IMAGE} } images(first: 8) { edges { node { ${IMAGE} } } }
  priceRange { minVariantPrice { ${MONEY} } }
  variants(first: 50) { edges { node { id title availableForSale price { ${MONEY} } image { ${IMAGE} } } } }`
const CART = `id checkoutUrl totalQuantity cost { subtotalAmount { ${MONEY} } }
  lines(first: 50) { edges { node { id quantity cost { totalAmount { ${MONEY} } }
    merchandise { ... on ProductVariant { id title image { ${IMAGE} } product { title handle } } } } } }`

type RawProduct = Omit<Product, 'images' | 'variants'> & { images: Edges<ShopImage>; variants: Edges<Variant> }
type RawCart = Omit<Cart, 'lines'> & { lines: Edges<CartLine> }
const toProduct = (p: RawProduct): Product => ({ ...p, images: nodes(p.images), variants: nodes(p.variants) })
const toCart = (c: RawCart | null): Cart | null => (c ? { ...c, lines: nodes(c.lines) } : null)

/** Shopify language code. A store without a Croatian translation answers in its default language. */
const language = (lang: Lang) => (lang === 'hr' ? 'HR' : 'EN')

export async function getProducts(cfg: ShopConfig, lang: Lang): Promise<Product[]> {
  const data = await gql<{ products: Edges<RawProduct> }>(
    cfg,
    `query Products($language: LanguageCode) @inContext(language: $language) {
      products(first: 48, sortKey: BEST_SELLING) { edges { node { ${PRODUCT} } } }
    }`,
    { language: language(lang) },
  )
  return nodes(data.products).map(toProduct)
}

// ---------- cart ----------

const readCartId = () => {
  try {
    return localStorage.getItem(CART_KEY)
  } catch {
    return null
  }
}
const saveCartId = (id: string | null) => {
  try {
    if (id) localStorage.setItem(CART_KEY, id)
    else localStorage.removeItem(CART_KEY)
  } catch {
    // Private mode: the cart lasts until the page is closed.
  }
}

/** The saved cart, or null. A cart that Shopify no longer knows (paid or expired) is forgotten. */
export async function loadCart(cfg: ShopConfig): Promise<Cart | null> {
  const id = readCartId()
  if (!id) return null
  const data = await gql<{ cart: RawCart | null }>(cfg, `query Cart($id: ID!) { cart(id: $id) { ${CART} } }`, { id })
  if (!data.cart) saveCartId(null)
  return toCart(data.cart)
}

type CartResult = { cart: RawCart | null; userErrors: { message: string }[] }
const unwrap = (r: CartResult) => {
  if (r.userErrors.length) throw new Error(r.userErrors[0]!.message)
  const cart = toCart(r.cart)
  if (cart) saveCartId(cart.id)
  return cart
}

export async function addToCart(cfg: ShopConfig, merchandiseId: string, quantity = 1): Promise<Cart | null> {
  const id = readCartId()
  const lines = [{ merchandiseId, quantity }]
  if (id) {
    const data = await gql<{ cartLinesAdd: CartResult }>(
      cfg,
      `mutation Add($id: ID!, $lines: [CartLineInput!]!) { cartLinesAdd(cartId: $id, lines: $lines) { cart { ${CART} } userErrors { message } } }`,
      { id, lines },
    )
    // An unknown cart id gives cart null: start a new cart.
    if (data.cartLinesAdd.cart) return unwrap(data.cartLinesAdd)
  }
  const data = await gql<{ cartCreate: CartResult }>(
    cfg,
    `mutation Create($lines: [CartLineInput!]) { cartCreate(input: { lines: $lines }) { cart { ${CART} } userErrors { message } } }`,
    { lines },
  )
  return unwrap(data.cartCreate)
}

/** Set the quantity of one line. Quantity 0 removes the line. */
export async function updateLine(cfg: ShopConfig, lineId: string, quantity: number): Promise<Cart | null> {
  const id = readCartId()
  if (!id) return null
  const data = await gql<{ cartLinesUpdate: CartResult }>(
    cfg,
    `mutation Update($id: ID!, $lines: [CartLineUpdateInput!]!) { cartLinesUpdate(cartId: $id, lines: $lines) { cart { ${CART} } userErrors { message } } }`,
    { id, lines: [{ id: lineId, quantity }] },
  )
  return unwrap(data.cartLinesUpdate)
}

export function formatMoney(m: Money, lang: Lang) {
  return new Intl.NumberFormat(lang === 'hr' ? 'hr-HR' : 'en-GB', { style: 'currency', currency: m.currencyCode }).format(Number(m.amount))
}
