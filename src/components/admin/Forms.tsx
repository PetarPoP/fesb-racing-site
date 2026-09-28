import { useId, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { ArrowLeft, Languages, Loader2, Save, Trash2, Upload, X } from 'lucide-react'
import type { News, Sponsor } from '~/lib/format'
import { saveNews, saveSponsor, translateFields, uploadImage, type NewsInput, type SponsorInput } from '~/lib/admin'
import { cx, tw } from '../ui'
import { RichEditor } from './RichEditor'

export const errMsg = (e: unknown) => (e instanceof Error ? e.message : String(e))

export async function upload(file: File) {
  const fd = new FormData()
  fd.append('file', file)
  return (await uploadImage({ data: fd })).url
}

const inputClass = 'w-full border border-line bg-bg px-3 py-2.5 text-fg outline-none focus:border-acc'
export const btn = cx(tw.mono, 'inline-flex cursor-pointer items-center gap-2 border px-4 py-2.5 text-xs transition-colors disabled:cursor-wait disabled:opacity-60')
export const btnGhost = cx(btn, 'border-line text-fg hover:border-acc hover:text-acc')
export const btnPrimary = cx(btn, 'border-brand bg-brand text-on-brand hover:bg-brand-hover')

function Field({ label, hint, children }: { label: string; hint?: string; children: (id: string) => ReactNode }) {
  const id = useId()
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="font-mono text-[11px] tracking-[.08em] text-mute uppercase">
        {label}
      </label>
      {children(id)}
      {hint && <span className="text-xs text-mute">{hint}</span>}
    </div>
  )
}

export function Text({ label, value, onChange, hint, required, type = 'text', multiline }: {
  label: string
  value: string
  onChange: (v: string) => void
  hint?: string
  required?: boolean
  type?: string
  multiline?: boolean
}) {
  return (
    <Field label={label} hint={hint}>
      {(id) =>
        multiline ? (
          <textarea id={id} rows={3} value={value} required={required} onChange={(e) => onChange(e.target.value)} className={cx(inputClass, 'resize-y')} />
        ) : (
          <input id={id} type={type} value={value} required={required} onChange={(e) => onChange(e.target.value)} className={inputClass} />
        )
      }
    </Field>
  )
}

function ImageField({ label, value, onChange }: { label: string; value: string; onChange: (url: string) => void }) {
  const ref = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function pick(file?: File) {
    if (!file) return
    setBusy(true)
    setError('')
    try {
      onChange(await upload(file))
    } catch (e) {
      setError(errMsg(e))
    } finally {
      setBusy(false)
      if (ref.current) ref.current.value = ''
    }
  }
  return (
    <Field label={label} hint="PNG, JPG, WEBP, GIF ili AVIF, najviše 5 MB.">
      {(id) => (
        <div className="flex flex-wrap items-center gap-3">
          {value && <img src={value} alt="" className="h-20 w-32 border border-line object-cover" />}
          <input ref={ref} id={id} type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/avif" hidden onChange={(e) => pick(e.target.files?.[0])} />
          <button type="button" disabled={busy} onClick={() => ref.current?.click()} className={btnGhost}>
            {busy ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : <Upload size={14} aria-hidden="true" />}
            {value ? 'Zamijeni sliku' : 'Učitaj sliku'}
          </button>
          {value && (
            <button type="button" onClick={() => onChange('')} className={btnGhost}>
              <X size={14} aria-hidden="true" />
              Ukloni
            </button>
          )}
          {error && <span role="alert" className="text-xs text-acc">{error}</span>}
        </div>
      )}
    </Field>
  )
}

function Columns({ hr, en, onTranslate, translating, canTranslate }: {
  hr: ReactNode
  en: ReactNode
  onTranslate: () => void
  translating: boolean
  canTranslate: boolean
}) {
  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <fieldset className="m-0 flex min-w-0 flex-col gap-4 border-0 p-0">
        <legend className="mb-4 font-display text-2xl font-bold uppercase">Hrvatski</legend>
        {hr}
      </fieldset>
      <fieldset className="m-0 flex min-w-0 flex-col gap-4 border-0 p-0">
        <legend className="mb-4 flex w-full flex-wrap items-center justify-between gap-3 font-display text-2xl font-bold uppercase">
          English
          <button type="button" onClick={onTranslate} disabled={translating || !canTranslate} className={btnGhost} title={canTranslate ? undefined : 'GOOGLE_TRANSLATE_API_KEY nije postavljen'}>
            {translating ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : <Languages size={14} aria-hidden="true" />}
            Generiraj EN prijevod
          </button>
        </legend>
        <p className="m-0 text-xs text-mute">
          Prazna EN polja popunjavaju se prijevodom pri spremanju. Ako prijevod nije dostupan, stranica na engleskom prikazuje hrvatski tekst.
        </p>
        {en}
      </fieldset>
    </div>
  )
}

