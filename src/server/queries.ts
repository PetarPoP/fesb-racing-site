import { asc, desc, eq } from 'drizzle-orm'
import type { NewsCard, SponsorCard } from '~/lib/format'
import { getDb, schema } from './db'

const { news, sponsors } = schema

const newsCardCols = {
  id: news.id,
  slug: news.slug,
  date: news.date,
  imageUrl: news.imageUrl,
  titleHr: news.titleHr,
  titleEn: news.titleEn,
  tagHr: news.tagHr,
  tagEn: news.tagEn,
  excerptHr: news.excerptHr,
  excerptEn: news.excerptEn,
}

const sponsorCardCols = {
  id: sponsors.id,
  slug: sponsors.slug,
  name: sponsors.name,
  website: sponsors.website,
  logoUrl: sponsors.logoUrl,
  sortOrder: sponsors.sortOrder,
  summaryHr: sponsors.summaryHr,
  summaryEn: sponsors.summaryEn,
}

const newsOrder = [desc(news.date), desc(news.id)]
const sponsorOrder = [asc(sponsors.sortOrder), asc(sponsors.name)]

export async function listNewsCards(limit?: number): Promise<NewsCard[]> {
  const db = await getDb()
  const q = db.select(newsCardCols).from(news).orderBy(...newsOrder)
  return limit ? q.limit(limit) : q
}

export async function listSponsorCards(): Promise<SponsorCard[]> {
  const db = await getDb()
  return db.select(sponsorCardCols).from(sponsors).orderBy(...sponsorOrder)
}

export async function findNews(slug: string) {
  const db = await getDb()
  const [row] = await db.select().from(news).where(eq(news.slug, slug)).limit(1)
  return row ?? null
}

export async function findSponsor(slug: string) {
  const db = await getDb()
  const [row] = await db.select().from(sponsors).where(eq(sponsors.slug, slug)).limit(1)
  return row ?? null
}

export async function listAllForAdmin() {
  const db = await getDb()
  const [n, s] = await Promise.all([
    db.select().from(news).orderBy(...newsOrder),
    db.select().from(sponsors).orderBy(...sponsorOrder),
  ])
  return { news: n, sponsors: s }
}
