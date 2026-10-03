// Client-only dither engine. Ported from the v3 design prototype.
// This module does not touch window or document at load time.
// Call startDither() from an effect. It returns a stop function.

const S = 3 // one canvas pixel is S screen pixels
const HERO_SRC = '/img/hero-car.jpg'

// Bayer 8x8 matrix
const B = [
  0, 32, 8, 40, 2, 34, 10, 42, 48, 16, 56, 24, 50, 18, 58, 26, 12, 44, 4, 36, 14, 46, 6, 38, 60, 28, 52, 20, 62, 30, 54,
  22, 3, 35, 11, 43, 1, 33, 9, 41, 51, 19, 59, 27, 49, 17, 57, 25, 15, 47, 7, 39, 13, 45, 5, 37, 63, 31, 55, 23, 61, 29,
  53, 21,
]
type Rgb = readonly [number, number, number]
const P: readonly Rgb[] = [
  [11, 10, 11],
  [125, 28, 44],
  [226, 71, 91],
  [241, 233, 229],
]

// Car body mask, in pixels of the 656x458 hero image
const CAR_POLY: readonly (readonly [number, number])[] = [
  [268, 214], [285, 224], [300, 232], [310, 250], [306, 272], [345, 274], [362, 267], [402, 267], [412, 280], [442, 290],
  [492, 298], [526, 309], [536, 324], [524, 348], [482, 356], [452, 364], [420, 369], [392, 364], [268, 362], [238, 371],
  [205, 374], [172, 369], [158, 354], [154, 322], [149, 306], [150, 291], [214, 289], [224, 262], [238, 240], [255, 228],
]
// Wheels: centre x, centre y, radius
const WHEELS: readonly (readonly [number, number, number])[] = [
  [205, 340, 34],
  [421, 336, 31],
]

type Mode = 'edges' | 'photo' | 'photoStill' | 'glow' | 'noise' | 'footer'
const isStill = (m: string) => m === 'noise' || m === 'photoStill'

interface Lum {
  key: string
  d: Float32Array
  m: Float32Array
  wl: Float32Array
  wa: Float32Array
  nz: Float32Array
}

interface Hover {
  el: HTMLElement
  cv: HTMLCanvasElement
  ce: HTMLCanvasElement | null
  a: number
  on: boolean
  mx: number
  my: number
  sx: number
  sy: number
  ex: number
  ey: number
  mode: string
  col: Rgb
  clear: boolean
  tr: [number, number][]
}

interface Sprite {
  h: number
  w: number
  L: Float32Array
  A: Uint8Array
}

const rnd = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453
  return s - Math.floor(s)
}

const vn = (x: number, y: number, sd: number) => {
  const xi = Math.floor(x)
  const yi = Math.floor(y)
  const xf = x - xi
  const yf = y - yi
  const u = xf * xf * (3 - 2 * xf)
  const v = yf * yf * (3 - 2 * yf)
  const h = (a: number, b: number) => rnd(a * 57 + b * 131 + sd * 17)
  return (h(xi, yi) * (1 - u) + h(xi + 1, yi) * u) * (1 - v) + (h(xi, yi + 1) * (1 - u) + h(xi + 1, yi + 1) * u) * v
}

const ss = (a: number, b: number, x: number) => {
  const u = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return u * u * (3 - 2 * u)
}

const ctx2d = (c: HTMLCanvasElement) => c.getContext('2d', { willReadFrequently: false })

function hexToRgb(h: string): Rgb {
  const n = /^#[0-9a-f]{6}$/i.test(h) ? h : '#e2475b'
  return [parseInt(n.slice(1, 3), 16), parseInt(n.slice(3, 5), 16), parseInt(n.slice(5, 7), 16)]
}

class Engine {
  private root: HTMLElement
  private reduced: boolean
  private photo: HTMLImageElement | null = null
  private lums = new WeakMap<HTMLCanvasElement, Lum>()
  private done = new WeakMap<HTMLCanvasElement, number>()
  private dh = new Map<HTMLElement, Hover>()
  private dhCur: HTMLElement | null = null
  private spr: Sprite | null = null
  private env: Float32Array | null = null
  private raf = 0
  private pending = 0
  private t0 = 0
  private lt = 0
  private stopped = false

