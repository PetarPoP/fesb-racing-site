import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowLeft, Check, Lock, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react'
import type { Content, Lang } from '~/content'
import { EMAIL_RE } from '~/lib/apply'
import { CATEGORIES, CATEGORY_LABEL, cart, cartCount, formatPrice, shopPass, stockOf, useCart, useShopPass, type ShopData, type ShopProduct } from '~/lib/shop'
import { checkShopPassword, getShop, placeOrder } from '~/lib/shopFns'
import { cx, tw } from './ui'

const topPad = 'pt-[clamp(104px,12vw,148px)] pb-10 md:pb-16'
const fill = (t: string, n: string | number) => t.replace('{n}', String(n))

/**
 * The shop data of the page, read again in the browser. A built page holds the stock of its build,
 * the fresh read shows the stock after the latest orders.
 */
function useShop(initial: ShopData, lang: Lang) {
  const [shop, setShop] = useState(initial)
  const refresh = () =>
    getShop({ data: lang })
      .then(setShop)
      .catch(() => {})
  useEffect(() => {
    void refresh()
  }, [lang])
  return { shop, refresh }
}

/** Shown while the shop is switched off in the CMS or has no products. */
function ComingSoon({ c }: { c: Content }) {
  return (
    <div className="grid min-h-[320px] place-items-center rounded-3xl border border-dashed border-fg/[.14] bg-panel p-8 text-center">
      <div className="flex max-w-[460px] flex-col items-center gap-4">
        <ShoppingBag size={40} strokeWidth={1.4} aria-hidden="true" className="text-acc" />
        <p className="display m-0 text-[clamp(26px,4vw,40px)] leading-none [font-stretch:115%] tracking-[-.02em]">{c.shopSoon}</p>
        <p className={tw.bodyMute}>{c.shopSoonText}</p>
      </div>
    </div>
  )
}

function CartButton({ lang, c }: { lang: Lang; c: Content }) {
  const count = cartCount(useCart())
  return (
    <Link to="/$lang/shop/kosarica" params={{ lang }} className={cx(tw.btnLight, 'flex items-center gap-2')} data-dh="wipe" data-dh-c="#e2475b">
      <ShoppingBag size={18} aria-hidden="true" />
      {c.shopCart}
      {count > 0 && <span className="grid min-w-6 place-items-center rounded-full bg-acc px-1.5 text-[13px] text-ink">{count}</span>}
    </Link>
  )
}

function BackToShop({ lang, c }: { lang: Lang; c: Content }) {
  return (
    <Link to="/$lang/shop" params={{ lang }} className={tw.backPill}>
      <ArrowLeft size={16} aria-hidden="true" className="transition-transform group-hover:-translate-x-0.5" />
      {c.shopBack}
    </Link>
  )
}

function Photo({ p, i = 0, className, eager }: { p: ShopProduct; i?: number; className?: string; eager?: boolean }) {
  const img = p.images[i]
  return (
    <div className={cx('relative overflow-hidden bg-sunk', className)}>
      {img ? (
        <img src={img.src} alt={p.name} width={img.w} height={img.h} loading={eager ? 'eager' : 'lazy'} decoding="async" className="absolute inset-0 size-full object-cover" />
      ) : (
        <ShoppingBag size={48} strokeWidth={1.2} aria-hidden="true" className="absolute inset-0 m-auto text-fg/20" />
      )}
    </div>
  )
}

