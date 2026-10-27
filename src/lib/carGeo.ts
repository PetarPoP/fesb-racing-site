/**
 * The heavy geometry work for the 3D car: normals with sharp edges, and the outline edges.
 * The GLB has no normals (smaller file), so this runs once per mesh when the scene is built.
 * It runs in a worker (carGeo.worker.ts), so the page keeps scrolling while the car is prepared.
 *
 * Same result as three's toCreasedNormals and EdgesGeometry, but with typed arrays and number keys
 * instead of string hashes: the car has about 450 000 triangles, and the string version took seconds.
 */

export type GeoJob = { position: Float32Array; index: Uint16Array | Uint32Array | null; crease: number }
export type GeoResult = { position: Float32Array; normal: Float32Array; edges: Float32Array }

const EDGE_ANGLE = (32 * Math.PI) / 180

/** A welded id per vertex: vertices whose quantised positions are equal share an id. */
function weldBy(position: Float32Array, q: (x: number) => number): [Uint32Array, number] {
  const nv = position.length / 3
  const qs = new Float64Array(position.length)
  let lo = Infinity
  let hi = -Infinity
  for (let i = 0; i < qs.length; i++) {
    const v = q(position[i]!)
    qs[i] = v
    if (v < lo) lo = v
    if (v > hi) hi = v
  }
  const span = hi - lo + 1
  const numeric = span ** 3 < Number.MAX_SAFE_INTEGER // a number key when it fits, else a string
  const ids = new Uint32Array(nv)
  const seen = new Map<number | string, number>()
  for (let i = 0; i < nv; i++) {
    const x = qs[3 * i]! - lo, y = qs[3 * i + 1]! - lo, z = qs[3 * i + 2]! - lo
    const k = numeric ? (x * span + y) * span + z : `${x},${y},${z}`
    let w = seen.get(k)
    if (w === undefined) seen.set(k, (w = seen.size))
    ids[i] = w
  }
  return [ids, seen.size]
}

export function buildGeo({ position, index, crease }: GeoJob): GeoResult {
  const nv = position.length / 3
  const tri = index ?? Uint32Array.from({ length: nv }, (_, i) => i)
  const nt = tri.length / 3

  // Weld vertices with the same position (the file splits them at seams). The grids match three's:
  // 1 cm for the normals, 0.1 mm for the edges.
  const [weld, nw] = weldBy(position, (x) => Math.trunc(x * (1 + 1e-10) * 1e2))
  const [weldE, nwE] = weldBy(position, (x) => Math.round(x * 1e4))

  // Face normals (unit length)
  const fn = new Float32Array(nt * 3)
  for (let f = 0; f < nt; f++) {
    const a = 3 * tri[3 * f]!, b = 3 * tri[3 * f + 1]!, c = 3 * tri[3 * f + 2]!
    const ux = position[b]! - position[a]!, uy = position[b + 1]! - position[a + 1]!, uz = position[b + 2]! - position[a + 2]!
    const vx = position[c]! - position[a]!, vy = position[c + 1]! - position[a + 1]!, vz = position[c + 2]! - position[a + 2]!
    const x = uy * vz - uz * vy, y = uz * vx - ux * vz, z = ux * vy - uy * vx
    const l = Math.hypot(x, y, z) || 1
    fn[3 * f] = x / l; fn[3 * f + 1] = y / l; fn[3 * f + 2] = z / l
  }

  // Faces around each welded vertex (compressed lists)
  const start = new Uint32Array(nw + 1)
  for (let i = 0; i < nt * 3; i++) start[weld[tri[i]!]! + 1]!++
  for (let w = 0; w < nw; w++) start[w + 1]! += start[w]!
  const fill = start.slice(0, nw)
  const around = new Uint32Array(nt * 3)
  for (let i = 0; i < nt * 3; i++) around[fill[weld[tri[i]!]!]!++] = (i / 3) | 0

  // Each corner: the sum of the faces around its vertex that meet this face under the crease angle.
  const cosCrease = Math.cos(crease)
  const outPos = new Float32Array(nt * 9)
  const outNorm = new Float32Array(nt * 9)
  for (let f = 0; f < nt; f++) {
    const nx = fn[3 * f]!, ny = fn[3 * f + 1]!, nz = fn[3 * f + 2]!
    for (let k = 0; k < 3; k++) {
      const v = tri[3 * f + k]!
      const w = weld[v]!
      let sx = 0, sy = 0, sz = 0
      for (let j = start[w]!; j < start[w + 1]!; j++) {
        const g = around[j]!
        if (nx * fn[3 * g]! + ny * fn[3 * g + 1]! + nz * fn[3 * g + 2]! > cosCrease) {
          sx += fn[3 * g]!; sy += fn[3 * g + 1]!; sz += fn[3 * g + 2]!
        }
      }
      const l = Math.hypot(sx, sy, sz) || 1
      const o = 9 * f + 3 * k
      outNorm[o] = sx / l; outNorm[o + 1] = sy / l; outNorm[o + 2] = sz / l
      outPos[o] = position[3 * v]!; outPos[o + 1] = position[3 * v + 1]!; outPos[o + 2] = position[3 * v + 2]!
    }
  }

  // Edges: an edge where two faces meet at more than 32 degrees, or an open edge (one face).
  const cosEdge = Math.cos(EDGE_ANGLE)
  const first = new Map<number, number>() // edge key → first face, removed when a second face shares it
  const keep: number[] = [] // vertex pairs
  for (let f = 0; f < nt; f++) {
    for (let k = 0; k < 3; k++) {
      const va = tri[3 * f + k]!, vb = tri[3 * f + ((k + 1) % 3)]!
      const a = weldE[va]!, b = weldE[vb]!
      if (a === b) continue
      const key = a < b ? a * nwE + b : b * nwE + a
      const g = first.get(key)
      if (g === undefined) {
        first.set(key, f * 3 + k)
        continue
      }
      first.delete(key)
      const h = (g / 3) | 0
      if (fn[3 * f]! * fn[3 * h]! + fn[3 * f + 1]! * fn[3 * h + 1]! + fn[3 * f + 2]! * fn[3 * h + 2]! <= cosEdge) keep.push(va, vb)
    }
  }
  for (const c of first.values()) {
    const f = (c / 3) | 0, k = c % 3
    keep.push(tri[3 * f + k]!, tri[3 * f + ((k + 1) % 3)]!)
  }
  const edges = new Float32Array(keep.length * 3)
  keep.forEach((v, i) => edges.set(position.subarray(3 * v, 3 * v + 3), 3 * i))

  return { position: outPos, normal: outNorm, edges }
}

/** Runs the jobs in a worker, or here when a worker cannot start. */
export function buildGeoAll(jobs: GeoJob[]): Promise<GeoResult[]> {
  let worker: Worker
  try {
    worker = new Worker(new URL('./carGeo.worker.ts', import.meta.url), { type: 'module' })
  } catch {
    return Promise.resolve(jobs.map(buildGeo))
  }
  return new Promise<GeoResult[]>((resolve) => {
    worker.onmessage = (e: MessageEvent<GeoResult[]>) => resolve(e.data)
    worker.onerror = () => resolve(jobs.map(buildGeo))
    // Copies, not transfers: the meshes keep their own arrays for the fallback above.
    worker.postMessage(jobs)
  }).finally(() => worker.terminate())
}
