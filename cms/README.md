# FESB Racing CMS

This folder holds the admin side of the FESB Racing site. It is Payload CMS 3.90.2 on Next.js 16.
It uses D1 for the database and R2 for the files. It runs on Cloudflare Workers through OpenNext.
The TanStack Start site stays in the parent folder. It does not read from this CMS yet.

Payload 3 does not support TanStack Start. This is the reason for a separate Next.js project.

## Local use

Use Node 24 and npm. The folder has its own `package.json` and `package-lock.json`.

1. Install: `npm install`
2. Read `.env.example`. Put the local values in `.dev.vars` (the file is not in git).
3. Apply the migration to the local D1: `npm run migrate:local`
4. Load the data: `npm run seed`
5. Start the admin: `npm run dev` (port 3100)
6. Open `http://localhost:3100/admin`. Log in with `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` from `.dev.vars`.

The local D1 and the local R2 are files under `.wrangler/state`. To start again, delete that folder and do steps 3 and 4.

The seed script is safe to run two times. Each record has a natural key (email, name, slug or file name).

### What the seed loads

- One admin user from `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD`.
- 56 partners with the tier, the order and the logo (the logo files are in `seed-assets/partners`).
- Five teams, two vehicles, four competitions and the home page, from `src/content.ts` of the site (hr and en).
- Three news posts. They come from the local database of the site, which holds only sample posts.
- The globals: site settings, stats, ticker, footer and join call to action (hr and en).
- Two forms, one sample submission and one sample redirect.
- Five SAMPLE members. The names are not real. Replace them in the admin.

## Content model

- Locales: `hr` (default) and `en`. Fallback is on. Text fields are localized.
- Collections: `users`, `media`, `news`, `pages`, `partners`, `teams`, `members`, `vehicles`, `competitions`.
- Plugins: SEO (news and pages), form builder (`forms` and `form-submissions`), redirects.
- Globals: `siteSettings`, `stats`, `ticker`, `footer`, `joinCta`.
- News and pages have drafts with autosave. A visitor can read only published documents.
- Create, update and delete need a logged-in user. Only an admin can manage users.
- Live preview opens `FRONTEND_URL` (default `http://localhost:3000`).

Image sizes are in the config. Payload makes them only when `sharp` is present. Workers have no `sharp`.
On Workers the original file is the only file.

## Change the schema

1. Change the collections in `src/`.
2. Run `npm run migrate:create -- <name>`. This writes a file in `src/migrations`.
3. Run `npm run generate:types` and `npm run generate:importmap`.
4. Run `npm run migrate:local`.

Dev and production use the same adapter (`@payloadcms/db-d1-sqlite`) and the same migration set.
The adapter option `push` is off.

## Build

- `npm run build` runs `next build --webpack`. Use webpack, not Turbopack (Payload issue #16470).
- `npm run build:cf` runs the OpenNext build. It writes `.open-next/worker.js`. It does not deploy.
- The `postinstall` script patches the OpenNext `@next/env` shim. Without the patch the esbuild step fails.

## Cloudflare set-up (a human runs these steps, one time)

Do not run these steps before you check the account with `cf auth whoami`.
The template needs a paid Workers plan, because the Worker bundle is larger than the free plan limit.

1. Create the D1 database: `cf d1 create --name fesb-racing-cms`
2. Copy the database id from the output into `cloudflare.config.ts` and `wrangler.jsonc` (replace `PLACEHOLDER_D1_DATABASE_ID`).
3. Create the R2 bucket: `cf r2 buckets create --name fesb-racing-media`
4. Put the bucket name in `cloudflare.config.ts` and `wrangler.jsonc` (replace `placeholder-fesb-racing-media`).
5. Set the secret: `openssl rand -hex 32 | cf workers secrets update --script-name fesb-racing-cms --name PAYLOAD_SECRET`
   Run `cf workers secrets update --help` first. The flag names can differ in your `cf` version.
6. Set `FRONTEND_URL` as a Worker variable in the config.
7. Apply the migration to the remote D1: `npm run migrate`
8. Build and deploy: `npm run deploy`

Both config files keep the same values. `cloudflare.config.ts` is the file for the `cf` tool.
`wrangler.jsonc` is the file that OpenNext and the local proxy read. Change both.

To seed the remote database, make the first admin user in `/admin` and enter the content by hand,
or run the seed script with remote bindings (not tested).

## Rebuild webhook

`src/hooks/rebuild.ts` adds `afterChange` and `afterDelete` hooks to `partners`, `news`, `teams`, `vehicles`, `competitions`
and `pages`, and `afterChange` to all globals. For `news` and `pages` (drafts) it fires only for a publish, for a change of a
published document, for an unpublish and for a delete of a published document. A draft save does nothing.
It sends POST to `REBUILD_WEBHOOK_URL` after 25 s without a new change (in memory, trailing).
The call runs in `waitUntil`, so the admin save does not wait. If the variable is empty, nothing happens.
`REBUILD_WEBHOOK_TOKEN` is for a GitHub `repository_dispatch` URL. See the root `README.md` and `DEPLOY.md`.

## Steps where only wrangler works

- Local D1 and R2 emulation: `src/payload.config.ts` imports `getPlatformProxy` from the `wrangler` library.
  `cf` has no replacement for this library import. The `wrangler` CLI is not run.
- `npm run migrate` (remote D1) uses the same library import with remote bindings.
- `npm run deploy`: `opennextjs-cloudflare deploy` runs `wrangler deploy` inside. `cf deploy` and `cf build`
  need a Build Output Specification (`.cloudflare/output/v0/config.json`). OpenNext does not write it.
  `npm run deploy:cf` is only a record of this limit.
- `cf dev` starts `next dev` with Turbopack and does not forward flags. Use `npm run dev` (webpack).

## Call the CMS from the TanStack Worker

`client/cms-client.ts` is a small typed REST client. It uses only `fetch`.

In the TanStack Worker, add a service binding to the CMS Worker. Then pass the binding as the fetcher.
A service binding is free, it does not use the public internet, and it needs no CORS.

```ts
// wrangler config of the TanStack Worker: services: [{ binding: 'CMS', service: 'fesb-racing-cms' }]
import { createCmsClient } from '../cms/client/cms-client'

const cms = createCmsClient({
  baseUrl: 'https://cms.internal', // the host is not used with a binding
  fetcher: env.CMS.fetch.bind(env.CMS),
})
const { docs } = await cms.getPartners({ locale: 'hr' })
const post = await cms.getNewsBySlug('nova-sasija-izlazi-iz-kalupa', { locale: 'en' })
const stats = await cms.getGlobal('stats', { locale: 'hr' })
```

For a draft, pass `draft: true` and a `token` (a user API key). Use drafts only in the preview route.
