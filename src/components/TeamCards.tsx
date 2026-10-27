import { useState } from 'react'
import { ChevronDown, Mail, Phone, UserRound } from 'lucide-react'
import type { Content } from '~/content'
import { teamColor } from '~/lib/carGroups'
import { cx, tw } from './ui'

/** A phone number as a tel: link (spaces and dashes removed). */
export const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, '')}`

/** Team icon. The file is a black drawing used as a mask, so it takes the colour of the text. */
function TeamIcon({ src, className }: { src: string; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cx('block bg-current [mask-position:center] [mask-repeat:no-repeat] [mask-size:contain]', className)}
      style={{ maskImage: `url("${src}")`, WebkitMaskImage: `url("${src}")` }}
    />
  )
}

function TeamCard({ t, c }: { t: Content['teams'][number]; c: Content }) {
  const [open, setOpen] = useState(false)
  const id = `team-about-${t.code.replace(/\W/g, '')}`
  return (
    <article className={cx(tw.card, 'flex flex-col gap-5 p-[clamp(20px,4vw,28px)]')} style={{ '--team': teamColor(t.code) } as React.CSSProperties}>
      <div className="flex items-start justify-between gap-4">
        <TeamIcon src={t.icon} className="h-14 w-24 text-fg [mask-position:left_center]" />
        <span className="rounded-full border border-(--team)/40 px-2.5 py-1 text-[13px] font-semibold text-(--team) light:border-fg/20 light:text-fg">
          {t.code}
        </span>
      </div>
      <h3 className={cx(tw.cardTitle, 'text-[clamp(26px,2.6vw,32px)]')}>{t.name}</h3>
      <div className="flex flex-col gap-2">
        <p id={id} className={cx(tw.bodyMute, !open && 'line-clamp-4')}>
          {t.about}
        </p>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpen((o) => !o)}
          className="press flex cursor-pointer items-center gap-1.5 self-start text-sm font-semibold text-fg hover:text-acc"
        >
          {open ? c.teamLess : c.teamMore}
          <ChevronDown size={15} aria-hidden="true" className={cx('transition-transform', open && 'rotate-180')} />
        </button>
      </div>
      <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0">
        {t.tags.map((s) => (
          <li key={s} className="rounded-full border border-fg/15 px-3 py-1.5 text-sm text-soft">
            {s}
          </li>
        ))}
      </ul>
      <div className="mt-auto flex items-center gap-4 border-t border-fg/10 pt-5">
        <div className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-2xl bg-sunk text-mute">
          {t.lead.photo ? (
            <img src={t.lead.photo} alt={t.lead.name} loading="lazy" decoding="async" className="size-full object-cover" />
          ) : (
            <UserRound size={28} strokeWidth={1.5} aria-hidden="true" />
          )}
        </div>
        <div className="flex min-w-0 flex-col gap-1">
          <span className="text-[13px] text-mute">{c.teamLead}</span>
          <span className="text-base leading-tight font-semibold">{t.lead.name}</span>
          <span className="flex flex-col gap-0.5 text-sm text-soft">
            {t.lead.email && (
              <a href={`mailto:${t.lead.email}`} className="flex min-w-0 items-center gap-1.5 hover:text-acc">
                <Mail size={14} aria-hidden="true" className="shrink-0" />
                <span className="truncate">{t.lead.email}</span>
              </a>
            )}
            {t.lead.phone && (
              <a href={telHref(t.lead.phone)} className="flex items-center gap-1.5 whitespace-nowrap hover:text-acc">
                <Phone size={14} aria-hidden="true" className="shrink-0" />
                {t.lead.phone}
              </a>
            )}
          </span>
        </div>
      </div>
    </article>
  )
}

/** One card per sub-team: icon, text, tags and the team lead. It comes before the 3D view of the car. */
export function TeamCards({ c }: { c: Content }) {
  return (
    <section id="timovi" className={tw.section}>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <h2 className={tw.h2}>{c.teamsTitle}</h2>
        <p className="m-0 max-w-[380px] text-[17px] leading-[1.55] text-soft">{c.teamsCardsText}</p>
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,340px),1fr))] gap-4">
        {c.teams.map((t) => (
          <TeamCard key={t.code} t={t} c={c} />
        ))}
      </div>
    </section>
  )
}