  constructor(root: HTMLElement, reduced: boolean) {
    this.root = root
    this.reduced = reduced
  }

  start() {
    this.t0 = performance.now()
    const im = new Image()
    im.onload = () => {
      this.photo = im
      this.requestStill()
    }
    im.src = HERO_SRC
    window.addEventListener('resize', this.onResize)
    if (this.reduced) {
      window.addEventListener('scroll', this.requestStill, { passive: true })
      this.requestStill()
      return
    }
    window.addEventListener('pointermove', this.onPointer)
    document.addEventListener('pointerleave', this.onLeave)
    const loop = () => {
      this.raf = requestAnimationFrame(loop)
      const t = (performance.now() - this.t0) / 1000
      this.drawHover(t)
      if (t - this.lt > 0.05) {
        this.lt = t
        this.paint(t)
      }
    }
    loop()
  }

  stop() {
    this.stopped = true
    cancelAnimationFrame(this.raf)
    cancelAnimationFrame(this.pending)
    window.removeEventListener('resize', this.onResize)
    window.removeEventListener('scroll', this.requestStill)
    window.removeEventListener('pointermove', this.onPointer)
    document.removeEventListener('pointerleave', this.onLeave)
    this.dh.forEach((st) => {
      st.cv.remove()
      st.ce?.remove()
    })
    this.dh.clear()
  }

  // Reduced motion: paint one still frame, coalesced to one per animation frame.
  private requestStill = () => {
    if (this.pending || this.stopped) return
    this.pending = requestAnimationFrame(() => {
      this.pending = 0
      if (!this.stopped) this.paint(0)
    })
  }

  private onResize = () => {
    this.done = new WeakMap()
    if (this.reduced) this.requestStill()
  }

  // Run a car sweep over an element. Used by the Competitions section.
  driveBy(el: HTMLElement) {
    if (this.reduced) return
    if (getComputedStyle(el).position === 'static') el.style.position = 'relative'
    el.querySelector('canvas[data-drive]')?.remove()
    const cv = document.createElement('canvas')
    cv.dataset.drive = '1'
    cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;image-rendering:pixelated;z-index:2'
    el.appendChild(cv)
    const W = Math.max(4, Math.floor(el.clientWidth / S))
    const H = Math.max(4, Math.floor(el.clientHeight / S))
    cv.width = W
    cv.height = H
    const spr = this.carSprite(Math.max(8, Math.round(H * 0.78)))
    const x = ctx2d(cv)
    if (!spr || !x) {
      cv.remove()
      return
    }
    const img = x.createImageData(W, H)
    const d = img.data
    const oy = Math.round((H - spr.h) / 2) + 1
    const dur = 520
    const t0 = performance.now()
    const step = () => {
      if (!cv.isConnected) return
      const p = Math.min(1, (performance.now() - t0) / dur)
      const cx = Math.round(-spr.w + p * (W + spr.w * 2.6))
      const TL = Math.round(W * 0.8)
      const fade = p > 0.9 ? (1 - p) / 0.1 : 1
      d.fill(0)
      for (let y = 0; y < spr.h; y++) {
        const yy = y + oy
        if (yy < 0 || yy >= H) continue
        let rear = -1
        for (let k = 0; k < spr.w; k++) {
          if (spr.A[y * spr.w + k]) {
            rear = k
            break
          }
        }
        if (rear < 0) continue
        const rl = (rnd(y * 3.1) * 0.6 + 0.4) * TL
        for (let j = 1; j < rl; j++) {
          const xx = cx + rear - j
          if (xx < 0) break
          if (xx >= W) continue
          const v = (1 - j / rl) * 0.9 * fade
          const th = (B[(yy & 7) * 8 + (xx & 7)]! + 0.5) / 64
          if (v < th) continue
          const col = P[v > 0.6 ? 2 : 1]!
          const i = (yy * W + xx) * 4
          d[i] = col[0]
          d[i + 1] = col[1]
          d[i + 2] = col[2]
          d[i + 3] = 200
        }
        for (let k = rear; k < spr.w; k++) {
          const xx = cx + k
          if (xx < 0 || xx >= W || !spr.A[y * spr.w + k]) continue
          const lv = spr.L[y * spr.w + k]!
          const th = (B[(yy & 7) * 8 + (xx & 7)]! + 0.5) / 64
          const v = Math.pow(lv, 0.8) * 1.6 * fade
          const li = v > 1 + th * 0.6 ? 3 : v > 0.45 + th * 0.5 ? 2 : v > 0.12 + th * 0.3 ? 1 : 0
          if (!li) continue
          const col = P[li]!
          const i = (yy * W + xx) * 4
          d[i] = col[0]
          d[i + 1] = col[1]
          d[i + 2] = col[2]
          d[i + 3] = 255
        }
      }
      x.putImageData(img, 0, 0)
      if (p < 1 && !this.stopped) requestAnimationFrame(step)
      else cv.remove()
    }
    requestAnimationFrame(step)
  }

