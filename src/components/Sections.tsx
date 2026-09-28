import { useState, type CSSProperties } from 'react'
import type { Content } from '~/content'
import { ArrowDown, ArrowRight } from 'lucide-react'
import { Corners, Photo, cx, tw } from './ui'

/** Link na sponzorski paket — zamijeniti pravim PDF-om (npr. /sponzorski-paket.pdf). */
const SPONSOR_PACK_URL = '#'

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
  const words = [...c.comps.map((k) => k.name), '18+', 'Formula Student', 'MotoStudent']
  const run = (hidden: boolean) => (
    <div className="flex" aria-hidden={hidden || undefined}>
      {words.map((w, i) => (
        <span key={i} className="px-7 whitespace-nowrap">
          {w}
          <span className="ml-14 opacity-60">+</span>
        </span>
      ))}
    </div>
  )
  return (
    <div className="flex h-9 items-center overflow-hidden bg-brand md:h-11">
      <div className="flex w-max animate-ticker font-display text-lg font-bold text-on-brand uppercase motion-reduce:animate-none md:text-[22px]">
        {run(false)}
        {run(true)}
      </div>
    </div>
  )
}

export function Stats({ c }: { c: Content }) {
  return (
    <section className="wrap grid grid-cols-2 gap-4 pt-7 md:grid-cols-4 md:gap-6 md:pt-14">
      {c.stats.map((s) => (
        <div key={s.l} className={cx(tw.card, 'flex flex-col gap-1 p-3.5 md:p-6')}>
          <Corners />
          <div className="font-mono text-[9px] tracking-[.12em] text-acc uppercase md:text-[10px]">{s.l}</div>
          <div className="font-display text-[40px] leading-none font-bold md:text-[68px]">{s.v}</div>
        </div>
      ))}
    </section>
  )
}

export function Story({ c }: { c: Content }) {
  return (
    <section id="prica" className={tw.section}>
      <h2 className={tw.h2}>{c.storyTitle}</h2>
      <div className="grid gap-6 md:grid-cols-3">
        {c.chapters.map((ch, i) => (
          <article key={ch.t} className={cx(tw.card, 'flex flex-col gap-3.5 p-6 md:p-[30px]')}>
            <Corners />
            <div className="flex justify-between font-mono text-[11px] font-semibold text-acc">
              <span>S{i + 1}</span>
              <span>{ch.y}</span>
            </div>
            <h3 className={tw.cardTitle}>{ch.t}</h3>
            <p className={tw.bodyMute}>{ch.d}</p>
          </article>
        ))}
      </div>
      <div className="relative bg-brand p-6 text-on-brand md:p-10">
        <Corners />
        <p className="m-0 font-display text-[32px] leading-[1.02] font-semibold uppercase md:text-[clamp(40px,4.1vw,52px)]">
          {c.mission}
        </p>
      </div>
    </section>
  )
}

