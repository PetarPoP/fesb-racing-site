/**
 * Three.js scena za sekciju „Timovi“: bolid se okreće dok se skrola, zatim se rastavi na sklopove.
 * Učitava se dinamički (samo u pregledniku, kad se sekcija približi ekranu), pa three.js nije u
 * glavnom bundleu. React komponenta (`CarExplode.tsx`) samo javlja napredak skrolanja i aktivni tim,
 * a scena svaki frame vraća pozicije oznaka na ekranu.
 */
import {
  ACESFilmicToneMapping,
  Box3,
  Color,
  GridHelper,
  Group,
  MathUtils,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  PMREMGenerator,
  Scene,
  SRGBColorSpace,
  Vector3,
  WebGLRenderer,
  type Material,
  type Object3D,
} from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { toCreasedNormals } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { CAR_GROUPS, explodeAt, yawAt, type CarGroup } from './carGroups'

export const MODEL_URL = '/models/efrt01.glb'

export type LabelPos = { key: string; ax: number; ay: number; visible: boolean }

type Part = { group: CarGroup; mesh: Mesh; home: Vector3; offset: Vector3; mat: MeshStandardMaterial }

function cssColor(name: string, fallback: string) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return new Color(v || fallback)
}

export async function createCarScene(
  canvas: HTMLCanvasElement,
  onProgress: (loaded: number) => void,
) {
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.outputColorSpace = SRGBColorSpace
  renderer.toneMapping = ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.05

  const scene = new Scene()
  const pmrem = new PMREMGenerator(renderer)
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
  scene.environmentIntensity = 0.9

  const camera = new PerspectiveCamera(28, 1, 0.1, 100)

  // Model: čvorovi su imenovani po ključu grupe (+ _L/_R za lijevu/desnu polovicu)
  const draco = new DRACOLoader().setDecoderPath('/draco/')
  const loader = new GLTFLoader().setDRACOLoader(draco)
  const gltf = await loader.loadAsync(MODEL_URL, (e) => {
    if (e.total) onProgress(e.loaded / e.total)
  })
  draco.dispose()

  const car = new Group() // okreće se oko vertikalne osi
  const root = gltf.scene
  car.add(root)
  scene.add(car)

  const byKey = new Map(CAR_GROUPS.map((g) => [g.key, g]))
  const parts: Part[] = []
  root.traverse((o: Object3D) => {
    if (!(o as Mesh).isMesh) return
    const mesh = o as Mesh
    // ime čvora: npr. "wheels_L" → grupa "wheels", strana L
    const name = (mesh.name || mesh.parent?.name || '').replace(/_\d+$/, '')
    const m = /^(.*?)(?:_(L|R|C))?$/.exec(name)!
    const group = byKey.get(m[1])
    if (!group) return
    const side = m[2] === 'L' ? 1 : m[2] === 'R' ? -1 : 0
    const [x, y, z] = group.explode
    const offset = new Vector3(x, y, z + side * (group.spread ?? 0))
    // GLB nema normale (manji file) — računaju se ovdje, s oštrim bridovima iznad 35°
    if (!mesh.geometry.attributes.normal) mesh.geometry = toCreasedNormals(mesh.geometry, MathUtils.degToRad(35))
    const mat = new MeshStandardMaterial({ metalness: 0.55, roughness: 0.38 })
    mesh.material = mat
    parts.push({ group, mesh, home: mesh.position.clone(), offset, mat })
  })

  // Pod: tehnička mreža ispod kotača
  const box = new Box3().setFromObject(root)
  const floorY = box.min.y
  let grid = new GridHelper(9, 36)
  scene.add(grid)

  // Sidra za oznake: središte sklopa (za L/R sklopove lijeva polovica, da linija ne ide u bolid)
  // Sidra za linije: stvarna točka na površini dijela (vrh mreže najbliži središtu dijela),
  // a ne središte okvira, koje kod npr. kotača pada u prazno između dva kotača.
  // Sklopovi s lijevom i desnom polovicom imaju sidro na obje, a koristi se ono bliže kameri.
  const v = new Vector3()
  const surfacePoint = (p: Part) => {
    const pos = p.mesh.geometry.attributes.position
    const mid = new Box3().setFromObject(p.mesh).getCenter(new Vector3())
    const best = new Vector3()
    let bestD = Infinity
    for (let i = 0; i < pos.count; i += 3) {
      p.mesh.localToWorld(v.fromBufferAttribute(pos, i))
      const d = v.distanceToSquared(mid)
      if (d < bestD) {
        bestD = d
        best.copy(v)
      }
    }
    return best
  }
  const anchors = CAR_GROUPS.map((g) => ({
    key: g.key,
    spots: parts.filter((p) => p.group === g).map((p) => ({ part: p, local: surfacePoint(p) })),
  }))

  let theme = { base: new Color(), livery: new Color(), acc: new Color(), line: new Color() }
  const readTheme = () => {
    const light = document.documentElement.dataset.theme === 'light'
    theme = {
      base: new Color(light ? '#958c8c' : '#8a8183'),
      livery: new Color('#7f1627'),
      acc: cssColor('--acc', light ? '#7f1627' : '#e8566c'),
      line: cssColor('--mark', '#e24a61'),
    }
    scene.remove(grid)
    grid.dispose()
    grid = new GridHelper(9, 36, theme.line, theme.line)
    const gm = grid.material as Material
    gm.transparent = true
    gm.opacity = light ? 0.22 : 0.18
    grid.position.y = floorY - 0.002
    scene.add(grid)
    dirty = true
  }

  let width = 1
  let height = 1
  let dirty = true
  const resize = (w: number, h: number) => {
    width = Math.max(1, w)
    height = Math.max(1, h)
    renderer.setSize(width, height, false)
    camera.aspect = width / height
    const portrait = camera.aspect < 1
    squeeze.set(portrait ? 0.62 : 1, portrait ? 0.85 : 1, portrait ? 0.75 : 1)
    camera.updateProjectionMatrix()
    dirty = true
  }

  // Stanje koje animiramo (glatko prati cilj)
  let shown = 0
  let target = 0
  let team: string | null = null
  const mix = new Map<CarGroup, number>() // 0 = neutralno, 1 = istaknuto, -1 = prigušeno
  const tmp = new Vector3()
  const off = new Vector3()
  // Na uspravnom ekranu (mobitel) dijelovi se razmiču manje, da bolid ne izlazi iz kadra
  const squeeze = new Vector3(1, 1, 1)
  const groupIndex = new Map(CAR_GROUPS.map((g, i) => [g, i]))

  const apply = (p: number) => {
    const n = CAR_GROUPS.length
    const e = explodeAt(p, n / 2, n) // za kameru: prosjek
    car.rotation.y = MathUtils.degToRad(yawAt(p))

    for (const part of parts) {
      const k = explodeAt(p, groupIndex.get(part.group)!, n)
      part.mesh.position.copy(part.home).add(off.copy(part.offset).multiply(squeeze).multiplyScalar(k))
    }

    // Kamera: odmakne se dok se bolid rastavlja, da sve stane u kadar
    const portrait = camera.aspect < 1
    const radius = MathUtils.lerp(1.9, 3.1, e) * (portrait ? 0.96 : 1)
    const fovV = MathUtils.degToRad(camera.fov)
    const fit = Math.max(radius / Math.tan(fovV / 2), radius / (Math.tan(fovV / 2) * camera.aspect))
    const dist = fit * 0.92
    const elev = MathUtils.degToRad(MathUtils.lerp(15, 30, e))
    camera.position.set(0, Math.sin(elev) * dist + 0.35 * e, Math.cos(elev) * dist)
    // na mobitelu je opis tima gore, pa se bolid spušta niže u kadru
    camera.lookAt(0, 0.25 + 0.35 * e + (portrait ? 0.3 * e : 0), 0)
  }

  const paintColors = (dt: number) => {
    let moving = false
    for (const g of CAR_GROUPS) {
      // '*' = tim bez vlastitih dijelova (marketing): ističe se cijeli bolid
      const goal = team === null ? 0 : team === '*' || g.team === team ? 1 : -1
      const cur = mix.get(g) ?? 0
      const next = MathUtils.damp(cur, goal, 9, dt)
      if (Math.abs(next - goal) > 0.002) moving = true
      mix.set(g, Math.abs(next - goal) <= 0.002 ? goal : next)
    }
    for (const part of parts) {
      const k = mix.get(part.group) ?? 0
      const hi = Math.max(0, k)
      const lo = Math.max(0, -k)
      // karoserija je u bojama tima (bordo), ostalo grafit
      part.mat.color.copy(part.group.key === 'body' ? theme.livery : theme.base).lerp(theme.acc, hi)
      part.mat.emissive.copy(theme.acc).multiplyScalar(hi * 0.12)
      part.mat.opacity = 1 - lo * 0.84
      const ghost = lo > 0.01
      if (part.mat.transparent !== ghost) {
        part.mat.transparent = ghost
        part.mat.depthWrite = !ghost
        part.mat.needsUpdate = true
      }
    }
    return moving
  }

  /** Jedan frame. Vraća pozicije sidara oznaka u pikselima platna. */
  const frame = (dt: number, reduced: boolean): LabelPos[] => {
    const before = shown
    shown = reduced ? target : MathUtils.damp(shown, target, 7, dt)
    if (Math.abs(shown - target) < 1e-4) shown = target
    const colorsMoving = paintColors(reduced ? 1 : dt)
    if (dirty || shown !== before || colorsMoving) {
      apply(shown)
      renderer.render(scene, camera)
      dirty = false
    }
    car.updateMatrixWorld()
    return anchors.map((a) => {
      let best: Vector3 | null = null
      let bestZ = Infinity
      for (const sp of a.spots) {
        // sidro prati pomak dijelova
        const k = explodeAt(shown, groupIndex.get(sp.part.group)!, CAR_GROUPS.length)
        tmp.copy(sp.local).add(off.copy(sp.part.offset).multiply(squeeze).multiplyScalar(k))
        root.localToWorld(tmp)
        const z = tmp.distanceToSquared(camera.position)
        if (z < bestZ) {
          bestZ = z
          best = (best ?? new Vector3()).copy(tmp)
        }
      }
      if (!best) return { key: a.key, ax: 0, ay: 0, visible: false }
      best.project(camera)
      return {
        key: a.key,
        ax: (best.x * 0.5 + 0.5) * width,
        ay: (-best.y * 0.5 + 0.5) * height,
        visible: best.z < 1,
      }
    })
  }

  // Središte bolida na ekranu (za smjer odmicanja oznaka)
  const center = () => {
    tmp.set(0, 0.3, 0).project(camera)
    return { x: (tmp.x * 0.5 + 0.5) * width, y: (-tmp.y * 0.5 + 0.5) * height }
  }

  readTheme()

  return {
    resize,
    frame,
    center,
    readTheme,
    setProgress: (p: number) => (target = MathUtils.clamp(p, 0, 1)),
    getProgress: () => shown,
    setTeam: (code: string | null) => (team = code),
    dispose: () => {
      renderer.dispose()
      pmrem.dispose()
      scene.traverse((o) => {
        const m = o as Mesh
        if (m.isMesh) {
          m.geometry.dispose()
          ;(m.material as Material).dispose()
        }
      })
    },
  }
}

export type CarScene = Awaited<ReturnType<typeof createCarScene>>
