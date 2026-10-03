import { defineConfig, loadEnv } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { nitro } from 'nitro/vite'
import { appendFile } from 'node:fs/promises'
import { join } from 'node:path'

const LANGS = ['hr', 'en']

/** Read the news slugs from the CMS at build time. Return an empty list when the CMS is down. */
async function cmsNewsSlugs(base: string): Promise<string[]> {
  try {
    const url = `${base.replace(/\/$/, '')}/api/news?limit=1000&depth=0&select[slug]=true`
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) })
    if (!res.ok) return []
    const { docs } = (await res.json()) as { docs: { slug?: string }[] }
    return docs.map((d) => d.slug).filter((s): s is string => Boolean(s))
  } catch {
    return []
  }
}

export default defineConfig(async ({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const cmsUrl = process.env.CMS_URL || env.CMS_URL || 'http://localhost:3100'
  process.env.CMS_URL ||= cmsUrl
  // The slug list is only needed for the build. It adds the detail pages to the crawl.
  // If the CMS is down, the news list is empty and no detail page exists.
  const slugs = command === 'build' ? await cmsNewsSlugs(cmsUrl) : []
  // In CI set REQUIRE_CMS=1. A build with the CMS down then fails and the old site stays live.
  if (command === 'build' && process.env.REQUIRE_CMS === '1' && slugs.length === 0) throw new Error(`REQUIRE_CMS=1 and no news from ${cmsUrl}`)
  // /admin goes to the CMS admin. The build writes it to _redirects, so the redirect uses no Worker request.
  const cmsAdmin = (process.env.CMS_PUBLIC_URL || env.CMS_PUBLIC_URL || cmsUrl).replace(/\/$/, '') + '/admin'
  const pages = [
    ...LANGS.flatMap((l) => [`/${l}`, `/${l}/novosti`, ...slugs.map((s) => `/${l}/novosti/${s}`)]),
  ].map((path) => ({ path }))

  return {
    server: { port: 3000 },
    resolve: { tsconfigPaths: true },
    plugins: [
      tailwindcss(),
      tanstackStart({
        pages,
        prerender: {
          enabled: true,
          crawlLinks: true,
          autoStaticPathsDiscovery: false,
          failOnError: false,
          // The admin path is a redirect and not a page.
          filter: ({ path }) => !path.startsWith('/admin'),
        },
      }),
      nitro({
        // Add the /admin rules to the _redirects file of the static assets. Cloudflare reads it before the Worker.
        // A module (not the `hooks` option), so the hook of the preset stays active.
        modules: [
          (n: { options: { output: { publicDir: string } }; hooks: { hook: (name: 'compiled', fn: () => Promise<void>) => void } }) => {
            if (command !== 'build') return
            n.hooks.hook('compiled', async () => {
              await appendFile(join(n.options.output.publicDir, '_redirects'), `/admin ${cmsAdmin} 302\n/admin/* ${cmsAdmin}/:splat 302\n`)
            })
          },
        ],
        // Static HTML goes to the assets folder. Only the other requests reach the Worker.
        // Only for the build. The dev server keeps the Node runtime (the fallback database needs Node).
        ...(command === 'build' ? { preset: 'cloudflare-module' } : {}),
        // The Worker (and the local runtime that renders the prerender) reads CMS_URL from its vars.
        cloudflare: {
          wrangler: { name: process.env.SITE_WORKER_NAME || 'fesb-racing-site', vars: { CMS_URL: cmsUrl, ...(process.env.CMS_PUBLIC_URL ? { CMS_PUBLIC_URL: process.env.CMS_PUBLIC_URL } : {}) } },
        },
        routeRules: {
          '/assets/**': { headers: { 'cache-control': 'public, max-age=31536000, immutable' } },
          '/models/**': { headers: { 'cache-control': 'public, max-age=31536000, immutable' } },
          '/draco/**': { headers: { 'cache-control': 'public, max-age=31536000, immutable' } },
          '/partners/**': { headers: { 'cache-control': 'public, max-age=31536000, immutable' } },
          '/img/**': { headers: { 'cache-control': 'public, max-age=31536000, immutable' } },
          '/admin': { redirect: { to: cmsAdmin, status: 302 } },
          '/admin/**': { redirect: { to: `${cmsAdmin}/**`, status: 302 } },
          '/favicon.svg': { headers: { 'cache-control': 'public, max-age=86400' } },
        },
      }),
      viteReact(),
    ],
  }
})
