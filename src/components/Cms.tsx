import { useRef } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import type { Content, Lang } from '~/content'
import { formatDate, pick, type News, type NewsCard, type PostKind } from '~/lib/format'
import { EmptyNews, NewsCardItem, NewsRow } from './Sections'
import { DitherCanvas } from './Dither'
import { Lightbox } from './Lightbox'
import { cx, tw } from './ui'

const linkBase = 'group inline-flex items-center gap-2 text-[15px] font-semibold hover:text-acc'
const linkClass = cx(linkBase, 'transition-colors')

/** Page title in the display style. */
const h1Class = 'display m-0 text-[clamp(36px,6.5vw,88px)] leading-[.88] text-balance'
const topPad = 'pt-[clamp(104px,12vw,148px)] pb-10 md:pb-16'

/** Cover image of a news item. Without an image, a dither canvas fills the space. */
function Cover({ src, alt, seed, className }: { src: string | null; alt: string; seed: string; className?: string }) {
  return src ? (
    <img src={src} alt={alt} className={cx('block w-full object-cover', className)} />
  ) : (
    <div className={cx('relative overflow-hidden bg-sunk', className)}>
      <DitherCanvas mode="noise" seed={[...seed].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) % 997, 7)} className="absolute inset-0 size-full" />
    </div>
  )
}

function Meta({ date, tag }: { date: string; tag: string }) {
  return (
    <div className="flex gap-3 text-sm text-mute">
      <span>{formatDate(date)}</span>
      {tag && <span className="text-acc">· {tag}</span>}
    </div>
  )
}

function BackLink({ kind, lang, label }: { kind: PostKind; lang: Lang; label: string }) {
  const inner = (
    <>
      <ArrowLeft size={16} aria-hidden="true" className="transition-transform group-hover:-translate-x-0.5" />
      {label}
    </>
  )
  return kind === 'blog' ? (
    <Link to="/$lang/blog" params={{ lang }} className={tw.backPill}>
      {inner}
    </Link>
  ) : (
    <Link to="/$lang/novosti" params={{ lang }} className={tw.backPill}>
      {inner}
    </Link>
  )
}

function Rich({ html }: { html: string }) {
  // The server builds this HTML from the CMS rich text and escapes the text.
  return <div className="rich" dangerouslySetInnerHTML={{ __html: html }} />
}

/** The list page of one post kind: news as cards, blog posts as rows. */
export function PostList({ kind, posts, lang, c }: { kind: PostKind; posts: NewsCard[]; lang: Lang; c: Content }) {
  return (
    <main className={cx('wrap flex flex-col gap-8', topPad)}>
      <Link to="/$lang" params={{ lang }} hash={kind === 'blog' ? 'blog' : 'novosti'} className={tw.backPill}>
        <ArrowLeft size={16} aria-hidden="true" className="transition-transform group-hover:-translate-x-0.5" />
        {c.backHome}
      </Link>
      <h1 className={tw.h2}>{kind === 'blog' ? c.blogTitle : c.newsTitle}</h1>
      {posts.length === 0 ? (
        <EmptyNews c={c} />
      ) : kind === 'news' ? (
        <div data-reveal="stagger" className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,320px),1fr))] gap-4">
          {posts.map((n) => (
            <NewsCardItem key={n.id} n={n} lang={lang} c={c} />
          ))}
        </div>
      ) : (
        <div className="border-t border-fg/[.14]">
          {posts.map((n) => (
            <NewsRow key={n.id} kind={kind} n={n} lang={lang} c={c} />
          ))}
        </div>
      )}
    </main>
  )
}

export function NewsArticle({ kind, n, lang, c }: { kind: PostKind; n: News; lang: Lang; c: Content }) {
  const title = pick(n, 'title', lang)
  const gallery = pick(n, 'gallery', lang)
  const article = useRef<HTMLElement>(null)
  return (
    <main className={cx('wrap flex max-w-[880px] flex-col gap-7', topPad)}>
      <BackLink kind={kind} lang={lang} label={kind === 'blog' ? c.allBlog : c.allNews} />
      <Meta date={n.date} tag={pick(n, 'tag', lang)} />
      <h1 className={h1Class}>{title}</h1>
      <p className="m-0 text-lg leading-[1.55] text-mute md:text-xl">{pick(n, 'excerpt', lang)}</p>
      {n.imageUrl && (
        <Cover src={n.imageUrl} alt={title} seed={n.slug} className="aspect-[16/9] rounded-3xl border border-fg/10" />
      )}
      <article ref={article} className="flex flex-col gap-10">
        <Rich html={pick(n, 'body', lang)} />
        {gallery && <Rich html={gallery} />}
      </article>
      <Lightbox containerRef={article} lang={lang} />
    </main>
  )
}

export function NotFound({ lang, c }: { lang: Lang; c: Content }) {
  return (
    <main className="wrap flex flex-col items-start gap-6 pt-[clamp(120px,14vw,180px)] pb-24">
      <h1 className={tw.h2}>404</h1>
      <p className={tw.bodyMute}>{c.notFound}</p>
      <Link to="/$lang" params={{ lang }} className={cx(linkClass, 'text-fg')}>
        <ArrowLeft size={16} aria-hidden="true" />
        {c.backHome}
      </Link>
    </main>
  )
}
