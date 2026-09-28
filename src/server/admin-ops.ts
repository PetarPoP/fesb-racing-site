import { eq } from 'drizzle-orm'
import { getDb, schema } from './db'
import { cleanHtml, cleanText, slugify } from './html'
import { canTranslate, translateHrToEn } from './translate'

const { news, sponsors } = schema

export type NewsInput = {
  id?: number
  date: string
  imageUrl: string
  titleHr: string
  titleEn: string
  tagHr: string
  tagEn: string
  excerptHr: string
  excerptEn: string
  bodyHr: string
  bodyEn: string
}

export type SponsorInput = {
  id?: number
  name: string
  website: string
  logoUrl: string
  sortOrder: number
  summaryHr: string
  summaryEn: string
  bodyHr: string
  bodyEn: string
}

export type SaveResult = { id: number; slug: string; translateError?: string }

const isoDate = (v: unknown) => {
  const s = String(v ?? '')
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : new Date().toISOString().slice(0, 10)
}

const imageUrl = (v: unknown) => {
  const s = cleanText(v, 1000)
  return /^(https:\/\/|\/uploads\/)/.test(s) ? s : ''
}

const websiteUrl = (v: unknown) => {
  const s = cleanText(v, 500)
  if (!s) return ''
  try {
    return new URL(/^https?:\/\//i.test(s) ? s : `https://${s}`).href
  } catch {
    return ''
  }
}

const html = (v: unknown) => cleanHtml(String(v ?? '').slice(0, 200_000))
const id = (v: unknown) => (typeof v === 'number' && Number.isInteger(v) ? v : undefined)

export function parseNews(raw: unknown): NewsInput {
  const d = (raw ?? {}) as Record<string, unknown>
  const v: NewsInput = {
    id: id(d.id),
    date: isoDate(d.date),
    imageUrl: imageUrl(d.imageUrl),
    titleHr: cleanText(d.titleHr, 200),
    titleEn: cleanText(d.titleEn, 200),
    tagHr: cleanText(d.tagHr, 40),
    tagEn: cleanText(d.tagEn, 40),
    excerptHr: cleanText(d.excerptHr, 600),
    excerptEn: cleanText(d.excerptEn, 600),
    bodyHr: html(d.bodyHr),
    bodyEn: html(d.bodyEn),
  }
  if (!v.titleHr) throw new Error('Naslov (HR) je obavezan.')
  return v
}

export function parseSponsor(raw: unknown): SponsorInput {
  const d = (raw ?? {}) as Record<string, unknown>
  const v: SponsorInput = {
    id: id(d.id),
    name: cleanText(d.name, 120),
    website: websiteUrl(d.website),
    logoUrl: imageUrl(d.logoUrl),
    sortOrder: Math.trunc(Number(d.sortOrder) || 0),
    summaryHr: cleanText(d.summaryHr, 600),
    summaryEn: cleanText(d.summaryEn, 600),
    bodyHr: html(d.bodyHr),
    bodyEn: html(d.bodyEn),
  }
  if (!v.name) throw new Error('Naziv sponzora je obavezan.')
  return v
}

type Pair = { hr: string; en: string; html?: boolean }

/** Popuni prazna EN polja prijevodom; ako prijevod ne uspije, EN ostaje prazan i stranica prikazuje HR. */
async function fillEnglish(pairs: Pair[]): Promise<string | undefined> {
  const missing = pairs.filter((p) => !p.en && p.hr)
  if (!missing.length || !canTranslate()) return undefined
  try {
    const text = missing.filter((p) => !p.html)
    const rich = missing.filter((p) => p.html)
    const [t, h] = await Promise.all([
      translateHrToEn(text.map((p) => p.hr), 'text'),
      translateHrToEn(rich.map((p) => p.hr), 'html'),
    ])
    text.forEach((p, i) => (p.en = t[i]))
    rich.forEach((p, i) => (p.en = cleanHtml(h[i])))
    return undefined
  } catch (e) {
    return e instanceof Error ? e.message : String(e)
  }
}

async function uniqueSlug(table: typeof news | typeof sponsors, base: string) {
  const db = await getDb()
  for (let i = 1; ; i++) {
    const slug = i === 1 ? base : `${base}-${i}`
    const [hit] = await db.select({ id: table.id }).from(table).where(eq(table.slug, slug)).limit(1)
    if (!hit) return slug
  }
}

export async function upsertNews(data: NewsInput): Promise<SaveResult> {
  const title: Pair = { hr: data.titleHr, en: data.titleEn }
  const tag: Pair = { hr: data.tagHr, en: data.tagEn }
  const excerpt: Pair = { hr: data.excerptHr, en: data.excerptEn }
  const body: Pair = { hr: data.bodyHr, en: data.bodyEn, html: true }
  const translateError = await fillEnglish([title, tag, excerpt, body])
  const row = {
    date: data.date,
    imageUrl: data.imageUrl || null,
    titleHr: title.hr,
    titleEn: title.en,
    tagHr: tag.hr,
    tagEn: tag.en,
    excerptHr: excerpt.hr,
    excerptEn: excerpt.en,
    bodyHr: body.hr,
    bodyEn: body.en,
  }
  const db = await getDb()
  const ret = { id: news.id, slug: news.slug }
  if (data.id) {
    const [r] = await db.update(news).set(row).where(eq(news.id, data.id)).returning(ret)
    if (!r) throw new Error('Novost ne postoji.')
    return { ...r, translateError }
  }
  // Slug se određuje samo pri stvaranju, da podijeljeni linkovi ne puknu kad se naslov promijeni.
  const slug = await uniqueSlug(news, slugify(data.titleHr))
  const [r] = await db.insert(news).values({ ...row, slug }).returning(ret)
  return { ...r, translateError }
}

export async function upsertSponsor(data: SponsorInput): Promise<SaveResult> {
  const summary: Pair = { hr: data.summaryHr, en: data.summaryEn }
  const body: Pair = { hr: data.bodyHr, en: data.bodyEn, html: true }
  const translateError = await fillEnglish([summary, body])
  const row = {
    name: data.name,
    website: data.website,
    logoUrl: data.logoUrl || null,
    sortOrder: data.sortOrder,
    summaryHr: summary.hr,
    summaryEn: summary.en,
    bodyHr: body.hr,
    bodyEn: body.en,
  }
  const db = await getDb()
  const ret = { id: sponsors.id, slug: sponsors.slug }
  if (data.id) {
    const [r] = await db.update(sponsors).set(row).where(eq(sponsors.id, data.id)).returning(ret)
    if (!r) throw new Error('Sponzor ne postoji.')
    return { ...r, translateError }
  }
  const slug = await uniqueSlug(sponsors, slugify(data.name))
  const [r] = await db.insert(sponsors).values({ ...row, slug }).returning(ret)
  return { ...r, translateError }
}

export async function removeNews(newsId: number) {
  const db = await getDb()
  await db.delete(news).where(eq(news.id, newsId))
}

export async function removeSponsor(sponsorId: number) {
  const db = await getDb()
  await db.delete(sponsors).where(eq(sponsors.id, sponsorId))
}

export function translatePayload(raw: unknown) {
  const d = (raw ?? {}) as { text?: unknown; html?: unknown }
  const arr = (v: unknown) => (Array.isArray(v) ? v.slice(0, 10).map((x) => String(x ?? '').slice(0, 50_000)) : [])
  return { text: arr(d.text), html: arr(d.html) }
}

export async function translateBoth(data: { text: string[]; html: string[] }) {
  const [text, rich] = await Promise.all([translateHrToEn(data.text, 'text'), translateHrToEn(data.html, 'html')])
  return { text, html: rich.map(cleanHtml) }
}
