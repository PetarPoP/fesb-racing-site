/**
 * Three.js scene for the "Teams" section. The car turns while the page scrolls, then it comes apart.
 * The module loads with a dynamic import (browser only, when the section is near the screen),
 * so three.js is not in the main bundle. The React component (`CarExplode.tsx`) sends the scroll
 * progress and the active team. Each frame the scene returns the screen positions of the labels.
 *
 * Look of the scene:
 * - Each part has its own material (table `LOOKS`). The whole car shows in full colour.
 * - The active team keeps the part colours and gets an outline and a glow in the team colour.
 * - The other parts fade to faint ghosts with a grey outline.
 */
import {
  ACESFilmicToneMapping,
  Box3,
  BufferAttribute,
  BufferGeometry,
  Color,
  EdgesGeometry,
  Group,
  LineBasicMaterial,
  LineSegments,
  MathUtils,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  PMREMGenerator,
  Scene,
  ShaderMaterial,
  SRGBColorSpace,
  Vector2,
  Vector3,
  WebGLRenderer,
  type Object3D,
} from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACO_PATH, fetchModel } from './carModel'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { toCreasedNormals } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { CAR_GROUPS, explodeAt, teamColor, yawAt, type CarGroup } from './carGroups'

export { MODEL_URL } from './carModel'

export type LabelPos = { key: string; ax: number; ay: number; visible: boolean }
export type DimLine = { key: 'length' | 'wheelbase' | 'width'; mm: number; ax: number; ay: number; bx: number; by: number; o: number }

/**
 * One table for all part materials. `edge` is the outline colour in the whole-car view.
 * `paint` colours single vertices, because one mesh can hold two materials (tyre and rim).
 */
type Look = { color: string; metal: number; rough: number; edge?: string; paint?: 'wheel' }
export const LOOKS: Record<string, Look> = {
  frame: { color: '#8d949c', metal: 0.85, rough: 0.4 }, // steel
  body: { color: '#b3172e', metal: 0.3, rough: 0.3 }, // FESB red
  aero_front: { color: '#18181b', metal: 0.35, rough: 0.34, edge: '#e2475b' }, // carbon, red edge
  aero_rear: { color: '#18181b', metal: 0.35, rough: 0.34, edge: '#f1e9e5' }, // carbon, white edge
  aero_under: { color: '#141416', metal: 0.3, rough: 0.4, edge: '#e2475b' },
  accu: { color: '#23252b', metal: 0.5, rough: 0.45, edge: '#4aa3ff' }, // dark pack, blue accent
  lv: { color: '#1d2634', metal: 0.4, rough: 0.5, edge: '#ff9a3c' }, // orange wiring
  drive: { color: '#aab0b8', metal: 0.9, rough: 0.3 }, // brushed metal
  steer: { color: '#c4c8ce', metal: 0.9, rough: 0.28 },
  cockpit: { color: '#242227', metal: 0.1, rough: 0.8 }, // seat fabric
  susp: { color: '#f2a31b', metal: 0.45, rough: 0.35 }, // yellow springs and arms
  brakes: { color: '#d6d9de', metal: 0.95, rough: 0.24 }, // light discs
  wheels: { color: '#5b6068', metal: 0.7, rough: 0.5, paint: 'wheel' }, // rim; the shader splits tyre and rim
}
const TYRE = new Color('#060607')
/** Opacity of the parts that are not in focus (mesh and outline). */
const GHOST_OPACITY = 0.08
const GHOST_EDGE_OPACITY = 0.035
const IDLE_EDGE = new Color('#6b6366')

type Part = {
  group: CarGroup
  mesh: Mesh
  edges: LineSegments
  home: Vector3
  offset: Vector3
  cur: Vector3
  mat: MeshStandardMaterial
  edgeMat: LineBasicMaterial
  base: Color
  neutral: Color
  box: Box3
}

const FLOOR_VERT = /* glsl */ `
varying vec2 vW;
void main() {
  vec4 w = modelMatrix * vec4(position, 1.0);
  vW = w.xz;
  gl_Position = projectionMatrix * viewMatrix * w;
}`

