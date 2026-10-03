import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import type { Lang } from '~/content'

type Item = { src: string; alt: string; caption: string }

const LABELS = {
  hr: { open: 'Otvori sliku', close: 'Zatvori', prev: 'Prethodna slika', next: 'Sljedeća slika', dialog: 'Pregled slike' },
  en: { open: 'Open image', close: 'Close', prev: 'Previous image', next: 'Next image', dialog: 'Image viewer' },
} as const

const SELECTOR = 'img[data-lb]'
const EASE = 'cubic-bezier(.2,.8,.2,1)'
const OPEN_MS = 380
const CLOSE_MS = 300
const SLIDE_PX = 48

/** Read the images of the article in the page order. */
function collect(root: HTMLElement): { items: Item[]; nodes: HTMLImageElement[] } {
  const nodes = [...root.querySelectorAll<HTMLImageElement>(SELECTOR)]
  const items = nodes.map((img) => ({
    src: img.currentSrc || img.src,
    alt: img.alt,
    caption: img.closest('figure')?.querySelector('figcaption')?.textContent ?? '',
  }))
  return { items, nodes }
}

/** True when the reader asks for less motion. Only call this in the browser. */
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Stop all running animations of one element. */
function stop(el: Element | null | undefined) {
  el?.getAnimations?.().forEach((a) => a.cancel())
}

/** Resistance past the edge: the pull gets harder and never passes the size. */
function rubber(x: number, size: number) {
  const c = 0.55
  const sign = x < 0 ? -1 : 1
  const a = Math.abs(x)
  return sign * (1 - 1 / ((a * c) / size + 1)) * size
}

/**
 * A lightbox for the images of one article.
 * The server renders plain img elements with data-lb. This component adds the click handling
 * with event delegation on the container, so it also works with the prerendered HTML.
 */
export function Lightbox({ containerRef, lang }: { containerRef: RefObject<HTMLElement | null>; lang: Lang }) {
  const t = LABELS[lang]
  const [state, setState] = useState<{ items: Item[]; nodes: HTMLImageElement[]; index: number } | null>(null)
  const trigger = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const root = containerRef.current
    if (!root) return
    // Make each image reachable with the keyboard.
    for (const img of root.querySelectorAll<HTMLImageElement>(SELECTOR)) {
      img.tabIndex = 0
      img.setAttribute('role', 'button')
      img.setAttribute('aria-haspopup', 'dialog')
      img.setAttribute('aria-label', `${t.open}${img.alt ? `: ${img.alt}` : ''}`)
    }
    const open = (img: HTMLImageElement) => {
      const { items, nodes } = collect(root)
      const index = nodes.indexOf(img)
      if (index < 0) return
      trigger.current = img
      setState({ items, nodes, index })
    }
    const onClick = (e: MouseEvent) => {
      const img = (e.target as Element | null)?.closest?.(SELECTOR)
      if (img instanceof HTMLImageElement && root.contains(img)) {
        e.preventDefault()
        open(img)
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' && e.key !== ' ') return
      const img = (e.target as Element | null)?.closest?.(SELECTOR)
      if (img instanceof HTMLImageElement) {
        e.preventDefault()
        open(img)
      }
    }
    root.addEventListener('click', onClick)
    root.addEventListener('keydown', onKey)
    return () => {
      root.removeEventListener('click', onClick)
      root.removeEventListener('keydown', onKey)
    }
  }, [containerRef, t])

  const close = useCallback(() => {
    setState(null)
    trigger.current?.focus()
  }, [])

  return state ? <Viewer items={state.items} origins={state.nodes} start={state.index} labels={t} onClose={close} /> : null
}

/** An image that leaves the screen while the next image comes in. */
type Ghost = { id: number; item: Item; transform: string; opacity: string; dir: number }