  private carSprite(h: number): Sprite | null {
    const im = this.photo
    if (!im) return null
    if (this.spr && this.spr.h === h) return this.spr
    const k2 = im.width / 656
    const bx = 146
    const by = 210
    const bw = 394
    const bh = 168
    const w = Math.round((h * bw) / bh)
    const c = document.createElement('canvas')
    c.width = w
    c.height = h
    const x = ctx2d(c)
    if (!x) return null
    const sc = w / bw
    x.beginPath()
    CAR_POLY.forEach((q, i) => {
      const px = (q[0] - bx) * sc
      const py = (q[1] - by) * sc
      if (i) x.lineTo(px, py)
      else x.moveTo(px, py)
    })
    x.closePath()
    x.clip()
    x.drawImage(im, bx * k2, by * k2, bw * k2, bh * k2, 0, 0, w, h)
    const p = x.getImageData(0, 0, w, h).data
    const L = new Float32Array(w * h)
    const A = new Uint8Array(w * h)
    for (let i = 0; i < w * h; i++) {
      A[i] = p[i * 4 + 3]! > 100 ? 1 : 0
      L[i] = (0.3 * p[i * 4]! + 0.59 * p[i * 4 + 1]! + 0.11 * p[i * 4 + 2]!) / 255
    }
    return (this.spr = { h, w, L, A })
  }

  private paint(t: number) {
    this.root.querySelectorAll<HTMLCanvasElement>('canvas[data-mode]').forEach((c) => {
      const m = c.dataset.mode as Mode
      const still = isStill(m)
      if (m === 'edges') {
        if (innerWidth < 768) return
      } else {
        const r = c.getBoundingClientRect()
        if (r.bottom < -50 || r.top > innerHeight + 50) return
      }
      if (still && this.done.get(c)) return
      if (this.dither(c, m, t) && still) this.done.set(c, 1)
    })
  }

