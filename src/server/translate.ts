const ENDPOINT = 'https://translation.googleapis.com/language/translate/v2'

export const canTranslate = () => Boolean(process.env.GOOGLE_TRANSLATE_API_KEY)

/** Google Cloud Translation v2, HR → EN. Prazni ulazi ostaju prazni i ne šalju se. */
export async function translateHrToEn(texts: string[], format: 'text' | 'html'): Promise<string[]> {
  const key = process.env.GOOGLE_TRANSLATE_API_KEY
  if (!key) throw new Error('GOOGLE_TRANSLATE_API_KEY nije postavljen na serveru.')
  const idx = texts.flatMap((t, i) => (t.trim() ? [i] : []))
  const out = texts.map(() => '')
  if (!idx.length) return out
  const res = await fetch(`${ENDPOINT}?key=${encodeURIComponent(key)}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ q: idx.map((i) => texts[i]), source: 'hr', target: 'en', format }),
  })
  if (!res.ok) throw new Error(`Google Translate: ${res.status} ${(await res.text()).slice(0, 200)}`)
  const json = (await res.json()) as { data: { translations: { translatedText: string }[] } }
  json.data.translations.forEach((t, j) => (out[idx[j]] = t.translatedText))
  return out
}
