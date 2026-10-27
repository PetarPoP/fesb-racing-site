import { useEffect, useLayoutEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
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

  // A link with data-join-mode ("Pridruži se", "Postani partner") scrolls here and then switches the form to that mode.
  // The switch waits until the scroll ends, so the visitor sees it happen, and the panel flashes once.
  const panelRef = useRef<HTMLDivElement>(null)
  const [flash, setFlash] = useState(0)
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const a = e.target instanceof Element ? e.target.closest<HTMLElement>('[data-join-mode]') : null
      const m = a?.dataset.joinMode
      if (m !== 'student' && m !== 'company') return
      let done = false
      const go = () => {
        if (done) return
        done = true
        window.removeEventListener('scrollend', go)
        window.setTimeout(() => {
          switchMode(m)
          setFlash((n) => n + 1)
        }, 120)
      }
      window.addEventListener('scrollend', go, { once: true })
      // No scrollend (Safari, or the form was already in view): switch after the smooth scroll.
      window.setTimeout(go, 900)
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [])

  // The highlight of the active mode slides between the two buttons.
  const modeRefs = useRef<(HTMLButtonElement | null)[]>([])
  const [pill, setPill] = useState<{ x: number; w: number } | null>(null)
  useLayoutEffect(() => {
    const measure = () => {
      const el = modeRefs.current[MODES.indexOf(mode)]
      if (el) setPill({ x: el.offsetLeft, w: el.offsetWidth })
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [mode, c.modeStudent, c.modeCompany])

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
        <h2 key={`t-${mode}`} className="display m-0 animate-fade-up text-[clamp(32px,4.6vw,64px)] leading-[.85] text-balance [overflow-wrap:break-word]">{company ? c.companyTitle : c.joinTitle}</h2>
        <p key={`p-${mode}`} className="m-0 max-w-[460px] animate-fade-up text-[17px] leading-[1.55] text-soft">{company ? c.companyText : c.joinText}</p>
      </div>

      <div
        ref={panelRef}
        key={`panel-${flash}`}
        className={cx('flex flex-col gap-3 rounded-3xl border border-fg/10 bg-panel p-[clamp(18px,5vw,28px)]', flash > 0 && 'animate-join-flash')}
      >
        <div role="radiogroup" aria-label={c.modeLabel} className="relative flex gap-1 self-start rounded-full bg-bg p-1">
          {pill && (
            <span
              aria-hidden="true"
              className="absolute top-1 bottom-1 left-0 rounded-full bg-fg transition-[transform,width] duration-500 ease-[cubic-bezier(.2,.8,.2,1)]"
              style={{ width: pill.w, transform: `translateX(${pill.x}px)` }}
            />
          )}
          {(
            [
              ['student', c.modeStudent],
              ['company', c.modeCompany],
            ] as const
          ).map(([m, label], i) => (
            <button
              key={m}
              ref={(el) => {
                modeRefs.current[i] = el
              }}
              type="button"
              role="radio"
              aria-checked={mode === m}
              tabIndex={mode === m ? 0 : -1}
              onClick={() => switchMode(m)}
              onKeyDown={(e) => arrowNav(e, MODES.indexOf(mode), MODES.length, (n) => switchMode(MODES[n]))}
              className={cx(
                'press relative min-h-11 cursor-pointer rounded-full px-4 py-2 text-sm font-semibold transition-colors duration-300',
                mode === m ? (pill ? 'text-ink' : 'bg-fg text-ink') : 'text-fg hover:text-acc',
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
          <form key={`form-${mode}`} onSubmit={onSubmit} noValidate className="flex animate-fade-up flex-col gap-3">
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
                        pick === i ? 'border-fg bg-fg text-ink' : 'border-fg/20 text-fg hover:border-acc hover:text-acc',
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
              className="press mt-3 cursor-pointer rounded-full bg-acc px-5 py-4 text-center text-[15px] font-semibold text-ink hover:text-ink disabled:cursor-wait disabled:opacity-70"
            >
              {status === 'sending' ? c.fSending : company ? c.fSendCompany : c.fSend}
            </button>
          </form>
        )}
      </div>
    </section>
  )
}
