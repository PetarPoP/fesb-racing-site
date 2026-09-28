import { useState, type FormEvent } from 'react'
import { ArrowRight, ChevronRight } from 'lucide-react'
import type { Content, Lang } from '~/content'
import { submitApplication, validateApplication, type Application, type Field, type FieldErrors } from '~/lib/apply'
import { Corners, cx, tw } from './ui'

type Status = 'idle' | 'sending' | 'sent' | 'error'
type Mode = 'student' | 'company'
type FieldDef = { name: Field; label: string; type: string; auto: string; err: string; multiline?: boolean }

export function Join({ c, lang }: { c: Content; lang: Lang }) {
  const [mode, setMode] = useState<Mode>('student')
  const [pick, setPick] = useState(0)
  const [status, setStatus] = useState<Status>('idle')
  const [errors, setErrors] = useState<FieldErrors>({})
  const company = mode === 'company'

  function switchMode(m: Mode) {
    setMode(m)
    setErrors({})
    setStatus('idle')
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const fd = new FormData(form)
    const get = (k: Field) => String(fd.get(k) ?? '')
    const data: Application = company
      ? { kind: 'company', company: get('company'), name: get('name'), email: get('email'), message: get('message'), lang }
      : { kind: 'student', name: get('name'), email: get('email'), study: get('study'), team: c.teams[pick].code, lang }
    const errs = validateApplication(data)
    setErrors(errs)
    const first = fields.find((f) => errs[f.name])
    if (first) {
      form.querySelector<HTMLElement>(`[name="${first.name}"]`)?.focus()
      return
    }
    setStatus('sending')
    try {
      await submitApplication({ data })
      setStatus('sent')
    } catch {
      setStatus('error')
    }
  }

  // Ključevi polja su imena, pa ime i e-mail ostaju upisani pri promjeni prekidača.
  const fields: FieldDef[] = company
    ? [
        { name: 'company', label: c.fCompany, type: 'text', auto: 'organization', err: c.errCompany },
        { name: 'name', label: c.fContact, type: 'text', auto: 'name', err: c.errName },
        { name: 'email', label: c.fMail, type: 'email', auto: 'email', err: c.errMail },
        { name: 'message', label: c.fMessage, type: 'text', auto: 'off', err: c.errMessage, multiline: true },
      ]
    : [
        { name: 'name', label: c.fName, type: 'text', auto: 'name', err: c.errName },
        { name: 'email', label: c.fMail, type: 'email', auto: 'email', err: c.errMail },
        { name: 'study', label: c.fStudy, type: 'text', auto: 'off', err: c.errStudy },
      ]

  const clearError = (name: Field) => errors[name] && setErrors((e) => ({ ...e, [name]: undefined }))
  const fieldProps = (f: FieldDef) => ({
    name: f.name,
    autoComplete: f.auto,
    'aria-invalid': errors[f.name] ? true : undefined,
    'aria-describedby': errors[f.name] ? `err-${f.name}` : undefined,
    onChange: () => clearError(f.name),
  })

  return (
    <section
      id="pridruzi-se"
      className="wrap grid scroll-mt-16 gap-10 py-14 md:grid-cols-[minmax(0,1fr)_minmax(0,500px)] md:gap-14 md:py-24"
    >
      <div className="flex flex-col gap-5">
        <h2 className="m-0 font-display text-[52px] leading-[.88] font-extrabold text-balance uppercase md:text-[clamp(56px,6.9vw,88px)]">
          {company ? c.companyTitle : c.joinTitle}
        </h2>
        <p className="m-0 max-w-[460px] text-[17px] leading-[1.6] text-mute">{company ? c.companyText : c.joinText}</p>
      </div>

      <div className={cx(tw.card, 'self-start font-mono text-sm')}>
        <Corners />
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
          <span className="text-[11px] text-mute">{company ? c.companyPath : c.formPath}</span>
          <div role="radiogroup" aria-label={c.modeLabel} className="flex border border-line text-xs uppercase">
            {(
              [
                ['student', c.modeStudent],
                ['company', c.modeCompany],
              ] as const
            ).map(([m, label]) => (
              <button
                key={m}
                type="button"
                role="radio"
                aria-checked={mode === m}
                onClick={() => switchMode(m)}
                className={cx(
                  'min-h-11 cursor-pointer px-3 py-1.5 tracking-[.06em] transition-colors md:min-h-0',
                  mode === m ? 'bg-fg text-bg' : 'text-fg hover:text-acc',
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {status === 'sent' ? (
          <div role="status" className="flex flex-col gap-2.5 px-4 py-6 leading-[1.6]">
            <span className="text-acc">[OK] 200</span>
            <span>{company ? c.fSentCompany : c.fSent}</span>
          </div>
        ) : (
          <form onSubmit={onSubmit} noValidate className="flex flex-col gap-1 p-4">
            {fields.map((f) => (
              <div key={f.name}>
                <label
                  className={cx(
                    'flex gap-2.5 border-b border-dashed py-2.5 focus-within:border-acc',
                    f.multiline ? 'flex-col' : 'items-center',
                    errors[f.name] ? 'border-acc' : 'border-line',
                  )}
                >
                  <span className="flex items-center gap-2.5">
                    <ChevronRight size={14} aria-hidden="true" className="shrink-0 text-acc" />
                    <span className="w-[110px] shrink-0 text-mute md:w-[150px]">{f.label}</span>
                  </span>
                  {f.multiline ? (
                    <textarea
                      {...fieldProps(f)}
                      rows={4}
                      className="min-h-24 w-full resize-y border-0 bg-transparent pl-6 text-fg caret-acc outline-none"
                    />
                  ) : (
                    <input
                      {...fieldProps(f)}
                      type={f.type}
                      className="min-h-7 min-w-0 flex-1 border-0 bg-transparent text-fg caret-acc outline-none"
                    />
                  )}
                </label>
                {errors[f.name] && (
                  <div id={`err-${f.name}`} className="pt-1.5 text-xs text-acc">
                    [ERR] {f.err}
                  </div>
                )}
              </div>
            ))}

            {!company && (
              <>
                <div id="pick-label" className="pt-3.5 pb-1.5 text-mute">
                  {c.fTeam}
                </div>
                <div role="radiogroup" aria-labelledby="pick-label" className="flex flex-wrap gap-1.5">
                  {c.teams.map((t, i) => (
                    <button
                      key={t.code}
                      type="button"
                      role="radio"
                      aria-checked={pick === i}
                      title={t.name}
                      onClick={() => setPick(i)}
                      className={cx(
                        'min-h-11 cursor-pointer border border-line px-2.5 py-[7px] text-xs transition-colors md:min-h-0',
                        pick === i ? 'bg-brand text-on-brand' : 'text-fg hover:bg-ph',
                      )}
                    >
                      {t.code}
                    </button>
                  ))}
                </div>
              </>
            )}

            {status === 'error' && (
              <div role="alert" className="pt-3 text-xs text-acc">
                [ERR] {c.errServer}
              </div>
            )}

            <button
              type="submit"
              disabled={status === 'sending'}
              className={cx(
                tw.btnRed,
                tw.mono,
                'mt-[18px] flex cursor-pointer items-center gap-2 p-[15px] text-left disabled:cursor-wait disabled:opacity-70',
              )}
            >
              <ArrowRight size={16} aria-hidden="true" />
              {status === 'sending' ? c.fSending : company ? c.fSendCompany : c.fSend}
            </button>
          </form>
        )}
      </div>
    </section>
  )
}
