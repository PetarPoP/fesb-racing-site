import { useEffect, useRef, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowRight, ArrowUpRight } from 'lucide-react'
import type { Content, Lang } from '~/content'
import { formatDate, pick, type NewsCard } from '~/lib/format'
import { SECTION_IDS } from '~/content'
import { DitherCanvas, useDriveBy } from './Dither'
import { SectionLink } from './Header'
import { PARTNERS, PARTNER_TIERS, partnerLogoSize, partnerUrl, type Partner } from '~/lib/partners'
import { cx, tw } from './ui'

// Lucide više nema ikone brendova, pa su obrisi ovdje ručno, u istom stilu linija.
const SOCIALS = [
  {
    name: 'Instagram',
    href: 'https://www.instagram.com/fesbracing',
    icon: (
      <>
        <rect x="2" y="2" width="20" height="20" rx="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <path d="M17.5 6.5h.01" />
      </>
    ),
  },
  {
    name: 'Facebook',
    href: 'https://www.facebook.com/FesbRacing/?locale=hr_HR',
    icon: <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />,
  },
  {
    name: 'LinkedIn',
    href: 'https://hr.linkedin.com/company/fesb-racing',
    icon: (
      <>
        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
        <rect x="2" y="9" width="4" height="12" />
        <circle cx="4" cy="4" r="2" />
      </>
    ),
  },
]