export function Teams({ c }: { c: Content }) {
  const [selected, setSelected] = useState(0)
  return (
    <section id="timovi" className={tw.section}>
      <h2 className={tw.h2}>{c.teamsTitle}</h2>
      <div className="flex flex-col gap-4 md:grid md:grid-cols-3 md:gap-7">
        {c.teams.map((t, i) => {
          const open = selected === i
          return (
            <button
              key={t.code}
              type="button"
              aria-pressed={open}
              onClick={() => setSelected(i)}
              className={cx(
                'relative flex cursor-pointer flex-col gap-2 border p-[18px] text-left transition-colors duration-200 md:min-h-[220px] md:gap-3 md:p-[30px]',
                open ? 'border-acc bg-sel' : 'border-line hover:bg-ph',
              )}
            >
              <Corners />
              <span className="flex justify-between font-mono text-[11px] font-semibold text-acc md:text-xs">
                <span>{String(i + 1).padStart(2, '0')}</span>
                <span>{t.code}</span>
              </span>
              <span className="font-display text-2xl leading-none font-bold uppercase md:text-[32px]">{t.name}</span>
              {/* Mobilno: opis samo za odabrani tim */}
              <span
                className={cx(
                  'text-sm leading-normal text-mute md:block md:text-base md:leading-[1.6]',
                  open ? 'block' : 'hidden',
                )}
              >
                {t.d}
              </span>
              {open && (
                <span className="mt-auto flex flex-wrap gap-1.5 pt-1">
                  {t.tags.map((g) => (
                    <span key={g} className="border border-acc px-[7px] py-[3px] font-mono text-[11px] text-acc">
                      {g}
                    </span>
                  ))}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </section>
  )
}

export function Vehicles({ c }: { c: Content }) {
  return (
    <section id="vozila" className={tw.section}>
      <h2 className={tw.h2}>{c.vehTitle}</h2>
      <div className="grid gap-7 md:grid-cols-2">
        {c.vehicles.map((v) => (
          <article key={v.id} className={cx(tw.card, 'flex flex-col')}>
            <Corners />
            <Photo label={v.img} corners={false} className="m-3.5 h-[220px] md:h-[320px]">
              <span className="absolute top-3 left-3 bg-brand px-2.5 py-[3px] font-display text-lg font-bold text-on-brand uppercase">
                {v.cls}
              </span>
            </Photo>
            <div className="flex flex-col gap-3.5 px-6 pt-3.5 pb-6 md:px-[30px] md:pb-[30px]">
              <h3 className="m-0 font-display text-[30px] leading-none font-bold uppercase md:text-4xl">{v.name}</h3>
              <p className={tw.bodyMute}>{v.d}</p>
              <ul className="m-0 grid list-none grid-cols-2 border-t border-l border-line p-0 sm:grid-cols-3 xl:grid-cols-5">
                {v.sys.map((s) => (
                  <li key={s} className="border-r border-b border-line px-2 py-2.5 font-mono text-[11px]">
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

export function Competitions({ c }: { c: Content }) {
  const [sel, setSel] = useState(3)
  const comp = c.comps[sel]
  return (
    <section id="natjecanja" className={tw.section}>
      <h2 className={tw.h2}>{c.compTitle}</h2>

      {/* „Staza“: vodoravna na desktopu, okomita na mobitelu */}
      <div className="relative mt-2 md:h-[110px]" style={{ '--progress': `${sel * 25 + 1}%` } as CSSProperties}>
        <div aria-hidden="true" className="absolute inset-x-0 top-10 hidden border-t border-dashed border-phb md:block" />
        <div
          aria-hidden="true"
          className="absolute top-[39px] left-0 hidden h-[3px] w-(--progress) bg-acc transition-[width] duration-400 motion-reduce:transition-none md:block"
        />
        <div aria-hidden="true" className="absolute top-3 bottom-3 left-[8.5px] border-l border-dashed border-phb md:hidden" />
        <div role="tablist" aria-label={c.compLabel} className="relative flex flex-col gap-5 md:absolute md:inset-0 md:grid md:grid-cols-4 md:gap-0">
          {c.comps.map((k, i) => (
            <button
              key={k.name}
              type="button"
              role="tab"
              aria-selected={sel === i}
              onClick={() => setSel(i)}
              className="group flex min-h-11 cursor-pointer items-center gap-4 text-left md:flex-col md:items-start md:gap-3.5"
            >
              <span
                aria-hidden="true"
                className={cx('size-[18px] shrink-0 rotate-45 border-2 border-acc md:mt-8', i <= sel ? 'bg-acc' : 'bg-bg')}
              />
              <span className="flex flex-col gap-0.5">
                <span
                  className={cx(
                    'font-display text-[22px] leading-tight font-bold uppercase transition-colors md:text-[clamp(20px,2vw,26px)]',
                    sel === i ? 'text-acc' : 'text-fg group-hover:text-acc',
                  )}
                >
                  {k.name}
                </span>
                <span className="font-mono text-[11px] text-mute">
                  {k.cc} · {k.type}
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>

      <div role="tabpanel" className="grid gap-7 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="relative flex min-h-[200px] flex-col justify-end gap-2 bg-brand p-6 text-on-brand md:min-h-[260px] md:p-9">
          <Corners />
          <div className="font-mono text-[11px] tracking-[.1em]">
            {comp.cc} · {comp.type}
          </div>
          <div className="font-display text-[40px] leading-[.95] font-extrabold uppercase md:text-[clamp(44px,4.7vw,60px)]">
            {comp.name}
          </div>
          <div className="text-[17px]">{comp.place}</div>
        </div>
        <Photo label={`${c.trackPlan} — ${comp.name}`} className="min-h-[200px]" />
      </div>
    </section>
  )
}

export function Sponsors({ c }: { c: Content }) {
  return (
    <section id="sponzori" className={tw.section}>
      <div className="grid items-start gap-8 md:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] md:gap-12">
        <div className="flex flex-col items-start gap-[18px]">
          <h2 className="m-0 font-display text-[44px] leading-[.92] font-extrabold uppercase md:text-[clamp(44px,4.7vw,60px)]">
            {c.sponTitle}
          </h2>
          <p className={tw.bodyMute}>{c.sponText}</p>
          <a
            href={SPONSOR_PACK_URL}
            className={cx(tw.btnRed, 'flex items-center gap-2 px-[18px] py-[13px] font-mono text-xs uppercase')}
          >
            <ArrowDown size={14} aria-hidden="true" />
            {c.sponCta}
          </a>
        </div>
        <ul className="m-0 grid list-none grid-cols-2 gap-4 p-0 sm:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <li
              key={i}
              className="grid h-24 place-items-center border border-dashed border-phb font-mono text-[11px] text-pht transition-colors hover:bg-ph"
            >
              LOGO {i + 1}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export function News({ c }: { c: Content }) {
  return (
    <section id="novosti" className={tw.section}>
      <h2 className={tw.h2}>{c.newsTitle}</h2>
      <div className="grid auto-rows-[160px] grid-cols-2 gap-4 md:grid-cols-4 md:grid-rows-[380px_230px] md:gap-7">
        {c.gallery.map((g, i) => (
          <Photo key={g} label={g} className={i === 0 ? 'col-span-2 md:row-span-2' : ''} />
        ))}
      </div>
      <div className="border-t border-line">
        {c.news.map((n) => (
          <a
            key={n.t}
            href="#novosti"
            aria-label={`${c.readMore}: ${n.t}`}
            className="group grid grid-cols-[auto_1fr_auto] items-center gap-x-5 gap-y-2 border-b border-line py-[18px] text-fg transition-colors hover:text-acc md:grid-cols-[120px_160px_minmax(0,1fr)_40px] md:py-[22px]"
          >
            <span className="font-mono text-xs text-mute">{n.date}</span>
            <span className="font-mono text-xs text-acc uppercase">{n.tag}</span>
            <span className="order-last col-span-3 font-display text-2xl leading-none font-bold uppercase md:order-none md:col-span-1 md:text-[32px]">
              {n.t}
            </span>
            <ArrowRight size={22} aria-hidden="true" className="transition-transform group-hover:translate-x-1" />
          </a>
        ))}
      </div>
    </section>
  )
}

export function Footer({ c }: { c: Content }) {
  return (
    <footer id="kontakt" className="scroll-mt-16 bg-brand text-on-brand">
      <div className="wrap grid items-end gap-8 py-14 md:grid-cols-[minmax(0,1fr)_auto]">
        <div className="flex flex-col gap-3">
          <div className="font-display text-[44px] leading-[.9] font-extrabold uppercase md:text-[clamp(52px,5.6vw,72px)]">
            {c.contactTitle}
          </div>
          <address className="text-base not-italic">
            {c.addr} · <a href={`mailto:${c.mail}`} className="text-on-brand underline hover:opacity-80">{c.mail}</a>
          </address>
          <ul className="m-0 mt-2 flex list-none gap-2.5 p-0">
            {SOCIALS.map((s) => (
              <li key={s.name}>
                <a
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.name}
                  title={s.name}
                  className="grid size-11 place-items-center border border-on-brand/40 text-on-brand transition-colors hover:border-on-brand hover:bg-on-brand hover:text-brand"
                >
                  <svg
                    viewBox="0 0 24 24"
                    width={20}
                    height={20}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    {s.icon}
                  </svg>
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div className="font-mono text-[11px]">{c.foot}</div>
      </div>
    </footer>
  )
}
