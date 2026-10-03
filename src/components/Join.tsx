import { useEffect, useState, type FormEvent, type KeyboardEvent } from 'react'
import { Check } from 'lucide-react'
import type { Content, Lang } from '~/content'
import { submitApplication, validateApplication, type Application, type Field, type FieldErrors } from '~/lib/apply'
import { cx, tw } from './ui'

type Status = 'idle' | 'sending' | 'sent' | 'error'
type Mode = 'student' | 'company'
type FieldDef = { name: Field; label: string; type: string; auto: string; err: string; multiline?: boolean }

const MODES = ['student', 'company'] as const

// Arrow keys move the choice in a radiogroup. The new radio is selected and focused.
function arrowNav(e: KeyboardEvent<HTMLElement>, current: number, count: number, select: (i: number) => void) {
  const step = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0
  if (!step) return
  e.preventDefault()
  const next = (current + step + count) % count
  select(next)
  e.currentTarget.parentElement?.querySelectorAll<HTMLElement>('[role="radio"]')[next]?.focus()
}

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

  // A link with data-join-mode (the sponsor button) also switches the form to that mode.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const a = e.target instanceof Element ? e.target.closest<HTMLElement>('[data-join-mode]') : null
      if (a?.dataset.joinMode === 'company') switchMode('company')
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [])

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

  const inputClass =
    'block w-full rounded-[14px] border border-fg/10 bg-bg px-[18px] py-4 text-base text-fg caret-acc outline-none transition-colors placeholder:text-mute focus:border-acc aria-[invalid=true]:border-acc'

  return (
    <section
      id="pridruzi-se"
      className="mx-auto grid w-full max-w-[1344px] scroll-mt-16 grid-cols-[repeat(auto-fit,minmax(min(100%,420px),1fr))] items-start gap-[clamp(28px,5vw,56px)] px-[clamp(20px,3.4vw,48px)] pt-[clamp(96px,14vw,160px)] pb-20"
    >
      <div className="flex flex-col gap-5">
        <h2 key={`t-${mode}`} className={cx(tw.h2, 'animate-fade-up text-[clamp(32px,4.2vw,60px)] [overflow-wrap:anywhere]')}>{company ? c.companyTitle : c.joinTitle}</h2>
        <p key={`p-${mode}`} className="m-0 max-w-[460px] animate-fade-up text-[17px] leading-[1.55] text-[#b8aca8]">{company ? c.companyText : c.joinText}</p>
      </div>

      <div className="flex flex-col gap-3 rounded-3xl border border-fg/10 bg-[#141112] p-[clamp(18px,5vw,28px)]">
        <div role="radiogroup" aria-label={c.modeLabel} className="flex gap-1 self-start rounded-full bg-bg p-1">
          {(
            [
              ['student', c.modeStudent],
              ['company', c.modeCompany],
            ] as const
          ).map(([m, label], i) => (
            <button
              key={m}
              type="button"
              role="radio"
              aria-checked={mode === m}
              tabIndex={mode === m ? 0 : -1}
              onClick={() => switchMode(m)}
              onKeyDown={(e) => arrowNav(e, MODES.indexOf(mode), MODES.length, (n) => switchMode(MODES[n]))}
              className={cx(
                'press min-h-11 cursor-pointer rounded-full px-4 py-2 text-sm font-semibold',
                mode === m ? 'bg-fg text-[#141112]' : 'text-fg hover:text-acc',
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {status === 'sent' ? (
          <div key="sent" role="status" className="animate-pop-in flex items-start gap-3 py-4 leading-[1.6]">
            <Check size={20} aria-hidden="true" className="mt-0.5 shrink-0 text-acc" />
            <span>{company ? c.fSentCompany : c.fSent}</span>
          </div>
        ) : (
          <form onSubmit={onSubmit} noValidate className="flex flex-col gap-3">
            {fields.map((f) => (
              <div key={f.name}>
                <label className="block">
                  <span className="sr-only">{f.label}</span>
                  {f.multiline ? (
                    <textarea {...fieldProps(f)} rows={4} placeholder={f.label} className={cx(inputClass, 'min-h-28 resize-y')} />
                  ) : (
                    <input {...fieldProps(f)} type={f.type} placeholder={f.label} className={inputClass} />
                  )}
                </label>
                {errors[f.name] && (
                  <div id={`err-${f.name}`} className="animate-fade-up pt-1.5 pl-1 text-sm text-acc">
                    {f.err}
                  </div>
                )}
              </div>
            ))}

            {!company && (
              <>
                <div id="pick-label" className="mt-2 text-sm text-mute">
                  {c.fTeam}
                </div>
                <div role="radiogroup" aria-labelledby="pick-label" className="flex flex-wrap gap-1.5">
                  {c.teams.map((t, i) => (
                    <button
                      key={t.code}
                      type="button"
                      role="radio"
                      aria-checked={pick === i}
                      tabIndex={pick === i ? 0 : -1}
                      title={t.name}
                      onClick={() => setPick(i)}
                      onKeyDown={(e) => arrowNav(e, pick, c.teams.length, setPick)}
                      className={cx(
                        'press min-h-11 cursor-pointer rounded-full border px-4 py-2.5 text-sm font-semibold',
                        pick === i ? 'border-fg bg-fg text-[#141112]' : 'border-fg/20 text-fg hover:border-acc hover:text-acc',
                      )}
                    >
                      {t.code}
                    </button>
                  ))}
                </div>
              </>
            )}

            {status === 'error' && (
              <div role="alert" className="animate-fade-up text-sm text-acc">
                {c.errServer}
              </div>
            )}

            <button
              type="submit"
              disabled={status === 'sending'}
              data-dh="wipe"
              data-dh-c="#f1e9e5"
              className="press mt-3 cursor-pointer rounded-full bg-acc px-5 py-4 text-center text-[15px] font-semibold text-[#141112] hover:text-[#141112] disabled:cursor-wait disabled:opacity-70"
            >
              {status === 'sending' ? c.fSending : company ? c.fSendCompany : c.fSend}
            </button>
          </form>
        )}
      </div>
    </section>
  )
}
