import type { Lang } from '~/content'
import type { News, Sponsor } from '~/server/schema'

export type { News, Sponsor }
export type NewsCard = Omit<News, 'bodyHr' | 'bodyEn' | 'createdAt'>
export type SponsorCard = Omit<Sponsor, 'bodyHr' | 'bodyEn' | 'createdAt'>

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
