/** Small helper that joins class names. */
export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ')

/* Sets of Tailwind classes that repeat */
export const tw = {
  /** A home section: centred column, v3 spacing. */
  section:
    'mx-auto flex w-full max-w-[1344px] scroll-mt-16 flex-col gap-[clamp(28px,5vw,48px)] px-[clamp(20px,3.4vw,48px)] pt-[clamp(96px,14vw,160px)]',
  /** Section title in the v3 display style. */
  h2: 'display m-0 text-[clamp(40px,7vw,104px)] leading-[.85] text-balance',
  /** Rounded card on the panel colour. */
  card: 'rounded-[20px] border border-fg/10 bg-panel',
  cardTitle: 'display m-0 text-[30px] leading-none [font-stretch:115%] tracking-[-.02em]',
  bodyMute: 'm-0 text-base leading-[1.6] text-pretty text-[#b8aca8]',
  /** Pill button with the light fill. Pair it with data-dh="wipe". */
  btnLight: 'press rounded-full bg-fg px-5 py-3.5 text-[15px] font-semibold whitespace-nowrap text-[#141112] hover:text-[#141112]',
  /** Pill button with the accent fill. */
  btnAcc: 'press rounded-full bg-acc px-5 py-3.5 text-[15px] font-semibold whitespace-nowrap text-[#141112] hover:text-[#141112]',
  /** Colour of the hover border of a card. */
  cardHover: 'transition-colors hover:border-acc/60 focus-visible:border-acc/60',
  /** Used by the admin pages. */
  btnRed: 'bg-brand text-on-brand transition-colors hover:bg-brand-hover',
  mono: 'font-mono uppercase tracking-[.06em]',
}