/** Pill buttons as one radio group (categories, sizes, delivery). */
function Pills<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: { value: T; label: ReactNode; disabled?: boolean }[]; onChange: (v: T) => void }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          disabled={o.disabled}
          onClick={() => onChange(o.value)}
          className={cx(
            'press min-h-11 cursor-pointer rounded-full border px-4 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40 disabled:line-through',
            value === o.value ? 'border-fg bg-fg text-ink' : 'border-fg/20 text-fg hover:border-acc hover:text-acc',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

function Stepper({ value, max, onChange, c, small }: { value: number; max: number; onChange: (n: number) => void; c: Content; small?: boolean }) {
  const size = small ? 'size-8' : 'size-11'
  return (
    <div className={cx('flex items-center rounded-full border border-fg/20', small && 'text-sm')}>
      <button type="button" aria-label={c.shopLess} disabled={value <= 1} onClick={() => onChange(value - 1)} className={cx('press grid cursor-pointer place-items-center rounded-full hover:text-acc disabled:cursor-not-allowed disabled:opacity-40', size)}>
        <Minus size={small ? 14 : 16} aria-hidden="true" />
      </button>
      <span className="min-w-6 text-center font-semibold" aria-live="polite">
        {value}
      </span>
      <button type="button" aria-label={c.shopMore} disabled={value >= max} onClick={() => onChange(value + 1)} className={cx('press grid cursor-pointer place-items-center rounded-full hover:text-acc disabled:cursor-not-allowed disabled:opacity-40', size)}>
        <Plus size={small ? 14 : 16} aria-hidden="true" />
      </button>
    </div>
  )
}

function ProductCard({ p, lang, c, trackStock }: { p: ShopProduct; lang: Lang; c: Content; trackStock: boolean }) {
  return (
    <Link
      to="/$lang/shop/$slug"
      params={{ lang, slug: p.slug }}
      data-dh="glow"
      data-dh-edge="20"
      className={cx(tw.card, tw.cardHover, 'group press flex flex-col overflow-hidden')}
    >
      <div className="relative">
        <Photo p={p} className="aspect-square transition-transform duration-500 group-hover:scale-[1.03]" />
        {trackStock && p.stock === 0 && <span className="absolute top-3 left-3 rounded-full bg-fg px-3 py-1 text-[13px] font-semibold text-ink">{c.shopSoldOut}</span>}
      </div>
      <div className="flex flex-col gap-1.5 p-[clamp(16px,3vw,20px)]">
        <span className={cx(tw.mono, 'text-xs text-mute')}>{CATEGORY_LABEL[lang][p.category] ?? p.category}</span>
        <span className="text-[17px] leading-snug font-semibold">{p.name}</span>
        <span className="text-soft">{formatPrice(p.price, lang)}</span>
      </div>
    </Link>
  )
}

/** /shop: the products, with a filter by category. */
function ShopPageInner({ shop: initial, c, lang }: { shop: ShopData; c: Content; lang: Lang }) {
  const { shop } = useShop(initial, lang)
  const [cat, setCat] = useState<string>('all')
  const open = shop.settings.enabled && shop.products.length > 0
  const cats = CATEGORIES.filter((k) => shop.products.some((p) => p.category === k))
  const list = cat === 'all' ? shop.products : shop.products.filter((p) => p.category === cat)
  return (
    <main className={cx('wrap flex flex-col gap-8', topPad)}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className={tw.h2}>{c.shopTitle}</h1>
        {open && <CartButton lang={lang} c={c} />}
      </div>
      <p className="m-0 max-w-[620px] text-[17px] leading-[1.55] text-soft">{c.shopText}</p>
      {!open ? (
        <ComingSoon c={c} />
      ) : (
        <>
          {cats.length > 1 && (
            <Pills
              label={c.shopTitle}
              value={cat}
              onChange={setCat}
              options={[{ value: 'all', label: c.shopAll }, ...cats.map((k) => ({ value: k as string, label: CATEGORY_LABEL[lang][k] }))]}
            />
          )}
          <div key={cat} data-reveal="stagger" className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,260px),1fr))] gap-4">
            {list.map((p) => (
              <ProductCard key={p.id} p={p} lang={lang} c={c} trackStock={shop.settings.trackStock} />
            ))}
          </div>
        </>
      )}
    </main>
  )
}

