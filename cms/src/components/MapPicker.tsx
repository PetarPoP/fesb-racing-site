'use client'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useField } from '@payloadcms/ui'

// Map of a competition in the admin. It sets the four "map" values (centre and half size of the view).
// OpenStreetMap tiles, no map library: drag to move, wheel or +/- to zoom, a click centres the map there.
// The red frame is the part that the site shows in the competition panel.

const TILE = 256
const MIN_Z = 3
const MAX_Z = 18
const HEIGHT = 420
/** Half width of the red frame in px, and its height to width ratio (about the shape of the map on the site). */
const frameHalf = (width: number) => Math.min(width / 4, 220)
const FRAME_RATIO = 0.85

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))
/** Web Mercator: degrees to world pixels at zoom z, and back. */
const toPx = (lat: number, lng: number, z: number) => {
  const n = TILE * 2 ** z
  const s = Math.sin((clamp(lat, -85, 85) * Math.PI) / 180)
  return {
    x: ((lng + 180) / 360) * n,
    y: (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * n,
  }
}
const toDeg = (x: number, y: number, z: number) => {
  const n = TILE * 2 ** z
  const lng = (x / n) * 360 - 180
  const lat = (Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / n))) * 180) / Math.PI
  return { lat, lng }
}
const round = (v: number, d = 5) => Math.round(v * 10 ** d) / 10 ** d

