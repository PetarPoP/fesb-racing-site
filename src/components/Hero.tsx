import type { Content } from '~/content'
import { DitherCanvas } from './Dither'

export function Hero({ c }: { c: Content }) {
  // The English first line is longer, so it gets a smaller size.
  const long = c.heroA.length > 10
  return (
    <section data-hero className="relative h-svh min-h-[620px] overflow-hidden" aria-labelledby="hero-title">
      <DitherCanvas mode="photo" className="absolute inset-0 size-full" />
      <div className="absolute inset-x-[clamp(20px,3.4vw,48px)] bottom-[clamp(20px,4vw,48px)] flex flex-wrap items-end justify-between gap-x-12 gap-y-5">
        <h1
          id="hero-title"
          className={`display m-0 pb-[.12em] leading-[.82] whitespace-nowrap ${long ? 'text-[clamp(24px,4.9vw,80px)]' : 'text-[clamp(40px,9.2vw,140px)]'}`}
        >
          {c.heroA}
          <br />
          {c.heroB}
        </h1>
        <div className="glass ml-auto box-border flex w-[min(100%,380px)] flex-col gap-4 rounded-[clamp(18px,4vw,24px)] p-[clamp(16px,4vw,22px)]">
          <p className="m-0 text-[clamp(15px,3.8vw,17px)] leading-normal text-[#e7ddd9]">{c.heroSub}</p>
          <div className="flex flex-wrap gap-2.5">
            <a
              href="#pridruzi-se"
              data-dh="wipe"
              data-dh-c="#f1e9e5"
              className="press rounded-full bg-acc px-5 py-3.5 text-[15px] font-semibold whitespace-nowrap text-[#141112] hover:text-[#141112]"
            >
              {c.cta}
            </a>
            <a
              href="#sponzori"
              data-dh="glow"
              className="press rounded-full border border-fg/20 bg-[rgba(20,17,18,.55)] px-5 py-3.5 text-[15px] font-semibold whitespace-nowrap backdrop-blur-[14px]"
            >
              {c.heroCta2}
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
