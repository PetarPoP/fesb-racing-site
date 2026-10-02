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
import { CAR_GROUPS, explodeAt, type CarGroup } from './carGroups'

export const MODEL_URL = '/models/efrt01.glb'

export type LabelPos = { key: string; ax: number; ay: number; visible: boolean }

type Part = { group: CarGroup; mesh: Mesh; home: Vector3; offset: Vector3; mat: MeshStandardMaterial }

const smooth = (a: number, b: number, x: number) => {
  const t = MathUtils.clamp((x - a) / (b - a), 0, 1)
  return t * t * (3 - 2 * t)
}

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
  const anchors = CAR_GROUPS.map((g) => {
    const own = parts.filter((p) => p.group === g)
    const pick = own.filter((p) => p.offset.z > 0.01 || p.group.spread === undefined)
    const list = pick.length ? pick : own
    const b = new Box3()
    list.forEach((p) => b.expandByObject(p.mesh))
    return { key: g.key, parts: list, local: b.isEmpty() ? null : b.getCenter(new Vector3()) }
  })

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
    camera.updateProjectionMatrix()
    dirty = true
  }

  // Stanje koje animiramo (glatko prati cilj)
  let shown = 0
  let target = 0
  let team: string | null = null
  const mix = new Map<CarGroup, number>() // 0 = neutralno, 1 = istaknuto, -1 = prigušeno
  const tmp = new Vector3()

  const apply = (p: number) => {
    const e = explodeAt(p)
    // Okret: iz 3/4 pogleda sprijeda preko boka do 3/4 pogleda straga, pa lagano nastavlja
    car.rotation.y = MathUtils.degToRad(-38 + 360 * smooth(0, 0.46, p) + 40 * smooth(0.46, 1, p))

    for (const part of parts) {
      part.mesh.position.copy(part.home).addScaledVector(part.offset, e)
    }

    // Kamera: odmakne se dok se bolid rastavlja, da sve stane u kadar
    const portrait = camera.aspect < 1
    const radius = MathUtils.lerp(1.9, 3.1, e) * (portrait ? 0.92 : 1)
    const fovV = MathUtils.degToRad(camera.fov)
    const fit = Math.max(radius / Math.tan(fovV / 2), radius / (Math.tan(fovV / 2) * camera.aspect))
    const dist = fit * 0.92
    const elev = MathUtils.degToRad(MathUtils.lerp(15, 30, e))
    camera.position.set(0, Math.sin(elev) * dist + 0.35 * e, Math.cos(elev) * dist)
    camera.lookAt(0, 0.25 + 0.35 * e, 0)
  }

  const paintColors = (dt: number) => {
    let moving = false
    for (const g of CAR_GROUPS) {
      const goal = team === null || team === '*' ? 0 : g.team === team ? 1 : -1
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
      if (!a.local) return { key: a.key, ax: 0, ay: 0, visible: false }
      // središte sidra prati pomak dijelova
      const p0 = a.parts[0]
      tmp.copy(a.local).addScaledVector(p0.offset, explodeAt(shown))
      root.localToWorld(tmp)
      tmp.project(camera)
      return {
        key: a.key,
        ax: (tmp.x * 0.5 + 0.5) * width,
        ay: (-tmp.y * 0.5 + 0.5) * height,
        visible: tmp.z < 1,
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
