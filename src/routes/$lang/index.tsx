import { useCallback } from 'react'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { content, type Lang } from '~/content'
import { Modal, NewsPreview, SponsorPreview } from '~/components/Cms'
import { Home } from '~/components/Site'
import { getHome } from '~/lib/cms'
import { pick } from '~/lib/format'

type Search = { novost?: string; sponzor?: string }

// Klik na novost/sponzora dodaje ?novost= / ?sponzor= (a prikazani URL se maskira na njihovu stranicu),
// pa se pregled otvara u modalu iznad početne; osvježavanje ili podijeljeni link otvaraju punu stranicu.
export const Route = createFileRoute('/$lang/')({
  validateSearch: (s: Record<string, unknown>): Search => ({
    novost: typeof s.novost === 'string' ? s.novost : undefined,
    sponzor: typeof s.sponzor === 'string' ? s.sponzor : undefined,
  }),
  loader: () => getHome(),
  staleTime: 30_000,
  head: () => ({
    links: [
      { rel: 'alternate', hrefLang: 'hr', href: '/hr' },
      { rel: 'alternate', hrefLang: 'en', href: '/en' },
    ],
  }),
  component: HomePage,
})

function HomePage() {
  const lang = Route.useParams().lang as Lang
  const c = content[lang]
  const { news, sponsors } = Route.useLoaderData()
  const { novost, sponzor } = Route.useSearch()
  const router = useRouter()
  const navigate = Route.useNavigate()

  const close = useCallback(() => {
    if (router.history.canGoBack()) router.history.back()
    else navigate({ search: {}, replace: true, resetScroll: false })
  }, [router, navigate])

  const n = novost ? news.find((x) => x.slug === novost) : undefined
  const s = sponzor ? sponsors.find((x) => x.slug === sponzor) : undefined

  return (
    <>
      <Home lang={lang} news={news} sponsors={sponsors} />
      {n && (
        <Modal key={n.slug} label={pick(n, 'title', lang)} closeLabel={c.close} onClose={close}>
          <NewsPreview n={n} lang={lang} c={c} />
        </Modal>
      )}
      {s && (
        <Modal key={s.slug} label={s.name} closeLabel={c.close} onClose={close}>
          <SponsorPreview s={s} lang={lang} c={c} />
        </Modal>
      )}
    </>
  )
}