export function Ticker({ c }: { c: Content }) {
  const words = c.ticker ?? [...c.comps.map((k) => k.name), '18+', 'Formula Student', 'MotoStudent']
  const trackRef = useRef<HTMLDivElement>(null)

  // The track holds three equal copies. One copy scrolls past at 40 px/s.
  useEffect(() => {
    const el = trackRef.current
    if (!el) return
    const set = () => {
      const w = el.scrollWidth / 3
      if (w > 0) el.style.animationDuration = `${w / 40}s`
    }
    set()
    const ro = new ResizeObserver(set)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return (
    <div className="overflow-hidden border-y border-fg/10">
      <div
        ref={trackRef}
        className="flex w-max animate-ticker py-[clamp(16px,2.4vw,22px)] motion-reduce:animate-none"
      >
        {[0, 1, 2].map((copy) =>
          words.map((w, i) => (
            <span
              key={`${copy}-${i}`}
              aria-hidden={copy > 0 || undefined}
              className="flex items-center gap-10 pr-10 text-[clamp(16px,2.4vw,20px)] font-semibold whitespace-nowrap text-[#c9bdb9] [font-stretch:112%]"
            >
              {w}
              <span className="size-[5px] rounded-full bg-acc" aria-hidden="true" />
            </span>
          )),
        )}
      </div>
    </div>
  )
}

export function Stats({ c }: { c: Content }) {
  return (
    <section className="mx-auto w-full max-w-[1344px] px-[clamp(20px,3.4vw,48px)] pt-[clamp(56px,9vw,96px)]">
      <div className="grid grid-cols-2 border-t border-fg/[.14] min-[900px]:grid-cols-4">
        {c.stats.map((s) => (
          <div key={s.l} className="flex flex-col gap-3 pt-6 pr-4">
            <span className="text-sm text-mute">{s.l}</span>
            <span className="display text-[clamp(44px,6vw,88px)] leading-[.9] tracking-[-.03em]">{s.v}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

export function Story({ c }: { c: Content }) {
  // The accent part of the mission statement gets its own colour.
  const at = c.mission.indexOf(c.missionAccent)
  const mission =
    at < 0 ? (
      c.mission
    ) : (
      <>
        {c.mission.slice(0, at)}
        <span className="text-acc">{c.missionAccent}</span>
        {c.mission.slice(at + c.missionAccent.length)}
      </>
    )
  return (
    <section id="prica" className={tw.section}>
      <h2 className={tw.h2}>{c.storyTitle}</h2>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,320px),1fr))] gap-4">
        {c.chapters.map((ch, i) => (
          <article key={ch.t} className={cx(tw.card, 'flex flex-col gap-4 p-[clamp(20px,5vw,28px)]')}>
            <div className="flex justify-between text-sm text-mute">
              <span className="font-semibold text-acc">S{i + 1}</span>
              <span>{ch.y}</span>
            </div>
            <h3 className={cx(tw.cardTitle, 'mt-[clamp(16px,4vw,40px)]')}>{ch.t}</h3>
            <p className={tw.bodyMute}>{ch.d}</p>
          </article>
        ))}
      </div>
      <p className="m-0 mt-[clamp(24px,5vw,56px)] max-w-[1100px] text-[clamp(26px,3.6vw,52px)] leading-[1.12] font-medium tracking-[-.02em] text-balance">
        {mission}
      </p>
    </section>
  )
}

export function Vehicles({ c }: { c: Content }) {
  return (
    <section id="vozila" className={tw.section}>
      <h2 className={tw.h2}>{c.vehTitle}</h2>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,440px),1fr))] gap-4">
        {c.vehicles.map((v) => (
          <article
            key={v.id}
            className="flex flex-col overflow-hidden rounded-3xl border border-fg/10 bg-[#141112]"
          >
            <div className="relative aspect-[16/10] bg-[#0f0d0e]">
              {v.src && (
                <img
                  src={v.src}
                  alt={v.img}
                  loading="lazy"
                  decoding="async"
                  className="absolute inset-0 size-full object-cover"
                  style={v.pos ? { objectPosition: v.pos } : undefined}
                />
              )}
            </div>
            <div className="flex flex-col gap-4 p-[clamp(18px,5vw,28px)]">
              <div className="flex flex-col gap-2">
                <span className="text-sm text-mute">{v.cls}</span>
                <h3 className="display m-0 text-[clamp(26px,6vw,34px)] leading-none [font-stretch:115%] tracking-[-.02em]">{v.name}</h3>
              </div>
              <p className={tw.bodyMute}>{v.d}</p>
              <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0">
                {v.sys.map((s) => (
                  <li key={s} className="rounded-full border border-fg/15 px-3 py-1.5 text-sm text-[#c9bdb9]">
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

/** OpenStreetMap embed that shows the given box. */
const mapSrc = (k: Content['comps'][number]) =>
  `https://www.openstreetmap.org/export/embed.html?bbox=${[k.c[1] - k.z[1], k.c[0] - k.z[0], k.c[1] + k.z[1], k.c[0] + k.z[0]].join(',')}&layer=mapnik`
const mapLink = (k: Content['comps'][number]) =>
  `https://www.openstreetmap.org/?mlat=${k.c[0]}&mlon=${k.c[1]}#map=15/${k.c[0]}/${k.c[1]}`

export function Competitions({ c }: { c: Content }) {
  const [sel, setSel] = useState(3)
  const driveBy = useDriveBy()
  const comp = c.comps[sel]!
  const tabs = useRef<(HTMLButtonElement | null)[]>([])
  // Move the selection and the focus to another tab (wraps at both ends).
  const onTabKey = (e: React.KeyboardEvent<HTMLButtonElement>, i: number) => {
    const n = c.comps.length
    const next =
      e.key === 'ArrowDown' || e.key === 'ArrowRight'
        ? (i + 1) % n
        : e.key === 'ArrowUp' || e.key === 'ArrowLeft'
          ? (i - 1 + n) % n
          : e.key === 'Home'
            ? 0
            : e.key === 'End'
              ? n - 1
              : -1
    if (next < 0) return
    e.preventDefault()
    setSel(next)
    const el = tabs.current[next]
    if (el) {
      el.focus()
      driveBy(el)
    }
  }
  return (
    <section id="natjecanja" className={tw.section}>
      <h2 className={tw.h2}>{c.compTitle}</h2>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,420px),1fr))] gap-4">
        <div role="tablist" aria-label={c.compLabel} aria-orientation="vertical" className="flex flex-col border-t border-fg/[.14]">
          {c.comps.map((k, i) => (
            <button
              key={k.name}
              ref={(el) => {
                tabs.current[i] = el
              }}
              type="button"
              role="tab"
              tabIndex={sel === i ? 0 : -1}
              onKeyDown={(e) => onTabKey(e, i)}
              id={`comp-tab-${i}`}
              aria-selected={sel === i}
              aria-controls="comp-panel"
              data-dh="glow"
              onClick={(e) => {
                setSel(i)
                driveBy(e.currentTarget)
              }}
              className={cx(
                'flex cursor-pointer items-center justify-between gap-4 border-b border-fg/[.14] px-1 py-[clamp(18px,4vw,26px)] text-left press',
                sel === i ? 'text-acc' : 'text-fg',
              )}
            >
              <span className="flex min-w-0 flex-col gap-1.5">
                <span className="display block text-[clamp(24px,2.4vw,34px)] leading-none [font-stretch:115%] tracking-[-.02em]">
                  {k.name}
                </span>
                <span className="text-sm text-mute">{k.sub}</span>
              </span>
            </button>
          ))}
        </div>

        <div
          role="tabpanel"
          id="comp-panel"
          aria-labelledby={`comp-tab-${sel}`}
          className="relative min-h-[clamp(300px,60vw,420px)] overflow-hidden rounded-3xl border border-fg/10 bg-[#141112]"
        >
          {/* The keyed wrapper fades the new map in when the tab changes. */}
          <div key={comp.name} className="animate-fade-up absolute inset-0">
            <iframe
              src={mapSrc(comp)}
              title={`${c.trackPlan} — ${comp.name}`}
              loading="lazy"
              tabIndex={-1}
              className="pointer-events-none absolute -inset-0.5 h-[calc(100%+4px)] w-[calc(100%+4px)] border-0 [filter:grayscale(1)_invert(1)_contrast(1.35)_brightness(.9)]"
            />
          </div>
          <div className="pointer-events-none absolute inset-0 bg-acc mix-blend-multiply" aria-hidden="true" />
          <div
            className="pointer-events-none absolute inset-0 [background:radial-gradient(120%_90%_at_50%_50%,transparent_55%,rgba(20,17,18,.85))]"
            aria-hidden="true"
          />
          <div className="glass absolute inset-x-3 bottom-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl py-2.5 pr-2.5 pl-4">
            <span key={comp.name} className="animate-fade-up flex min-w-0 flex-col gap-0.5">
              <span className="text-[15px] font-semibold">{comp.name}</span>
              <span className="text-[13px] text-[#c9bdb9]">{comp.venue}</span>
            </span>
            <a
              href={mapLink(comp)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-full bg-fg px-3.5 py-[9px] text-[13px] font-semibold text-[#141112] hover:text-[#141112]"
            >
              {c.compMapOpen}
              <ArrowUpRight size={14} aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}

export function Sponsors({ c, partners = PARTNERS }: { c: Content; partners?: Partner[] }) {
  const total = partners.length
  const tiers = ([1, 2, 3, 4] as const).map((t, i) => ({ t, label: c.sponTiers[i], items: partners.filter((p) => p.tier === t) }))

  const tileBase = 'grid w-full place-items-center rounded-2xl border border-fg/10 bg-[#100e0f] px-4 opacity-80'
  const linkTileClass = cx(tileBase, 'press hover:border-acc/60 hover:opacity-100 focus-visible:border-acc/60 focus-visible:opacity-100')
  const tileStyle = (t: Partner['tier']) => {
    const [minW, h] = PARTNER_TIERS[t]
    return { flex: `1 1 ${minW}px`, minWidth: `min(calc(50% - 4px), ${minW}px)`, height: h } as const
  }
  return (
    <section id="sponzori" className={tw.section}>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <h2 className={tw.h2}>{c.sponTitle}</h2>
        <div className="flex max-w-[400px] flex-col items-start gap-4">
          <span className="text-sm text-mute">{c.sponCount.replace('{n}', String(total))}</span>
          <p className="m-0 text-[17px] leading-[1.55] text-[#b8aca8]">{c.sponText}</p>
          {/* data-join-mode: the Join form switches to the sponsor mode on a click here. */}
          <a href="#pridruzi-se" data-join-mode="company" data-dh="wipe" data-dh-c="#e2475b" className={tw.btnLight}>
            {c.sponCta}
          </a>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        {tiers.map(({ t, label, items }) => (
          <ul key={t} aria-label={label} className="m-0 flex list-none flex-wrap gap-2 p-0">
            {items.map((p) => {
              const { w, h } = partnerLogoSize(p)
              const img = (
                <img
                  src={p.logoUrl ?? `/partners/${p.key}.png`}
                  alt={p.name}
                  width={w}
                  height={h}
                  loading="lazy"
                  decoding="async"
                  style={{ width: w, height: h }}
                  className="block max-w-full object-contain [filter:brightness(0)_invert(1)]"
                />
              )
              const url = partnerUrl(p)
              return (
                <li key={p.key} className="flex" style={tileStyle(t)}>
                  {url ? (
                    <a href={url} target="_blank" rel="noopener" title={p.name} data-dh="glow" className={linkTileClass}>
                      {img}
                    </a>
                  ) : (
                    <span title={p.name} className={tileBase}>
                      {img}
                    </span>
                  )}
                </li>
              )
            })}
          </ul>
        ))}
      </div>
    </section>
  )
}

/** A number from a text. It picks the seed of a noise canvas, so each item gets its own pattern. */
const seedOf = (text: string) => [...text].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) % 997, 7)

/** Empty state of the news list. It shows when the CMS has no posts or does not answer. */
export function EmptyNews({ c }: { c: Content }) {
  return (
    <div className="grid min-h-[200px] place-items-center rounded-3xl border border-dashed border-fg/[.14] bg-[#141112] p-8 text-center">
      <p className="display m-0 text-[clamp(24px,4vw,36px)] leading-none [font-stretch:115%] tracking-[-.02em] text-mute">{c.noNews}</p>
    </div>
  )
}

export function News({ c, lang, news }: { c: Content; lang: Lang; news: NewsCard[] }) {
  const [first, ...rest] = news
  return (
    <section id="novosti" className={tw.section}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h2 className={tw.h2}>{c.newsTitle}</h2>
        <Link
          to="/$lang/novosti"
          params={{ lang }}
          className="group flex items-center gap-2 text-[15px] font-semibold whitespace-nowrap transition-colors hover:text-acc"
        >
          {c.allNews}
          <ArrowRight size={16} aria-hidden="true" className="transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
      {!first && <EmptyNews c={c} />}
      {first && <NewsFeatured n={first} lang={lang} c={c} />}
      {rest.length > 0 && (
        <div className="border-t border-fg/[.14]">
          {rest.map((n) => (
            <NewsRow key={n.id} n={n} lang={lang} c={c} />
          ))}
        </div>
      )}
    </section>
  )
}

/** The newest news item as one large card. It links to the article page. */
function NewsFeatured({ n, lang, c }: { n: NewsCard; lang: Lang; c: Content }) {
  const title = pick(n, 'title', lang)
  const tag = pick(n, 'tag', lang)
  return (
    <Link
      to="/$lang/novosti/$slug"
      params={{ lang, slug: n.slug }}
      aria-label={`${c.readMore}: ${title}`}
      data-dh="glow"
      data-dh-edge="24"
      className={cx(
        'grid grid-cols-[repeat(auto-fit,minmax(min(100%,300px),1fr))] items-center gap-[clamp(12px,3vw,24px)] rounded-3xl border border-fg/10 bg-[#141112] p-[clamp(10px,3vw,16px)] press hover:border-acc/60 focus-visible:border-acc/60',
      )}
    >
      <div className="relative aspect-[16/10] overflow-hidden rounded-[14px] bg-[#0f0d0e]">
        {n.imageUrl ? (
          <img src={n.imageUrl} alt="" loading="lazy" decoding="async" className="absolute inset-0 size-full object-cover" />
        ) : (
          <DitherCanvas mode="noise" seed={seedOf(n.slug)} className="absolute inset-0 size-full" />
        )}
      </div>
      <div className="flex flex-col gap-3 p-2">
        <span className="text-sm text-mute">
          {formatDate(n.date)}
          {tag && ` · ${tag}`}
        </span>
        <span className="display text-[clamp(28px,6vw,40px)] leading-none [font-stretch:115%] tracking-[-.02em]">{title}</span>
      </div>
    </Link>
  )
}

const rowClass =
  'group grid grid-cols-[1fr_auto] items-center gap-x-5 gap-y-1 border-b border-fg/[.14] py-5 text-fg press hover:text-acc md:grid-cols-[210px_minmax(0,1fr)_auto] md:py-[22px]'

/** One news item as a compact row. It links to the article page. */
export function NewsRow({ n, lang, c }: { n: NewsCard; lang: Lang; c: Content }) {
  const title = pick(n, 'title', lang)
  const tag = pick(n, 'tag', lang)
  const inner = (
    <>
      <span className="text-sm whitespace-nowrap text-mute md:col-start-1">
        {formatDate(n.date)}
        {tag && <span className="text-acc"> · {tag}</span>}
      </span>
      <span className="display col-span-2 text-[clamp(20px,2.4vw,28px)] leading-none [font-stretch:115%] tracking-[-.02em] md:col-span-1 md:col-start-2 md:row-start-1">
        {title}
      </span>
      <ArrowRight
        size={22}
        aria-hidden="true"
        className="col-start-2 row-start-1 transition-transform group-hover:translate-x-1 md:col-start-3"
      />
    </>
  )
  return (
    <Link to="/$lang/novosti/$slug" params={{ lang, slug: n.slug }} aria-label={`${c.readMore}: ${title}`} className={rowClass}>
      {inner}
    </Link>
  )
}

/** Fit the wordmark to the width of its parent. */
function useFitWordmark() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    const parent = el?.parentElement
    if (!el || !parent) return
    const fit = () => {
      const w = parent.clientWidth
      if (!w) return
      el.style.fontSize = '100px'
      const nw = el.scrollWidth
      if (nw) el.style.fontSize = `${Math.min(320, ((100 * w) / nw) * 0.99)}px`
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(parent)
    void document.fonts?.ready.then(fit)
    return () => ro.disconnect()
  }, [])
  return ref
}

export function Footer({ c, lang, onHome }: { c: Content; lang: Lang; onHome: boolean }) {
  const wordmark = useFitWordmark()
  const link = (i: number) => (
    <SectionLink key={SECTION_IDS[i]} id={SECTION_IDS[i]!} lang={lang} onHome={onHome}>
      {c.nav[i]}
    </SectionLink>
  )
  const colTitle = 'mb-1.5 text-[13px] text-[#c9bdb9]'
  return (
    <footer id="kontakt" className="relative scroll-mt-16 overflow-hidden bg-bg [container-type:inline-size]">
      <DitherCanvas mode="footer" className="absolute inset-0 size-full" />
      <div className="relative flex flex-col pt-[clamp(72px,12cqw,120px)] px-[clamp(20px,3.4cqw,48px)]">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(40%,180px),1fr))] gap-x-6 gap-y-[clamp(32px,6cqw,48px)]">
          <div className="col-span-2 flex min-w-0 flex-col gap-5">
            <div className="display text-[clamp(38px,9cqw,52px)] leading-[.88] tracking-[-.03em]">{c.contactTitle}</div>
            <address className="max-w-[340px] text-base leading-normal not-italic">
              {c.addr} · <a href={`mailto:${c.mail}`} className="underline">{c.mail}</a>
            </address>
            <div className="flex flex-wrap gap-2.5">
              <SectionLink
                id="pridruzi-se"
                lang={lang}
                onHome={onHome}
                data-dh="wipe"
                data-dh-c="#e2475b"
                className="press rounded-full bg-fg px-5 py-3 text-[15px] font-semibold whitespace-nowrap text-[#141112] hover:text-[#141112]"
              >
                {c.cta}
              </SectionLink>
              <SectionLink
                id="sponzori"
                lang={lang}
                onHome={onHome}
                data-dh="glow"
                className="press rounded-full border border-fg/25 bg-[rgba(20,17,18,.6)] px-5 py-3 text-[15px] font-semibold whitespace-nowrap"
              >
                {c.heroCta2}
              </SectionLink>
            </div>
          </div>
          <div className="flex flex-col gap-3 text-[15px]">
            <div className={colTitle}>{c.footTeam}</div>
            {link(0)}
            {link(1)}
            {link(5)}
          </div>
          <div className="flex flex-col gap-3 text-[15px]">
            <div className={colTitle}>{c.footProgram}</div>
            {link(2)}
            {link(3)}
            {link(4)}
          </div>
          <div className="flex flex-col gap-3 text-[15px]">
            <div className={colTitle}>{c.footFollow}</div>
            {SOCIALS.map((s) => (
              <a key={s.name} href={c.socials?.[s.name.toLowerCase()] ?? s.href} target="_blank" rel="noopener noreferrer" className="hover:text-acc">
                {s.name}
              </a>
            ))}
          </div>
        </div>
        <div data-flag className="mt-[clamp(48px,9cqw,88px)] mb-6 h-[clamp(56px,10cqw,96px)]" aria-hidden="true" />
        <div className="text-[13px] text-[#c9bdb9]">{c.foot}</div>
        <div className="w-full overflow-hidden pt-4 pb-[3vw] text-center">
          <div
            ref={wordmark}
            className="display inline-block align-top pt-[.04em] text-[12vw] leading-[.8] whitespace-nowrap"
            aria-hidden="true"
          >
            FESB/RACING
          </div>
        </div>
      </div>
    </footer>
  )
}
