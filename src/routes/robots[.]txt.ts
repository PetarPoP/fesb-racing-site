import { createFileRoute } from '@tanstack/react-router'
import { SITE_URL } from '~/lib/seo'

// robots.txt. Only the public address is open to search engines: a preview deploy (another *.workers.dev
// address) asks not to be crawled, so its pages do not compete with the real ones.
export const Route = createFileRoute('/robots.txt')({
  server: {
    handlers: {
      GET: ({ request }) => {
        const live = new URL(request.url).host === new URL(SITE_URL).host
        const body = live
          ? ['User-agent: *', 'Allow: /', 'Disallow: /*/shop', 'Disallow: /_serverFn/', '', `Sitemap: ${SITE_URL}/sitemap.xml`, ''].join('\n')
          : ['User-agent: *', 'Disallow: /', ''].join('\n')
        return new Response(body, { headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'public, max-age=3600' } })
      },
    },
  },
})