function GhostImage({ ghost, onDone }: { ghost: Ghost; onDone: (id: number) => void }) {
  const ref = useRef<HTMLImageElement>(null)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const slide = reducedMotion() ? 0 : -ghost.dir * SLIDE_PX
    const from = ghost.transform === 'none' ? 'translate3d(0,0,0)' : ghost.transform
    const a = el.animate(
      [
        { transform: from, opacity: ghost.opacity },
        { transform: `${from} translate3d(${slide}px,0,0)`, opacity: 0 },
      ],
      { duration: 260, easing: EASE, fill: 'forwards' },
    )
    a.onfinish = () => onDone(ghost.id)
    return () => a.cancel()
  }, [ghost, onDone])
  return <img ref={ref} src={ghost.item.src} alt="" aria-hidden="true" draggable={false} className="pointer-events-none col-start-1 row-start-1 block max-h-full max-w-full rounded-xl object-contain" />
}

function Viewer({
  items,
  origins,
  start,
  labels,
  onClose,
}: {
  items: Item[]
  origins: HTMLImageElement[]
  start: number
  labels: (typeof LABELS)[Lang]
  onClose: () => void
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const backdropRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const [i, setI] = useState(start)
  const [ghosts, setGhosts] = useState<Ghost[]>([])
  const iRef = useRef(start)
  const dirRef = useRef(1)
  const ghostId = useRef(0)
  const closing = useRef(false)
  const mounted = useRef(false)
  const justDragged = useRef(false)
  const many = items.length > 1

  const uiItems = () => [...(dialogRef.current?.querySelectorAll<HTMLElement>('[data-ui]') ?? [])]

  /** Show the thumbnails again. */
  const restoreThumbs = useCallback(() => {
    for (const n of origins) n.style.visibility = ''
  }, [origins])

  /** Move to another image. dir is 1 for next and -1 for previous. */
  const goTo = useCallback(
    (next: number, dir: number) => {
      if (closing.current || next < 0 || next >= items.length || next === iRef.current) return
      const cur = imgRef.current
      if (cur) {
        // Start the leaving image where the current image is now, so a fast change stays smooth.
        const cs = getComputedStyle(cur)
        const id = ++ghostId.current
        setGhosts((g) => [...g, { id, item: items[iRef.current], transform: cs.transform, opacity: cs.opacity, dir }])
      }
      dirRef.current = dir
      iRef.current = next
      setI(next)
    },
    [items],
  )

  /** Close with the reverse of the open motion. */
  const requestClose = useCallback(() => {
    if (closing.current) return
    closing.current = true
    const img = imgRef.current
    const bd = backdropRef.current
    const finish = () => {
      restoreThumbs()
      onClose()
    }
    if (!img || !bd) return finish()
    const reduced = reducedMotion()
    const cur = getComputedStyle(img).transform
    const curOpacity = getComputedStyle(img).opacity
    const bdOpacity = getComputedStyle(bd).opacity
    stop(img)
    stop(bd)
    img.style.transform = ''
    img.style.opacity = ''
    bd.style.opacity = ''
    for (const el of uiItems()) {
      const o = getComputedStyle(el).opacity
      stop(el)
      el.style.opacity = ''
      el.animate([{ opacity: o }, { opacity: 0 }], { duration: 160, easing: 'ease-out', fill: 'forwards' })
    }
    const opts: KeyframeAnimationOptions = { duration: reduced ? 200 : CLOSE_MS, easing: EASE, fill: 'forwards' }
    bd.animate([{ opacity: bdOpacity }, { opacity: 0 }], opts)

    const thumb = origins[iRef.current]
    const t = thumb?.isConnected ? thumb.getBoundingClientRect() : null
    const inView = !!t && t.width > 0 && t.height > 0 && t.bottom > 0 && t.top < innerHeight && t.right > 0 && t.left < innerWidth
    let anim: Animation
    if (!reduced && inView && t) {
      // Fly back to the thumbnail rectangle.
      const r = img.getBoundingClientRect()
      const to = `translate3d(${t.left + t.width / 2 - (r.left + r.width / 2)}px,${t.top + t.height / 2 - (r.top + r.height / 2)}px,0) scale(${t.width / r.width},${t.height / r.height})`
      anim = img.animate([{ transform: cur, opacity: curOpacity }, { transform: to, opacity: 1 }], opts)
    } else {
      anim = img.animate(
        [
          { transform: cur, opacity: curOpacity },
          { transform: reduced ? cur : `${cur === 'none' ? '' : cur} scale(.94)`, opacity: 0 },
        ],
        opts,
      )
    }
    anim.onfinish = finish
  }, [onClose, origins, restoreThumbs])

  // Open the dialog and play the open motion.
  useLayoutEffect(() => {
    const d = dialogRef.current
    const img = imgRef.current
    const bd = backdropRef.current
    if (!d || !img || !bd) return
    d.showModal()
    const root = document.documentElement
    const prev = root.style.overflow
    root.style.overflow = 'hidden'
    const onCancel = (e: Event) => {
      e.preventDefault()
      requestClose()
    }
    d.addEventListener('cancel', onCancel)

    const reduced = reducedMotion()
    const thumb = origins[start]
    const thumbRect = thumb?.isConnected ? thumb.getBoundingClientRect() : null
    if (thumb) thumb.style.visibility = 'hidden'

    bd.animate([{ opacity: 0 }, { opacity: 1 }], { duration: reduced ? 200 : OPEN_MS, easing: EASE })
    for (const el of uiItems()) {
      el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 240, delay: reduced ? 0 : 140, easing: 'ease-out', fill: 'backwards' })
    }

    const play = () => {
      img.style.opacity = ''
      const r = img.getBoundingClientRect()
      if (!reduced && thumbRect && thumbRect.width > 0 && r.width > 0) {
        const from = `translate3d(${thumbRect.left + thumbRect.width / 2 - (r.left + r.width / 2)}px,${thumbRect.top + thumbRect.height / 2 - (r.top + r.height / 2)}px,0) scale(${thumbRect.width / r.width},${thumbRect.height / r.height})`
        img.animate([{ transform: from }, { transform: 'none' }], { duration: OPEN_MS, easing: EASE })
      } else {
        img.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 220, easing: 'ease-out' })
      }
    }
    // The thumbnail src is the same, so the image is normally ready. If not, wait for it.
    const ready = img.complete && img.naturalWidth > 0
    if (ready) play()
    else {
      img.style.opacity = '0'
      img.addEventListener('load', play, { once: true })
    }

    return () => {
      img.removeEventListener('load', play)
      d.removeEventListener('cancel', onCancel)
      root.style.overflow = prev
      for (const n of origins) n.style.visibility = ''
      d.close()
    }
    // This runs once when the viewer opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Hide the thumbnail of the image on screen, and warm the neighbours.
  useEffect(() => {
    origins.forEach((n, k) => {
      n.style.visibility = k === i ? 'hidden' : ''
    })
    for (const k of [i - 1, i + 1]) {
      const it = items[k]
      if (it) new Image().src = it.src
    }
  }, [i, items, origins])

  // Slide the new image in, in the direction of travel.
  useLayoutEffect(() => {
    if (!mounted.current) {
      mounted.current = true
      return
    }
    const img = imgRef.current
    if (!img) return
    const slide = reducedMotion() ? 0 : dirRef.current * SLIDE_PX
    img.animate(
      [
        { transform: `translate3d(${slide}px,0,0)`, opacity: 0 },
        { transform: 'translate3d(0,0,0)', opacity: 1 },
      ],
      { duration: 320, easing: EASE },
    )
  }, [i])

  const dropGhost = useCallback((id: number) => setGhosts((g) => g.filter((x) => x.id !== id)), [])

  // Touch drag: 1:1 tracking, rubber band at the ends, and swipe down to dismiss.
  const drag = useRef<{
    id: number
    x0: number
    y0: number
    bx: number
    by: number
    x: number
    t: number
    v: number
    vy: number
    y: number
    axis: '' | 'x' | 'y'
    dx: number
    dy: number
  } | null>(null)

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse' || closing.current || drag.current || !e.isPrimary) return
    const img = imgRef.current
    if (!img) return
    // Freeze a running animation where it is, so the finger can take over.
    const cs = getComputedStyle(img)
    const m = new DOMMatrix(cs.transform === 'none' ? undefined : cs.transform)
    const o = cs.opacity
    stop(img)
    img.style.transform = cs.transform
    img.style.opacity = o
    drag.current = { id: e.pointerId, x0: e.clientX, y0: e.clientY, bx: m.m41, by: m.m42, x: e.clientX, y: e.clientY, t: e.timeStamp, v: 0, vy: 0, axis: '', dx: 0, dy: 0 }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current
    const img = imgRef.current
    if (!d || d.id !== e.pointerId || !img) return
    const dx = e.clientX - d.x0
    const dy = e.clientY - d.y0
    const dt = Math.max(1, e.timeStamp - d.t)
    // Smooth the velocity (px per ms) so one noisy sample does not decide.
    d.v = 0.7 * ((e.clientX - d.x) / dt) + 0.3 * d.v
    d.vy = 0.7 * ((e.clientY - d.y) / dt) + 0.3 * d.vy
    d.x = e.clientX
    d.y = e.clientY
    d.t = e.timeStamp
    d.dx = dx
    d.dy = dy
    if (!d.axis && Math.hypot(dx, dy) > 8) d.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'
    const stage = stageRef.current
    if (!stage) return
    if (d.axis === 'x') {
      const w = stage.clientWidth
      const blocked = (dx < 0 && iRef.current >= items.length - 1) || (dx > 0 && iRef.current <= 0)
      const tx = blocked ? rubber(dx, w) : dx
      img.style.transform = `translate3d(${d.bx + tx}px,${d.by}px,0)`
    } else if (d.axis === 'y') {
      const h = stage.clientHeight
      const ty = dy > 0 ? dy : rubber(dy, h) * 0.5
      const p = Math.min(1, Math.abs(ty) / (h * 0.6))
      img.style.transform = `translate3d(${d.bx}px,${d.by + ty}px,0) scale(${1 - p * 0.2})`
      if (backdropRef.current) backdropRef.current.style.opacity = String(1 - p * 0.9)
      for (const el of uiItems()) el.style.opacity = String(Math.max(0, 1 - p * 3))
    }
  }

  const onPointerEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current
    const img = imgRef.current
    if (!d || d.id !== e.pointerId) return
    drag.current = null
    if (!img) return
    // A pause before release means no fling.
    const idle = e.timeStamp - d.t > 100
    const v = idle ? 0 : d.v
    const vy = idle ? 0 : d.vy
    const cancelled = e.type === 'pointercancel'
    if (d.axis) justDragged.current = true
    const stage = stageRef.current
    if (!cancelled && d.axis === 'x' && stage) {
      let dir = 0
      if (Math.abs(v) > 0.5) dir = v < 0 ? 1 : -1
      else if (Math.abs(d.dx) > stage.clientWidth * 0.25) dir = d.dx < 0 ? 1 : -1
      if (dir && iRef.current + dir >= 0 && iRef.current + dir < items.length) {
        goTo(iRef.current + dir, dir)
        return
      }
    }
    if (!cancelled && d.axis === 'y' && (d.dy > 100 || vy > 0.5) && d.dy > 0) {
      requestClose()
      return
    }
    // Spring back to rest.
    const cur = getComputedStyle(img).transform
    img.style.transform = ''
    img.style.opacity = ''
    img.animate([{ transform: cur }, { transform: 'none' }], { duration: 380, easing: EASE })
    const bd = backdropRef.current
    if (bd) {
      const o = getComputedStyle(bd).opacity
      bd.style.opacity = ''
      bd.animate([{ opacity: o }, { opacity: 1 }], { duration: 300, easing: EASE })
    }
    for (const el of uiItems()) {
      const o = getComputedStyle(el).opacity
      el.style.opacity = ''
      el.animate([{ opacity: o }, { opacity: 1 }], { duration: 300, easing: EASE })
    }
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLDialogElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      requestClose()
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      goTo(iRef.current + 1, 1)
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      goTo(iRef.current - 1, -1)
    } else if (e.key === 'Tab') {
      // Keep the focus inside the dialog.
      const focusable = [...e.currentTarget.querySelectorAll<HTMLElement>('button:not([disabled])')]
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const active = document.activeElement
      if (e.shiftKey && active === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && active === last) {
        e.preventDefault()
        first.focus()
      }
    }
  }

  const onStageClick = (e: React.MouseEvent) => {
    if (justDragged.current) {
      justDragged.current = false
      return
    }
    if (e.target === e.currentTarget) requestClose()
  }

  const item = items[i]
  const btn =
    'glass press grid size-11 cursor-pointer place-items-center rounded-full text-fg hover:text-acc focus-visible:outline-2 focus-visible:outline-acc aria-disabled:opacity-40'
  return (
    <dialog
      ref={dialogRef}
      aria-label={labels.dialog}
      aria-modal="true"
      onKeyDown={onKeyDown}
      onClick={(e) => e.target === e.currentTarget && requestClose()}
      className="m-0 h-dvh max-h-none w-screen max-w-none overflow-hidden border-0 bg-transparent p-0 text-fg"
    >
      {/* The own backdrop can fade with the motion of the image. */}
      <div ref={backdropRef} aria-hidden="true" className="absolute inset-0 bg-black/85 backdrop-blur-md" />
      <div
        ref={stageRef}
        onClick={onStageClick}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
        style={{ touchAction: 'none' }}
        className="absolute inset-0 grid grid-cols-[minmax(0,1fr)] grid-rows-[minmax(0,1fr)] place-items-center px-3 pt-16 pb-24 md:px-20"
      >
        {ghosts.map((g) => (
          <GhostImage key={g.id} ghost={g} onDone={dropGhost} />
        ))}
        <img
          key={`cur-${i}`}
          ref={imgRef}
          src={item.src}
          alt={item.alt}
          draggable={false}
          className="col-start-1 row-start-1 block max-h-full max-w-full rounded-xl object-contain will-change-transform"
          onClick={(e) => e.stopPropagation()}
        />
      </div>
      <button type="button" data-ui onClick={requestClose} aria-label={labels.close} className={`${btn} absolute top-3 right-3`} autoFocus>
        <X size={18} aria-hidden="true" />
      </button>
      {many && (
        <>
          <button
            type="button"
            data-ui
            onClick={() => goTo(i - 1, -1)}
            aria-label={labels.prev}
            aria-disabled={i === 0}
            className={`${btn} absolute top-1/2 left-2 -translate-y-1/2 md:left-5`}
          >
            <ChevronLeft size={20} aria-hidden="true" />
          </button>
          <button
            type="button"
            data-ui
            onClick={() => goTo(i + 1, 1)}
            aria-label={labels.next}
            aria-disabled={i === items.length - 1}
            className={`${btn} absolute top-1/2 right-2 -translate-y-1/2 md:right-5`}
          >
            <ChevronRight size={20} aria-hidden="true" />
          </button>
        </>
      )}
      <div data-ui aria-live="polite" className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-center gap-1 px-4 pb-6 text-center">
        {item.caption && <p className="m-0 max-w-[70ch] text-sm text-fg">{item.caption}</p>}
        {many && (
          <p className="m-0 text-xs text-mute tabular-nums">
            {i + 1} / {items.length}
          </p>
        )}
      </div>
    </dialog>
  )
}
