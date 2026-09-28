import { useState, type FormEvent } from 'react'
import type { Content, Lang } from '~/content'
import { submitApplication, validateApplication, type FieldErrors } from '~/lib/apply'
import { ArrowRight, ChevronRight } from 'lucide-react'
import { Corners, cx, tw } from './ui'

type Status = 'idle' | 'sending' | 'sent' | 'error'

export function Join({ c, lang }: { c: Content; lang: Lang }) {
  const [pick, setPick] = useState(0)
  const [status, setStatus] = useState<Status>('idle')
  const [errors, setErrors] = useState<FieldErrors>({})

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const fd = new FormData(form)
    const data = {
      name: String(fd.get('name') ?? ''),
      email: String(fd.get('email') ?? ''),
      study: String(fd.get('study') ?? ''),
      team: c.teams[pick].code,
      lang,
    }
    const errs = validateApplication(data)
    setErrors(errs)
    if (Object.keys(errs).length) {
      const first = (['name', 'email', 'study'] as const).find((k) => errs[k])
      form.querySelector<HTMLInputElement>(`[name="${first}"]`)?.focus()
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

  const fields = [
    { name: 'name', label: c.fName, type: 'text', auto: 'name', err: c.errName },
    { name: 'email', label: c.fMail, type: 'email', auto: 'email', err: c.errMail },
    { name: 'study', label: c.fStudy, type: 'text', auto: 'off', err: c.errStudy },
  ] as const

  return (
    <section
      id="pridruzi-se"
      className="wrap grid scroll-mt-16 gap-10 py-14 md:grid-cols-[minmax(0,1fr)_minmax(0,500px)] md:gap-14 md:py-24"
    >
      <div className="flex flex-col gap-5">
        <h2 className="m-0 font-display text-[52px] leading-[.88] font-extrabold text-balance uppercase md:text-[clamp(56px,6.9vw,88px)]">
          {c.joinTitle}
        </h2>
        <p className="m-0 max-w-[460px] text-[17px] leading-[1.6] text-mute">{c.joinText}</p>
      </div>

      <div className={cx(tw.card, 'self-start font-mono text-sm')}>
        <Corners />
        <div className="border-b border-line px-4 py-3 text-[11px] text-mute">{c.formPath}</div>

        {status === 'sent' ? (
          <div role="status" className="flex flex-col gap-2.5 px-4 py-6 leading-[1.6]">
            <span className="text-acc">[OK] 200</span>
            <span>{c.fSent}</span>
          </div>
        ) : (
          <form onSubmit={onSubmit} noValidate className="flex flex-col gap-1 p-4">
            {fields.map((f) => (
              <div key={f.name}>
                <label
                  className={cx(
                    'flex items-center gap-2.5 border-b border-dashed py-2.5 focus-within:border-acc',
                    errors[f.name] ? 'border-acc' : 'border-line',
                  )}
                >
                  <ChevronRight size={14} aria-hidden="true" className="shrink-0 text-acc" />
                  <span className="w-[110px] shrink-0 text-mute md:w-[150px]">{f.label}</span>
                  <input
                    name={f.name}
                    type={f.type}
                    autoComplete={f.auto}
                    aria-invalid={errors[f.name] ? true : undefined}
                    aria-describedby={errors[f.name] ? `err-${f.name}` : undefined}
                    onChange={() => errors[f.name] && setErrors((e) => ({ ...e, [f.name]: undefined }))}
                    className="min-h-7 min-w-0 flex-1 border-0 bg-transparent text-fg caret-acc outline-none"
                  />
                </label>
                {errors[f.name] && (
                  <div id={`err-${f.name}`} className="pt-1.5 text-xs text-acc">
                    [ERR] {f.err}
                  </div>
                )}
              </div>
            ))}

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
              {status === 'sending' ? c.fSending : c.fSend}
            </button>
          </form>
        )}
      </div>
    </section>
  )
}