  // Luminance of the hero photo, with car mask and wheel data
  private lum(c: HTMLCanvasElement, W: number, H: number): Lum | null {
    const key = `${W}x${H}`
    const old = this.lums.get(c)
    if (old && old.key === key) return old
    const im = this.photo
    if (!im) return null
    const o = document.createElement('canvas')
    o.width = W
    o.height = H
    const x = ctx2d(o)
    if (!x) return null
    const port = H > W * 1.1
    const u0 = (W * 1.12) / 386
    const sc = port ? (u0 * 656) / im.width : Math.max(W / im.width, H / im.height)
    const dw = im.width * sc
    const dh = im.height * sc
    const pox = port ? W / 2 - 343 * u0 : (W - dw) / 2
    const poy = port ? H * 0.36 - 294 * u0 : (H - dh) / 2
    x.drawImage(im, pox, poy, dw, dh)
    const p = x.getImageData(0, 0, W, H).data
    const d = new Float32Array(W * H)
    for (let i = 0; i < W * H; i++) d[i] = (0.3 * p[i * 4]! + 0.59 * p[i * 4 + 1]! + 0.11 * p[i * 4 + 2]!) / 255
    if (port) {
      const fb = Math.max(4, dh * 0.22)
      for (let y = 0; y < H; y++) {
        const f = Math.min(1, Math.max(0, (poy + dh - y) / fb))
        const g = f * f * (3 - 2 * f)
        if (g < 1) for (let k = 0; k < W; k++) d[y * W + k]! *= g
      }
      // Mirror the car below the ground line as a reflection
      const gy = poy + 372 * u0
      const RL = H - gy
      const sr = Float32Array.from(d)
      for (let y = Math.ceil(gy); y < H; y++) {
        const dy = y - gy
        const my = Math.round(gy - dy * 0.9)
        if (my < 0) break
        const fall = Math.pow(1 - dy / RL, 0.9) * 0.9
        const wob = Math.round(Math.sin(y * 0.7) * 1.5 + Math.sin(y * 0.23) * 2)
        for (let k = 0; k < W; k++) {
          const kk = Math.min(W - 1, Math.max(0, k + wob))
          d[y * W + k] = Math.max(d[y * W + k]!, sr[my * W + kk]! * fall)
        }
      }
    }
    const ox = pox
    const oy = poy
    const m = new Float32Array(W * H)
    const k2 = im.width / 656
    const mc = document.createElement('canvas')
    mc.width = W
    mc.height = H
    const mx = ctx2d(mc)
    if (!mx) return null
    mx.filter = `blur(${Math.max(0.6, W / 600)}px)`
    mx.fillStyle = '#fff'
    mx.beginPath()
    CAR_POLY.forEach((q, i) => {
      const px = ox + q[0] * k2 * sc
      const py = oy + q[1] * k2 * sc
      if (i) mx.lineTo(px, py)
      else mx.moveTo(px, py)
    })
    mx.closePath()
    mx.fill()
    const mp = mx.getImageData(0, 0, W, H).data
    for (let i = 0; i < W * H; i++) m[i] = Math.min(1, (mp[i * 4 + 3]! / 255) * 1.8)
    // Smear the background to the left of the car so the body stands out
    const BR = Math.max(6, Math.round(W * 0.09))
    const ps = new Float32Array(W + 1)
    const src = Float32Array.from(d)
    const GO = Math.max(2, W * 0.014)
    const GA = [0.42, 0.3, 0.2, 0.12, 0.06]
    for (let y = 0; y < H; y++) {
      const row = y * W
      for (let k = 0; k < W; k++) ps[k + 1] = ps[k]! + src[row + k]!
      for (let k = 0; k < W; k++) {
        const i = row + k
        if (m[i]! > 0.999) continue
        const a0 = Math.max(0, (k - BR) | 0)
        const a1 = Math.min(W, (k + BR * 0.25 + 1) | 0)
        let acc = (ps[a1]! - ps[a0]!) / (a1 - a0)
        for (let j = 0; j < GA.length; j++) {
          const kk = k + Math.round(GO * (j + 1))
          if (kk >= W) break
          const w = m[row + kk]! * GA[j]!
          if (w > 0) acc = acc * (1 - w) + src[row + kk]! * w
        }
        d[i] = src[i]! * m[i]! + acc * (1 - m[i]!)
      }
    }
    const wa = new Float32Array(W * H).fill(-99)
    const wl = Float32Array.from(d)
    WHEELS.forEach((q) => {
      const cx = ox + q[0] * k2 * sc
      const cy = oy + q[1] * k2 * sc
      const R = q[2] * k2 * sc * 0.86
      for (let y = Math.max(0, (cy - R) | 0); y < Math.min(H, cy + R + 1); y++) {
        for (let k = Math.max(0, (cx - R) | 0); k < Math.min(W, cx + R + 1); k++) {
          const dx = k - cx
          const dy = y - cy
          const r0 = Math.hypot(dx, dy)
          if (r0 > R) continue
          const an = Math.atan2(dy, dx)
          let acc = 0
          for (let j = 0; j < 16; j++) {
            const a2 = an + j * 0.39
            const sx = Math.round(cx + Math.cos(a2) * r0)
            const sy = Math.round(cy + Math.sin(a2) * r0)
            acc += src[Math.min(H - 1, Math.max(0, sy)) * W + Math.min(W - 1, Math.max(0, sx))]!
          }
          const i = y * W + k
          const e = Math.min(1, (R - r0) / 2)
          wl[i] = d[i]! * (1 - e) + (acc / 16) * e
          wa[i] = an
        }
      }
    })
    const nz = new Float32Array(W * H)
    for (let i = 0; i < W * H; i++) nz[i] = Math.random() - 0.5
    const out: Lum = { key, d, m, wl, wa, nz }
    this.lums.set(c, out)
    return out
  }

