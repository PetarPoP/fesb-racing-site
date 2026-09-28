import type { ReactNode } from 'react'

/** Male pomoćna funkcija za spajanje klasa. */
export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ')

/* Ponavljajući skupovi Tailwind klasa */
export const tw = {
  section: 'wrap flex scroll-mt-16 flex-col gap-6 pt-14 md:gap-8 md:pt-24',
  h2: 'm-0 font-display text-[48px] leading-[.9] font-extrabold uppercase md:text-[clamp(56px,6.25vw,80px)]',
  card: 'relative border border-line',
  cardTitle: 'm-0 font-display text-[26px] leading-none font-bold uppercase md:text-[32px]',
  bodyMute: 'm-0 text-base leading-[1.6] text-pretty text-mute',
  btnRed: 'bg-brand text-on-brand transition-colors hover:bg-brand-hover',
  mono: 'font-mono uppercase tracking-[.06em]',
}

/** Četiri križića na kutovima okvira (motiv tehničkog nacrta). Roditelj mora biti `relative`. */
export function Corners({ className }: { className?: string }) {
  return <i className={cx('corners', className)} aria-hidden="true" />
}

/**
 * Placeholder fotografije (iscrtkani okvir + ikona + opis).
 * Kad stignu prave slike, proslijedi `src` — dimenzije i križići ostaju.
 */
export function Photo({
  label,
  src,
  className,
  corners = true,
  children,
}: {
  label: string
  src?: string
  className?: string
  corners?: boolean
  children?: ReactNode
}) {
  return (
    <figure
      className={cx(
        'relative m-0 flex flex-col items-center justify-center gap-2.5 border border-dashed border-phb bg-ph px-4 text-center text-[13px] text-pht md:text-sm',
        className,
      )}
    >
      {corners && <Corners />}
      {children}
      {src ? (
        <img src={src} alt={label} loading="lazy" className="absolute inset-0 size-full object-cover" />
      ) : (
        <>
          <span className="h-[19px] w-6 rounded-[3px] border-[1.5px] border-current" aria-hidden="true" />
          <figcaption>{label}</figcaption>
        </>
      )}
    </figure>
  )
}
