import type { Lang } from '~/content'

/** A news post from the CMS. The server fills both language columns with the value of the requested locale. */
export type News = {
  id: number | string
  slug: string
  date: string
  imageUrl: string | null
  titleHr: string
  titleEn: string
  tagHr: string
  tagEn: string
  excerptHr: string
  excerptEn: string
  bodyHr: string
  bodyEn: string
  /** HTML of the post gallery. It is empty when the post has no gallery. */
  galleryHr: string
  galleryEn: string
}
export type NewsCard = Omit<News, 'bodyHr' | 'bodyEn' | 'galleryHr' | 'galleryEn'>

/** EN polje ako je popunjeno, inače HR (prijevod još nije upisan ni generiran). */
export function pick(row: object, field: string, lang: Lang): string {
  const r = row as Record<string, unknown>
  const hr = String(r[`${field}Hr`] ?? '')
  return lang === 'en' ? String(r[`${field}En`] ?? '') || hr : hr
}

export function formatDate(iso: string) {
  const [y, m, d] = iso.split('-')
  return `${d} / ${m} / ${y}`
}