  // Vertical strength of the side glow, per canvas row
  private edgeEnv(H: number): Float32Array | null {
    const hero = this.root.querySelector('[data-hero]')
    const box = this.root.querySelector('[data-edge-hide]')
    const foot = this.root.querySelector('footer')
    if (!hero || !box || !foot) return null
    const hb = hero.getBoundingClientRect().bottom
    const br = box.getBoundingClientRect()
    const ft = foot.getBoundingClientRect().top
    const vh = innerHeight
    if (!this.env || this.env.length !== H) this.env = new Float32Array(H)
    for (let y = 0; y < H; y++) {
      const yv = y * S
      let e =
        ss(hb, hb + vh * 0.45, yv) *
        (1 - ss(ft - vh * 0.5, ft - 40, yv)) *
        ss(60, vh * 0.22, yv) *
        (1 - ss(vh * 0.82, vh, yv) * 0.6)
      e *= 1 - ss(br.top - vh * 0.35, br.top, yv) * (1 - ss(br.bottom, br.bottom + vh * 0.35, yv))
      this.env[y] = e
    }
    return this.env
  }

  private dither(c: HTMLCanvasElement, mode: Mode, t: number): boolean {
    const W = Math.floor(c.clientWidth / S)
    const H = Math.floor(c.clientHeight / S)
    if (W < 2 || H < 2) return false
    if (c.width !== W || c.height !== H) {
      c.width = W
      c.height = H
    }
    let env: Float32Array | null = null
    if (mode === 'edges') {
      env = this.edgeEnv(H)
      if (!env) return false
    }
    const eW = Math.max(24, Math.min(72, c.clientWidth * 0.045)) / S
    const sc = scrollY / S
    let L: Lum | null = null
    if (mode === 'photo' || mode === 'photoStill') {
      L = this.lum(c, W, H)
      if (!L) return false
    }
    let fy0 = -1
    let fy1 = -1
    let cell = 8
    if (mode === 'footer') {
      const wrap = c.parentElement
      const fl = wrap?.querySelector('[data-flag]')
      if (!wrap || !fl) return false
      const rr = wrap.getBoundingClientRect()
      const fr = fl.getBoundingClientRect()
      fy0 = (fr.top - rr.top) / S
      fy1 = (fr.bottom - rr.top) / S
      cell = Math.max(6, Math.round((fy1 - fy0) / 4))
    }
    const seed = +(c.dataset.seed ?? 0)
    const x = ctx2d(c)
    if (!x) return false
    const img = x.createImageData(W, H)
    const d = img.data
    const cx = 0.72 + 0.14 * Math.sin(t * 0.35)
    const cy = 0.8 + 0.06 * Math.cos(t * 0.5)
    const tall = H > W * 1.1
    for (let y = 0; y < H; y++) {
      const ny = y / H
      for (let k = 0; k < W; k++) {
        const nx = k / W
        let v = 0
        if (mode === 'edges' && env) {
          const dd = Math.min(k, W - 1 - k)
          const en = env[y]!
          if (dd > eW || en <= 0) v = 0
          else {
            const e = 1 - dd / eW
            v = e * e * e * en * (0.5 + vn(k * 0.08 + (k > W / 2 ? 50 : 0), (y + sc) * 0.025 - t * 0.12, 4) * 0.55)
          }
        } else if (mode === 'photo' && L) {
          const i = y * W + k
          const mk = L.m[i]!
          let lu = L.d[i]!
          const an = L.wa[i]!
          if (an > -9) lu = L.wl[i]! + Math.pow(Math.sin(an * 3 + t * 47) * 0.5 + 0.5, 3) * 0.14
          if (mk > 0) {
            lu +=
              (Math.pow(Math.sin(nx * 9 - t * 2.2 + ny * 3) * 0.5 + 0.5, 6) * 0.16 +
                L.nz[(i + Math.floor(t * 12) * 7919) % (W * H)]! * 0.07) *
              mk
          }
          v =
            Math.pow(lu, 1.3) * 3.1 -
            0.2 +
            Math.pow(Math.sin(nx * 14 + t * 16 + rnd(y) * 6) * 0.5 + 0.5, 3) * rnd(y * 1.7) * 0.22 * (1 - mk)
          v *= 1 - Math.max(0, ny - (tall ? 0.72 : 0.45)) * (tall ? 2.2 : 1.35)
          v *= 0.55 + 0.45 * Math.min(1, nx * 2.2)
        } else if (mode === 'photoStill' && L) {
          v = Math.pow(L.d[y * W + k]!, 1.3) * 3.1 - 0.2
          v *= 1 - Math.max(0, ny - 0.7) * 1.5
        } else if (mode === 'glow') {
          const dx = (nx - 0.5) * 1.6
          const dy = ny - 0.5
          v = Math.exp(-(dx * dx + dy * dy) * 4) * (1.05 + 0.1 * Math.sin(t * 0.8)) + vn(nx * 5 + t * 0.08, ny * 4, 3) * 0.15
        } else if (mode === 'noise') {
          v = vn(nx * 3, ny * 2.5, seed) * 0.8 + vn(nx * 8, ny * 7, seed + 5) * 0.3 + ny * ny * 0.4
          v = Math.max(0, v - 0.35) * 1.4
        } else if (mode === 'footer') {
          const dx = (nx - cx) * 1.6
          const dy = ny - cy
          v =
            Math.max(
              0,
              Math.min(
                1,
                Math.pow(Math.max(0, ny - 0.42) / 0.58, 1.4) * 0.9 +
                  Math.exp(-(dx * dx + dy * dy) * 7) * 0.75 * Math.min(1, ny / 0.6) +
                  Math.sin(nx * 9 + t * 0.8 + ny * 4) * 0.06 * Math.min(1, ny / 0.5),
              ),
            ) * 2
          const fh = fy1 - fy0
          const wave = Math.sin(k * 0.035 - t * 2.4) * fh * 0.14 + Math.sin(k * 0.011 + t * 0.9) * fh * 0.08
          const yy = y - wave
          if (yy >= fy0 && yy < fy1) {
            const light = 0.5 + 0.5 * Math.cos(k * 0.035 - t * 2.4 + 0.9)
            const edge = Math.min(1, Math.min(k, W - k) / (W * 0.08))
            const white = ((Math.floor(k / cell) + Math.floor((yy - fy0) / cell)) & 1) === 0
            const sq = white ? 1.9 + light * 1.1 : light * 0.9
            v = v + (sq - v) * edge
          }
        }
        v = v < 0 ? 0 : v > 2.999 ? 2.999 : v
        const lv = v | 0
        const th = (B[(y & 7) * 8 + (k & 7)]! + 0.5) / 64
        const col = P[Math.min(3, lv + (v - lv > th ? 1 : 0))]!
        const i = (y * W + k) * 4
        d[i] = col[0]
        d[i + 1] = col[1]
        d[i + 2] = col[2]
        d[i + 3] = 255
      }
    }
    x.putImageData(img, 0, 0)
    return true
  }

