import type { MouseEvent, ReactNode } from 'react'
import type { Content, Lang } from '~/content'
import type { Partner } from '~/lib/partners'
import type { NewsCard } from '~/lib/format'
import { Header } from './Header'
import { Hero } from './Hero'
import { Join } from './Join'
import { Competitions, Footer, News, Sponsors, Stats, Story, Ticker, Vehicles } from './Sections'
import { DitherCanvas, DitherProvider } from './Dither'
import { Teams } from './CarExplode'

// Klik na sidro samo skrola; hash se briše iz URL-a da „Natrag“ ni osvježavanje ne vraćaju na tu sekciju.
// Podijeljeni link s #sekcijom i dalje otvara tu sekciju jer ga preglednik obradi pri učitavanju.
function onAnchorClick(e: MouseEvent<HTMLElement>) {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
  const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#"]')
  const target = a && document.getElementById(decodeURIComponent(a.hash.slice(1)))
  if (!target) return
  e.preventDefault()
  target.scrollIntoView({ behavior: 'instant' })
  if (location.hash) history.replaceState(history.state, '', location.pathname + location.search)
}

export function Shell({ lang, c, onHome, children }: { lang: Lang; c: Content; onHome: boolean; children: ReactNode }) {
  return (
    <DitherProvider className="contents">
      <div className="contents" onClick={onAnchorClick}>
        {onHome && <DitherCanvas mode="edges" className="fixed inset-0 -z-10 size-full max-[767px]:hidden" />}
        <Header lang={lang} c={c} onHome={onHome} />
        {children}
        <Footer c={c} lang={lang} onHome={onHome} />
      </div>
    </DitherProvider>
  )
}

export function Home({ lang, c, news, partners }: { lang: Lang; c: Content; news: NewsCard[]; partners: Partner[] }) {
  return (
    <main id="top" className="overflow-x-clip">
      <Hero c={c} />
      <Ticker c={c} />
      <Stats c={c} />
      <Story c={c} />
      <Teams c={c} lang={lang} />
      <Vehicles c={c} />
      <Competitions c={c} />
      <Sponsors c={c} partners={partners} />
      <News c={c} lang={lang} news={news} />
      <Join c={c} lang={lang} />
    </main>
  )
}
