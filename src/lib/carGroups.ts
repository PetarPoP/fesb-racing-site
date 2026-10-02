/**
 * Koji tim je zadužen za koji dio bolida (sekcija „Timovi“, 3D rastav).
 *
 * Svaka grupa odgovara jednom ili više čvorova u `/models/efrt01.glb` (ime čvora = `key`,
 * a sklopovi koji se rastavljaju na lijevo/desno imaju sufiks `_L` / `_R`).
 * Za promjenu tima dovoljno je promijeniti `team` — vrijednost je `code` iz `content.teams`.
 *
 * `explode` je pomak u metrima u koordinatama bolida: x = naprijed, y = gore, z = lijevo.
 * `spread` dodatno razmiče lijevu i desnu polovicu sklopa (u metrima).
 */
export type CarGroup = {
  key: string
  /** Šifre iz SolidWorks stabla koje grupa pokriva (samo za prikaz u oznaci). */
  codes: string[]
  team: string
  name: { hr: string; en: string }
  explode: [number, number, number]
  spread?: number
}

export const CAR_GROUPS: CarGroup[] = [
  { key: 'frame', codes: ['04-FR'], team: 'MEH', name: { hr: 'Šasija', en: 'Chassis' }, explode: [0, 0, 0] },
  { key: 'body', codes: ['04-BM'], team: 'KAR', name: { hr: 'Karoserija', en: 'Bodywork' }, explode: [0, 1.15, 0] },
  { key: 'aero_front', codes: ['04-AF'], team: 'AER', name: { hr: 'Prednje krilo', en: 'Front wing' }, explode: [1.05, -0.05, 0] },
  { key: 'aero_rear', codes: ['04-AR'], team: 'AER', name: { hr: 'Stražnje krilo', en: 'Rear wing' }, explode: [-1.0, 0.7, 0] },
  { key: 'aero_under', codes: ['04-AU'], team: 'AER', name: { hr: 'Podnica i difuzor', en: 'Undertray & diffuser' }, explode: [0, -0.55, 0], spread: 0.25 },
  { key: 'accu', codes: ['09-ET'], team: 'E&S', name: { hr: 'Akumulator i VN sustav', en: 'Accumulator & HV system' }, explode: [-0.25, 1.7, 0] },
  { key: 'lv', codes: ['02-LV'], team: 'E&S', name: { hr: 'Niskonaponski sustav', en: 'Low-voltage system' }, explode: [0.1, 0.35, 0], spread: 0.6 },
  { key: 'drive', codes: ['03-DT'], team: 'MEH', name: { hr: 'Pogonski sklop', en: 'Drivetrain' }, explode: [-1.05, -0.05, 0] },
  { key: 'steer', codes: ['06-ST'], team: 'MEH', name: { hr: 'Upravljanje', en: 'Steering' }, explode: [0.55, 0.85, 0] },
  { key: 'cockpit', codes: ['05-MS'], team: 'MEH', name: { hr: 'Kokpit i sjedalo', en: 'Cockpit & seat' }, explode: [0.1, 0.6, 0] },
  { key: 'susp', codes: ['07-SU'], team: 'MEH', name: { hr: 'Ovjes', en: 'Suspension' }, explode: [0, 0, 0], spread: 0.6 },
  { key: 'brakes', codes: ['01-BR'], team: 'MEH', name: { hr: 'Kočioni sustav', en: 'Brake system' }, explode: [0, -0.15, 0], spread: 0.85 },
  { key: 'wheels', codes: ['08-WT'], team: 'MEH', name: { hr: 'Kotači i gume', en: 'Wheels & tyres' }, explode: [0, 0, 0], spread: 1.25 },
]

/**
 * Dijelovi skrolanja kroz sekciju (0–1): okret i rastav, timovi redom (svaki jednako dugo),
 * pa se bolid polako sklopi dio po dio i okrene natrag u početni pogled.
 * Ovdje (a ne u car3d.ts) da ih React komponenta može čitati bez učitavanja three.js.
 */
export const PHASE = {
  explodeFrom: 0.1,
  explodeTo: 0.24,
  teamsFrom: 0.26,
  teamsTo: 0.82,
  assembleFrom: 0.84,
  assembleTo: 0.97,
}

/** Razmak između sklopova dok se vraćaju na mjesto (udio skrola) — redom iz CAR_GROUPS, kotači zadnji. */
const ASSEMBLE_STAGGER = 0.05

const clamp01 = (x: number) => Math.min(1, Math.max(0, x))
const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a))
  return t * t * (3 - 2 * t)
}
const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)

/**
 * Koliko je sklop rastavljen (0 = na mjestu, 1 = potpuno odmaknut) za dani napredak skrolanja.
 * `i` / `n` = redni broj sklopa i ukupan broj, za postupno sklapanje na kraju.
 */
export const explodeAt = (p: number, i = 0, n = 1) => {
  const out = smoothstep(PHASE.explodeFrom, PHASE.explodeTo, p)
  const start = PHASE.assembleFrom + (n > 1 ? (i / (n - 1)) * ASSEMBLE_STAGGER : 0)
  const back = easeInOutCubic(clamp01((p - start) / (PHASE.assembleTo - ASSEMBLE_STAGGER - PHASE.assembleFrom)))
  return out * (1 - back)
}

/** Okret bolida (stupnjevi): puni krug kroz rastav, lagani zanos uz timove, pa natrag u početni 3/4 pogled. */
export const yawAt = (p: number) =>
  -38 + 300 * smoothstep(0, PHASE.explodeTo + 0.02, p) + 30 * smoothstep(PHASE.teamsFrom, PHASE.teamsTo, p) + 30 * smoothstep(PHASE.assembleFrom, PHASE.assembleTo, p)