  // ---- Hover effects: data-dh="glow" or "wipe" ----

  private mkHover(el: HTMLElement): Hover {
    if (getComputedStyle(el).position === 'static') el.style.position = 'relative'
    el.style.isolation = 'isolate'
    el.style.overflow = 'hidden'
    const cv = document.createElement('canvas')
    cv.setAttribute('aria-hidden', 'true')
    cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;z-index:-1;pointer-events:none;image-rendering:pixelated'
    el.appendChild(cv)
    let ce: HTMLCanvasElement | null = null
    if (el.dataset.dhEdge) {
      ce = document.createElement('canvas')
      ce.setAttribute('aria-hidden', 'true')
      ce.style.cssText =
        'position:absolute;inset:0;width:100%;height:100%;z-index:5;pointer-events:none;image-rendering:pixelated;border-radius:inherit'
      el.appendChild(ce)
    }
    return {
      el,
      cv,
      ce,
      a: 0,
      on: false,
      mx: 0,
      my: 0,
      sx: 0,
      sy: 0,
      ex: 0,
      ey: 0,
      mode: el.dataset.dh ?? 'glow',
      col: hexToRgb(el.dataset.dhC ?? '#e2475b'),
      clear: true,
      tr: [],
    }
  }

  private onPointer = (e: PointerEvent) => {
    const target = e.target instanceof Element ? e.target : null
    const el = target?.closest<HTMLElement>('[data-dh]') ?? null
    if (el !== this.dhCur) {
      if (this.dhCur) {
        const o = this.dh.get(this.dhCur)
        if (o) o.on = false
      }
      this.dhCur = el
      if (el) {
        let st = this.dh.get(el)
        if (!st) {
          st = this.mkHover(el)
          this.dh.set(el, st)
        }
        const rc = el.getBoundingClientRect()
        st.on = true
        if (st.a < 0.05) {
          st.ex = e.clientX - rc.left
          st.ey = e.clientY - rc.top
          st.sx = st.ex
          st.sy = st.ey
        }
      }
    }
    if (el) {
      const st = this.dh.get(el)
      if (st) {
        const rc = el.getBoundingClientRect()
        st.mx = e.clientX - rc.left
        st.my = e.clientY - rc.top
      }
    }
  }

