import { useEffect, useRef, useState } from 'react'
import { ArrowUpRight, Mail, Phone, UserRound, X } from 'lucide-react'
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

/**
 * A team card shows the icon, the name and one sentence. A click or tap opens a window
 * with the full text, the tags and the team lead (no hover, so the page never moves under the mouse).
 */
function TeamCard({ t, c }: { t: Content['teams'][number]; c: Content }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className={cx(
          tw.card,
          'group press flex cursor-pointer flex-col p-[clamp(20px,4vw,28px)] text-left transition-colors duration-300 hover:border-(--team)/40',
        )}
        style={{ '--team': teamColor(t.code) } as React.CSSProperties}
      >
        <span className="flex w-full items-start justify-between gap-4">
          <TeamIcon
            src={t.icon}
            className="h-14 w-24 text-fg transition-colors duration-500 [mask-position:left_center] group-hover:text-(--team) light:group-hover:text-fg"
          />
          <TeamCode code={t.code} />
        </span>
        <span className={cx(tw.cardTitle, 'mt-5 block text-[clamp(26px,2.6vw,32px)]')}>{t.name}</span>
        <span className={cx(tw.bodyMute, 'mt-2 block')}>{t.d}</span>
        <span className="mt-4 flex items-center gap-1.5 text-sm font-semibold text-fg group-hover:text-acc">
          {c.teamMore}
          <ArrowUpRight size={15} aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </span>
      </button>
      {open && <TeamDialog t={t} c={c} onClose={() => setOpen(false)} />}
    </>
  )
}

function TeamCode({ code }: { code: string }) {
  return (
    <span className="rounded-full border border-(--team)/40 px-2.5 py-1 text-[13px] font-semibold text-(--team) light:border-fg/20 light:text-fg">
      {code}
    </span>
  )
}

/** The full team: text, tags and the lead. Closes on Escape, the X or a click on the dimmed backdrop. */
function TeamDialog({ t, c, onClose }: { t: Content['teams'][number]; c: Content; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    ref.current?.showModal()
  }, [])
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && ref.current?.close()}
      aria-label={t.name}
      style={{ '--team': teamColor(t.code) } as React.CSSProperties}
      className="m-auto max-h-[90svh] w-[min(100%-24px,640px)] max-w-none animate-modal-in overflow-y-auto rounded-3xl border border-fg/10 bg-panel p-0 text-fg backdrop:bg-black/60 backdrop:backdrop-blur-[4px]"
    >
      <div className="flex flex-col gap-5 p-[clamp(20px,5vw,36px)]">
        <div className="flex items-start justify-between gap-4">
          <TeamIcon src={t.icon} className="h-16 w-28 text-(--team) [mask-position:left_center] light:text-fg" />
          <div className="flex items-center gap-2">
            <TeamCode code={t.code} />
            <button
              type="button"
              onClick={() => ref.current?.close()}
              aria-label={c.close}
              className="press -mr-2 grid size-10 shrink-0 cursor-pointer place-items-center rounded-full hover:bg-fg/10"
            >
              <X size={20} aria-hidden="true" />
            </button>
          </div>
        </div>
        <h2 className={cx(tw.cardTitle, 'text-[clamp(28px,4vw,40px)]')}>{t.name}</h2>
        <p className={tw.bodyMute}>{t.about}</p>
        <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0">
          {t.tags.map((s) => (
            <li key={s} className="rounded-full border border-fg/15 px-3 py-1.5 text-sm text-soft">
              {s}
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-4 border-t border-fg/10 pt-5">
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
      </div>
    </dialog>
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
      <div data-reveal="stagger" className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,340px),1fr))] gap-4">
        {c.teams.map((t) => (
          <TeamCard key={t.code} t={t} c={c} />
        ))}
      </div>
    </section>
  )
}
