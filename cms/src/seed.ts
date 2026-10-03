/**
 * Idempotent seed script. Run it with: npm run seed
 * It uses the same local D1 and R2 emulation as "npm run dev" (.wrangler/state).
 * Every record has a natural key (email, name, slug, filename), so a second run changes nothing.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getPayload, type Payload } from 'payload'
import config from './payload.config'
import content from './seed-data/content.json' with { type: 'json' }
import partnersData from './seed-data/partners.json' with { type: 'json' }

const here = path.dirname(fileURLToPath(import.meta.url))
const assets = path.resolve(here, '..', 'seed-assets')
const hr = content.hr
const en = content.en

type Locale = 'hr' | 'en'

const log = (msg: string) => console.log(`[seed] ${msg}`)

/** Make a Lexical document from plain paragraphs. */
const lexical = (paragraphs: string[]) => ({
  root: {
    type: 'root',
    format: '',
    indent: 0,
    version: 1,
    direction: 'ltr',
    children: paragraphs.map((text) => ({
      type: 'paragraph',
      format: '',
      indent: 0,
      version: 1,
      direction: 'ltr',
      textFormat: 0,
      children: [{ type: 'text', text, detail: 0, format: 0, mode: 'normal', style: '', version: 1 }],
    })),
    },
})


// ---- Lexical node builders for the feature post ----
const lexText = (text: string, format = 0) => ({ type: 'text', text, detail: 0, format, mode: 'normal', style: '', version: 1 })
const lexElement = (type: string, children: unknown[], extra: Record<string, unknown> = {}) => ({
  type, children, format: '', indent: 0, version: 1, direction: 'ltr', ...extra,
})
const lexPara = (...children: unknown[]) => lexElement('paragraph', children, { textFormat: 0 })
const lexHeading = (tag: string, text: string) => lexElement('heading', [lexText(text)], { tag })
const lexList = (listType: 'bullet' | 'number' | 'check', items: { text: string; checked?: boolean }[]) =>
  lexElement(
    'list',
    items.map((it, i) =>
      lexElement('listitem', [lexText(it.text)], { value: i + 1, ...(listType === 'check' ? { checked: !!it.checked } : {}) }),
    ),
    { listType, start: 1, tag: listType === 'number' ? 'ol' : 'ul' },
  )
const lexTable = (rows: string[][]) =>
  lexElement(
    'table',
    rows.map((row, r) =>
      lexElement('tablerow', row.map((cell) =>
        lexElement('tablecell', [lexPara(lexText(cell))], { headerState: r === 0 ? 1 : 0, colSpan: 1, rowSpan: 1, backgroundColor: null }),
      ), {}),
    ),
    {},
  )
const lexUpload = (mediaId: number, fields: { caption?: string; alt?: string }) => ({
  type: 'upload', version: 3, format: '', id: `up${mediaId}`, relationTo: 'media', value: mediaId, fields,
})
const lexGallery = (id: string, title: string, layout: string, images: { id: string; image: number; caption: string }[]) => ({
  type: 'block', version: 2, format: '', fields: { id, blockType: 'gallery', blockName: '', title, layout, images },
})
const lexDoc = (children: unknown[]) => ({ root: { type: 'root', format: '', indent: 0, version: 1, direction: 'ltr', children } })

const htmlToParagraphs = (html: string) =>
  [...html.matchAll(/<p>(.*?)<\/p>/g)].map((m) => m[1].replace(/<[^>]+>/g, '')).filter(Boolean)

/**
 * Copy the row ids of the hr document into the en data.
 * Without the ids, Payload replaces the array rows and the hr values of localized fields are lost.
 */
function withIds(next: unknown, base: unknown): unknown {
  if (Array.isArray(next) && Array.isArray(base)) {
    return next.map((row, i) => {
      const old = base[i] as Record<string, unknown> | undefined
      const merged = withIds(row, old) as Record<string, unknown>
      return old?.id !== undefined && merged && typeof merged === 'object' ? { id: old.id, ...merged } : merged
    })
  }
  if (next && typeof next === 'object' && base && typeof base === 'object') {
    return Object.fromEntries(
      Object.entries(next).map(([k, v]) => [k, withIds(v, (base as Record<string, unknown>)[k])]),
    )
  }
  return next
}

