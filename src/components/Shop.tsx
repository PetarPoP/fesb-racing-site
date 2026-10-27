import { useEffect, useRef, useState } from 'react'
import { Minus, Plus, ShoppingBag, X } from 'lucide-react'
import type { Content, Lang } from '~/content'
import { addToCart, formatMoney, getProducts, loadCart, updateLine, type Cart, type Product, type ShopConfig } from '~/lib/shopify'
import { cx, tw } from './ui'

const topPad = 'pt-[clamp(104px,12vw,148px)] pb-10 md:pb-16'

/** Shown while the store is not connected (no domain or token in the CMS), or when Shopify does not answer. */
function ComingSoon({ c, error }: { c: Content; error?: boolean }) {
  return (
    <div className="grid min-h-[320px] place-items-center rounded-3xl border border-dashed border-fg/[.14] bg-panel p-8 text-center">
      <div className="flex max-w-[460px] flex-col items-center gap-4">
        <ShoppingBag size={40} strokeWidth={1.4} aria-hidden="true" className="text-acc" />
        <p className="display m-0 text-[clamp(26px,4vw,40px)] leading-none [font-stretch:115%] tracking-[-.02em]">{error ? c.shopError : c.shopSoon}</p>
        <p className={tw.bodyMute}>{c.shopSoonText}</p>
      </div>
    </div>
  )
}

function ProductCard({ p, lang, c, onOpen }: { p: Product; lang: Lang; c: Content; onOpen: () => void }) {
  const soldOut = p.variants.every((v) => !v.availableForSale)
  return (
    <button
      type="button"
      onClick={onOpen}
      data-dh="glow"
      data-dh-edge="20"
      className={cx(tw.card, 'group flex cursor-pointer flex-col overflow-hidden text-left press hover:border-acc/60 focus-visible:border-acc/60')}
    >
      <div className="relative aspect-square overflow-hidden bg-sunk">
        {p.featuredImage && (
          <img
            src={p.featuredImage.url}
            alt={p.featuredImage.altText ?? p.title}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        )}
        {soldOut && <span className="absolute top-3 left-3 rounded-full bg-fg px-3 py-1 text-[13px] font-semibold text-ink">{c.shopSoldOut}</span>}
      </div>
      <div className="flex flex-col gap-1.5 p-[clamp(16px,3vw,20px)]">
        <span className="text-[17px] leading-snug font-semibold">{p.title}</span>
        <span className="text-sm text-soft">{formatMoney(p.priceRange.minVariantPrice, lang)}</span>
      </div>
    </button>
  )
}