/** Grid floor: fades with distance, dark under the car, accent ring at the contact line, moving soft spot. */
const FLOOR_FRAG = /* glsl */ `
varying vec2 vW;
uniform vec3 uCol;
uniform vec3 uSpotCol;
uniform vec2 uSpot;
uniform float uSpotAmt;
uniform vec2 uHalf;
uniform float uYaw;
float grid(vec2 p, float s, float w) {
  vec2 q = p / s;
  vec2 g = abs(fract(q - 0.5) - 0.5) / max(fwidth(q), vec2(1e-4));
  return 1.0 - min(min(g.x, g.y) / w, 1.0);
}
void main() {
  float d = length(vW);
  float fade = 1.0 - smoothstep(1.2, 8.0, d);
  float g = max(grid(vW, 0.25, 1.0) * 0.4, grid(vW, 1.0, 1.4) * 0.85) * fade;
  float c = cos(uYaw), s = sin(uYaw);
  vec2 p = vec2(c * vW.x - s * vW.y, s * vW.x + c * vW.y);
  float e = length(p / uHalf);
  float shadow = 1.0 - smoothstep(0.55, 1.25, e);
  g *= 1.0 - 0.8 * shadow;
  float ring = exp(-pow((e - 1.0) / 0.05, 2.0)) * 0.38 * fade;
  float sd = length(vW - uSpot);
  float spot = exp(-sd * sd / 0.8) * uSpotAmt * 0.3 * fade;
  float k = g * 0.5 + ring;
  float a = clamp(k + spot + shadow * 0.18, 0.0, 1.0);
  vec3 rgb = (uCol * k + uSpotCol * spot) / max(k + spot, 1e-3);
  gl_FragColor = vec4(mix(vec3(0.0), rgb, step(0.001, k + spot)), a);
  #include <colorspace_fragment>
}`

