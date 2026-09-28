import { useEffect, useRef, type ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowLeft, ArrowRight, ExternalLink, X } from 'lucide-react'
import type { Content, Lang } from '~/content'
import { formatDate, pick, type News, type NewsCard, type Sponsor, type SponsorCard } from '~/lib/format'
import { Corners, Photo, cx, tw } from './ui'

const linkClass = 'group inline-flex items-center gap-2 font-mono text-xs tracking-[.06em] uppercase transition-colors hover:text-acc'

export function Modal({ label, closeLabel, onClose, children }: { label: string; closeLabel: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const d = ref.current
    if (!d) return
    d.showModal()
    const root = document.documentElement
    const prev = root.style.overflow
    root.style.overflow = 'hidden'
    const onCancel = (e: Event) => {
      e.preventDefault()
      onClose()
    }
    d.addEventListener('cancel', onCancel)
    return () => {
      d.removeEventListener('cancel', onCancel)
      root.style.overflow = prev
      d.close()
    }
  }, [onClose])

  return (
    <dialog
      ref={ref}
      aria-label={label}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="m-auto max-h-[calc(100dvh-32px)] w-[min(720px,calc(100vw-32px))] overflow-visible border border-line bg-bg p-0 text-fg backdrop:bg-black/70 backdrop:backdrop-blur-sm open:animate-modal-in"
    >
      <div className="relative max-h-[calc(100dvh-34px)] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          aria-label={closeLabel}
          className="absolute top-3 right-3 z-10 grid size-10 cursor-pointer place-items-center border border-line bg-bg text-fg transition-colors hover:text-acc"
        >
          <X size={18} aria-hidden="true" />
        </button>
        {children}
      </div>
      <Corners />
    </dialog>
  )
}

function Cover({ src, alt, className }: { src: string | null; alt: string; className?: string }) {
  return src ? (
    <img src={src} alt={alt} className={cx('block w-full object-cover', className)} />
  ) : (
    <Photo label={alt} corners={false} className={className} />
  )
}

function Meta({ date, tag }: { date: string; tag: string }) {
  return (
    <div className="flex gap-4 font-mono text-xs">
      <span className="text-mute">{formatDate(date)}</span>
      {tag && <span className="text-acc uppercase">{tag}</span>}
    </div>
  )
}

export function NewsPreview({ n, lang, c }: { n: NewsCard; lang: Lang; c: Content }) {
  const title = pick(n, 'title', lang)
  return (
    <article className="flex flex-col">
      <Cover src={n.imageUrl} alt={title} className="aspect-[16/8] border-0 border-b" />
      <div className="flex flex-col gap-4 p-6 md:p-8">
        <Meta date={n.date} tag={pick(n, 'tag', lang)} />
        <h2 className="m-0 font-display text-[34px] leading-[.95] font-extrabold uppercase md:text-[44px]">{title}</h2>
        <p className={tw.bodyMute}>{pick(n, 'excerpt', lang)}</p>
        <Link to="/$lang/novosti/$slug" params={{ lang, slug: n.slug }} className={cx(tw.btnRed, linkClass, 'mt-2 self-start px-[18px] py-[13px] hover:text-on-brand')}>
          {c.readFull}
          <ArrowRight size={16} aria-hidden="true" className="transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </article>
  )
}

function Logo({ s, className }: { s: SponsorCard; className?: string }) {
  return (
    <div className={cx('grid place-items-center border border-line p-6', className)}>
      {s.logoUrl ? (
        <img src={s.logoUrl} alt={s.name} className="max-h-full max-w-full object-contain" />
      ) : (
        <span className="font-display text-3xl font-bold uppercase">{s.name}</span>
      )}
    </div>
  )
}

function Website({ href, label }: { href: string; label: string }) {
  if (!href) return null
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={cx(linkClass, 'text-fg')}>
      {label}
      <ExternalLink size={14} aria-hidden="true" />
    </a>
  )
}

