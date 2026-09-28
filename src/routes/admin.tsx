import { useState, type FormEvent } from 'react'
import { Link, createFileRoute, useRouter } from '@tanstack/react-router'
import { ExternalLink, Loader2, LogOut, Pencil, Plus, TriangleAlert } from 'lucide-react'
import { NewsForm, SponsorForm, btnGhost, btnPrimary, errMsg } from '~/components/admin/Forms'
import { cx, tw } from '~/components/ui'
import { adminData, adminStatus, deleteNews, deleteSponsor, login, logout } from '~/lib/admin'
import { formatDate, type News, type Sponsor } from '~/lib/format'

export const Route = createFileRoute('/admin')({
  loader: async () => {
    const status = await adminStatus()
    return { status, data: status.authed ? await adminData() : null }
  },
  head: () => ({ meta: [{ title: 'Admin — FESB Racing' }, { name: 'robots', content: 'noindex, nofollow' }] }),
  component: AdminPage,
})

type Editing = { kind: 'news'; item: News | null } | { kind: 'sponsor'; item: Sponsor | null } | null

function AdminPage() {
  const { status, data } = Route.useLoaderData()
  const router = useRouter()

  return (
    <div className="min-h-dvh">
      <header className="border-b border-line">
        <div className="wrap flex h-16 items-center gap-4 font-mono text-xs">
          <span className="font-display text-2xl font-extrabold tracking-[.02em]">
            FESB<span className="text-acc">/</span>RACING <span className="text-mute">· ADMIN</span>
          </span>
          <Link to="/$lang" params={{ lang: 'hr' }} className="ml-auto inline-flex items-center gap-1.5 uppercase hover:text-acc">
            Stranica
            <ExternalLink size={14} aria-hidden="true" />
          </Link>
          {status.authed && (
            <button
              type="button"
              onClick={async () => {
                await logout()
                router.invalidate()
              }}
              className={btnGhost}
            >
              <LogOut size={14} aria-hidden="true" />
              Odjava
            </button>
          )}
        </div>
      </header>
      <main className="wrap flex flex-col gap-8 py-10">
        {status.authed && data ? <Dashboard status={status} data={data} /> : <Login />}
      </main>
    </div>
  )
}

