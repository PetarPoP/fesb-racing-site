import { useEffect, useRef } from 'react'
import { ArrowRight } from 'lucide-react'
import type { Content } from '~/content'
import { Corners, Photo, cx, tw } from './ui'

const LAP_MS = 68_400

const fmt = (e: number) => {
  const m = Math.floor(e / 60000)
  const s = Math.floor(e / 1000) % 60
  const ms = Math.floor(e % 1000)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(ms).padStart(3, '0')}`
}

/** Demo lap timer: requestAnimationFrame, tekst i širina trake mijenjaju se izravno u DOM-u (bez re-rendera). */
function LapTimer() {
  const timeRef = useRef<HTMLDivElement>(null)
  const barRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    let raf = 0
    const paint = (e: number) => {
      if (timeRef.current) timeRef.current.textContent = fmt(e)
      if (barRef.current) barRef.current.style.width = `${(e / LAP_MS) * 100}%`
    }
    const start = () => {
      cancelAnimationFrame(raf)
      if (mq.matches) return paint(LAP_MS - 1) // smanjeno kretanje: zaustavljen, prikazan puni krug
      const t0 = performance.now()
      const tick = () => {
        paint((performance.now() - t0) % LAP_MS)
        raf = requestAnimationFrame(tick)
      }
      raf = requestAnimationFrame(tick)
    }
    start()
    mq.addEventListener('change', start)
    return () => {
      cancelAnimationFrame(raf)
      mq.removeEventListener('change', start)
    }
  }, [])

  return (
    <div
      role="img"
      aria-label="Lap timer — demo"
      className="relative order-5 flex items-center justify-between border border-line bg-bg p-3.5 font-mono md:absolute md:right-10 md:bottom-10 md:w-[300px] md:flex-col md:items-stretch md:gap-3 md:p-[18px]"
    >
      <Corners className="hidden md:block" />
      <div className="flex justify-between text-[10px] tracking-[.1em] text-mute">
        <span>
          LAP · <span className="hidden md:inline">ENDURANCE</span>
          <span className="md:hidden">DEMO</span>
        </span>
        <span className="hidden text-acc md:inline">● DEMO</span>
      </div>
      <div ref={timeRef} className="text-2xl font-medium tabular-nums md:text-[40px]">
        00:00.000
      </div>
      <div className="hidden h-[3px] bg-line md:block">
        <div ref={barRef} className="h-[3px] w-0 bg-acc" />
      </div>
      <div className="hidden grid-cols-3 text-[10px] text-mute md:grid">
        <span>S1</span>
        <span>S2</span>
        <span>S3</span>
      </div>
    </div>
  )
}

export function Hero({ c }: { c: Content }) {
  // Dulji EN naslov („From whiteboard“) dobiva manji rez da ne uđe u fotografiju
  const long = c.heroA.length > 10
  return (
    <section className="grid-bg border-b border-line" aria-labelledby="hero-title">
      {/* Mobilno: jedan stupac (redoslijed preko `order`). Desktop: apsolutni raspored iz nacrta, visina 700px. */}
      <div className="wrap relative flex flex-col gap-[18px] pt-9 pb-7 md:block md:h-[700px] md:py-0">
        <div className="contents md:absolute md:top-[72px] md:left-10 md:flex md:w-[min(560px,46%)] md:flex-col md:gap-[26px]">
          <h1
            id="hero-title"
            className={cx(
              'order-2 m-0 font-display leading-[.86] font-extrabold uppercase',
              long ? 'text-[56px] md:text-[clamp(72px,8.1vw,104px)]' : 'text-[68px] md:text-[clamp(88px,10.3vw,132px)]',
            )}
          >
            {c.heroA}
            <br />
            <span className="text-acc">{c.heroB}</span>
          </h1>
          <p className="order-3 m-0 text-base leading-normal text-pretty text-mute md:max-w-[460px] md:text-lg md:leading-[1.55]">
            {c.heroSub}
          </p>
          <div className={cx(tw.mono, 'order-6 flex gap-2.5 text-[13px]')}>
            <a
              href="#pridruzi-se"
              className={cx(tw.btnRed, 'group flex flex-1 items-center justify-center gap-2 px-[22px] py-4 md:flex-none md:py-[15px]')}
            >
              {c.cta}
              <ArrowRight size={16} aria-hidden="true" className="transition-transform group-hover:translate-x-0.5" />
            </a>
            <a
              href="#sponzori"
              className="hidden border border-fg px-[22px] py-[15px] text-fg transition-colors hover:border-acc hover:text-acc md:inline-block"
            >
              {c.heroCta2}
            </a>
          </div>
        </div>

        <Photo
          label={c.heroImg}
          src="/img/bolid-u-zavoju.jpg"
          position="50% 68%"
          eager
          className="order-4 h-[200px] md:absolute md:top-12 md:right-10 md:aspect-[10/7] md:h-auto md:w-[min(600px,47vw)]"
        />
        <div
          aria-hidden="true"
          className="hidden justify-between font-mono text-[10px] text-mute md:absolute md:top-[calc(66px+min(600px,47vw)*.7)] md:right-10 md:flex md:w-[min(600px,47vw)]"
        >
          <span>├──────── 3 050 mm ────────┤</span>
          <span>SCALE 1:20 · SHEET 01/10</span>
        </div>

        <LapTimer />
      </div>
    </section>
  )
}