export function SponsorPreview({ s, lang, c }: { s: SponsorCard; lang: Lang; c: Content }) {
  return (
    <article className="flex flex-col gap-5 p-6 md:p-8">
      <Logo s={s} className="h-40 bg-ph" />
      <h2 className="m-0 font-display text-[34px] leading-[.95] font-extrabold uppercase md:text-[44px]">{s.name}</h2>
      <p className={tw.bodyMute}>{pick(s, 'summary', lang)}</p>
      <div className="flex flex-wrap items-center gap-5">
        <Link to="/$lang/sponzori/$slug" params={{ lang, slug: s.slug }} className={cx(tw.btnRed, linkClass, 'px-[18px] py-[13px] hover:text-on-brand')}>
          {c.sponsorMore}
          <ArrowRight size={16} aria-hidden="true" className="transition-transform group-hover:translate-x-0.5" />
        </Link>
        <Website href={s.website} label={c.visitWebsite} />
      </div>
    </article>
  )
}

function BackLink({ lang, to, label }: { lang: Lang; to: 'news' | 'home'; label: string }) {
  const cls = cx(linkClass, 'text-mute')
  const icon = <ArrowLeft size={16} aria-hidden="true" className="transition-transform group-hover:-translate-x-0.5" />
  return to === 'news' ? (
    <Link to="/$lang/novosti" params={{ lang }} className={cls}>
      {icon}
      {label}
    </Link>
  ) : (
    <Link to="/$lang" params={{ lang }} hash="sponzori" className={cls}>
      {icon}
      {label}
    </Link>
  )
}

function Rich({ html }: { html: string }) {
  // HTML je očišćen (sanitize-html) pri spremanju u adminu.
  return <div className="rich" dangerouslySetInnerHTML={{ __html: html }} />
}

export function NewsArticle({ n, lang, c }: { n: News; lang: Lang; c: Content }) {
  const title = pick(n, 'title', lang)
  return (
    <main className="wrap flex max-w-[880px] flex-col gap-7 py-10 md:py-16">
      <BackLink lang={lang} to="news" label={c.allNews} />
      <Meta date={n.date} tag={pick(n, 'tag', lang)} />
      <h1 className="m-0 font-display text-[44px] leading-[.9] font-extrabold text-balance uppercase md:text-[72px]">{title}</h1>
      <p className="m-0 text-lg leading-[1.55] text-mute md:text-xl">{pick(n, 'excerpt', lang)}</p>
      {n.imageUrl && (
        <div className="relative">
          <Cover src={n.imageUrl} alt={title} className="aspect-[16/9] border border-line" />
          <Corners />
        </div>
      )}
      <Rich html={pick(n, 'body', lang)} />
    </main>
  )
}

export function SponsorArticle({ s, lang, c }: { s: Sponsor; lang: Lang; c: Content }) {
  return (
    <main className="wrap flex max-w-[880px] flex-col gap-7 py-10 md:py-16">
      <BackLink lang={lang} to="home" label={c.sponTitle} />
      <div className="relative">
        <Logo s={s} className="h-56 bg-ph md:h-72" />
        <Corners />
      </div>
      <h1 className="m-0 font-display text-[44px] leading-[.9] font-extrabold uppercase md:text-[72px]">{s.name}</h1>
      <p className="m-0 text-lg leading-[1.55] text-mute md:text-xl">{pick(s, 'summary', lang)}</p>
      <Website href={s.website} label={c.visitWebsite} />
      <Rich html={pick(s, 'body', lang)} />
    </main>
  )
}

export function NotFound({ lang, c }: { lang: Lang; c: Content }) {
  return (
    <main className="wrap flex flex-col items-start gap-6 py-24">
      <h1 className={tw.h2}>404</h1>
      <p className={tw.bodyMute}>{c.notFound}</p>
      <Link to="/$lang" params={{ lang }} className={cx(linkClass, 'text-fg')}>
        <ArrowLeft size={16} aria-hidden="true" />
        {c.backHome}
      </Link>
    </main>
  )
}
