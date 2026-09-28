import { createServerFn } from '@tanstack/react-start'

export type Application = {
  name: string
  email: string
  study: string
  team: string
  lang: 'hr' | 'en'
}

export type FieldErrors = Partial<Record<'name' | 'email' | 'study', true>>

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export function validateApplication(d: Application): FieldErrors {
  const e: FieldErrors = {}
  if (!d.name.trim()) e.name = true
  if (!EMAIL_RE.test(d.email.trim())) e.email = true
  if (!d.study.trim()) e.study = true
  return e
}

/**
 * Prijava novog člana. Validacija se ponavlja na serveru.
 * Ako je postavljen APPLY_WEBHOOK_URL (npr. Formspree endpoint ili vlastiti API),
 * prijava se prosljeđuje kao JSON; inače se samo zapisuje u log servera.
 */
export const submitApplication = createServerFn({ method: 'POST' })
  .validator((raw: unknown): Application => {
    const d = (raw ?? {}) as Record<string, unknown>
    const app: Application = {
      name: String(d.name ?? '').slice(0, 200),
      email: String(d.email ?? '').slice(0, 200),
      study: String(d.study ?? '').slice(0, 200),
      team: String(d.team ?? '').slice(0, 20),
      lang: d.lang === 'en' ? 'en' : 'hr',
    }
    if (Object.keys(validateApplication(app)).length) throw new Error('invalid')
    return app
  })
  .handler(async ({ data }) => {
    const url = process.env.APPLY_WEBHOOK_URL
    if (url) {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error(`webhook ${res.status}`)
    } else {
      console.info('[prijava]', new Date().toISOString(), data)
    }
    return { ok: true as const }
  })
