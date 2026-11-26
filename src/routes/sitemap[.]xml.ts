import { createFileRoute } from '@tanstack/react-router'
import { LANGS } from '~/content'
import { getCmsPosts, getCmsShop, getCmsVehicles } from '~/server/cms'
import { SITE_URL } from '~/lib/seo'

const escapeXml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

type Entry = { path: string; lastmod?: string }

/** Build one <url> element with an alternate link for each language. */
function urlElement(origin: string, entry: Entry) {
  // The path has the form /hr/... . Replace the language segment for each alternate.
  const rest = entry.path.replace(/^\/[a-z]{2}/, '')
  const loc = (l: string) => escapeXml(`${origin}/${l}${rest}`)
  const links = [...LANGS.map((l) => `    <xhtml:link rel="alternate" hreflang="${l}" href="${loc(l)}"/>`), `    <xhtml:link rel="alternate" hreflang="x-default" href="${loc('hr')}"/>`].join('\n')
  return LANGS.map((l) =>
    [
      '  <url>',
      `    <loc>${loc(l)}</loc>`,
      entry.lastmod ? `    <lastmod>${entry.lastmod}</lastmod>` : '',
      links,
      '  </url>',
    ]
      .filter(Boolean)
      .join('\n'),
  ).join('\n')
}

export const Route = createFileRoute('/sitemap.xml')({
  server: {
    handlers: {
      GET: async () => {
        // The addresses are those of the public site (SITE_URL at build time), also on a preview deploy.
        const origin = SITE_URL
        // The news list is null when the CMS is down. The sitemap then has only the static pages.
        const [news, blog, shop, vehicles] = await Promise.all([getCmsPosts('news', 'hr'), getCmsPosts('blog', 'hr'), getCmsShop('hr'), getCmsVehicles('hr')])
        const newest = (list: { date: string }[] | null) => list?.map((n) => n.date).sort().at(-1)
        const entries: Entry[] = [
          { path: '/hr', lastmod: newest([...(news ?? []), ...(blog ?? [])]) },
          { path: '/hr/novosti', lastmod: newest(news) },
          ...(news ?? []).map((n) => ({ path: `/hr/novosti/${encodeURIComponent(n.slug)}`, lastmod: n.date })),
          { path: '/hr/blog', lastmod: newest(blog) },
          ...(blog ?? []).map((n) => ({ path: `/hr/blog/${encodeURIComponent(n.slug)}`, lastmod: n.date })),
          { path: '/hr/projekti/formula-student' },
          { path: '/hr/projekti/motostudent' },
          ...vehicles.map((v) => ({ path: `/hr/projekti/${v.project}/${encodeURIComponent(v.id)}` })),
          ...(shop?.settings.enabled ? [{ path: '/hr/shop' }, ...shop.products.map((p) => ({ path: `/hr/shop/${encodeURIComponent(p.slug)}` }))] : []),
        ]
        const xml = [
          '<?xml version="1.0" encoding="UTF-8"?>',
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
          ...entries.map((e) => urlElement(origin, e)),
          '</urlset>',
          '',
        ].join('\n')
        return new Response(xml, {
          headers: {
            'content-type': 'application/xml; charset=utf-8',
            'cache-control': 'public, max-age=300, s-maxage=3600',
          },
        })
      },
    },
  },
})
