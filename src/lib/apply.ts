import { createServerFn } from '@tanstack/react-start'

export type StudentApplication = {
  kind: 'student'
  name: string
  email: string
  study: string
  team: string
  lang: 'hr' | 'en'
}

export type CompanyInquiry = {
  kind: 'company'
  company: string
  name: string
  email: string
  message: string
  lang: 'hr' | 'en'
}

export type Application = StudentApplication | CompanyInquiry

export type Field = 'name' | 'email' | 'study' | 'company' | 'message'
export type FieldErrors = Partial<Record<Field, true>>

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export function validateApplication(d: Application): FieldErrors {
  const e: FieldErrors = {}
  if (d.kind === 'company' && !d.company.trim()) e.company = true
  if (!d.name.trim()) e.name = true
  if (!EMAIL_RE.test(d.email.trim())) e.email = true
  if (d.kind === 'student' && !d.study.trim()) e.study = true
  if (d.kind === 'company' && !d.message.trim()) e.message = true
  return e
}

const str = (v: unknown, max: number) => String(v ?? '').slice(0, max)

/**
 * Prijava studenta ili upit tvrtke. Validacija se ponavlja na serveru.
 * Ako je postavljen APPLY_WEBHOOK_URL (npr. Formspree endpoint ili vlastiti API),
 * poruka se prosljeđuje kao JSON s poljem `kind`; inače se samo zapisuje u log servera.
 */
export const submitApplication = createServerFn({ method: 'POST' })
  .validator((raw: unknown): Application => {
    const d = (raw ?? {}) as Record<string, unknown>
    const lang = d.lang === 'en' ? 'en' : 'hr'
    const app: Application =
      d.kind === 'company'
        ? { kind: 'company', company: str(d.company, 200), name: str(d.name, 200), email: str(d.email, 200), message: str(d.message, 5000), lang }
        : { kind: 'student', name: str(d.name, 200), email: str(d.email, 200), study: str(d.study, 200), team: str(d.team, 20), lang }
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
      console.info(data.kind === 'company' ? '[upit tvrtke]' : '[prijava]', new Date().toISOString(), data)
    }
    return { ok: true as const }
  })
