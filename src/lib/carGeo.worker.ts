import { buildGeo, type GeoJob } from './carGeo'

self.onmessage = (e: MessageEvent<GeoJob[]>) => {
  const out = e.data.map(buildGeo)
  ;(self as unknown as Worker).postMessage(
    out,
    out.flatMap((r) => [r.position.buffer, r.normal.buffer, r.edges.buffer]),
  )
}
