import { sql } from 'drizzle-orm'
import type { PgliteDatabase } from 'drizzle-orm/pglite'
import * as schema from './schema'

type Db = PgliteDatabase<typeof schema>

// CREATE IF NOT EXISTS umjesto migracija: dvije tablice, isti SQL za Neon i PGlite.
const DDL = [
  `CREATE TABLE IF NOT EXISTS news (
    id serial PRIMARY KEY,
    slug text NOT NULL UNIQUE,
    date date NOT NULL,
    image_url text,
    title_hr text NOT NULL,
    title_en text NOT NULL DEFAULT '',
    tag_hr text NOT NULL DEFAULT '',
    tag_en text NOT NULL DEFAULT '',
    excerpt_hr text NOT NULL DEFAULT '',
    excerpt_en text NOT NULL DEFAULT '',
    body_hr text NOT NULL DEFAULT '',
    body_en text NOT NULL DEFAULT '',
    created_at timestamp NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS sponsors (
    id serial PRIMARY KEY,
    slug text NOT NULL UNIQUE,
    name text NOT NULL,
    website text NOT NULL DEFAULT '',
    logo_url text,
    sort_order integer NOT NULL DEFAULT 0,
    summary_hr text NOT NULL DEFAULT '',
    summary_en text NOT NULL DEFAULT '',
    body_hr text NOT NULL DEFAULT '',
    body_en text NOT NULL DEFAULT '',
    created_at timestamp NOT NULL DEFAULT now()
  )`,
]

const SEED_NEWS: (typeof schema.news.$inferInsert)[] = [
  {
    slug: 'nova-sasija-izlazi-iz-kalupa',
    date: '2026-09-12',
    titleHr: 'Nova šasija izlazi iz kalupa',
    titleEn: 'New chassis out of the mould',
    tagHr: 'Radionica',
    tagEn: 'Workshop',
    excerptHr: 'Nakon tri tjedna laminiranja prva monokok šasija za sezonu 2027 izašla je iz kalupa.',
    excerptEn: 'After three weeks of layup, the first monocoque chassis for the 2027 season is out of the mould.',
    bodyHr: '<p>Nakon tri tjedna laminiranja prva monokok šasija za sezonu 2027 izašla je iz kalupa.</p><p>Tekst primjera — zamijeni ga u adminu.</p>',
    bodyEn: '<p>After three weeks of layup, the first monocoque chassis for the 2027 season is out of the mould.</p><p>Sample text — replace it in the admin.</p>',
  },
  {
    slug: 'povratak-s-europskih-staza',
    date: '2026-08-20',
    titleHr: 'Povratak s europskih staza',
    titleEn: 'Back from the European tracks',
    tagHr: 'Natjecanja',
    tagEn: 'Competitions',
    excerptHr: 'Ljeto smo proveli na natjecanjima u Hrvatskoj, Italiji i Češkoj.',
    excerptEn: 'We spent the summer competing in Croatia, Italy and the Czech Republic.',
    bodyHr: '<p>Ljeto smo proveli na natjecanjima u Hrvatskoj, Italiji i Češkoj.</p>',
    bodyEn: '<p>We spent the summer competing in Croatia, Italy and the Czech Republic.</p>',
  },
  {
    slug: 'otvorene-prijave-za-nove-clanove',
    date: '2026-07-01',
    titleHr: 'Otvorene prijave za nove članove',
    titleEn: 'Applications open for new members',
    tagHr: 'Tim',
    tagEn: 'Team',
    excerptHr: 'Tražimo studente strojarstva, elektrotehnike, računarstva i ekonomije.',
    excerptEn: 'We are looking for mechanical, electrical, computing and economics students.',
    bodyHr: '<p>Tražimo studente strojarstva, elektrotehnike, računarstva i ekonomije.</p>',
    bodyEn: '<p>We are looking for mechanical, electrical, computing and economics students.</p>',
  },
]

async function connect(): Promise<Db> {
  const url = process.env.DATABASE_URL
  if (url) {
    const { neon } = await import('@neondatabase/serverless')
    const { drizzle } = await import('drizzle-orm/neon-http')
    const db = drizzle(neon(url), { schema }) as unknown as Db
    for (const q of DDL) await db.execute(sql.raw(q))
    return db
  }
  // Lokalno bez Neona: ugrađeni Postgres u .data/pglite, s primjerima novosti.
  const { PGlite } = await import('@electric-sql/pglite')
  const { drizzle } = await import('drizzle-orm/pglite')
  const { mkdir } = await import('node:fs/promises')
  await mkdir('.data', { recursive: true })
  const db = drizzle(new PGlite('.data/pglite'), { schema })
  for (const q of DDL) await db.execute(sql.raw(q))
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(schema.news)
  if (n === 0) await db.insert(schema.news).values(SEED_NEWS)
  return db
}

// Na globalThis da HMR u razvoju ne otvara PGlite dvaput nad istom mapom.
const g = globalThis as { __fesbDb?: Promise<Db> }

export function getDb() {
  g.__fesbDb ??= connect().catch((e) => {
    g.__fesbDb = undefined
    throw e
  })
  return g.__fesbDb
}

export { schema }