/** /shop/<product>: photos, price, size and quantity, and the add button. */
function ProductPageInner({ shop: initial, slug, c, lang }: { shop: ShopData; slug: string; c: Content; lang: Lang }) {
  const { shop } = useShop(initial, lang)
  const p = shop.products.find((x) => x.slug === slug)
  const lines = useCart()
  const sized = Boolean(p?.sizes.length)
  const [size, setSize] = useState<string | null>(null)
  const [qty, setQty] = useState(1)
  const [shot, setShot] = useState(0)
  const [added, setAdded] = useState(false)
  const [needSize, setNeedSize] = useState(false)
  if (!p) return null

  const chosen = sized ? size : null
  // The pieces in the cart count against the stock.
  const inCart = lines.find((l) => l.id === p.id && l.size === chosen)?.qty ?? 0
  const left = sized && !size ? Math.max(0, ...p.sizes.map((s) => s.stock)) : Math.max(0, stockOf(p, chosen) - inCart)
  const soldOut = p.stock === 0

  const add = () => {
    if (sized && !size) return setNeedSize(true)
    if (qty > left) return
    cart.add(p.id, chosen, qty)
    setAdded(true)
    setQty(1)
  }

  return (
    <main className={cx('wrap flex flex-col gap-10', topPad)}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <BackToShop lang={lang} c={c} />
        <CartButton lang={lang} c={c} />
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,400px),1fr))] items-start gap-[clamp(24px,5vw,64px)]">
        <div className="flex flex-col gap-3">
          <Photo p={p} i={shot} eager className="aspect-square rounded-3xl border border-fg/10" />
          {p.images.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {p.images.map((img, i) => (
                <button
                  key={img.src}
                  type="button"
                  aria-label={`${p.name} ${i + 1}`}
                  aria-pressed={shot === i}
                  onClick={() => setShot(i)}
                  className={cx('press size-20 cursor-pointer overflow-hidden rounded-xl border-2', shot === i ? 'border-acc' : 'border-transparent hover:border-fg/30')}
                >
                  <img src={img.src} alt="" loading="lazy" className="size-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <span className={cx(tw.mono, 'text-sm text-mute')}>{CATEGORY_LABEL[lang][p.category] ?? p.category}</span>
            <h1 className="display m-0 text-[clamp(36px,5vw,64px)] leading-[.9] text-balance normal-case">{p.name}</h1>
            <span className="text-2xl font-semibold">{formatPrice(p.price, lang)}</span>
          </div>
          {p.description && <p className={cx(tw.bodyMute, 'whitespace-pre-line')}>{p.description}</p>}

          {sized && (
            <div className="flex flex-col gap-2">
              <span className="text-sm text-mute">
                {c.shopSize}
              </span>
              <Pills
                label={c.shopSize}
                value={size ?? ''}
                onChange={(s) => {
                  setSize(s)
                  setQty(1)
                  setNeedSize(false)
                  setAdded(false)
                }}
                options={p.sizes.map((s) => ({ value: s.size, label: s.size, disabled: s.stock === 0 }))}
              />
              {needSize && (
                <span role="alert" className="animate-fade-up text-sm text-acc">
                  {c.shopPickSize}
                </span>
              )}
            </div>
          )}

          {shop.settings.trackStock && (
            <p className="m-0 text-sm text-mute" aria-live="polite">
              {soldOut ? c.shopSoldOut : !sized || size ? (left > 0 && left <= 3 ? fill(c.shopLow, left) : fill(c.shopInStock, left)) : fill(c.shopInStock, p.stock)}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <Stepper value={qty} max={Math.max(1, left)} onChange={(n) => setQty(Math.max(1, n))} c={c} />
            <button
              type="button"
              disabled={soldOut || left === 0}
              onClick={add}
              data-dh="wipe"
              data-dh-c="#f1e9e5"
              className={cx(tw.btnAcc, 'flex-1 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50')}
            >
              {soldOut || left === 0 ? c.shopSoldOut : c.shopAdd}
            </button>
          </div>

          {added && (
            <div role="status" className="flex animate-pop-in flex-wrap items-center gap-x-4 gap-y-2">
              <span className="flex items-center gap-2">
                <Check size={18} aria-hidden="true" className="text-acc" />
                {c.shopAdded}
              </span>
              <Link to="/$lang/shop/kosarica" params={{ lang }} className="font-semibold text-acc underline-offset-4 hover:underline">
                {c.shopViewCart}
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

type FormField = 'name' | 'email' | 'phone' | 'address'

const inputClass =
  'block w-full rounded-[14px] border border-fg/10 bg-bg px-[18px] py-4 text-base text-fg caret-acc outline-none transition-colors placeholder:text-mute focus:border-acc aria-[invalid=true]:border-acc'

/** /shop/kosarica: the cart lines and the order form. */
function CartPageInner({ shop: initial, c, lang }: { shop: ShopData; c: Content; lang: Lang }) {
  const { shop, refresh } = useShop(initial, lang)
  const lines = useCart()
  const [delivery, setDelivery] = useState<'pickup' | 'post'>('pickup')
  const [errors, setErrors] = useState<Partial<Record<FormField, true>>>({})
  const [status, setStatus] = useState<'idle' | 'sending' | 'error' | 'short' | 'closed'>('idle')
  const [done, setDone] = useState<{ number: string; post: boolean } | null>(null)

  const byId = useMemo(() => new Map(shop.products.map((p) => [p.id, p])), [shop.products])
  // A line of a product that is gone from the shop is left out.
  const rows = lines.flatMap((l) => {
    const p = byId.get(l.id)
    return p ? [{ ...l, p }] : []
  })
  const subtotal = rows.reduce((s, r) => s + r.p.price * r.qty, 0)
  const post = delivery === 'post' && shop.settings.delivery
  const shipping = post ? shop.settings.deliveryPrice : 0

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    const v = (k: string) => String(f.get(k) ?? '').trim()
    const errs: Partial<Record<FormField, true>> = {}
    if (!v('name')) errs.name = true
    if (!EMAIL_RE.test(v('email'))) errs.email = true
    if (!v('phone')) errs.phone = true
    if (post && !v('address')) errs.address = true
    setErrors(errs)
    if (Object.keys(errs).length) return
    setStatus('sending')
    try {
      const r = await placeOrder({
        data: {
          lang,
          customer: { name: v('name'), email: v('email'), phone: v('phone') },
          delivery: post ? 'post' : 'pickup',
          address: post ? v('address') : '',
          note: v('note'),
          items: rows.map((r) => ({ product: r.id, size: r.size, qty: r.qty })),
          password: shopPass.get() ?? '',
        },
      })
      if (r.ok) {
        cart.clear()
        setDone({ number: r.number, post })
        setStatus('idle')
        void refresh()
        return
      }
      if (r.error === 'stock') {
        // Lower each short line to what is left, so the visitor sees what can still be ordered.
        for (const s of r.short ?? []) cart.set(s.product, s.size, s.available)
        await refresh()
      }
      if (r.error === 'locked') {
        // The password changed in the CMS. The login comes back with a note; the cart stays.
        lockedNote = true
        shopPass.set(null)
        return
      }
      setStatus(r.error === 'stock' ? 'short' : r.error === 'closed' ? 'closed' : 'error')
    } catch {
      setStatus('error')
    }
  }

  const field = (name: FormField, label: string, type: string, auto: string, err: string, multiline = false) => (
    <div>
      <label className="block">
        <span className="sr-only">{label}</span>
        {multiline ? (
          <textarea
            name={name}
            rows={3}
            autoComplete={auto}
            placeholder={label}
            aria-invalid={errors[name] ? true : undefined}
            onChange={() => errors[name] && setErrors((e) => ({ ...e, [name]: undefined }))}
            className={cx(inputClass, 'min-h-24 resize-y')}
          />
        ) : (
          <input
            name={name}
            type={type}
            autoComplete={auto}
            placeholder={label}
            aria-invalid={errors[name] ? true : undefined}
            onChange={() => errors[name] && setErrors((e) => ({ ...e, [name]: undefined }))}
            className={inputClass}
          />
        )}
      </label>
      {errors[name] && <div className="animate-fade-up pt-1.5 pl-1 text-sm text-acc">{err}</div>}
    </div>
  )

  return (
    <main className={cx('wrap flex flex-col gap-8', topPad)}>
      <BackToShop lang={lang} c={c} />
      <h1 className={tw.h2}>{done ? c.shopDone : c.shopCart}</h1>

      {done ? (
        <div role="status" className={cx(tw.card, 'flex max-w-[620px] animate-pop-in flex-col gap-4 p-[clamp(20px,4vw,28px)]')}>
          <Check size={32} aria-hidden="true" className="text-acc" />
          <p className="m-0 text-[17px] leading-[1.6]">{fill(c.shopDoneText, done.number)}</p>
          {shop.settings.pickup && !done.post && <p className={cx(tw.bodyMute, 'whitespace-pre-line')}>{shop.settings.pickup}</p>}
          <Link to="/$lang/shop" params={{ lang }} className={cx(tw.btnLight, 'self-start')} data-dh="wipe" data-dh-c="#e2475b">
            {c.shopBrowse}
          </Link>
        </div>
      ) : !shop.settings.enabled ? (
        <ComingSoon c={c} />
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-start gap-5">
          <p className={tw.bodyMute}>{c.shopEmpty}</p>
          <Link to="/$lang/shop" params={{ lang }} className={tw.btnLight} data-dh="wipe" data-dh-c="#e2475b">
            {c.shopBrowse}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,420px),1fr))] items-start gap-[clamp(24px,4vw,48px)]">
          <ul className={cx(tw.card, 'm-0 flex list-none flex-col p-0')}>
            {rows.map((r) => {
              const max = stockOf(r.p, r.size)
              return (
                <li key={`${r.id}|${r.size}`} className="flex gap-4 border-b border-fg/10 p-[clamp(14px,3vw,20px)] last:border-b-0">
                  <Link to="/$lang/shop/$slug" params={{ lang, slug: r.p.slug }} className="shrink-0" tabIndex={-1} aria-hidden="true">
                    <Photo p={r.p} className="size-20 rounded-xl sm:size-24" />
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex items-start justify-between gap-3">
                      <Link to="/$lang/shop/$slug" params={{ lang, slug: r.p.slug }} className="font-semibold hover:text-acc">
                        {r.p.name}
                      </Link>
                      <button type="button" aria-label={`${c.shopRemove}: ${r.p.name}`} onClick={() => cart.set(r.id, r.size, 0)} className="press -mt-1.5 -mr-1.5 grid size-9 shrink-0 cursor-pointer place-items-center rounded-full text-mute hover:bg-fg/10 hover:text-acc">
                        <Trash2 size={16} aria-hidden="true" />
                      </button>
                    </div>
                    {r.size && (
                      <span className="text-sm text-mute">
                        {c.shopSize}: {r.size}
                      </span>
                    )}
                    <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-2">
                      <Stepper small value={r.qty} max={Math.max(r.qty, max)} onChange={(n) => cart.set(r.id, r.size, Math.max(1, n))} c={c} />
                      <span className="font-semibold">{formatPrice(r.p.price * r.qty, lang)}</span>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>

          <form onSubmit={onSubmit} noValidate className="flex flex-col gap-3 rounded-3xl border border-fg/10 bg-panel p-[clamp(18px,5vw,28px)]">
            <h2 className="display m-0 mb-2 text-[clamp(24px,3vw,32px)] leading-none [font-stretch:115%] tracking-[-.02em]">{c.shopFormTitle}</h2>
            {field('name', c.fName, 'text', 'name', c.errName)}
            {field('email', c.fMail, 'email', 'email', c.errMail)}
            {field('phone', c.shopPhone, 'tel', 'tel', c.errPhone)}

            {shop.settings.delivery && (
              <div className="mt-2 flex flex-col gap-2">
                <span className="text-sm text-mute">{c.shopDelivery}</span>
                <Pills
                  label={c.shopDelivery}
                  value={delivery}
                  onChange={setDelivery}
                  options={[
                    { value: 'pickup', label: c.shopPickup },
                    { value: 'post', label: `${c.shopPost} (${shop.settings.deliveryPrice > 0 ? formatPrice(shop.settings.deliveryPrice, lang) : c.shopFree})` },
                  ]}
                />
              </div>
            )}
            {post && field('address', c.shopAddress, 'text', 'street-address', c.errAddress, true)}
            <label className="block">
              <span className="sr-only">{c.shopNote}</span>
              <textarea name="note" rows={2} placeholder={c.shopNote} className={cx(inputClass, 'min-h-20 resize-y')} />
            </label>

            {shop.settings.pickup && !post && <p className="m-0 text-sm leading-[1.6] whitespace-pre-line text-soft">{shop.settings.pickup}</p>}

            <dl className="m-0 mt-2 flex flex-col border-t border-fg/10 pt-3">
              <div className="flex justify-between py-1 text-soft">
                <dt>{c.shopSubtotal}</dt>
                <dd className="m-0">{formatPrice(subtotal, lang)}</dd>
              </div>
              {post && (
                <div className="flex justify-between py-1 text-soft">
                  <dt>{c.shopShipping}</dt>
                  <dd className="m-0">{shipping > 0 ? formatPrice(shipping, lang) : c.shopFree}</dd>
                </div>
              )}
              <div className="flex justify-between py-1 text-lg font-semibold">
                <dt>{c.shopTotal}</dt>
                <dd className="m-0">{formatPrice(subtotal + shipping, lang)}</dd>
              </div>
            </dl>

            {status !== 'idle' && status !== 'sending' && (
              <div role="alert" className="animate-fade-up text-sm text-acc">
                {status === 'short' ? c.shopShort : status === 'closed' ? c.shopClosed : c.errServer}
              </div>
            )}
            <button
              type="submit"
              disabled={status === 'sending'}
              data-dh="wipe"
              data-dh-c="#f1e9e5"
              className="press mt-2 cursor-pointer rounded-full bg-acc px-5 py-4 text-center text-[15px] font-semibold text-ink hover:text-ink disabled:cursor-wait disabled:opacity-70"
            >
              {status === 'sending' ? c.fSending : c.shopOrder}
            </button>
          </form>
        </div>
      )}
    </main>
  )
}

// ---------- password ----------

/** Set when an order came back "locked": the login then says that the password changed. */
let lockedNote = false

/** The login of the team shop. The CMS checks the password; the browser keeps it after a right try. */
function ShopLogin({ c, lang }: { c: Content; lang: Lang }) {
  const [status, setStatus] = useState<'idle' | 'checking' | 'wrong' | 'error'>('idle')
  const [note] = useState(() => lockedNote)
  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const value = String(new FormData(e.currentTarget).get('password') ?? '').trim()
    if (!value) return setStatus('wrong')
    setStatus('checking')
    try {
      if (await checkShopPassword({ data: value })) {
        lockedNote = false
        shopPass.set(value)
      } else setStatus('wrong')
    } catch {
      setStatus('error')
    }
  }
  return (
    <main className={cx('wrap flex flex-col gap-8', topPad)}>
      <form onSubmit={onSubmit} noValidate className={cx(tw.card, 'flex w-full max-w-[460px] flex-col gap-4 p-[clamp(20px,4vw,28px)]')}>
        <Lock size={32} strokeWidth={1.6} aria-hidden="true" className="text-acc" />
        <h1 className="display m-0 text-[clamp(30px,5vw,44px)] leading-none [font-stretch:115%] tracking-[-.02em]">{c.shopLocked}</h1>
        <p className={tw.bodyMute}>{note ? c.shopPassChanged : c.shopLockedText}</p>
        <label className="block">
          <span className="sr-only">{c.shopPass}</span>
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder={c.shopPass}
            aria-invalid={status === 'wrong' ? true : undefined}
            aria-describedby={status === 'wrong' || status === 'error' ? 'pass-err' : undefined}
            onChange={() => status === 'wrong' && setStatus('idle')}
            className={inputClass}
          />
        </label>
        {(status === 'wrong' || status === 'error') && (
          <div id="pass-err" role="alert" className="animate-fade-up pl-1 text-sm text-acc">
            {status === 'wrong' ? c.shopWrongPass : c.errServer}
          </div>
        )}
        <button type="submit" disabled={status === 'checking'} className={cx(tw.btnLight, 'self-start disabled:opacity-60')} data-dh="wipe" data-dh-c="#e2475b">
          {c.shopEnter}
        </button>
      </form>
      <Link to="/$lang" params={{ lang }} className={tw.backPill}>
        <ArrowLeft size={16} aria-hidden="true" />
        {c.backHome}
      </Link>
    </main>
  )
}

/**
 * The shop pages behind the password. The server render and the first render show the login, so a built page
 * holds no shop view. A kept password is checked again once, in case it changed in the CMS.
 */
function Gate({ c, lang, children }: { c: Content; lang: Lang; children: ReactNode }) {
  const pass = useShopPass()
  useEffect(() => {
    if (!pass) return
    checkShopPassword({ data: pass })
      .then((ok) => {
        if (!ok) shopPass.set(null)
      })
      .catch(() => {})
  }, [pass])
  return pass ? <>{children}</> : <ShopLogin c={c} lang={lang} />
}

export function ShopPage(props: { shop: ShopData; c: Content; lang: Lang }) {
  return (
    <Gate c={props.c} lang={props.lang}>
      <ShopPageInner {...props} />
    </Gate>
  )
}

export function ProductPage(props: { shop: ShopData; slug: string; c: Content; lang: Lang }) {
  return (
    <Gate c={props.c} lang={props.lang}>
      <ProductPageInner {...props} />
    </Gate>
  )
}

export function CartPage(props: { shop: ShopData; c: Content; lang: Lang }) {
  return (
    <Gate c={props.c} lang={props.lang}>
      <CartPageInner {...props} />
    </Gate>
  )
}