  private onLeave = () => {
    if (!this.dhCur) return
    const o = this.dh.get(this.dhCur)
    if (o) o.on = false
    this.dhCur = null
  }

  private drawHover(t: number) {
    this.dh.forEach((st, el) => {
      if (!el.isConnected) {
        st.cv.remove()
        st.ce?.remove()
        this.dh.delete(el)
        return
      }
      const tgt = st.on ? 1 : 0
      st.a += (tgt - st.a) * (st.mode === 'wipe' ? (st.on ? 0.028 : 0.085) : st.on ? 0.06 : 0.035)
      const cv = st.cv
      if (st.a < 0.004 && !st.on) {
        if (!st.clear) {
          ctx2d(cv)?.clearRect(0, 0, cv.width, cv.height)
          if (st.ce) ctx2d(st.ce)?.clearRect(0, 0, st.ce.width, st.ce.height)
          st.clear = true
        }
        st.a = 0
        return
      }
      st.clear = false
      const W = Math.max(1, Math.ceil(cv.clientWidth / S))
      const H = Math.max(1, Math.ceil(cv.clientHeight / S))
      if (cv.width !== W || cv.height !== H) {
        cv.width = W
        cv.height = H
      }
      const x = ctx2d(cv)
      if (!x) return
      const img = x.createImageData(W, H)
      const d = img.data
      st.sx += (st.mx - st.sx) * 0.2
      st.sy += (st.my - st.sy) * 0.2
      st.tr.unshift([st.sx, st.sy])
      if (st.tr.length > 15) st.tr.length = 15
      if (st.mode === 'wipe') {
        const ex = st.ex / S
        const ey = st.ey / S
        const md = Math.max(Math.hypot(ex, ey), Math.hypot(W - ex, ey), Math.hypot(ex, H - ey), Math.hypot(W - ex, H - ey))
        const e = 1 - Math.pow(1 - st.a, 3)
        const rr = e * (md + 6)
        const c = st.col
        for (let y = 0; y < H; y++) {
          for (let k = 0; k < W; k++) {
            const v = (rr - Math.hypot(k - ex, y - ey)) / 5 + 0.5
            const th = (B[(y & 7) * 8 + (k & 7)]! + 0.5) / 64
            if (v > th) {
              const i = (y * W + k) * 4
              d[i] = c[0]
              d[i + 1] = c[1]
              d[i + 2] = c[2]
              d[i + 3] = 255
            }
          }
        }
      } else {
        this.drawGlow(st, d, W, H, t)
      }
      x.putImageData(img, 0, 0)
    })
  }