export async function createCarScene(canvas: HTMLCanvasElement, onProgress: (loaded: number) => void) {
  const small = Math.min(window.innerWidth, window.innerHeight) < 700
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, small ? 1.5 : 2))
  renderer.outputColorSpace = SRGBColorSpace
  renderer.toneMapping = ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.05
  renderer.setClearColor(0x000000, 0)

  const scene = new Scene()
  const pmrem = new PMREMGenerator(renderer)
  const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
  scene.environment = envTex
  scene.environmentIntensity = 1.0

  const camera = new PerspectiveCamera(28, 1, 0.1, 100)

  const draco = new DRACOLoader().setDecoderPath(DRACO_PATH)
  const loader = new GLTFLoader().setDRACOLoader(draco)
  const data = await fetchModel(onProgress) // shared with the early fetch, so no second request
  const gltf = await loader.parseAsync(data, '')
  draco.dispose()

  const car = new Group() // turns around the vertical axis
  const root = gltf.scene
  car.add(root)
  scene.add(car)

  // Put the car in the middle of the floor, so it turns around its own centre.
  const rawBox = new Box3().setFromObject(root)
  const rawC = rawBox.getCenter(new Vector3())
  root.position.set(-rawC.x, 0, -rawC.z)
  root.updateMatrixWorld(true)

  // Wheel clusters (front axle and rear axle), found while the wheel meshes get their vertex colours.
  const axles: number[] = []
  const paintWheels = (geo: BufferGeometry) => {
    const pos = geo.attributes.position
    const xs: number[] = []
    for (let i = 0; i < pos.count; i++) xs.push(pos.getX(i))
    const sorted = [...xs].sort((a, b) => a - b)
    const split = (sorted[0] + sorted[sorted.length - 1]) / 2
    const cl = [
      { mn: Infinity, mx: -Infinity, ymn: Infinity, ymx: -Infinity },
      { mn: Infinity, mx: -Infinity, ymn: Infinity, ymx: -Infinity },
    ]
    for (let i = 0; i < pos.count; i++) {
      const c = cl[pos.getX(i) > split ? 1 : 0]
      c.mn = Math.min(c.mn, pos.getX(i))
      c.mx = Math.max(c.mx, pos.getX(i))
      c.ymn = Math.min(c.ymn, pos.getY(i))
      c.ymx = Math.max(c.ymx, pos.getY(i))
    }
    for (const c of cl) axles.push((c.mn + c.mx) / 2)
    const circ = cl.map((c) => new Vector3((c.mn + c.mx) / 2, (c.ymn + c.ymx) / 2, (c.mx - c.mn) / 2))
    return { split, c0: circ[0], c1: circ[1] }
  }

  /** Per-fragment tyre/rim split: a clean circle by the object-space radius, with a soft edge. */
  const wheelShader = (info: { split: number; c0: Vector3; c1: Vector3 }, rim: Color) => (sh: { uniforms: Record<string, { value: unknown }>; vertexShader: string; fragmentShader: string }) => {
    sh.uniforms.uSplit = { value: info.split }
    sh.uniforms.uC0 = { value: info.c0 }
    sh.uniforms.uC1 = { value: info.c1 }
    sh.uniforms.uTyre = { value: TYRE }
    sh.uniforms.uRim = { value: rim }
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vLp;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvLp = position;')
    sh.fragmentShader = sh.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
varying vec3 vLp;
uniform float uSplit;
uniform vec3 uC0;
uniform vec3 uC1;
uniform vec3 uTyre;
uniform vec3 uRim;
float tyreMask() {
  vec3 c = vLp.x > uSplit ? uC1 : uC0;
  float r = length(vLp.xy - c.xy) / max(c.z, 1e-4);
  return smoothstep(0.74, 0.78, r);
}`,
      )
      .replace('#include <color_fragment>', '#include <color_fragment>\nfloat tyreK = tyreMask();\ndiffuseColor.rgb *= mix(uRim, uTyre, tyreK);')
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = mix(0.5, 0.92, tyreK);')
      .replace('#include <metalnessmap_fragment>', '#include <metalnessmap_fragment>\nmetalnessFactor = mix(0.7, 0.0, tyreK);')
  }
  const byKey = new Map(CAR_GROUPS.map((g) => [g.key, g]))
  const parts: Part[] = []
  root.traverse((o: Object3D) => {
    if (!(o as Mesh).isMesh) return
    const mesh = o as Mesh
    // node name, for example "wheels_L" = group "wheels", side L
    const name = (mesh.name || mesh.parent?.name || '').replace(/_\d+$/, '')
    const m = /^(.*?)(?:_(L|R|C))?$/.exec(name)!
    const group = byKey.get(m[1])
    if (!group) return
    const side = m[2] === 'L' ? 1 : m[2] === 'R' ? -1 : 0
    const [x, y, z] = group.explode
    const offset = new Vector3(x, y, z + side * (group.spread ?? 0))
    // The GLB has no normals (smaller file). They are computed here, with sharp edges above 35 degrees.
    const raw = mesh.geometry
    // Wheels use a wide crease angle, so the round tyre and rim shade smooth.
    const crease = group.key === 'wheels' ? 50 : 35
    if (!raw.attributes.normal) mesh.geometry = toCreasedNormals(raw, MathUtils.degToRad(crease))
    if (mesh.geometry !== raw) raw.dispose()
    const look = LOOKS[group.key] ?? LOOKS.frame
    const wheelInfo = look.paint === 'wheel' ? paintWheels(mesh.geometry) : null
    const mat = new MeshStandardMaterial({
      color: look.paint ? 0xffffff : look.color,
      metalness: look.metal,
      roughness: look.rough,
      envMapIntensity: look.paint ? 0.55 : 1,
    })
    if (wheelInfo) {
      mat.onBeforeCompile = wheelShader(wheelInfo, new Color(LOOKS.wheels.color))
      mat.customProgramCacheKey = () => 'wheel'
    }
    mesh.material = mat
    const edgeMat = new LineBasicMaterial({ transparent: true, depthWrite: false, opacity: 0.1 })
    const edges = new LineSegments(new EdgesGeometry(mesh.geometry, 32), edgeMat)
    edges.frustumCulled = false
    mesh.add(edges)
    mesh.geometry.computeBoundingBox()
    parts.push({
      group,
      mesh,
      edges,
      home: mesh.position.clone(),
      offset,
      cur: new Vector3(),
      mat,
      edgeMat,
      base: new Color(look.paint ? '#ffffff' : look.color),
      neutral: new Color(look.edge ?? '#ffffff'),
      box: mesh.geometry.boundingBox!.clone(),
    })
  })

  // Approximate sizes from the CAD bounds (the model units are metres)
  const box = new Box3().setFromObject(root)
  const floorY = box.min.y
  const size = box.getSize(new Vector3())
  axles.sort((a, b) => a - b)
  const axF = (axles[axles.length - 1] ?? box.max.x - 0.3) + root.position.x
  const axR = (axles[0] ?? box.min.x + 0.3) + root.position.x
  const toMm = (m: number) => Math.round((m * (size.x < 20 ? 1000 : 1)) / 5) * 5

  // Floor: custom grid shader on one large plane
  const floorMat = new ShaderMaterial({
    vertexShader: FLOOR_VERT,
    fragmentShader: FLOOR_FRAG,
    transparent: true,
    depthWrite: false,
    uniforms: {
      uCol: { value: new Color('#e2475b') },
      uSpotCol: { value: new Color('#e2475b') },
      uSpot: { value: new Vector2() },
      uSpotAmt: { value: 0 },
      uHalf: { value: new Vector2(size.x / 2, size.z / 2.2) },
      uYaw: { value: 0 },
    },
  })
  const floor = new Mesh(new PlaneGeometry(24, 24), floorMat)
  floor.rotation.x = -Math.PI / 2
  floor.position.y = floorY - 0.002
  floor.renderOrder = -1
  scene.add(floor)

  // Anchors for the labels: a real point on the part surface (see the older note: the box centre of
  // a wheel falls between two wheels). An assembly with two halves has an anchor on both.
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
    spots: parts.filter((p) => p.group === g).map((p) => ({ part: p, local: root.worldToLocal(surfacePoint(p)) })),
  }))
  const counts: Record<string, number> = {}
  for (const p of parts) counts[p.group.team] = (counts[p.group.team] ?? 0) + 1

  let width = 1
  let height = 1
  let dirty = true
  const squeeze = new Vector3(1, 1, 1)
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

  // Animated state
  let shown = 0
  let target = 0
  let team: string | null = null
  let clock = 0
  const mix = new Map<CarGroup, number>() // 0 = neutral, 1 = active, -1 = idle
  const gColor = new Map<CarGroup, Color>() // colour of the team that last lit the group
  const tmp = new Vector3()
  const off = new Vector3()
  const groupIndex = new Map(CAR_GROUPS.map((g, i) => [g, i]))
  const baseLook = new Vector3()
  const camLook = new Vector3(0, 0.25, 0)
  let camR = 1.9
  let spotAmt = 0
  const spot = new Vector2()
  const focusBox = new Box3()
  const pbox = new Box3()
  const focusC = new Vector3()
  const lookGoal = new Vector3()

  const placeParts = (p: number) => {
    const n = CAR_GROUPS.length
    car.rotation.y = MathUtils.degToRad(yawAt(p))
    for (const part of parts) {
      const k = explodeAt(p, groupIndex.get(part.group)!, n)
      part.cur.copy(part.offset).multiply(squeeze).multiplyScalar(k)
      part.mesh.position.copy(part.home).add(part.cur)
    }
    car.updateMatrixWorld(true)
  }

  /** Camera: steps back while the car comes apart, then flies toward the active team's parts. */
  const placeCamera = (p: number, dt: number, reduced: boolean) => {
    const n = CAR_GROUPS.length
    const e = explodeAt(p, n / 2, n)
    const portrait = camera.aspect < 1
    const R0 = MathUtils.lerp(1.9, 3.1, e) * (portrait ? MathUtils.lerp(1.15, 0.96, e) : 1)
    baseLook.set(0, 0.25 + 0.35 * e + (portrait ? 0.3 * e : 0), 0)
    let Rt = R0
    lookGoal.copy(baseLook)
    const focused = team !== null && team !== '*' && e > 0.5
    if (focused) {
      focusBox.makeEmpty()
      for (const part of parts) {
        if (part.group.team !== team) continue
        pbox.copy(part.box).translate(part.home).translate(part.cur)
        focusBox.union(pbox)
      }
      if (!focusBox.isEmpty()) {
        focusBox.getCenter(focusC)
        const r = focusBox.getSize(tmp).length() / 2
        root.localToWorld(focusC)
        Rt = Math.min(R0, Math.max(1.2, r * 0.95 + 0.55))
        lookGoal.lerp(focusC, 0.7)
        // on a wide screen the text card is on the right, so the focus moves a little to the left
        if (!portrait) lookGoal.x += 0.28 * Rt
      }
    }
    const rate = reduced ? 1000 : 3.2
    const before = camR + camLook.x + camLook.y + camLook.z
    camR = MathUtils.damp(camR, Rt, rate, dt)
    camLook.set(
      MathUtils.damp(camLook.x, lookGoal.x, rate, dt),
      MathUtils.damp(camLook.y, lookGoal.y, rate, dt),
      MathUtils.damp(camLook.z, lookGoal.z, rate, dt),
    )
    const fovV = MathUtils.degToRad(camera.fov)
    const fit = Math.max(camR / Math.tan(fovV / 2), camR / (Math.tan(fovV / 2) * camera.aspect))
    const dist = fit * 0.92
    const elev = MathUtils.degToRad(MathUtils.lerp(15, 30, e))
    camera.position.set(camLook.x, camLook.y + Math.sin(elev) * dist, camLook.z + Math.cos(elev) * dist)
    camera.lookAt(camLook)
    camera.updateMatrixWorld()
    const moved = Math.abs(camR + camLook.x + camLook.y + camLook.z - before) > 1e-4
    // Spotlight on the floor follows the active parts (x and z)
    const goalAmt = team === null ? 0 : 1
    if (focused && !focusBox.isEmpty()) spot.set(focusC.x, focusC.z)
    else if (team === '*') spot.set(0, 0)
    spotAmt = reduced ? goalAmt : MathUtils.damp(spotAmt, goalAmt, 4, dt)
    return moved
  }

  const spotU = floorMat.uniforms.uSpot.value as Vector2
  const lastSpot = new Vector2()
  const tc = new Color()

  const paintColors = (dt: number, reduced: boolean) => {
    let moving = false
    for (const g of CAR_GROUPS) {
      // '*' = a team without own parts (marketing): the whole car is lit
      const goal = team === null ? 0 : team === '*' || g.team === team ? 1 : -1
      if (goal === 1) gColor.set(g, new Color(teamColor(team === '*' ? 'M&B' : team)))
      const cur = mix.get(g) ?? 0
      const next = MathUtils.damp(cur, goal, 9, dt)
      if (Math.abs(next - goal) > 0.002) moving = true
      mix.set(g, Math.abs(next - goal) <= 0.002 ? goal : next)
    }
    const pulse = reduced ? 0.06 : 0.055 + 0.04 * Math.sin(clock * 1.7)
    for (const part of parts) {
      const k = mix.get(part.group) ?? 0
      const hi = Math.max(0, k)
      const lo = Math.max(0, -k)
      const look = LOOKS[part.group.key] ?? LOOKS.frame
      const tint = gColor.get(part.group) ?? tc.set('#e2475b')
      // Idle parts fade to faint, darker ghosts. Active parts keep their own colour and glow.
      if (look.paint) part.mat.color.setScalar(1 - lo * 0.45)
      else part.mat.color.copy(part.base).multiplyScalar(1 - lo * 0.45)
      part.mat.emissive.copy(tint).multiplyScalar(hi * pulse)
      part.mat.opacity = 1 - lo * (1 - GHOST_OPACITY)
      const ghost = lo > 0.01
      if (part.mat.transparent !== ghost) {
        part.mat.transparent = ghost
        part.mat.depthWrite = !ghost
        part.mat.needsUpdate = true
      }
      // Outline: faint in the whole-car view, team colour when active, grey when idle
      const neutralOp = look.edge ? 0.5 : 0.05
      part.edgeMat.color.copy(part.neutral).lerp(tint, hi).lerp(IDLE_EDGE, lo)
      const act = 0.55 + 0.35 * (reduced ? 0.5 : 0.5 + 0.5 * Math.sin(clock * 1.7))
      part.edgeMat.opacity = MathUtils.lerp(MathUtils.lerp(neutralOp, act, hi), GHOST_EDGE_OPACITY, lo)
    }
    return moving
  }

  /** One frame. Returns the label anchor positions in canvas pixels. */
  const frame = (dt: number, reduced: boolean): LabelPos[] => {
    clock += dt
    const before = shown
    shown = reduced ? target : MathUtils.damp(shown, target, 7, dt)
    if (Math.abs(shown - target) < 1e-4) shown = target
    placeParts(shown)
    const colorsMoving = paintColors(reduced ? 1 : dt, reduced)
    const camMoving = placeCamera(shown, reduced ? 1 : dt, reduced)

    const pulsing = team !== null && !reduced
    spotU.lerp(spot, reduced ? 1 : Math.min(1, dt * 4))
    const spotMoving = lastSpot.distanceToSquared(spotU) > 1e-6
    lastSpot.copy(spotU)
    const fu = floorMat.uniforms
    fu.uSpotAmt.value = spotAmt
    fu.uYaw.value = car.rotation.y
    if (team !== null) (fu.uSpotCol.value as Color).set(teamColor(team === '*' ? 'M&B' : team))

    if (dirty || shown !== before || colorsMoving || camMoving || pulsing || spotMoving || Math.abs(spotAmt - (team === null ? 0 : 1)) > 0.002) {
      renderer.render(scene, camera)
      dirty = false
    }
    return anchors.map((a) => {
      let best: Vector3 | null = null
      let bestZ = Infinity
      for (const sp of a.spots) {
        tmp.copy(sp.local).add(sp.part.cur)
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

  /** Centre of the car on the screen (direction for label offsets). */
  const center = () => {
    tmp.set(0, 0.3, 0).project(camera)
    return { x: (tmp.x * 0.5 + 0.5) * width, y: (-tmp.y * 0.5 + 0.5) * height }
  }

  // Dimension lines on the floor: lengths in mm are approximate (taken from the CAD bounds)
  const dimDefs: { key: DimLine['key']; mm: number; a: Vector3; b: Vector3 }[] = [
    { key: 'length', mm: toMm(size.x), a: new Vector3(box.min.x, floorY, box.max.z + 0.3), b: new Vector3(box.max.x, floorY, box.max.z + 0.3) },
    { key: 'wheelbase', mm: toMm(axF - axR), a: new Vector3(axR, floorY, box.max.z + 0.62), b: new Vector3(axF, floorY, box.max.z + 0.62) },
    { key: 'width', mm: toMm(size.z), a: new Vector3(box.min.x - 0.3, floorY, box.min.z), b: new Vector3(box.min.x - 0.3, floorY, box.max.z) },
  ]
  const dims = (): DimLine[] => {
    const k = Math.max(...CAR_GROUPS.map((g, i) => explodeAt(shown, i, CAR_GROUPS.length)))
    const o = team === null ? MathUtils.clamp(1 - k * 5, 0, 1) : 0
    return dimDefs.map((d) => {
      const pa = car.localToWorld(d.a.clone()).project(camera)
      const pb = car.localToWorld(d.b.clone()).project(camera)
      return {
        key: d.key,
        mm: d.mm,
        ax: (pa.x * 0.5 + 0.5) * width,
        ay: (-pa.y * 0.5 + 0.5) * height,
        bx: (pb.x * 0.5 + 0.5) * width,
        by: (-pb.y * 0.5 + 0.5) * height,
        o: pa.z < 1 && pb.z < 1 ? o : 0,
      }
    })
  }

  return {
    resize,
    frame,
    center,
    dims,
    counts,
    setProgress: (p: number) => {
      const next = MathUtils.clamp(p, 0, 1)
      // A jump (anchor link) skips the damping, so the car does not replay the whole assembly.
      if (Math.abs(next - target) > 0.2) shown = next
      target = next
    },
    getProgress: () => shown,
    setTeam: (code: string | null) => {
      team = code
      dirty = true
    },
    dispose: () => {
      for (const p of parts) {
        p.edges.geometry.dispose()
        p.edgeMat.dispose()
        p.mesh.geometry.dispose()
        p.mat.dispose()
      }
      floor.geometry.dispose()
      floorMat.dispose()
      envTex.dispose()
      pmrem.dispose()
      renderer.dispose()
      renderer.forceContextLoss()
    },
  }
}

export type CarScene = Awaited<ReturnType<typeof createCarScene>>