export default function MapPicker() {
  const lat = useField<number>({ path: 'map.lat' })
  const lng = useField<number>({ path: 'map.lng' })
  const spanLat = useField<number>({ path: 'map.spanLat' })
  const spanLng = useField<number>({ path: 'map.spanLng' })
  const box = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(640)
  const [drag, setDrag] = useState<{
    x: number
    y: number
    dx: number
    dy: number
    moved: boolean
  } | null>(null)
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)

  const has = [lat.value, lng.value].every((v) => typeof v === 'number')
  const cLat = has ? lat.value! : 45
  const cLng = has ? lng.value! : 12
  const sLng = typeof spanLng.value === 'number' && spanLng.value > 0 ? spanLng.value : 0.015

  // The zoom follows the saved view: the saved spans fit in the frame, so the whole site view is on the map.
  const sLat = typeof spanLat.value === 'number' && spanLat.value > 0 ? spanLat.value : sLng / 2
  const latPx0 = (toPx(cLat - sLat, cLng, 0).y - toPx(cLat + sLat, cLng, 0).y) / 2
  const fitZoom = Math.min(Math.log2((360 * frameHalf(width)) / (TILE * sLng)), Math.log2((HEIGHT * 0.42) / latPx0))
  const zoom = clamp(Math.floor(fitZoom + 0.05), MIN_Z, MAX_Z)

  useEffect(() => {
    const el = box.current
    if (!el) return
    const ro = new ResizeObserver(() => setWidth(el.clientWidth || 640))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  /** Save a new centre. The spans follow the zoom and the size of the frame. */
  const save = useCallback(
    (la: number, ln: number, z: number) => {
      lat.setValue(round(la))
      lng.setValue(round(ln))
      const halfW = frameHalf(width)
      const halfH = halfW * FRAME_RATIO
      const c = toPx(la, ln, z)
      const a = toDeg(c.x - halfW, c.y - halfH, z)
      spanLng.setValue(round(ln - a.lng, 4))
      spanLat.setValue(round(a.lat - la, 4))
    },
    [lat, lng, spanLat, spanLng, width],
  )

  const centre = toPx(cLat, cLng, zoom)
  const cx = centre.x - (drag?.dx ?? 0)
  const cy = centre.y - (drag?.dy ?? 0)
  const left = cx - width / 2
  const top = cy - HEIGHT / 2
  const n = 2 ** zoom
  const tiles: { key: string; x: number; y: number; src: string }[] = []
  for (let ty = Math.floor(top / TILE); ty <= Math.floor((top + HEIGHT) / TILE); ty++) {
    if (ty < 0 || ty >= n) continue
    for (let tx = Math.floor(left / TILE); tx <= Math.floor((left + width) / TILE); tx++) {
      const wx = ((tx % n) + n) % n
      tiles.push({
        key: `${tx}/${ty}`,
        x: tx * TILE - left,
        y: ty * TILE - top,
        src: `https://tile.openstreetmap.org/${zoom}/${wx}/${ty}.png`,
      })
    }
  }

  // The frame of the site view, from the saved spans.
  let frame: { x: number; y: number; w: number; h: number } | null = null
  if (has && typeof spanLat.value === 'number' && typeof spanLng.value === 'number') {
    const a = toPx(cLat + spanLat.value, cLng - spanLng.value, zoom)
    const b = toPx(cLat - spanLat.value, cLng + spanLng.value, zoom)
    frame = { x: a.x - left, y: a.y - top, w: b.x - a.x, h: b.y - a.y }
  }

  const onUp = (e: React.PointerEvent) => {
    if (!drag) return
    const rect = box.current!.getBoundingClientRect()
    if (drag.moved) {
      const d = toDeg(cx, cy, zoom)
      save(d.lat, d.lng, zoom)
    } else {
      const d = toDeg(left + (e.clientX - rect.left), top + (e.clientY - rect.top), zoom)
      save(d.lat, d.lng, zoom)
    }
    setDrag(null)
  }

  const zoomBy = (step: number) => save(cLat, cLng, clamp(zoom + step, MIN_Z, MAX_Z))

  // Wheel zoom with a native listener: React wheel listeners are passive and cannot stop the page from scrolling.
  // One step per 250 ms, so a touchpad does not jump many levels at once.
  const zoomRef = useRef(zoomBy)
  zoomRef.current = zoomBy
  useEffect(() => {
    const el = box.current
    if (!el) return
    let last = 0
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const now = Date.now()
      if (now - last < 250 || e.deltaY === 0) return
      last = now
      zoomRef.current(e.deltaY < 0 ? 1 : -1)
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  const search = async () => {
    if (!query.trim()) return
    setSearching(true)
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`)
      const [hit] = (await res.json()) as { lat: string; lon: string }[]
      if (hit) save(Number(hit.lat), Number(hit.lon), Math.max(zoom, 14))
    } finally {
      setSearching(false)
    }
  }

  const btn: React.CSSProperties = {
    width: 34,
    height: 34,
    borderRadius: 8,
    border: '1px solid var(--theme-elevation-150)',
    background: 'var(--theme-elevation-0)',
    color: 'var(--theme-text)',
    fontSize: 18,
    cursor: 'pointer',
  }

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <input
          type="search"
          value={query}
          placeholder="Search a place (circuit, town) …"
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              void search()
            }
          }}
          style={{
            flex: 1,
            height: 36,
            padding: '0 12px',
            borderRadius: 8,
            border: '1px solid var(--theme-elevation-150)',
            background: 'var(--theme-input-bg)',
            color: 'var(--theme-text)',
          }}
        />
        <button
          type="button"
          onClick={() => void search()}
          disabled={searching}
          style={{ ...btn, width: 'auto', padding: '0 14px', fontSize: 14 }}
        >
          {searching ? '…' : 'Find'}
        </button>
      </div>
      <div
        ref={box}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId)
          setDrag({ x: e.clientX, y: e.clientY, dx: 0, dy: 0, moved: false })
        }}
        onPointerMove={(e) => {
          if (!drag) return
          const dx = e.clientX - drag.x
          const dy = e.clientY - drag.y
          setDrag({
            ...drag,
            dx,
            dy,
            moved: drag.moved || Math.hypot(dx, dy) > 4,
          })
        }}
        onPointerUp={onUp}
        onPointerCancel={() => setDrag(null)}
        style={{
          position: 'relative',
          height: HEIGHT,
          overflow: 'hidden',
          borderRadius: 12,
          border: '1px solid var(--theme-elevation-150)',
          background: '#ddd',
          cursor: drag?.moved ? 'grabbing' : 'grab',
          touchAction: 'none',
          userSelect: 'none',
        }}
      >
        {tiles.map((t) => (
          <img
            key={t.key}
            src={t.src}
            alt=""
            draggable={false}
            style={{
              position: 'absolute',
              left: t.x,
              top: t.y,
              width: TILE,
              height: TILE,
              pointerEvents: 'none',
            }}
          />
        ))}
        {frame && !drag && (
          <div
            style={{
              position: 'absolute',
              left: frame.x,
              top: frame.y,
              width: frame.w,
              height: frame.h,
              border: '2px solid #e2475b',
              background: 'rgba(226,71,91,.08)',
              pointerEvents: 'none',
            }}
          />
        )}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: 14,
            height: 14,
            marginLeft: -7,
            marginTop: -7,
            borderRadius: 7,
            border: '2px solid #e2475b',
            background: '#fff',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            right: 8,
            top: 8,
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <button type="button" aria-label="Zoom in" style={btn} onClick={() => zoomBy(1)}>
            +
          </button>
          <button type="button" aria-label="Zoom out" style={btn} onClick={() => zoomBy(-1)}>
            −
          </button>
        </div>
        <div
          style={{
            position: 'absolute',
            right: 0,
            bottom: 0,
            padding: '2px 6px',
            fontSize: 11,
            background: 'rgba(255,255,255,.8)',
            color: '#333',
          }}
        >
          © OpenStreetMap contributors
        </div>
      </div>
      <p
        style={{
          margin: '6px 0 0',
          fontSize: 13,
          color: 'var(--theme-elevation-500)',
        }}
      >
        Drag or click to move the centre, use the wheel or +/− to zoom. The red frame is what the site shows.
      </p>
    </div>
  )
}