function Login() {
  const router = useRouter()
  const [pw, setPw] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const r = await login({ data: pw })
      if (r.ok) await router.invalidate()
      else setError('Pogrešna lozinka.')
    } catch (err) {
      setError(errMsg(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className={cx(tw.card, 'mx-auto mt-10 flex w-full max-w-sm flex-col gap-4 p-6')}>
      <h1 className="m-0 font-display text-4xl font-extrabold uppercase">Prijava</h1>
      <label className="flex flex-col gap-1.5">
        <span className="font-mono text-[11px] tracking-[.08em] text-mute uppercase">Lozinka</span>
        <input
          type="password"
          autoComplete="current-password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          required
          autoFocus
          className="border border-line bg-bg px-3 py-2.5 text-fg outline-none focus:border-acc"
        />
      </label>
      {error && <p role="alert" className="m-0 text-sm text-acc">{error}</p>}
      <button type="submit" disabled={busy} className={cx(btnPrimary, 'justify-center')}>
        {busy && <Loader2 size={14} className="animate-spin" aria-hidden="true" />}
        Prijavi se
      </button>
    </form>
  )
}

type Status = Awaited<ReturnType<typeof adminStatus>>
type Data = NonNullable<Awaited<ReturnType<typeof adminData>>>

function Dashboard({ status, data }: { status: Status; data: Data }) {
  const router = useRouter()
  const [tab, setTab] = useState<'news' | 'sponsor'>('news')
  const [editing, setEditing] = useState<Editing>(null)
  const [notice, setNotice] = useState('')

  async function done(msg?: string) {
    setEditing(null)
    setNotice(msg ?? '')
    await router.invalidate()
    window.scrollTo({ top: 0 })
  }

  async function remove(kind: 'news' | 'sponsor', id: number, name: string) {
    if (!window.confirm(`Obrisati „${name}“? Ovo se ne može poništiti.`)) return
    try {
      await (kind === 'news' ? deleteNews({ data: id }) : deleteSponsor({ data: id }))
      await done('Obrisano.')
    } catch (e) {
      setNotice(errMsg(e))
    }
  }

  if (editing?.kind === 'news') {
    const item = editing.item
    return (
      <NewsForm
        item={item}
        canTranslate={status.canTranslate}
        onDone={done}
        onDelete={item ? () => remove('news', item.id, item.titleHr) : undefined}
      />
    )
  }
  if (editing?.kind === 'sponsor') {
    const item = editing.item
    return (
      <SponsorForm
        item={item}
        canTranslate={status.canTranslate}
        onDone={done}
        onDelete={item ? () => remove('sponsor', item.id, item.name) : undefined}
      />
    )
  }

  const warnings = [
    status.db === 'local' && 'Baza: lokalna (PGlite u .data/). Za produkciju spoji Neon u Vercelu (DATABASE_URL).',
    status.storage === 'local' && 'Slike: lokalno u public/uploads. Za produkciju spoji Vercel Blob (BLOB_READ_WRITE_TOKEN).',
    !status.canTranslate && 'Automatski prijevod je isključen: postavi GOOGLE_TRANSLATE_API_KEY.',
  ].filter(Boolean) as string[]

  const rowClass = 'flex w-full cursor-pointer items-center gap-4 border-b border-line py-3 text-left transition-colors hover:text-acc'

  return (
    <>
      {warnings.length > 0 && (
        <ul className="m-0 flex list-none flex-col gap-1.5 border border-line p-4 text-sm text-mute">
          {warnings.map((w) => (
            <li key={w} className="flex gap-2">
              <TriangleAlert size={16} className="mt-0.5 shrink-0 text-acc" aria-hidden="true" />
              {w}
            </li>
          ))}
        </ul>
      )}
      {notice && <p role="status" className="m-0 border border-line p-3 text-sm">{notice}</p>}

      <div className="flex flex-wrap items-center gap-3">
        <div role="tablist" aria-label="Sadržaj" className="flex border border-line font-mono text-xs uppercase">
          {(
            [
              ['news', `Novosti (${data.news.length})`],
              ['sponsor', `Sponzori (${data.sponsors.length})`],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={tab === k}
              onClick={() => setTab(k)}
              className={cx('cursor-pointer px-4 py-2.5', tab === k ? 'bg-fg text-bg' : 'text-fg hover:text-acc')}
            >
              {label}
            </button>
          ))}
        </div>
        <button type="button" onClick={() => setEditing({ kind: tab, item: null } as Editing)} className={cx(btnPrimary, 'ml-auto')}>
          <Plus size={14} aria-hidden="true" />
          {tab === 'news' ? 'Nova novost' : 'Novi sponzor'}
        </button>
      </div>

      <div role="tabpanel" className="border-t border-line">
        {tab === 'news' &&
          (data.news.length ? (
            data.news.map((n) => (
              <button key={n.id} type="button" onClick={() => setEditing({ kind: 'news', item: n })} className={rowClass}>
                <span className="w-28 shrink-0 font-mono text-xs text-mute">{formatDate(n.date)}</span>
                <span className="grow font-display text-xl font-bold uppercase">{n.titleHr}</span>
                {!n.titleEn && <span className="font-mono text-[10px] text-mute uppercase">bez EN</span>}
                <Pencil size={16} aria-hidden="true" />
              </button>
            ))
          ) : (
            <p className={cx(tw.bodyMute, 'py-6')}>Još nema novosti.</p>
          ))}
        {tab === 'sponsor' &&
          (data.sponsors.length ? (
            data.sponsors.map((s) => (
              <button key={s.id} type="button" onClick={() => setEditing({ kind: 'sponsor', item: s })} className={rowClass}>
                <span className="grid h-10 w-16 shrink-0 place-items-center border border-line">
                  {s.logoUrl && <img src={s.logoUrl} alt="" className="max-h-full max-w-full object-contain" />}
                </span>
                <span className="grow font-display text-xl font-bold uppercase">{s.name}</span>
                <span className="font-mono text-xs text-mute">#{s.sortOrder}</span>
                <Pencil size={16} aria-hidden="true" />
              </button>
            ))
          ) : (
            <p className={cx(tw.bodyMute, 'py-6')}>Još nema sponzora.</p>
          ))}
      </div>
    </>
  )
}