/** A product in a dialog: photos, text, variant choice and the add button. */
function ProductDialog({
  p,
  lang,
  c,
  busy,
  onAdd,
  onClose,
}: {
  p: Product
  lang: Lang
  c: Content
  busy: boolean
  onAdd: (variantId: string, qty: number) => void
  onClose: () => void
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const [variantId, setVariantId] = useState(() => (p.variants.find((v) => v.availableForSale) ?? p.variants[0])?.id ?? '')
  const [qty, setQty] = useState(1)
  const variant = p.variants.find((v) => v.id === variantId)
  const image = variant?.image ?? p.featuredImage
  useEffect(() => {
    ref.current?.showModal()
  }, [])
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && ref.current?.close()}
      aria-label={p.title}
      className="m-auto w-[min(100%-24px,920px)] max-w-none animate-modal-in overflow-hidden rounded-3xl border border-fg/10 bg-panel p-0 text-fg backdrop:bg-black/60 backdrop:backdrop-blur-[4px]"
    >
      <div className="grid max-h-[90svh] grid-cols-[repeat(auto-fit,minmax(min(100%,320px),1fr))] overflow-y-auto">
        <div className="relative aspect-square bg-sunk">
          {image && <img src={image.url} alt={image.altText ?? p.title} className="absolute inset-0 size-full object-cover" />}
        </div>
        <div className="flex flex-col gap-5 p-[clamp(20px,4vw,32px)]">
          <div className="flex items-start justify-between gap-4">
            <h2 className={cx(tw.cardTitle, 'normal-case')}>{p.title}</h2>
            <button type="button" onClick={() => ref.current?.close()} aria-label={c.close} className="press -mt-1 -mr-2 grid size-10 shrink-0 cursor-pointer place-items-center rounded-full hover:bg-fg/10">
              <X size={20} aria-hidden="true" />
            </button>
          </div>
          {variant && <span className="text-xl font-semibold">{formatMoney(variant.price, lang)}</span>}
          {p.description && <p className={cx(tw.bodyMute, 'whitespace-pre-line')}>{p.description}</p>}
          {p.variants.length > 1 && (
            <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
              <legend className="mb-2 text-sm text-mute">{c.shopVariant}</legend>
              <div className="flex flex-wrap gap-1.5">
                {p.variants.map((v) => (
                  <label
                    key={v.id}
                    className={cx(
                      'press cursor-pointer rounded-full border px-3.5 py-2 text-sm has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-40 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-acc',
                      v.id === variantId ? 'border-fg bg-fg text-ink' : 'border-fg/20 hover:border-acc',
                    )}
                  >
                    <input type="radio" name="variant" value={v.id} checked={v.id === variantId} disabled={!v.availableForSale} onChange={() => setVariantId(v.id)} className="sr-only" />
                    {v.title}
                  </label>
                ))}
              </div>
            </fieldset>
          )}
          <div className="mt-auto flex flex-wrap items-center gap-3 pt-2">
            <div className="flex items-center rounded-full border border-fg/20">
              <button type="button" aria-label={c.shopLess} onClick={() => setQty((q) => Math.max(1, q - 1))} className="press grid size-11 cursor-pointer place-items-center rounded-full hover:text-acc">
                <Minus size={16} aria-hidden="true" />
              </button>
              <span className="min-w-6 text-center font-semibold" aria-live="polite">
                {qty}
              </span>
              <button type="button" aria-label={c.shopMore} onClick={() => setQty((q) => q + 1)} className="press grid size-11 cursor-pointer place-items-center rounded-full hover:text-acc">
                <Plus size={16} aria-hidden="true" />
              </button>
            </div>
            <button
              type="button"
              disabled={!variant?.availableForSale || busy}
              onClick={() => variant && onAdd(variant.id, qty)}
              data-dh="wipe"
              data-dh-c="#f1e9e5"
              className={cx(tw.btnAcc, 'flex-1 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50')}
            >
              {variant?.availableForSale ? (busy ? c.fSending : c.shopAdd) : c.shopSoldOut}
            </button>
          </div>
        </div>
      </div>
    </dialog>
  )
}

