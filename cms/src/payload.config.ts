import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { sqliteD1Adapter } from '@payloadcms/db-d1-sqlite'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { r2Storage } from '@payloadcms/storage-r2'
import { seoPlugin } from '@payloadcms/plugin-seo'
import { formBuilderPlugin } from '@payloadcms/plugin-form-builder'
import { redirectsPlugin } from '@payloadcms/plugin-redirects'
import { buildConfig } from 'payload'
import { getCloudflareContext, type CloudflareContext } from '@opennextjs/cloudflare'
import type { GetPlatformProxyOptions } from 'wrangler'

import { anyone, isLoggedIn } from './access'
import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { News } from './collections/News'
import { Pages } from './collections/Pages'
import { Partners } from './collections/Partners'
import { Teams } from './collections/Teams'
import { Members } from './collections/Members'
import { Vehicles } from './collections/Vehicles'
import { Competitions } from './collections/Competitions'
import { Footer, JoinCta, SiteSettings, Stats, Ticker } from './globals'
import { migrations } from './migrations'
import { withRebuildHooks } from './hooks/rebuild'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const realpath = (value: string) => (fs.existsSync(value) ? fs.realpathSync(value) : undefined)

// True for the Payload CLI (migrate, generate:types, run) and for "next build".
const isCLI = process.argv.some((value) => realpath(value)?.endsWith(path.join('payload', 'bin.js')))
const isBuild = process.env.NEXT_PHASE === 'phase-production-build'
const isProduction = process.env.NODE_ENV === 'production'

const createLog =
  (level: string, fn: typeof console.log) => (objOrMsg: object | string, msg?: string) => {
    if (typeof objOrMsg === 'string') {
      fn(JSON.stringify({ level, msg: objOrMsg }))
    } else {
      fn(JSON.stringify({ level, ...objOrMsg, msg: msg ?? (objOrMsg as { msg?: string }).msg }))
    }
  }

const cloudflareLogger = {
  level: process.env.PAYLOAD_LOG_LEVEL || 'info',
  trace: createLog('trace', console.debug),
  debug: createLog('debug', console.debug),
  info: createLog('info', console.log),
  warn: createLog('warn', console.warn),
  error: createLog('error', console.error),
  fatal: createLog('fatal', console.error),
  silent: () => {},
} as any // Use PayloadLogger type when it is exported

const cloudflare =
  isCLI || isBuild || !isProduction
    ? await getCloudflareContextFromWrangler()
    : await getCloudflareContext({ async: true })

/** Read a variable from the Cloudflare bindings (.dev.vars locally) or from process.env. */
const env = (name: string): string | undefined =>
  (cloudflare.env as unknown as Record<string, string | undefined>)[name] ?? process.env[name]

const withHooks = withRebuildHooks(
  env,
  [Users, Media, News, Pages, Partners, Teams, Members, Vehicles, Competitions],
  [SiteSettings, Stats, Ticker, Footer, JoinCta],
)

export const frontendUrl = env('FRONTEND_URL') || 'http://localhost:3000'

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: { baseDir: path.resolve(dirname) },
    theme: 'dark',
    meta: {
      titleSuffix: ' - FESB Racing CMS',
      icons: [{ rel: 'icon', type: 'image/svg+xml', url: '/favicon.svg' }],
    },
    components: { graphics: { Logo: '/components/Logo', Icon: '/components/Icon' } },
    livePreview: {
      url: frontendUrl,
      collections: ['news', 'pages'],
      breakpoints: [
        { label: 'Mobile', name: 'mobile', width: 390, height: 844 },
        { label: 'Desktop', name: 'desktop', width: 1440, height: 900 },
      ],
    },
  },
  localization: {
    locales: [
      { label: 'Hrvatski', code: 'hr' },
      { label: 'English', code: 'en' },
    ],
    defaultLocale: 'hr',
    fallback: true,
  },
  collections: withHooks.collections,
  globals: withHooks.globals,
  editor: lexicalEditor(),
  secret: env('PAYLOAD_SECRET') || '',
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
  db: sqliteD1Adapter({
    binding: cloudflare.env.D1,
    // One migration set for dev and prod. Run "npm run migrate:local" in dev.
    push: false,
    prodMigrations: migrations,
  }),
  logger: isProduction && !isCLI && !isBuild ? cloudflareLogger : undefined,
  plugins: [
    r2Storage({ bucket: cloudflare.env.R2, collections: { media: true } }),
    seoPlugin({
      collections: ['news', 'pages'],
      uploadsCollection: 'media',
      tabbedUI: true,
      generateTitle: ({ doc }) => `${(doc as { title?: string }).title ?? ''} - FESB Racing`,
    }),
    formBuilderPlugin({
      fields: { payment: false },
      redirectRelationships: ['pages'],
      formOverrides: {
        admin: { group: 'Forms' },
        access: { read: anyone, create: isLoggedIn, update: isLoggedIn, delete: isLoggedIn },
      },
      formSubmissionOverrides: {
        admin: { group: 'Forms' },
        // A visitor can send a submission. Only a logged-in user can read it.
        access: { create: anyone, read: isLoggedIn, update: isLoggedIn, delete: isLoggedIn },
      },
    }),
    redirectsPlugin({
      collections: ['news', 'pages'],
      overrides: {
        admin: { group: 'Settings' },
        access: { read: anyone, create: isLoggedIn, update: isLoggedIn, delete: isLoggedIn },
      },
    }),
  ],
})

// Adapted from OpenNext cloudflare-context.ts. The "wrangler" library gives the local D1 and R2.
function getCloudflareContextFromWrangler(): Promise<CloudflareContext> {
  return import(/* webpackIgnore: true */ `${'__wrangler'.replaceAll('_', '')}`).then(
    ({ getPlatformProxy }) =>
      getPlatformProxy({
        environment: process.env.CLOUDFLARE_ENV,
        // Remote bindings only for CLI work in production (for example the remote migration).
        remoteBindings: isProduction && !isBuild,
      } satisfies GetPlatformProxyOptions),
  )
}
