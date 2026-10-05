import { ArrowDown, ArrowRight } from 'lucide-react'
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import type { Content, Lang } from '~/content'
import { CAR_GROUPS, PHASE, teamColor } from '~/lib/carGroups'
import { fetchModel, warmDecoder } from '~/lib/carModel'
import type { CarScene, DimLine, LabelPos } from '~/lib/car3d'
import { cx, tw } from './ui'

/** Names of the assemblies at the dots: small and white, with a soft shadow so they stay readable. */
const labelText =
  'text-[13px] font-semibold [filter:drop-shadow(0_0_2px_var(--bg))_drop-shadow(0_0_1px_var(--bg))] md:text-[15px]'

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
  const barRef = useRef<HTMLDivElement>(null)
  const lastTeam = useRef<(typeof c.teams)[number] | null>(null)
  const sceneRef = useRef<CarScene | null>(null)
  const [loaded, setLoaded] = useState<number | null>(null) // null = još ne učitava
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)
  const [active, setActive] = useState(-1)
  const activeRef = useRef(-1)

  const teams = c.teams
  const activeTeam = active >= 0 ? teams[active] : null
  // Position and width of the sliding pill behind the active chip
  const [pill, setPill] = useState({ x: 0, w: 0 })
  if (activeTeam) lastTeam.current = activeTeam
  // Measure the active chip. Measure again when the window size changes.
  // All chips get the width of the widest one (padding stays as in the design). Measured again on resize.
  const [chipW, setChipW] = useState(0)
  useLayoutEffect(() => {
    const measure = () => {
      const chips = chipRefs.current.filter((el): el is HTMLButtonElement => !!el)
      chips.forEach((el) => (el.style.minWidth = ''))
      const w = Math.ceil(Math.max(0, ...chips.map((el) => el.getBoundingClientRect().width)))
      chips.forEach((el) => (el.style.minWidth = `${w}px`))
      setChipW(w)
    }
    measure()
    void document.fonts?.ready.then(measure) // the width changes when the web font arrives
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [teams])
  useLayoutEffect(() => {
    const measure = () => {
      const chip = active >= 0 ? chipRefs.current[active] : null
      if (chip) setPill((p) => (p.x === chip.offsetLeft && p.w === chip.offsetWidth ? p : { x: chip.offsetLeft, w: chip.offsetWidth }))
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [active, chipW])
  const ghostTeam = activeTeam ?? lastTeam.current // the big code stays while it fades out

  // Rano, u praznom hodu nakon učitavanja stranice: model, dekoder i kod scene (bez blokiranja prvog prikaza)
  useEffect(() => {
    let cancelled = false
    const warm = () => {
      if (cancelled) return
      fetchModel().catch(() => {})
      warmDecoder()
      void import('~/lib/car3d')
    }
    const idle = () => {
      const ric = window.requestIdleCallback
      if (ric) ric(warm, { timeout: 5000 })
      else setTimeout(warm, 2000)
    }
    if (document.readyState === 'complete') idle()
    else window.addEventListener('load', idle, { once: true })
    return () => {
      cancelled = true
      window.removeEventListener('load', idle)
    }
  }, [])

  // Napravi scenu tek kad se sekcija približi ekranu
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

    const vis = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting
      if (visible) {
        last = performance.now()
        cancelAnimationFrame(raf)
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
    const dimEls = new Map<string, { g: SVGGElement; main: SVGLineElement; ta: SVGLineElement; tb: SVGLineElement; text: SVGTextElement }>()
    svg.querySelectorAll<SVGGElement>('g[data-dim]').forEach((g) => {
      const l = g.querySelectorAll('line')
      dimEls.set(g.dataset.dim!, { g, main: l[0], ta: l[1], tb: l[2], text: g.querySelector('text')! })
    })
    const dimText: Record<string, string> = {
      length: c.carDimLength,
      wheelbase: c.carDimWheelbase,
      width: c.carDimWidth,
    }
    // Dimension lines: thin lines on the floor with an approximate size in mm (whole-car phases only)
    const layoutDims = (list: DimLine[]) => {
      for (const d of list) {
        const el = dimEls.get(d.key)
        if (!el) continue
        el.g.style.opacity = d.o < 0.01 ? '0' : String(d.o * 0.9)
        if (d.o < 0.01) continue
        const dx = d.bx - d.ax
        const dy = d.by - d.ay
        const len = Math.hypot(dx, dy) || 1
        const nx = (-dy / len) * 5
        const ny = (dx / len) * 5
        el.main.setAttribute('x1', d.ax.toFixed(1))
        el.main.setAttribute('y1', d.ay.toFixed(1))
        el.main.setAttribute('x2', d.bx.toFixed(1))
        el.main.setAttribute('y2', d.by.toFixed(1))
        el.ta.setAttribute('x1', (d.ax - nx).toFixed(1))
        el.ta.setAttribute('y1', (d.ay - ny).toFixed(1))
        el.ta.setAttribute('x2', (d.ax + nx).toFixed(1))
        el.ta.setAttribute('y2', (d.ay + ny).toFixed(1))
        el.tb.setAttribute('x1', (d.bx - nx).toFixed(1))
        el.tb.setAttribute('y1', (d.by - ny).toFixed(1))
        el.tb.setAttribute('x2', (d.bx + nx).toFixed(1))
        el.tb.setAttribute('y2', (d.by + ny).toFixed(1))
        // the labels sit at different points along their lines, so they do not meet
        const t = d.key === 'wheelbase' ? 0.7 : d.key === 'length' ? 0.3 : 0.5
        const W = stage.clientWidth
        el.text.setAttribute('x', Math.min(W - 80, Math.max(80, d.ax + dx * t)).toFixed(1))
        el.text.setAttribute('y', (d.ay + dy * t + 17).toFixed(1))
        el.text.textContent = `${dimText[d.key]} ≈ ${d.mm} mm`
      }
    }
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
      const partless = !!code && !CAR_GROUPS.some((g) => g.team === code)
      const ctr = scene.center()
      const all: LabelPos = { key: '__all', ax: ctr.x, ay: ctr.y, visible: true }
      const toPlace: { name: SVGTextElement; key: string; ax: number; ay: number }[] = []
      for (const a of [...pos, all]) {
        const team = a.key === '__all' ? (partless ? code : null) : CAR_GROUPS.find((g) => g.key === a.key)!.team
        const goal = team !== null && code === team && a.visible && cr ? 1 : 0
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
          if (name) toPlace.push({ name, key: a.key, ax: a.ax, ay })
        }
        if (line) line.style.opacity = op
        if (dot) dot.style.opacity = op
        if (name) name.style.opacity = op
      }
      placeNames(toPlace)
    }

    // Natpisi se ne smiju preklapati: za svaki se probaju mjesta oko točke (desno/lijevo, iznad/ispod),
    // a ako su sva zauzeta, natpis se pomiče dolje/gore dok ne nađe slobodan red
    const lastSpot = new Map<string, number>()
    const placeNames = (list: { name: SVGTextElement; key: string; ax: number; ay: number }[]) => {
      const W = stage.clientWidth
      const lh = W < 900 ? 14 : 16
      const taken: { x0: number; x1: number; y0: number; y1: number }[] = []
      const free = (b: (typeof taken)[number]) =>
        b.x0 >= 4 && b.x1 <= W - 4 && taken.every((t) => b.x1 + 4 < t.x0 || b.x0 - 4 > t.x1 || b.y1 + 2 < t.y0 || b.y0 - 2 > t.y1)
      for (const l of list.sort((m, n) => m.ay - n.ay)) {
        const w = l.name.getComputedTextLength()
        // [pomak x, bazna linija y, desno poravnanje]
        const spots: [number, number, boolean][] = [
          [9, -8, false],
          [-9, -8, true],
          [9, lh + 6, false],
          [-9, lh + 6, true],
        ]
        for (let k = 1; k <= 8; k++) {
          const dy = Math.ceil(k / 2) * (lh + 3) * (k % 2 ? 1 : -1)
          spots.push([9, -8 + dy, false], [-9, -8 + dy, true])
        }
        const pref = lastSpot.get(l.key)
        const order = pref !== undefined ? [pref, ...spots.keys()] : [...spots.keys()]
        let pick = order.find((i) => {
          const [dx, by, end] = spots[i]
          const x0 = end ? l.ax + dx - w : l.ax + dx
          return free({ x0, x1: x0 + w, y0: l.ay + by - lh + 3, y1: l.ay + by + 3 })
        })
        pick ??= 0
        lastSpot.set(l.key, pick)
        const [dx, by, end] = spots[pick]
        const x0 = end ? l.ax + dx - w : l.ax + dx
        taken.push({ x0, x1: x0 + w, y0: l.ay + by - lh + 3, y1: l.ay + by + 3 })
        l.name.setAttribute('text-anchor', end ? 'end' : 'start')
        l.name.setAttribute('x', (l.ax + dx).toFixed(1))
        l.name.setAttribute('y', (l.ay + by).toFixed(1))
      }
    }

    // Full screen amount: 0 = inset card, 1 = full screen. It grows as the track reaches the top
    // and shrinks again before the stage unpins. With reduced motion the stage stays at full size.
    const ease = (x: number) => x * x * (3 - 2 * x)
    const fullness = () => {
      if (mq.matches) return 1
      const r = track.getBoundingClientRect()
      const vh = window.innerHeight
      const grow = clamp01((vh * 0.7 - r.top) / (vh * 0.7))
      const shrink = clamp01((r.bottom - vh) / (vh * 0.7))
      return ease(Math.min(grow, shrink))
    }

    const tick = (now: number) => {
      if (!visible) return
      stage.style.setProperty('--e', fullness().toFixed(4))
      const dt = Math.min(0.1, (now - last) / 1000)
      last = now
      const prog = progress()
      scene.setProgress(prog)
      if (barRef.current) {
        barRef.current.style.transform = `scaleX(${prog.toFixed(4)})`
        barRef.current.setAttribute('aria-valuenow', String(Math.round(prog * 100)))
      }
      const idx = teamAt(scene.getProgress(), teams.length)
      if (idx !== activeRef.current) {
        activeRef.current = idx
        setActive(idx)
        stage.style.setProperty('--team', teamColor(idx >= 0 ? teams[idx].code : null))
        const code = idx >= 0 ? teams[idx].code : null
        // tim bez fizičkih dijelova (npr. marketing) — cijeli bolid ostaje neutralan
        scene.setTeam(code && CAR_GROUPS.some((g) => g.team === code) ? code : code ? '*' : null)
      }
      const pos = scene.frame(dt, mq.matches)
      layout(pos, dt, mq.matches)
      layoutDims(scene.dims())
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      vis.disconnect()
    }
  }, [ready, teams, c])

  const countLine = (code: string) => {
    const a = CAR_GROUPS.filter((g) => g.team === code).length
    if (!a) return c.carNoParts
    const m = sceneRef.current?.counts[code] ?? a
    return c.carCount.replace('{a}', String(a)).replace('{m}', String(m))
  }

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
    <section id="timovi" className="scroll-mt-16 pt-[clamp(96px,14vw,160px)]">
      <div className="mx-auto flex w-full max-w-[1344px] flex-wrap items-end justify-between gap-6 px-[clamp(20px,3.4vw,48px)]">
        <h2 className={tw.h2}>{c.teamsTitle}</h2>
        <p className="m-0 max-w-[380px] text-[17px] leading-[1.55] text-[#b8aca8]">{c.carIntro}</p>
      </div>

      <div
        ref={trackRef}
        className="relative mt-10 h-[520vh] w-full [--stage-h:100svh]"
      >
        {/* Snap points: the scroll settles for a moment on each team before it moves to the next */}
        {teams.map((t, i) => (
          <div
            key={t.code}
            aria-hidden="true"
            className="pointer-events-none absolute left-0 h-px w-px snap-start"
            style={{
              top: `calc(${PHASE.teamsFrom + ((i + 0.5) / teams.length) * (PHASE.teamsTo - PHASE.teamsFrom)} * (100% - var(--stage-h)))`,
            }}
          />
        ))}
        <div
          ref={stageRef}
          data-edge-hide
          style={{ '--e': 0, '--team': '#e2475b' } as CSSProperties}
          className={cx(
            // --e is 0 for the inset card and 1 for the full screen. The clip path follows it.
            'sticky top-0 h-svh w-full bg-bg',
            '[--ct:72px] [--cb:12px] [--cs:clamp(20px,3.4vw,48px)] [--cr:clamp(18px,4vw,24px)] md:[--ct:80px] md:[--cb:16px]',
            '[clip-path:inset(calc(var(--ct)*(1-var(--e)))_calc(var(--cs)*(1-var(--e)))_calc(var(--cb)*(1-var(--e)))_calc(var(--cs)*(1-var(--e)))_round_calc(var(--cr)*(1-var(--e))))]',
          )}
        >
          {/* Thin ring around the card. It fades out while the stage grows to full screen. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-[var(--ct)_var(--cs)_var(--cb)] rounded-[var(--cr)] border border-fg/10 opacity-[calc(1-var(--e))]"
          />
          {/* Large faint outlined code of the active team, behind the car */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 grid select-none place-items-center overflow-hidden">
            <span
              className={cx(
                'display text-[clamp(150px,32vw,460px)] leading-none font-black tracking-[-.04em] whitespace-nowrap transition-opacity duration-500',
                activeTeam ? 'opacity-100' : 'opacity-0',
              )}
              style={{ color: 'transparent', WebkitTextStroke: `1.5px ${teamColor(ghostTeam?.code)}`, opacity: undefined }}
            >
              <span className="opacity-[.2]">{ghostTeam?.code}</span>
            </span>
          </div>
          <canvas
            ref={canvasRef}
            className={cx('absolute inset-0 size-full transition-opacity duration-700', ready ? 'opacity-100' : 'opacity-0')}
            aria-label={c.carAria}
            role="img"
          />

          {/* Dashed lines from the parts of the active team to its chip at the bottom */}
          <svg ref={svgRef} className="pointer-events-none absolute inset-0 size-full" aria-hidden="true">
            {CAR_GROUPS.map((g) => (
              <g key={g.key}>
                <polyline
                  data-key={g.key}
                  fill="none"
                  stroke="var(--team)"
                  strokeWidth="1"
                  strokeDasharray="3 4"
                  style={{ opacity: 0 }}
                />
                <circle data-key={g.key} r="3.5" fill="var(--team)" stroke="var(--bg)" strokeWidth="1.5" style={{ opacity: 0 }} />
                <text data-key={g.key} className={labelText} fill="var(--fg)" style={{ opacity: 0 }}>
                  {g.name[lang]}
                </text>
              </g>
            ))}
            {/* A team without own parts (marketing): one line from the whole car */}
            <g>
              <polyline data-key="__all" fill="none" stroke="var(--team)" strokeWidth="1" strokeDasharray="3 4" style={{ opacity: 0 }} />
              <circle data-key="__all" r="3.5" fill="var(--team)" stroke="var(--bg)" strokeWidth="1.5" style={{ opacity: 0 }} />
              <text data-key="__all" className={labelText} fill="var(--fg)" style={{ opacity: 0 }}>
                {c.carAll}
              </text>
            </g>
            {/* Dimension lines (whole-car phases) */}
            {(['length', 'wheelbase', 'width'] as const).map((k) => (
              <g key={k} data-dim={k} style={{ opacity: 0 }} stroke="var(--fg)" strokeWidth="1">
                <line />
                <line />
                <line />
                <text fill="var(--fg)" stroke="var(--bg)" strokeWidth="3" paintOrder="stroke" textAnchor="middle" className="text-[11px] font-medium [font-variant-numeric:tabular-nums] md:text-xs" />
              </g>
            ))}
          </svg>

          {/* Top bar */}
          <div className="pointer-events-none absolute inset-x-[calc(var(--cs)+16px)] top-[calc(var(--ct)+14px)] flex justify-between text-[13px] text-mute md:text-sm">
            <span className="min-w-0 pr-3">
              <span className="font-semibold text-acc">eFRT01</span> · {c.carModelNote}
            </span>
            <span className="flex items-center gap-4">
              <span className="hidden items-center gap-1 md:inline-flex">
                {c.carScroll}
                <ArrowDown aria-hidden size={14} />
              </span>
              <a
                href="#timovi-kraj"
                className="press pointer-events-auto inline-flex items-center gap-1.5 rounded-full border border-fg/25 bg-bg/60 px-3 py-1 whitespace-nowrap text-fg backdrop-blur-sm hover:border-fg/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--team)]"
              >
                {c.carSkip}
                <ArrowRight aria-hidden size={14} />
              </a>
            </span>
          </div>

          {!ready && (
            <div className="absolute inset-0 grid place-items-center text-sm text-mute">
              {failed ? c.carFailed : `${c.carLoading} ${loaded === null ? '' : `${Math.round(loaded * 100)}%`}`}
            </div>
          )}

          {/* Text of the active team: top right on wide screens, above the chips on a phone (there every card has the same width) */}
          <div className="pointer-events-none absolute inset-x-[calc(var(--cs)+12px)] top-[calc(var(--ct)+46px)] flex max-md:top-auto max-md:bottom-[calc(var(--cb)+clamp(72px,12vw,96px))] md:justify-end">
            <div
              className={cx(
                'glass max-w-[420px] rounded-2xl p-3.5 transition-[opacity,translate] duration-300 max-md:mx-auto max-md:w-full md:p-5',
                activeTeam ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0',
              )}
              aria-live="polite"
            >
              {activeTeam && (
                <div key={activeTeam.code} className="animate-fade-up">
                  <div className="flex justify-between text-sm text-mute">
                    <span className="font-semibold" style={{ color: teamColor(activeTeam.code) }}>
                      {String(active + 1).padStart(2, '0')}
                    </span>
                    <span>{activeTeam.code}</span>
                  </div>
                  <h3 className="display m-0 mt-1 text-2xl leading-none [font-stretch:115%] tracking-[-.02em] md:text-[32px]">
                    {activeTeam.name}
                  </h3>
                  <p className="m-0 mt-1.5 hidden text-[13px] leading-snug text-[#c9bdb9] md:mt-2 md:block md:text-[15px] md:leading-normal">{activeTeam.d}</p>
                  <p className="m-0 mt-2 text-xs text-mute md:text-[13px]">{countLine(activeTeam.code)}</p>
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {activeTeam.tags.map((g) => (
                      <span
                        key={g}
                        className="rounded-full border px-2.5 py-0.5 text-xs"
                        style={{ borderColor: `${teamColor(activeTeam.code)}99`, color: teamColor(activeTeam.code) }}
                      >
                        {g}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Team selector: glass pill. The lines end on the chips. Every chip is as wide as the widest one. */}
          <nav
            aria-label={c.teamsTitle}
            className="absolute bottom-[calc(var(--cb)+clamp(12px,3vw,24px))] left-1/2 flex max-w-[calc(100%-24px)] -translate-x-1/2 gap-0.5 rounded-full border border-fg/[.14] bg-[rgba(20,17,18,.55)] p-1 text-sm whitespace-nowrap backdrop-blur-[14px]"
          >
            {/* Sliding pill behind the active chip */}
            <span
              aria-hidden
              className="pointer-events-none absolute top-1 bottom-1 left-0 rounded-full [transition:translate_420ms_cubic-bezier(.2,.8,.2,1),width_420ms_cubic-bezier(.2,.8,.2,1),opacity_200ms,background-color_300ms] motion-reduce:transition-none"
              style={{
                width: pill.w,
                translate: `${pill.x}px 0`,
                backgroundColor: teamColor(activeTeam?.code ?? null),
                opacity: active < 0 ? 0 : 1,
              }}
            />
            {teams.map((t, i) => (
              <button
                key={t.code}
                ref={(el) => {
                  chipRefs.current[i] = el
                }}
                type="button"
                onClick={() => goToTeam(i)}
                aria-pressed={active === i}
                title={t.name}
                className={cx(
                  'press relative z-10 min-h-11 cursor-pointer rounded-full px-[clamp(10px,2.6vw,16px)] py-[9px] text-center font-semibold',
                  active === i ? 'text-[#141112]' : 'text-fg hover:bg-fg/10',
                )}
              >
                {t.code}
              </button>
            ))}
          </nav>

          <p
            className={cx(
              'pointer-events-none absolute bottom-[calc(var(--cb)+clamp(72px,12vw,96px))] left-1/2 m-0 w-max max-w-[calc(100%-32px)] -translate-x-1/2 text-center text-[11px] text-mute transition-opacity duration-300 md:text-xs',
              active < 0 ? 'opacity-70' : 'opacity-0',
            )}
          >
            {c.carDimNote}
          </p>

          {/* Thin scroll progress bar at the bottom edge of the stage */}
          <div
            ref={barRef}
            role="progressbar"
            aria-label={c.carProgress}
            aria-valuemin={0}
            aria-valuemax={100}
            className="pointer-events-none absolute inset-x-0 bottom-0 h-[3px] origin-left scale-x-0 bg-[var(--team)] transition-colors duration-300"
          />
        </div>
      </div>
      <div id="timovi-kraj" tabIndex={-1} className="outline-none" />
    </section>
  )
}
