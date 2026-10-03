// Model fetch, without three.js. It starts early (idle time) and the scene reuses the same request.
export const MODEL_URL = '/models/efrt01.glb'
export const DRACO_PATH = '/draco/'

type Listener = (fraction: number) => void

let promise: Promise<ArrayBuffer> | null = null
let fraction = 0
const listeners = new Set<Listener>()

/** One shared fetch of the model. Each caller gets the same bytes and progress. */
export function fetchModel(onProgress?: Listener): Promise<ArrayBuffer> {
  if (onProgress) {
    listeners.add(onProgress)
    if (fraction > 0) onProgress(fraction)
  }
  promise ??= (async () => {
    const res = await fetch(MODEL_URL)
    if (!res.ok || !res.body) throw new Error(`Model: HTTP ${res.status}`)
    const total = Number(res.headers.get('content-length')) || 0
    const chunks: Uint8Array[] = []
    let loaded = 0
    const reader = res.body.getReader()
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      chunks.push(value)
      loaded += value.length
      if (total) {
        fraction = Math.min(loaded / total, 1)
        listeners.forEach((l) => l(fraction))
      }
    }
    const out = new Uint8Array(loaded)
    let at = 0
    for (const c of chunks) {
      out.set(c, at)
      at += c.length
    }
    return out.buffer
  })().catch((err) => {
    promise = null // allow a retry
    throw err
  })
  return promise
}

/** Warm the HTTP cache for the Draco decoder, so the loader finds it ready. */
export function warmDecoder() {
  for (const f of ['draco_wasm_wrapper.js', 'draco_decoder.wasm']) {
    fetch(DRACO_PATH + f, { priority: 'low' } as RequestInit).catch(() => {})
  }
}
