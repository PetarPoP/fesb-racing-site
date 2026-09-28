import { createFileRoute } from '@tanstack/react-router'
import { content, type Lang } from '~/content'
import { NewsRow } from '~/components/Sections'
import { tw } from '~/components/ui'
import { getNewsList } from '~/lib/cms'

export const Route = createFileRoute('/$lang/novosti/')({
  loader: () => getNewsList(),
  head: ({ params }) => {
    const c = content[params.lang as Lang] ?? content.hr
    return { meta: [{ title: `${c.newsLabel} — FESB Racing` }] }
  },
  component: NewsListPage,
})

function NewsListPage() {
  const lang = Route.useParams().lang as Lang
  const c = content[lang]
  const news = Route.useLoaderData()
  return (
    <main className="wrap flex flex-col gap-8 py-10 md:py-16">
      <h1 className={tw.h2}>{c.newsTitle}</h1>
      <div className="border-t border-line">
        {news.length === 0 && <p className={tw.bodyMute}>{c.noNews}</p>}
        {news.map((n) => (
          <NewsRow key={n.id} n={n} lang={lang} c={c} />
        ))}
      </div>
    </main>
  )
}
