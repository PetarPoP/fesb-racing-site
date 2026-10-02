import { useEffect, useRef, useState } from 'react'
import type { Content, Lang } from '~/content'
import { CAR_GROUPS, PHASE } from '~/lib/carGroups'
import type { CarScene, LabelPos } from '~/lib/car3d'
import { Corners, cx, tw } from './ui'

const clamp01 = (x: number) => Math.min(1, Math.max(0, x))

/** Koji je tim aktivan za dani napredak skrolanja (-1 = nijedan). */
const teamAt = (p: number, n: number) =>
  p < PHASE.teamsFrom || p >= PHASE.teamsTo
    ? -1
    : Math.min(n - 1, Math.floor(((p - PHASE.teamsFrom) / (PHASE.teamsTo - PHASE.teamsFrom)) * n))

/**
 * Sekcija „Timovi“: 3D model bolida (eFRT01) je zalijepljen (sticky) dok se skrola kroz visoki blok.
 * Bolid se okrene i rastavi na sklopove, zatim se timovi redom ističu: dijelovi tima su crveni,
 * a iscrtkane linije od njih vode do kartice tima na dnu. Na kraju se bolid opet sklopi.
 */
export function Teams({ c, lang }: { c: Content; lang: Lang }) {
  const trackRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const chipRefs = useRef<(HTMLButtonElement | null)[]>([])
  const sceneRef = useRef<CarScene | null>(null)
  const [loaded, setLoaded] = useState<number | null>(null) // null = još ne učitava
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)
  const [active, setActive] = useState(-1)
  const activeRef = useRef(-1)

  const teams = c.teams
  const activeTeam = active >= 0 ? teams[active] : null

  // Učitaj three.js i model tek kad se sekcija približi ekranu
  useEffect(() => {
    const track = trackRef.current
    const canvas = canvasRef.current
    if (!track || !canvas) return
    let cancelled = false
    const io = new IntersectionObserver(
      async ([entry]) => {
        if (!entry.isIntersecting) return
        io.disconnect()
        setLoaded(0)
        try {
          const { createCarScene } = await import('~/lib/car3d')
          const scene = await createCarScene(canvas, (f) => !cancelled && setLoaded(f))
          if (cancelled) return scene.dispose()
          sceneRef.current = scene
          setReady(true)
        } catch (err) {
          console.error('3D model se nije učitao', err)
          if (!cancelled) setFailed(true)
        }
      },
      { rootMargin: '600px 0px' },
    )
    io.observe(track)
    return () => {
      cancelled = true
      io.disconnect()
      sceneRef.current?.dispose()
      sceneRef.current = null
    }
  }, [])

  // Petlja: skrol → napredak → scena → linije (izravno u DOM-u, bez re-rendera)
  useEffect(() => {
    if (!ready) return
    const scene = sceneRef.current!
    const track = trackRef.current!
    const stage = stageRef.current!
    const svg = svgRef.current!
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    let raf = 0
    let last = performance.now()
    let visible = true

    const progress = () => {
      const r = track.getBoundingClientRect()
      const span = r.height - stage.clientHeight
      return span > 0 ? clamp01(-r.top / span) : 0
    }

    const ro = new ResizeObserver(() => scene.resize(stage.clientWidth, stage.clientHeight))
    ro.observe(stage)
    scene.resize(stage.clientWidth, stage.clientHeight)

    const themeObs = new MutationObserver(() => scene.readTheme())
    themeObs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })

    const vis = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting
      if (visible) {
        last = performance.now()
        raf = requestAnimationFrame(tick)
      }
    })
    vis.observe(track)

    const lines = new Map<string, SVGPolylineElement>()
    const dots = new Map<string, SVGCircleElement>()
    const names = new Map<string, SVGTextElement>()
    svg.querySelectorAll<SVGPolylineElement>('polyline[data-key]').forEach((l) => lines.set(l.dataset.key!, l))
    svg.querySelectorAll<SVGCircleElement>('circle[data-key]').forEach((d) => dots.set(d.dataset.key!, d))
    svg.querySelectorAll<SVGTextElement>('text[data-key]').forEach((t) => names.set(t.dataset.key!, t))
    const shown = new Map<string, number>() // glatko pretapanje linija između timova

    // Linije: od sredine sklopa ravno dolje do zajedničke „sabirnice“, pa do kartice tima na dnu
    const layout = (pos: LabelPos[], dt: number, reduced: boolean) => {
      const idx = activeRef.current
      const chip = idx >= 0 ? chipRefs.current[idx] : null
      const sr = stage.getBoundingClientRect()
      const cr = chip?.getBoundingClientRect()
      const cx = cr ? cr.left - sr.left + cr.width / 2 : 0
      const cy = cr ? cr.top - sr.top : 0
      const busY = cy - (stage.clientWidth < 900 ? 18 : 28)
      const code = idx >= 0 ? teams[idx].code : null
      for (const a of pos) {
        const group = CAR_GROUPS.find((g) => g.key === a.key)!
        const goal = code === group.team && a.visible && cr ? 1 : 0
        const prev = shown.get(a.key) ?? 0
        const o = reduced ? goal : prev + (goal - prev) * Math.min(1, dt * 10)
        shown.set(a.key, o)
        const op = String(o < 0.01 ? 0 : o)
        const line = lines.get(a.key)
        const dot = dots.get(a.key)
        const name = names.get(a.key)
        if (goal) {
          const ay = Math.min(a.ay, busY)
          line?.setAttribute(
            'points',
            `${a.ax.toFixed(1)},${ay.toFixed(1)} ${a.ax.toFixed(1)},${busY.toFixed(1)} ${cx.toFixed(1)},${busY.toFixed(1)} ${cx.toFixed(1)},${cy.toFixed(1)}`,
          )
          dot?.setAttribute('cx', a.ax.toFixed(1))
          dot?.setAttribute('cy', ay.toFixed(1))
          name?.setAttribute('x', (a.ax + 9).toFixed(1))
          name?.setAttribute('y', (ay - 8).toFixed(1))
        }
        if (line) line.style.opacity = op
        if (dot) dot.style.opacity = op
        if (name) name.style.opacity = op
      }
    }

    const tick = (now: number) => {
      if (!visible) return
      const dt = Math.min(0.1, (now - last) / 1000)
      last = now
      scene.setProgress(progress())
      const idx = teamAt(scene.getProgress(), teams.length)
      if (idx !== activeRef.current) {
        activeRef.current = idx
        setActive(idx)
        const code = idx >= 0 ? teams[idx].code : null
        // tim bez fizičkih dijelova (npr. marketing) — cijeli bolid ostaje neutralan
        scene.setTeam(code && CAR_GROUPS.some((g) => g.team === code) ? code : code ? '*' : null)
      }
      const pos = scene.frame(dt, mq.matches)
      layout(pos, dt, mq.matches)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      vis.disconnect()
      themeObs.disconnect()
    }
  }, [ready, teams])

  // Klik na tim: skrolaj do njegovog dijela sekcije
  const goToTeam = (i: number) => {
    const track = trackRef.current
    const stage = stageRef.current
    if (!track || !stage) return
    const span = track.offsetHeight - stage.clientHeight
    const p = PHASE.teamsFrom + ((i + 0.5) / teams.length) * (PHASE.teamsTo - PHASE.teamsFrom)
    const top = track.getBoundingClientRect().top + window.scrollY + span * p
    window.scrollTo({ top, behavior: 'smooth' })
  }

  return (
    <section id="timovi" className="scroll-mt-16 pt-14 md:pt-24">
      <div className="wrap flex flex-col gap-6 md:gap-8">
        <h2 className={tw.h2}>{c.teamsTitle}</h2>
        <p className={cx(tw.bodyMute, 'max-w-[620px] md:text-lg')}>{c.carIntro}</p>
      </div>

      <div ref={trackRef} className="relative h-[460vh]">
        <div
          ref={stageRef}
          className="sticky top-[60px] h-[calc(100svh-60px)] overflow-hidden md:top-16 md:h-[calc(100svh-4rem)]"
        >
          <div className="grid-bg absolute inset-0" aria-hidden="true" />
          <canvas
            ref={canvasRef}
            className={cx('absolute inset-0 size-full transition-opacity duration-700', ready ? 'opacity-100' : 'opacity-0')}
            aria-label={c.carAria}
            role="img"
          />

          {/* Iscrtkane linije od sklopova aktivnog tima do njegove kartice na dnu */}
          <svg ref={svgRef} className="pointer-events-none absolute inset-0 size-full" aria-hidden="true">
            {CAR_GROUPS.map((g) => (
              <g key={g.key}>
                <polyline
                  data-key={g.key}
                  fill="none"
                  stroke="var(--acc)"
                  strokeWidth="1"
                  strokeDasharray="3 4"
                  style={{ opacity: 0 }}
                />
                <circle data-key={g.key} r="3" fill="var(--bg)" stroke="var(--acc)" strokeWidth="1.5" style={{ opacity: 0 }} />
                <text
                  data-key={g.key}
                  className="font-mono text-[10px] font-semibold tracking-[.08em] uppercase"
                  fill="var(--acc)"
                  stroke="var(--bg)"
                  strokeWidth="3"
                  paintOrder="stroke"
                  style={{ opacity: 0 }}
                >
                  {g.name[lang]}
                </text>
              </g>
            ))}
          </svg>

          {/* Gornja traka nacrta */}
          <div className="wrap pointer-events-none absolute inset-x-0 top-0 flex justify-between pt-4 font-mono text-[10px] tracking-[.12em] text-mute uppercase md:pt-6 md:text-[11px]">
            <span>
              <span className="text-acc">eFRT01</span> · {c.carModelNote}
            </span>
            <span className="hidden md:inline">{c.carScroll}</span>
          </div>

          {!ready && (
            <div className="absolute inset-0 grid place-items-center font-mono text-xs tracking-[.12em] text-mute uppercase">
              {failed ? c.carFailed : `${c.carLoading} ${loaded === null ? '' : `${Math.round(loaded * 100)}%`}`}
            </div>
          )}

          {/* Opis aktivnog tima (gore desno, da ne zaklanja bolid ni linije prema karticama) */}
          <div className="wrap pointer-events-none absolute inset-x-0 top-10 flex md:top-14 md:justify-end">
            <div
              className={cx(
                tw.card,
                'max-w-[420px] bg-bg/90 p-3.5 backdrop-blur-sm transition-[opacity,transform] duration-300 md:p-5',
                activeTeam ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0',
              )}
              aria-live="polite"
            >
              <Corners />
              {activeTeam && (
                <>
                  <div className="flex justify-between font-mono text-[11px] font-semibold text-acc">
                    <span>{String(active + 1).padStart(2, '0')}</span>
                    <span>{activeTeam.code}</span>
                  </div>
                  <h3 className="m-0 mt-1 font-display text-2xl leading-none font-bold uppercase md:text-[32px]">
                    {activeTeam.name}
                  </h3>
                  <p className="m-0 mt-2 hidden text-[15px] leading-normal text-mute md:block">{activeTeam.d}</p>
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {activeTeam.tags.map((g) => (
                      <span key={g} className="border border-acc px-[7px] py-[3px] font-mono text-[11px] text-acc">
                        {g}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Kartice timova na dnu — linije sklopova završavaju na njima */}
          <div className="wrap absolute inset-x-0 bottom-0 pb-4 md:pb-8">
            <nav aria-label={c.teamsTitle} className="flex gap-1.5 md:justify-end md:gap-2">
              {teams.map((t, i) => (
                <button
                  key={t.code}
                  ref={(el) => {
                    chipRefs.current[i] = el
                  }}
                  type="button"
                  onClick={() => goToTeam(i)}
                  aria-pressed={active === i}
                  className={cx(
                    'flex min-h-11 flex-1 cursor-pointer flex-col justify-between border px-2 py-1.5 text-left font-mono text-[10px] font-semibold transition-colors md:min-w-[110px] md:flex-none md:text-[11px]',
                    active === i ? 'border-brand bg-brand text-on-brand' : 'border-line bg-bg/80 text-acc hover:bg-ph',
                  )}
                >
                  <span className="opacity-70">{String(i + 1).padStart(2, '0')}</span>
                  <span>{t.code}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>
      </div>
    </section>
  )
}
