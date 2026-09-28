import { content, type Lang } from '~/content'
import { Header } from './Header'
import { Hero } from './Hero'
import { Join } from './Join'
import { Competitions, Footer, News, Sponsors, Stats, Story, Teams, Ticker, Vehicles } from './Sections'

export function Site({ lang }: { lang: Lang }) {
  const c = content[lang]
  return (
    <>
      <Header lang={lang} c={c} />
      <main id="top" className="overflow-x-clip">
        <Hero c={c} />
        <Ticker c={c} />
        <Stats c={c} />
        <Story c={c} />
        <Teams c={c} />
        <Vehicles c={c} />
        <Competitions c={c} />
        <Sponsors c={c} />
        <News c={c} />
        <Join c={c} lang={lang} />
      </main>
      <Footer c={c} />
    </>
  )
}