async function findOne(payload: Payload, collection: any, where: any) {
  const res = await payload.find({ collection, where, limit: 1, depth: 0, locale: 'hr', pagination: false })
  return res.docs[0] as any
}

/** Create a document in hr, then write the en values of the localized fields. */
async function upsert(
  payload: Payload,
  collection: any,
  where: any,
  dataHr: Record<string, unknown>,
  dataEn?: Record<string, unknown>,
) {
  const existing = await findOne(payload, collection, where)
  if (existing) return { doc: existing, created: false }
  const doc = (await payload.create({ collection, data: dataHr as any, locale: 'hr', overrideAccess: true })) as any
  if (dataEn) {
    await payload.update({ collection, id: doc.id, data: withIds(dataEn, doc) as any, locale: 'en', overrideAccess: true })
  }
  return { doc, created: true }
}

async function upsertMedia(payload: Payload, file: string, altHr: string, altEn: string) {
  const filename = path.basename(file)
  const existing = await findOne(payload, 'media', { filename: { equals: filename } })
  if (existing) return existing
  const data = fs.readFileSync(file)
  const mimetype = filename.endsWith('.png') ? 'image/png' : 'image/jpeg'
  const doc = (await payload.create({
    collection: 'media',
    data: { alt: altHr },
    file: { data, mimetype, name: filename, size: data.length },
    locale: 'hr',
    overrideAccess: true,
  })) as any
  await payload.update({ collection: 'media', id: doc.id, data: { alt: altEn }, locale: 'en', overrideAccess: true })
  return doc
}

async function seedGlobal(payload: Payload, slug: any, perLocale: (l: Locale) => Record<string, unknown>) {
  const base = await payload.updateGlobal({ slug, data: perLocale('hr') as any, locale: 'hr', overrideAccess: true })
  await payload.updateGlobal({ slug, data: withIds(perLocale('en'), base) as any, locale: 'en', overrideAccess: true })
  log(`global ${slug}`)
}

