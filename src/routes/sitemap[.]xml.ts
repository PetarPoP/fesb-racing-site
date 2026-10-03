import { createFileRoute } from '@tanstack/react-router'
import { LANGS } from '~/content'
import { getCmsNews } from '~/server/cms'

const escapeXml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

type Entry = { path: string; lastmod?: string }

/** Build one <url> element with an alternate link for each language. */
function urlElement(origin: string, entry: Entry) {
  // The path has the form /hr/... . Replace the language segment for each alternate.
  const rest = entry.path.replace(/^\/[a-z]{2}/, '')
  const loc = (l: string) => escapeXml(`${origin}/${l}${rest}`)
  const links = LANGS.map((l) => `    <xhtml:link rel="alternate" hreflang="${l}" href="${loc(l)}"/>`).join('\n')
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
      GET: async ({ request }) => {
        // SITE_URL sets the public address. Without it, the sitemap uses the address of the request.
        const origin = (process.env.SITE_URL || new URL(request.url).origin).replace(/\/$/, '')
        // The news list is null when the CMS is down. The sitemap then has only the static pages.
        const news = (await getCmsNews('hr')) ?? []
        const newest = news.map((n) => n.date).sort().at(-1)
        const entries: Entry[] = [
          { path: '/hr', lastmod: newest },
          { path: '/hr/novosti', lastmod: newest },
          ...news.map((n) => ({ path: `/hr/novosti/${encodeURIComponent(n.slug)}`, lastmod: n.date })),
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
