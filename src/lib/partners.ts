/** Partner logos. Files: public/partners/<key>.png. The order is the order on the page. */
export type Partner = {
  name: string
  key: string
  /** Domain with an optional path. Empty if the partner has no site. */
  domain: string
  /** Width divided by height of the logo file. */
  ratio: number
  /** 1 is the largest tier. 4 is the smallest tier. */
  tier: 1 | 2 | 3 | 4
  /** Full logo URL (from the CMS). When empty, the logo is public/partners/<key>.png. */
  logoUrl?: string
}

export const PARTNERS: Partner[] = [
  { name: 'FESB', key: 'p01', domain: 'fesb.unist.hr', ratio: 2.32, tier: 1 },
  { name: 'Sveučilište u Splitu', key: 'p02', domain: 'unist.hr', ratio: 3.59, tier: 1 },
  { name: 'Studentski zbor UNIST', key: 'p03', domain: 'szst.unist.hr', ratio: 1.64, tier: 1 },
  { name: 'Dalstroj', key: 'p04', domain: 'dalstroj.com', ratio: 3.77, tier: 2 },
  { name: 'Končar', key: 'p05', domain: 'koncar.hr', ratio: 6.06, tier: 2 },
  { name: 'Tromont', key: 'p06', domain: 'tromont.hr', ratio: 8.11, tier: 2 },
  { name: 'Vertem', key: 'p07', domain: 'vertem.hr', ratio: 5.04, tier: 2 },
  { name: 'PS Tehnik', key: 'p08', domain: 'pstehnik.hr', ratio: 2.55, tier: 3 },
  { name: 'Easy Composites', key: 'p09', domain: 'easycomposites.co.uk', ratio: 2.83, tier: 3 },
  { name: 'Altium', key: 'p10', domain: 'altium.com', ratio: 2.69, tier: 3 },
  { name: 'IZIT', key: 'p11m', domain: 'izit.hr', ratio: 2.67, tier: 3 },
  { name: 'Serdarević R-Tech', key: 'p12m', domain: 'serdarevic-rtech.com', ratio: 2.92, tier: 3 },
  { name: 'Ruščić Performance', key: 'p13', domain: '', ratio: 3.07, tier: 3 },
  { name: 'HELL Energy', key: 'p14w', domain: 'hellenergy.com', ratio: 2.92, tier: 4 },
  { name: 'Altair', key: 'p15', domain: 'altair.com', ratio: 4.92, tier: 4 },
  { name: 'Ansys', key: 'p16', domain: 'ansys.com', ratio: 3.21, tier: 4 },
  { name: 'HEP', key: 'p17w', domain: 'hep.hr', ratio: 3.28, tier: 4 },
  { name: 'Festo', key: 'p18', domain: 'festo.com', ratio: 5.60, tier: 4 },
  { name: 'Brzoglas', key: 'p19m', domain: 'facebook.com/Brzoglas-doo-538469403009917', ratio: 2.44, tier: 4 },
  { name: 'Rexing', key: 'p20', domain: 'rexing.eu', ratio: 5.73, tier: 4 },
  { name: 'Vector', key: 'p21', domain: 'vector.com', ratio: 4.30, tier: 4 },
  { name: 'Kibernetika', key: 'p22', domain: 'kibernetika.hr', ratio: 2.67, tier: 4 },
  { name: 'PCBWay', key: 'p23', domain: 'pcbway.com', ratio: 3.62, tier: 4 },
  { name: 'norelem', key: 'p24b', domain: 'norelem.com', ratio: 4.35, tier: 4 },
  { name: 'Yamaha Split', key: 'p25', domain: 'yamaha-split.hr', ratio: 3.09, tier: 4 },
  { name: 'HSTEC', key: 'p26', domain: 'hstec.hr', ratio: 2.84, tier: 4 },
  { name: 'PCB Libraries', key: 'p27', domain: 'pcblibraries.com', ratio: 3.28, tier: 4 },
  { name: 'ECON Engineering', key: 'p28', domain: 'econengineering.com', ratio: 2.13, tier: 4 },
  { name: 'THP', key: 'p29w', domain: 'thp.solutions', ratio: 1.17, tier: 4 },
  { name: 'Plotanje Martinović', key: 'p30', domain: 'plotanjemartinovic.com', ratio: 1.94, tier: 4 },
  { name: 'Kvaser', key: 'p31', domain: 'kvaser.com', ratio: 2.07, tier: 4 },
  { name: 'TeXtreme', key: 'p32', domain: 'textreme.com', ratio: 6.34, tier: 4 },
  { name: 'KISSsoft', key: 'p33', domain: 'kisssoft.com', ratio: 3.08, tier: 4 },
  { name: 'QS Shifting Controll', key: 'p34', domain: 'qs.vyrobce.cz', ratio: 3.51, tier: 4 },
  { name: 'MSC Software', key: 'p35', domain: 'mscsoftware.com', ratio: 3.81, tier: 4 },
  { name: 'VI-grade', key: 'p36', domain: 'vi-grade.com', ratio: 3.14, tier: 4 },
  { name: 'Gamma Technologies', key: 'p37', domain: 'gtisoft.com', ratio: 4.17, tier: 4 },
  { name: 'Rimac Technology', key: 'p38', domain: 'rimac-technology.com', ratio: 5.45, tier: 4 },
  { name: 'Bugatti Rimac', key: 'p39', domain: 'rimac-group.com', ratio: 2.96, tier: 4 },
  { name: 'JLCPCB', key: 'p40', domain: 'jlcpcb.com', ratio: 4.84, tier: 4 },
  { name: 'Pobis', key: 'p41m', domain: 'pobis.hr', ratio: 1.30, tier: 4 },
  { name: 'R-M', key: 'p42m', domain: '', ratio: 0.88, tier: 4 },
  { name: 'Pristan', key: 'p43', domain: 'pristan-colours.hr', ratio: 1.76, tier: 4 },
  { name: 'SKF', key: 'p44', domain: 'skf.com', ratio: 4.26, tier: 4 },
  { name: 'Cabo tehnologije', key: 'p45', domain: 'instagram.com/cabo_tehnologije', ratio: 1.86, tier: 4 },
  { name: 'Batemo', key: 'p46', domain: 'batemo.com', ratio: 4.29, tier: 4 },
  { name: 'Adria Winch', key: 'p47', domain: 'adriawinch.com', ratio: 6.00, tier: 4 },
  { name: 'Vijci Kranjec', key: 'p48', domain: 'vijci.com', ratio: 5.17, tier: 4 },
  { name: 'Južni prolaz', key: 'p49', domain: 'juzniprolaz.hr', ratio: 13.33, tier: 4 },
  { name: 'cyber_Folks', key: 'p50', domain: 'cyberfolks.hr', ratio: 6.74, tier: 4 },
  { name: 'Velum Nautica', key: 'p51', domain: 'velumnautica.com', ratio: 1.55, tier: 4 },
  { name: 'Tennant Metall', key: 'p52', domain: 'tennant-metall.com', ratio: 4.48, tier: 4 },
  { name: 'Eurocircuits', key: 'p53', domain: 'eurocircuits.com', ratio: 1.26, tier: 4 },
  { name: 'EPLAN', key: 'p54e', domain: 'eplan.hr', ratio: 0.71, tier: 4 },
  { name: 'KeyShot', key: 'p55', domain: 'keyshot.com', ratio: 2.86, tier: 4 },
  { name: 'AVL', key: 'p56', domain: 'avl.com', ratio: 3.02, tier: 4 },
]

/** Tier layout: [minimum tile width, tile height, logo size] in px. */
export const PARTNER_TIERS: Record<Partner['tier'], [number, number, number]> = {
  1: [280, 210, 64],
  2: [240, 170, 50],
  3: [200, 136, 40],
  4: [160, 112, 32],
}

export function partnerUrl(p: Partner) {
  return p.domain ? 'https://' + p.domain : ''
}

/** Logo size in px, from the tier and the aspect ratio. */
export function partnerLogoSize(p: Partner) {
  const [minW, , size] = PARTNER_TIERS[p.tier]
  const h = Math.min(size * 1.5, (size / Math.pow(p.ratio, 0.45)) * 1.4)
  const w = Math.min(minW * 0.72, h * p.ratio)
  return { w: Math.round(w), h: Math.round(w / p.ratio) }
}