/** The cart as a side panel: lines with quantity, the subtotal and the button to the Shopify checkout. */
function CartPanel({ cart, lang, c, busy, onQty, onClose }: { cart: Cart | null; lang: Lang; c: Content; busy: boolean; onQty: (lineId: string, q: number) => void; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    ref.current?.showModal()
  }, [])
  const lines = cart?.lines ?? []
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && ref.current?.close()}
      aria-label={c.shopCart}
      className="mt-0 mr-0 mb-0 ml-auto h-svh max-h-none w-[min(100%,440px)] max-w-none border-0 border-l border-fg/10 bg-panel p-0 text-fg backdrop:bg-black/50"
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-fg/10 px-5 py-4">
          <h2 className="m-0 text-lg font-semibold">{c.shopCart}</h2>
          <button type="button" onClick={() => ref.current?.close()} aria-label={c.close} className="press grid size-10 cursor-pointer place-items-center rounded-full hover:bg-fg/10">
            <X size={20} aria-hidden="true" />
          </button>
        </div>
        {lines.length === 0 ? (
          <p className="m-0 flex-1 p-5 text-mute">{c.shopEmpty}</p>
        ) : (
          <ul className="m-0 flex flex-1 list-none flex-col overflow-y-auto p-0">
            {lines.map((l) => (
              <li key={l.id} className="flex gap-4 border-b border-fg/10 px-5 py-4">
                <div className="size-20 shrink-0 overflow-hidden rounded-xl bg-sunk">
                  {l.merchandise.image && <img src={l.merchandise.image.url} alt="" className="size-full object-cover" />}
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="font-semibold">{l.merchandise.product.title}</span>
                  {l.merchandise.title !== 'Default Title' && <span className="text-sm text-mute">{l.merchandise.title}</span>}
                  <div className="mt-auto flex items-center justify-between gap-3">
                    <div className="flex items-center rounded-full border border-fg/20 text-sm">
                      <button type="button" disabled={busy} aria-label={c.shopLess} onClick={() => onQty(l.id, l.quantity - 1)} className="grid size-8 cursor-pointer place-items-center hover:text-acc">
                        <Minus size={14} aria-hidden="true" />
                      </button>
                      <span className="min-w-5 text-center">{l.quantity}</span>
                      <button type="button" disabled={busy} aria-label={c.shopMore} onClick={() => onQty(l.id, l.quantity + 1)} className="grid size-8 cursor-pointer place-items-center hover:text-acc">
                        <Plus size={14} aria-hidden="true" />
                      </button>
                    </div>
                    <span className="text-sm font-semibold">{formatMoney(l.cost.totalAmount, lang)}</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
        {cart && lines.length > 0 && (
          <div className="flex flex-col gap-3 border-t border-fg/10 p-5">
            <div className="flex justify-between text-lg font-semibold">
              <span>{c.shopSubtotal}</span>
              <span>{formatMoney(cart.cost.subtotalAmount, lang)}</span>
            </div>
            <a href={cart.checkoutUrl} className={cx(tw.btnAcc, 'text-center')} data-dh="wipe" data-dh-c="#f1e9e5">
              {c.shopCheckout}
            </a>
          </div>
        )}
      </div>
    </dialog>
  )
}

/** /shop: the products of the Shopify store. Products and cart load in the browser from the Storefront API. */
export function ShopPage({ c, lang }: { c: Content; lang: Lang }) {
  const cfg: ShopConfig | null = c.shop?.domain && c.shop.token ? { domain: c.shop.domain, token: c.shop.token } : null
  const [products, setProducts] = useState<Product[] | null>(null)
  const [error, setError] = useState(false)
  const [cart, setCart] = useState<Cart | null>(null)
  const [open, setOpen] = useState<Product | null>(null)
  const [cartOpen, setCartOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!cfg) return
    let live = true
    getProducts(cfg, lang)
      .then((p) => live && setProducts(p))
      .catch(() => live && setError(true))
    loadCart(cfg)
      .then((x) => live && setCart(x))
      .catch(() => {})
    return () => {
      live = false
    }
  }, [cfg?.domain, cfg?.token, lang])

  const run = async (fn: () => Promise<Cart | null>) => {
    setBusy(true)
    try {
      setCart(await fn())
      return true
    } catch {
      return false
    } finally {
      setBusy(false)
    }
  }

  const count = cart?.totalQuantity ?? 0
  return (
    <main className={cx('wrap flex flex-col gap-8', topPad)}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className={tw.h2}>{c.shopTitle}</h1>
        {cfg && (
          <button type="button" onClick={() => setCartOpen(true)} className={cx(tw.btnLight, 'flex cursor-pointer items-center gap-2')} data-dh="wipe" data-dh-c="#e2475b">
            <ShoppingBag size={18} aria-hidden="true" />
            {c.shopCart}
            {count > 0 && <span className="grid min-w-6 place-items-center rounded-full bg-acc px-1.5 text-[13px] text-ink">{count}</span>}
          </button>
        )}
      </div>
      <p className="m-0 max-w-[620px] text-[17px] leading-[1.55] text-soft">{c.shopText}</p>
      {!cfg || error || (products && products.length === 0) ? (
        <ComingSoon c={c} error={error} />
      ) : !products ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,260px),1fr))] gap-4" aria-busy="true">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="aspect-[4/5] animate-pulse rounded-[20px] bg-panel" />
          ))}
        </div>
      ) : (
        <div data-reveal="stagger" className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,260px),1fr))] gap-4">
          {products.map((p) => (
            <ProductCard key={p.id} p={p} lang={lang} c={c} onOpen={() => setOpen(p)} />
          ))}
        </div>
      )}
      {cfg && open && (
        <ProductDialog
          p={open}
          lang={lang}
          c={c}
          busy={busy}
          onClose={() => setOpen(null)}
          onAdd={async (id, q) => {
            if (await run(() => addToCart(cfg, id, q))) {
              setOpen(null)
              setCartOpen(true)
            }
          }}
        />
      )}
      {cfg && cartOpen && <CartPanel cart={cart} lang={lang} c={c} busy={busy} onClose={() => setCartOpen(false)} onQty={(id, q) => void run(() => updateLine(cfg, id, Math.max(0, q)))} />}
    </main>
  )
}