async function main() {
  const payload = await getPayload({ config })

  // 0. Schema. Same migration set as production.
  await payload.db.migrate()

  // 1. Admin user.
  const cfEnv = (key: string) => process.env[key] ?? readDevVar(key)
  const email = cfEnv('SEED_ADMIN_EMAIL')
  const password = cfEnv('SEED_ADMIN_PASSWORD')
  if (!email || !password) throw new Error('Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD in .dev.vars')
  const user = await upsert(payload, 'users', { email: { equals: email } }, { email, password, name: 'Admin', role: 'admin' })
  log(`user ${email} ${user.created ? 'created' : 'exists'}`)

  // 2. Media and partners.
  let partnerCount = 0
  const tiers = ['university', 'main', 'partner', 'supporter'] as const
  const plain = new Set(['p11m', 'p12m', 'p19m', 'p22', 'p24b', 'p29w', 'p41m', 'p42m', 'p53', 'p54e', 'p56'])
  for (const [i, p] of partnersData.entries()) {
    const logo = await upsertMedia(
      payload,
      path.join(assets, 'partners', `${p.key}.png`),
      `Logo: ${p.name}`,
      `Logo: ${p.name}`,
    )
    const r = await upsert(payload, 'partners', { name: { equals: p.name } }, {
      name: p.name,
      logo: logo.id,
      url: p.domain,
      tier: tiers[p.tier - 1],
      order: i,
      logoRatio: p.ratio,
      plainLogo: plain.has(p.key),
      active: true,
    })
    if (r.created) partnerCount++
  }
  log(`partners: ${partnerCount} created, ${partnersData.length} total`)

  // 3. Teams (the five site teams).
  const teamDocs: Record<string, any> = {}
  for (const [i, t] of hr.teams.entries()) {
    const te = en.teams[i]
    const r = await upsert(payload, 'teams', { code: { equals: t.code } },
      { name: t.name, code: t.code, program: 'both', description: t.d, tags: t.tags.map((tag) => ({ tag })), order: i },
      { name: te.name, description: te.d, tags: te.tags.map((tag) => ({ tag })) })
    teamDocs[t.code] = r.doc
  }
  log('teams')

  // 4. Members. Sample data: replace it in the admin.
  const sampleMembers = [
    { name: 'Primjer člana 1', team: 'MEH', hr: 'Voditelj tima', en: 'Team lead', year: 2024 },
    { name: 'Primjer člana 2', team: 'E&S', hr: 'Inženjer elektronike', en: 'Electronics engineer', year: 2024 },
    { name: 'Primjer člana 3', team: 'AER', hr: 'Aerodinamičar', en: 'Aerodynamicist', year: 2025 },
    { name: 'Primjer člana 4', team: 'KAR', hr: 'Laminator', en: 'Laminator', year: 2025 },
    { name: 'Primjer člana 5', team: 'M&B', hr: 'Voditelj partnerstava', en: 'Partnerships lead', year: 2025 },
  ]
  for (const [i, m] of sampleMembers.entries()) {
    await upsert(payload, 'members', { name: { equals: m.name } },
      { name: m.name, role: m.hr, team: teamDocs[m.team].id, program: 'formula-student', year: m.year, order: i, active: true },
      { role: m.en })
  }
  log('members (sample)')

  // 5. Vehicles and competitions.
  const imgCar = await upsertMedia(payload, path.join(assets, 'img', 'foto-bolida.jpg'), hr.vehicles[0].img, en.vehicles[0].img)
  const imgBike = await upsertMedia(payload, path.join(assets, 'img', 'foto-motora.jpg'), hr.vehicles[1].img, en.vehicles[1].img)
  const imgHero = await upsertMedia(payload, path.join(assets, 'img', 'hero-car.jpg'), 'Bolid FESB Racing', 'FESB Racing car')
  const media = [imgCar, imgBike]
  const specs = (l: Locale, sys: string[]) => sys.map((value) => ({ key: l === 'hr' ? 'Sustav' : 'System', value }))
  for (const [i, v] of hr.vehicles.entries()) {
    const ve = en.vehicles[i]
    await upsert(payload, 'vehicles', { slug: { equals: v.id } },
      {
        name: v.name,
        slug: v.id,
        kind: v.id === 'fs' ? 'car' : 'bike',
        description: v.d,
        cover: media[i].id,
        specs: specs('hr', v.sys),
        gallery: [{ image: media[i].id, caption: v.img }],
        results: '',
        link: '',
      },
      { name: ve.name, description: ve.d, specs: specs('en', ve.sys), gallery: [{ image: media[i].id, caption: ve.img }] })
  }
  for (const [i, c] of hr.comps.entries()) {
    const ce = en.comps[i]
    await upsert(payload, 'competitions', { name: { equals: c.name } },
      {
        name: c.name,
        country: c.cc,
        place: c.place,
        type: c.type,
        circuit: c.sub,
        venue: c.venue,
        map: { lat: c.c[0], lng: c.c[1], spanLat: c.z[0], spanLng: c.z[1] },
        order: i,
        specs: [],
        results: '',
        link: '',
      },
      { place: ce.place, venue: ce.venue })
  }
  log('vehicles, competitions')

  // 6. News. Read from the existing site database (3 sample rows) and write the same values.
  const news = [
    {
      slug: 'nova-sasija-izlazi-iz-kalupa', date: '2026-09-12', cover: imgHero,
      hr: { title: 'Nova šasija izlazi iz kalupa', tag: 'Radionica', excerpt: 'Nakon tri tjedna laminiranja prva monokok šasija za sezonu 2027 izašla je iz kalupa.', body: '<p>Nakon tri tjedna laminiranja prva monokok šasija za sezonu 2027 izašla je iz kalupa.</p><p>Tekst primjera — zamijeni ga u adminu.</p>' },
      en: { title: 'New chassis out of the mould', tag: 'Workshop', excerpt: 'After three weeks of layup, the first monocoque chassis for the 2027 season is out of the mould.', body: '<p>After three weeks of layup, the first monocoque chassis for the 2027 season is out of the mould.</p><p>Sample text — replace it in the admin.</p>' },
    },
    {
      slug: 'povratak-s-europskih-staza', date: '2026-08-20', cover: imgCar,
      hr: { title: 'Povratak s europskih staza', tag: 'Natjecanja', excerpt: 'Ljeto smo proveli na natjecanjima u Hrvatskoj, Italiji i Češkoj.', body: '<p>Ljeto smo proveli na natjecanjima u Hrvatskoj, Italiji i Češkoj.</p>' },
      en: { title: 'Back from the European tracks', tag: 'Competitions', excerpt: 'We spent the summer competing in Croatia, Italy and the Czech Republic.', body: '<p>We spent the summer competing in Croatia, Italy and the Czech Republic.</p>' },
    },
    {
      slug: 'otvorene-prijave-za-nove-clanove', date: '2026-07-01', cover: imgBike,
      hr: { title: 'Otvorene prijave za nove članove', tag: 'Tim', excerpt: 'Tražimo studente strojarstva, elektrotehnike, računarstva i ekonomije.', body: '<p>Tražimo studente strojarstva, elektrotehnike, računarstva i ekonomije.</p>' },
      en: { title: 'Applications open for new members', tag: 'Team', excerpt: 'We are looking for mechanical, electrical, computing and economics students.', body: '<p>We are looking for mechanical, electrical, computing and economics students.</p>' },
    },
  ]
  for (const n of news) {
    await upsert(payload, 'news', { slug: { equals: n.slug } },
      {
        title: n.hr.title, slug: n.slug, publishedAt: new Date(n.date).toISOString(), tags: [n.hr.tag], cover: n.cover.id,
        excerpt: n.hr.excerpt, body: lexical(htmlToParagraphs(n.hr.body)), _status: 'published',
        meta: { title: n.hr.title, description: n.hr.excerpt },
      },
      {
        title: n.en.title, tags: [n.en.tag], excerpt: n.en.excerpt, body: lexical(htmlToParagraphs(n.en.body)),
        meta: { title: n.en.title, description: n.en.excerpt },
      })
  }
  log('news (3 rows, existing site data)')

  // 6b. A feature post. It shows the rich editor: heading, lists, quote, table, inline image and a gallery block.
  const gi = (l: Locale) => [
    { id: 'seedg1', image: imgHero.id, caption: l === 'hr' ? 'Bolid na stazi' : 'The car on track' },
    { id: 'seedg2', image: imgCar.id, caption: l === 'hr' ? 'Formula Student bolid' : 'The Formula Student car' },
    { id: 'seedg3', image: imgBike.id, caption: l === 'hr' ? 'MotoStudent motocikl' : 'The MotoStudent bike' },
  ]
  const featureBody = (l: Locale) =>
    lexDoc(l === 'hr'
      ? [
          lexHeading('h2', 'Što je novo u sezoni 2027'),
          lexPara(lexText('Ovo je primjer objave s '), lexText('podebljanim', 1), lexText(' i '), lexText('kosim', 2), lexText(' tekstom te s '), lexText('kodom', 16), lexText('.')),
          lexList('bullet', [{ text: 'Nova monokok šasija' }, { text: 'Lakši aerodinamički paket' }, { text: 'Novi baterijski sustav' }]),
          lexList('check', [{ text: 'Laminiranje šasije', checked: true }, { text: 'Ispitivanje na stazi', checked: false }]),
          lexElement('quote', [lexText('Svaki gram se računa.')]),
          lexUpload(imgHero.id, { caption: 'Bolid u radionici' }),
          lexHeading('h3', 'Ključni podaci'),
          lexTable([['Sustav', 'Cilj'], ['Masa', '170 kg'], ['Snaga', '80 kW']]),
          { type: 'horizontalrule', version: 1 },
          lexGallery('seedgal', 'Galerija sezone', 'grid', gi(l)),
          lexPara(lexText('Tekst primjera — zamijeni ga u adminu.')),
        ]
      : [
          lexHeading('h2', 'What is new in the 2027 season'),
          lexPara(lexText('This is a sample post with '), lexText('bold', 1), lexText(' and '), lexText('italic', 2), lexText(' text and with '), lexText('code', 16), lexText('.')),
          lexList('bullet', [{ text: 'New monocoque chassis' }, { text: 'Lighter aerodynamic package' }, { text: 'New battery system' }]),
          lexList('check', [{ text: 'Chassis layup', checked: true }, { text: 'Track testing', checked: false }]),
          lexElement('quote', [lexText('Every gram counts.')]),
          lexUpload(imgHero.id, { caption: 'The car in the workshop' }),
          lexHeading('h3', 'Key data'),
          lexTable([['System', 'Target'], ['Mass', '170 kg'], ['Power', '80 kW']]),
          { type: 'horizontalrule', version: 1 },
          lexGallery('seedgal', 'Season gallery', 'grid', gi(l)),
          lexPara(lexText('Sample text — replace it in the admin.')),
        ])
  await upsert(payload, 'news', { slug: { equals: 'sezona-2027-novosti' } },
    {
      title: 'Sezona 2027: sve što je novo', slug: 'sezona-2027-novosti', publishedAt: new Date('2026-09-20').toISOString(),
      tags: ['Tim'], cover: imgHero.id, excerpt: 'Primjer objave s naslovima, popisima, tablicom, slikom i galerijom.',
      body: featureBody('hr'), _status: 'published',
      gallery: [
        { image: imgCar.id, caption: 'Formula Student bolid' },
        { image: imgBike.id, caption: 'MotoStudent motocikl' },
      ],
      meta: { title: 'Sezona 2027: sve što je novo', description: 'Primjer objave s bogatim uređivačem.' },
    },
    {
      title: 'Season 2027: everything new', tags: ['Team'], excerpt: 'A sample post with headings, lists, a table, an image and a gallery.',
      body: featureBody('en'),
      gallery: [
        { image: imgCar.id, caption: 'The Formula Student car' },
        { image: imgBike.id, caption: 'The MotoStudent bike' },
      ],
      meta: { title: 'Season 2027: everything new', description: 'A sample post with the rich editor.' },
    })
  log('news (feature post)')

  // 7. Pages.
  await upsert(payload, 'pages', { slug: { equals: 'home' } },
    {
      title: 'Početna', slug: 'home', _status: 'published',
      meta: { title: hr.metaTitle, description: hr.metaDesc },
      layout: [
        { blockType: 'hero', heading: `${hr.heroA} ${hr.heroB}`, subheading: hr.heroSub, image: imgHero.id, ctaLabel: hr.cta, ctaUrl: '/#kontakt' },
        { blockType: 'text', content: lexical([hr.mission]) },
        { blockType: 'gallery', images: [{ image: imgCar.id, caption: hr.vehicles[0].img }, { image: imgBike.id, caption: hr.vehicles[1].img }] },
        { blockType: 'cta', heading: hr.joinTitle, text: hr.joinText, buttonLabel: hr.cta, buttonUrl: '/#kontakt' },
      ],
    },
    {
      title: 'Home', meta: { title: en.metaTitle, description: en.metaDesc },
      layout: [
        { blockType: 'hero', heading: `${en.heroA} ${en.heroB}`, subheading: en.heroSub, image: imgHero.id, ctaLabel: en.cta, ctaUrl: '/#kontakt' },
        { blockType: 'text', content: lexical([en.mission]) },
        { blockType: 'gallery', images: [{ image: imgCar.id, caption: en.vehicles[0].img }, { image: imgBike.id, caption: en.vehicles[1].img }] },
        { blockType: 'cta', heading: en.joinTitle, text: en.joinText, buttonLabel: en.cta, buttonUrl: '/#kontakt' },
      ],
    })
  log('pages')

  // 8. Globals.
  const ids = ['prica', 'timovi', 'vozila', 'natjecanja', 'sponzori', 'novosti', 'kontakt']
  const c = (l: Locale) => content[l]
  await seedGlobal(payload, 'siteSettings', (l) => ({
    name: 'FESB Racing',
    contact: { email: c(l).mail, address: c(l).addr },
    social: [
      { platform: 'instagram', url: 'https://www.instagram.com/fesbracing' },
      { platform: 'facebook', url: 'https://www.facebook.com/FesbRacing/?locale=hr_HR' },
      { platform: 'linkedin', url: 'https://hr.linkedin.com/company/fesb-racing' },
    ],
  }))
  await seedGlobal(payload, 'stats', (l) => ({ items: c(l).stats.map((s) => ({ value: s.v, label: s.l })) }))
  // The ticker has no strings in content.ts. It uses the list from the design (v3.html).
  const ticker = ['Formula Student Italy', 'Formula Student Czech', 'MotoStudent', 'Rimac FS Alpe Adria', 'Formula Student', 'MotoStudent']
  await seedGlobal(payload, 'ticker', () => ({ items: ticker.map((text) => ({ text })) }))
  await seedGlobal(payload, 'footer', (l) => ({
    copyright: c(l).foot,
    teamHeading: c(l).footTeam,
    programHeading: c(l).footProgram,
    followHeading: c(l).footFollow,
    links: c(l).nav.map((label, i) => ({ label, url: `/#${ids[i]}` })),
  }))
  await seedGlobal(payload, 'joinCta', (l) => ({ title: c(l).joinTitle, text: c(l).joinText, buttonLabel: c(l).cta }))

  // 9. Forms and one sample submission.
  const fieldText = (name: string, label: string, required = true) => ({ blockType: 'text', name, label, required, width: 100 })
  const joinForm = await upsert(payload, 'forms', { title: { equals: 'Prijava za člana' } }, {
    title: 'Prijava za člana',
    submitButtonLabel: hr.fSend,
    confirmationType: 'message',
    confirmationMessage: lexical([hr.fSent]),
    fields: [
      fieldText('name', hr.fName),
      { blockType: 'email', name: 'email', label: hr.fMail, required: true, width: 100 },
      fieldText('study', hr.fStudy),
      fieldText('team', hr.fTeam, false),
    ],
  })
  await upsert(payload, 'forms', { title: { equals: 'Upit za sponzora' } }, {
    title: 'Upit za sponzora',
    submitButtonLabel: hr.fSendCompany,
    confirmationType: 'message',
    confirmationMessage: lexical([hr.fSentCompany]),
    fields: [
      fieldText('company', hr.fCompany),
      fieldText('contact', hr.fContact),
      { blockType: 'email', name: 'email', label: hr.fMail, required: true, width: 100 },
      { blockType: 'textarea', name: 'message', label: hr.fMessage, required: true, width: 100 },
    ],
  })
  const sub = await payload.find({ collection: 'form-submissions', limit: 1, depth: 0, overrideAccess: true })
  if (sub.totalDocs === 0) {
    await payload.create({
      collection: 'form-submissions',
      overrideAccess: true,
      data: {
        form: joinForm.doc.id,
        submissionData: [
          { field: 'name', value: 'Primjer prijave' },
          { field: 'email', value: 'primjer@example.com' },
          { field: 'study', value: 'Strojarstvo, 2. godina' },
        ],
      },
    })
  }
  log('forms, submission')

  // 10. Redirect.
  const redirects = await payload.find({ collection: 'redirects', limit: 1, depth: 0, overrideAccess: true })
  if (redirects.totalDocs === 0) {
    await payload.create({
      collection: 'redirects',
      overrideAccess: true,
      data: { from: '/vijesti', to: { type: 'custom', url: '/hr/novosti' } },
    })
  }
  log('redirects')
  log('done')
}

/** The Payload CLI does not load .dev.vars into process.env. Read the file as a fallback. */
function readDevVar(key: string): string | undefined {
  const file = path.resolve(here, '..', '.dev.vars')
  if (!fs.existsSync(file)) return undefined
  const line = fs.readFileSync(file, 'utf8').split('\n').find((l) => l.startsWith(`${key}=`))
  return line?.slice(key.length + 1).trim()
}

// Top-level await keeps "payload run" alive until the seed ends.
try {
  await main()
  process.exit(0)
} catch (err) {
  console.error(err)
  process.exit(1)
}