function FormShell({ title, onBack, onSubmit, onDelete, saving, error, notice, children }: {
  title: string
  onBack: () => void
  onSubmit: () => void
  onDelete?: () => void
  saving: boolean
  error: string
  notice?: string
  children: ReactNode
}) {
  function submit(e: FormEvent) {
    e.preventDefault()
    onSubmit()
  }
  return (
    <form onSubmit={submit} className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button type="button" onClick={onBack} className={btnGhost}>
          <ArrowLeft size={14} aria-hidden="true" />
          Natrag
        </button>
        <h2 className="m-0 grow font-display text-4xl font-extrabold uppercase">{title}</h2>
      </div>
      {children}
      {notice && <p role="status" className="m-0 border border-line p-3 text-sm text-mute">{notice}</p>}
      {error && <p role="alert" className="m-0 border border-acc p-3 text-sm text-acc">{error}</p>}
      <div className="flex flex-wrap items-center gap-3 border-t border-line pt-6">
        <button type="submit" disabled={saving} className={btnPrimary}>
          {saving ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : <Save size={14} aria-hidden="true" />}
          Spremi
        </button>
        {onDelete && (
          <button type="button" onClick={onDelete} disabled={saving} className={cx(btnGhost, 'ml-auto hover:border-acc')}>
            <Trash2 size={14} aria-hidden="true" />
            Obriši
          </button>
        )}
      </div>
    </form>
  )
}

function useTranslate(canTranslate: boolean) {
  const [translating, setTranslating] = useState(false)
  const [error, setError] = useState('')
  async function run(text: string[], html: string[], hasEn: boolean) {
    if (!canTranslate) return null
    if (hasEn && !window.confirm('Zamijeniti postojeći engleski tekst novim prijevodom?')) return null
    setTranslating(true)
    setError('')
    try {
      return await translateFields({ data: { text, html } })
    } catch (e) {
      setError(errMsg(e))
      return null
    } finally {
      setTranslating(false)
    }
  }
  return { translating, error, run }
}

type FormProps<T> = {
  item: T | null
  canTranslate: boolean
  onDone: (notice?: string) => void
  onDelete?: () => void
}

const today = () => new Date().toISOString().slice(0, 10)
const translatedNotice = (err?: string) => (err ? `Spremljeno, ali automatski prijevod nije uspio: ${err}` : undefined)