  private drawGlow(st: Hover, d: Uint8ClampedArray, W: number, H: number, t: number) {
    const R = Math.max(46, Math.min(W * S, H * S, 340) * 0.5) / S
    const pts: [number, number, number, number][] = []
    for (let i = 0; i < st.tr.length; i += 3) {
      const f = 1 - i / st.tr.length
      pts.push([st.tr[i]![0] / S, st.tr[i]![1] / S, R * R * (0.35 + 0.65 * f), f * f])
    }
    let wsum = 0
    pts.forEach((p) => (wsum += p[3]))
    wsum = Math.max(1, wsum * 0.55)
    const ts = t * 0.9
    const amp = R * 0.35
    let x0 = 1e9
    let x1 = -1e9
    let y0 = 1e9
    let y1 = -1e9
    pts.forEach((p) => {
      x0 = Math.min(x0, p[0])
      x1 = Math.max(x1, p[0])
      y0 = Math.min(y0, p[1])
      y1 = Math.max(y1, p[1])
    })
    const m = R * 2.2 + amp
    x0 = Math.max(0, (x0 - m) | 0)
    x1 = Math.min(W, (x1 + m) | 0)
    y0 = Math.max(0, (y0 - m) | 0)
    y1 = Math.min(H, (y1 + m) | 0)
    const cx = new Float32Array(W)
    for (let k = x0; k < x1; k++) cx[k] = Math.sin(k * 0.17 - ts * 1.7) * amp * 0.45
    for (let y = y0; y < y1; y++) {
      const ry = Math.sin(y * 0.19 + ts * 2.1) * amp * 0.45
      const ry2 = y * 0.11
      for (let k = x0; k < x1; k++) {
        const wx = k + ry + Math.sin(ry2 + k * 0.07 + ts) * amp * 0.25
        const wy = y + cx[k]!
        let f = 0
        for (let j = 0; j < pts.length; j++) {
          const p = pts[j]!
          const dx = wx - p[0]
          const dy = wy - p[1]
          const q = (dx * dx + dy * dy) / p[2]
          if (q < 5) f += Math.exp(-q) * p[3]
        }
        f /= wsum
        let v = Math.pow(Math.min(1.2, f), 1.4) * 1.8 * st.a
        if (v < 0.02) continue
        v = Math.min(1.4, v)
        const lv = v | 0
        const th = (B[(y & 7) * 8 + (k & 7)]! + 0.5) / 64
        const li = Math.min(3, lv + (v - lv > th ? 1 : 0))
        if (li === 0) continue
        const col = P[li]!
        const i = (y * W + k) * 4
        d[i] = col[0]
        d[i + 1] = col[1]
        d[i + 2] = col[2]
        d[i + 3] = li === 1 ? 140 : 120
      }
    }
    if (st.ce) this.drawEdge(st, W, H, t)
  }

  // Dithered rim on a rounded box (data-dh-edge = corner radius in px)
  private drawEdge(st: Hover, W: number, H: number, t: number) {
    const ce = st.ce
    if (!ce) return
    if (ce.width !== W || ce.height !== H) {
      ce.width = W
      ce.height = H
    }
    const ex = ctx2d(ce)
    if (!ex) return
    const eimg = ex.createImageData(W, H)
    const ed = eimg.data
    const r = +(st.el.dataset.dhEdge ?? 0) / S
    const D = 4
    const ts2 = t * 1.2
    const edge = (k: number, y: number, py: number, ay: number) => {
      const px = k + 0.5
      const ax = Math.max(r - px, px - (W - r), 0)
      const de = ax > 0 && ay > 0 ? r - Math.hypot(ax, ay) : Math.min(px, W - px, py, H - py)
      if (de < 0 || de > D) return
      const n = Math.sin(k * 0.21 + y * 0.13 - ts2 * 2) * 0.5 + Math.sin(k * 0.07 - y * 0.19 + ts2) * 0.5
      const u = 1 - de / D
      const v = u * u * (0.85 + 0.35 * n) * st.a
      const th = (B[(y & 7) * 8 + (k & 7)]! + 0.5) / 64
      if (v < th) return
      const col = P[2]!
      const i = (y * W + k) * 4
      ed[i] = col[0]
      ed[i + 1] = col[1]
      ed[i + 2] = col[2]
      ed[i + 3] = 110
    }
    for (let y = 0; y < H; y++) {
      const py = y + 0.5
      const ay = Math.max(r - py, py - (H - r), 0)
      const ey = Math.min(py, H - py)
      if (ey > D && ay === 0) {
        const k0 = Math.ceil(D)
        const k1 = W - Math.ceil(D)
        for (let k = 0; k < k0; k++) edge(k, y, py, ay)
        for (let k = Math.max(k0, k1); k < W; k++) edge(k, y, py, ay)
        continue
      }
      for (let k = 0; k < W; k++) edge(k, y, py, ay)
    }
    ex.putImageData(eimg, 0, 0)
  }
}

export interface DitherHandle {
  stop: () => void
  driveBy: (el: HTMLElement) => void
}

/** Start the shared paint loop for all canvas[data-mode] inside root. Client only. */
export function startDither(root: HTMLElement): DitherHandle {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const engine = new Engine(root, reduced)
  engine.start()
  return { stop: () => engine.stop(), driveBy: (el) => engine.driveBy(el) }
}