export function NewsForm({ item, canTranslate, onDone, onDelete }: FormProps<News>) {
  const [v, setV] = useState<NewsInput>(() => ({
    id: item?.id,
    date: item?.date ?? today(),
    imageUrl: item?.imageUrl ?? '',
    titleHr: item?.titleHr ?? '',
    titleEn: item?.titleEn ?? '',
    tagHr: item?.tagHr ?? '',
    tagEn: item?.tagEn ?? '',
    excerptHr: item?.excerptHr ?? '',
    excerptEn: item?.excerptEn ?? '',
    bodyHr: item?.bodyHr ?? '',
    bodyEn: item?.bodyEn ?? '',
  }))
  const set = <K extends keyof NewsInput>(k: K) => (val: NewsInput[K]) => setV((p) => ({ ...p, [k]: val }))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const tr = useTranslate(canTranslate)

  async function translate() {
    const r = await tr.run([v.titleHr, v.tagHr, v.excerptHr], [v.bodyHr], Boolean(v.titleEn || v.tagEn || v.excerptEn || v.bodyEn))
    if (r) setV((p) => ({ ...p, titleEn: r.text[0], tagEn: r.text[1], excerptEn: r.text[2], bodyEn: r.html[0] }))
  }

  async function submit() {
    setSaving(true)
    setError('')
    try {
      const r = await saveNews({ data: v })
      onDone(translatedNotice(r.translateError))
    } catch (e) {
      setError(errMsg(e))
      setSaving(false)
    }
  }

  return (
    <FormShell title={item ? 'Uredi novost' : 'Nova novost'} onBack={() => onDone()} onSubmit={submit} onDelete={onDelete} saving={saving} error={error || tr.error}>
      <div className="grid gap-4 sm:grid-cols-[200px_1fr]">
        <Text label="Datum" type="date" value={v.date} onChange={set('date')} required />
        <ImageField label="Naslovna slika" value={v.imageUrl} onChange={set('imageUrl')} />
      </div>
      <Columns
        canTranslate={canTranslate}
        translating={tr.translating}
        onTranslate={translate}
        hr={
          <>
            <Text label="Naslov" value={v.titleHr} onChange={set('titleHr')} required />
            <Text label="Oznaka" hint="Npr. Radionica, Natjecanja, Tim" value={v.tagHr} onChange={set('tagHr')} />
            <Text label="Sažetak" hint="Prikazuje se u skraćenom pregledu i u tražilicama." value={v.excerptHr} onChange={set('excerptHr')} multiline />
            <RichEditor label="Tekst (HR)" value={v.bodyHr} onChange={set('bodyHr')} onUpload={upload} />
          </>
        }
        en={
          <>
            <Text label="Title" value={v.titleEn} onChange={set('titleEn')} />
            <Text label="Tag" value={v.tagEn} onChange={set('tagEn')} />
            <Text label="Summary" value={v.excerptEn} onChange={set('excerptEn')} multiline />
            <RichEditor label="Tekst (EN)" value={v.bodyEn} onChange={set('bodyEn')} onUpload={upload} />
          </>
        }
      />
    </FormShell>
  )
}

export function SponsorForm({ item, canTranslate, onDone, onDelete }: FormProps<Sponsor>) {
  const [v, setV] = useState<SponsorInput>(() => ({
    id: item?.id,
    name: item?.name ?? '',
    website: item?.website ?? '',
    logoUrl: item?.logoUrl ?? '',
    sortOrder: item?.sortOrder ?? 0,
    summaryHr: item?.summaryHr ?? '',
    summaryEn: item?.summaryEn ?? '',
    bodyHr: item?.bodyHr ?? '',
    bodyEn: item?.bodyEn ?? '',
  }))
  const set = <K extends keyof SponsorInput>(k: K) => (val: SponsorInput[K]) => setV((p) => ({ ...p, [k]: val }))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const tr = useTranslate(canTranslate)

  async function translate() {
    const r = await tr.run([v.summaryHr], [v.bodyHr], Boolean(v.summaryEn || v.bodyEn))
    if (r) setV((p) => ({ ...p, summaryEn: r.text[0], bodyEn: r.html[0] }))
  }

  async function submit() {
    setSaving(true)
    setError('')
    try {
      const r = await saveSponsor({ data: v })
      onDone(translatedNotice(r.translateError))
    } catch (e) {
      setError(errMsg(e))
      setSaving(false)
    }
  }

  return (
    <FormShell title={item ? 'Uredi sponzora' : 'Novi sponzor'} onBack={() => onDone()} onSubmit={submit} onDelete={onDelete} saving={saving} error={error || tr.error}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Text label="Naziv" value={v.name} onChange={set('name')} required />
        <Text label="Web stranica" hint="Npr. tvrtka.hr — https:// se doda sam." value={v.website} onChange={set('website')} />
        <ImageField label="Logo" value={v.logoUrl} onChange={set('logoUrl')} />
        <Text
          label="Redoslijed"
          type="number"
          hint="Manji broj prikazuje se ranije."
          value={String(v.sortOrder)}
          onChange={(x) => set('sortOrder')(Number(x) || 0)}
        />
      </div>
      <Columns
        canTranslate={canTranslate}
        translating={tr.translating}
        onTranslate={translate}
        hr={
          <>
            <Text label="Kratki opis" hint="Prikazuje se u skraćenom pregledu." value={v.summaryHr} onChange={set('summaryHr')} multiline />
            <RichEditor label="Pojedinosti (HR)" value={v.bodyHr} onChange={set('bodyHr')} onUpload={upload} />
          </>
        }
        en={
          <>
            <Text label="Short description" value={v.summaryEn} onChange={set('summaryEn')} multiline />
            <RichEditor label="Pojedinosti (EN)" value={v.bodyEn} onChange={set('bodyEn')} onUpload={upload} />
          </>
        }
      />
    </FormShell>
  )
}
