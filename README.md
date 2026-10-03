# FESB Racing — web stranica

One-page stranica („Telemetrija / nacrt“) u **TanStack Start + React 19 + Tailwind CSS v4 + TypeScript**.

```bash
npm install
npm run dev        # http://localhost:3000  → preusmjerava na /hr
npm run build      # produkcijski build (dist/)
npm start          # pokreće build lokalno (vite preview)
npm run typecheck
```

## Rute i jezik
- `/hr` i `/en` — `src/routes/$lang.tsx` (nepoznat jezik → `/hr`), `/` → `/hr`.
- Sav tekst je u `src/content.ts` (HR/EN rječnik iz `fesb-content.js` + UI tekstovi).
- `<html lang>`, `<title>`, meta description i `hreflang` linkovi postavljaju se po jeziku (SSR).

## Tema (tamna / svijetla)
- `data-theme="dark|light"` na `<html>`; skripta u `<head>` (`src/lib/theme.ts`) čita `localStorage`,
  inače `prefers-color-scheme`, prije prvog iscrtavanja → nema bljeska krive teme.
- Tokeni iz dizajna su CSS varijable u `src/styles.css`, izložene Tailwindu kao boje:
  `bg-bg text-fg text-mute text-acc border-line bg-ph border-phb text-pht bg-sel` + `bg-brand` (#7F1627),
  `hover:bg-brand-hover`, `text-on-brand`. Varijante `dark:` / `light:` prate `data-theme`.
- Fontovi: `font-display` (Barlow Condensed), `font-sans` (Barlow), `font-mono` (IBM Plex Mono) — self-hostani preko `@fontsource`.
- Breakpoint `md` = 900px (mobilni ↔ desktop layout), `nav` = 1180px (puna navigacija; ispod je izbornik).

## Struktura
```
src/
  routes/__root.tsx   html shell, head, skripta teme
  routes/index.tsx    / → /hr
  routes/$lang.tsx    stranica + SEO meta po jeziku
  components/Site.tsx redoslijed sekcija
  components/Header.tsx, Hero.tsx (lap timer), Sections.tsx, Join.tsx, ui.tsx (Corners, Photo, SectionLabel)
  lib/apply.ts        server funkcija za prijavu (validacija na klijentu i serveru)
  styles.css          Tailwind, tokeni, utility-ji `wrap`, `grid-bg`, `corners`
```

## CMS link
The site reads content from the Payload CMS in `cms/`. See `cms/README.md` for the CMS itself.

- `src/server/cms.ts` is the loader layer. It uses `cms/client/cms-client.ts`.
- `src/lib/cms.ts` has the TanStack server functions. The route loaders call them with the language.
- `CMS_URL` is the CMS address (default `http://localhost:3100`). `CMS_PUBLIC_URL` is the address of the media files for the browser. It defaults to `CMS_URL`.
- Each call has a 2 s timeout. The result is cached in memory for 60 s (10 s after an error).
- On an error or an empty result, the site uses the static data for the structure, and shows an empty state for the news. The site does not fail when the CMS is down.

What comes from the CMS (per language, hr and en):
- Partners: the Sponsors section. Fallback: `PARTNERS` in `src/lib/partners.ts` and `public/partners`.
- News: the list and the detail page (published posts only). Fallback: the drizzle table `news`.
- Globals: stats, ticker, footer headings and text, join text and button, contact email and address, social links.
- Teams, vehicles and competitions: names and texts. The static data in `src/content.ts` keeps the order, the team codes, the CAD mapping and the vehicle image alt text.

What stays as before:
- News come only from the CMS. Sponsor tiles link to the partner website. `/admin` redirects to `<CMS_PUBLIC_URL or CMS_URL>/admin`.
- Text for the interface (buttons, labels, errors, the 3D car) stays in `src/content.ts`.
- The footer link list uses the section anchors in the site code.
- `plainLogo` of a CMS partner is not used. All logos get the white filter, as before.

Local use: start the CMS (`cd cms && npm run dev`), then start the site. Set `CMS_URL` if the CMS uses a different port.

### Static build (prerender)
The public site is built as static HTML. This keeps the free Cloudflare Workers plan enough
(100k requests a day, 10 ms CPU, 3 MiB bundle). Static assets are free and have no limit.

- `npm run build` renders every public page to HTML: `/hr`, `/en`, the news list and every news detail page.
- The build reads the news slugs from `CMS_URL`. If the CMS is down, the build makes the empty news state.
- Nitro preset: `cloudflare-module` (set in `vite.config.ts`). The prerendered files go to `.output/public`. Cloudflare serves them as static assets before the Worker runs.
- `CMS_URL` is also saved in the Worker `vars`, so the Worker finds the CMS at run time.
- Only these requests reach the Worker: `/` (redirect to `/hr`), the server functions (`/_serverFn/*`), and the API. `public/_redirects` handles `/`, and the build adds the `/admin` redirect to `.output/public/_redirects`, without the Worker.
- Cache headers are in `vite.config.ts` (`routeRules`) and become `_headers`: hashed assets, `/models`, `/draco`, `/partners` and `/img` get `immutable` for one year.
- The 3D scene (`car3d`, three.js, the models) loads with a dynamic import after the page loads. It is not in the first HTML.
- Media URLs in the HTML use `CMS_PUBLIC_URL` (or `CMS_URL`). Set the public address for a production build.

### How a publish becomes a rebuild
1. An editor publishes in the CMS (a news post, a page, a partner, a team, a vehicle, a competition or a global).
2. The CMS hook (`cms/src/hooks/rebuild.ts`) sees a public change. A draft save does not count. An unpublish and a delete of a published post count.
3. The hook waits 25 s after the last change (debounce). Many edits make one call. The save in the admin does not wait.
4. The hook sends POST to `REBUILD_WEBHOOK_URL`. If the variable is empty, the hook does nothing.
5. The webhook starts the build: GitHub Actions `deploy-site.yml` (through `repository_dispatch`, event `cms-publish`) or a deploy hook of a Cloudflare build.
6. The build prerenders the pages from the CMS and deploys them.

Expected delay: about 25 s debounce plus 2 to 4 minutes for the build. Plan for 3 to 5 minutes from publish to live.
The debounce is in memory in one Worker instance. Edits that reach other instances can make more than one build. This is only a cost in build minutes.

Why this fits the free plan: a visitor request for a prerendered page is a static asset request. It does not use Worker requests or CPU time.
The CMS is read only at build time. Visitors do not load the CMS. The site and the CMS use two separate Workers, so the 3 MiB bundle limit applies to each one alone.

Steps for the human to set the webhook:
- GitHub Actions (default): create a fine-grained token with "Contents: read and write" for this repository.
  Set `REBUILD_WEBHOOK_URL` to `https://api.github.com/repos/OWNER/REPO/dispatches` and `REBUILD_WEBHOOK_TOKEN` to the token.
  The hook sends the event type `cms-publish` for this URL, and `deploy-site.yml` starts.
- Cloudflare Workers Builds (no relay): connect the repository in the Cloudflare dashboard (Workers, Builds). Add a deploy hook
  in the build settings and copy its URL into `REBUILD_WEBHOOK_URL`. A deploy hook accepts a plain POST.
- Set the secrets: `cf workers secrets update REBUILD_WEBHOOK_URL --worker fesb-racing-cms --text "<url>"` (same for `REBUILD_WEBHOOK_TOKEN`), or put it in `cms/.secrets.env` and run `scripts/deploy.sh`.
- The repository secrets for the workflow: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `CMS_URL`, `CMS_PUBLIC_URL`.

See `DEPLOY.md` for the full path from zero to live.

## Forma „Pridruži se“
`submitApplication` (TanStack server function). Ako je postavljen `APPLY_WEBHOOK_URL`
(npr. Formspree endpoint ili vlastiti API), prijava se šalje kao JSON; inače se zapisuje u log servera.

## Što još treba od tima
- Fotografije: `<Photo label="…" src="/img/…" />` — dimenzije i križići ostaju isti.
- Sponzorski paket: `SPONSOR_PACK_URL` u `components/Sections.tsx`.
- Privremeni sadržaj: brojke, novosti, logotipi sponzora, e-mail, kota „3 050 mm“.

## Deploy
TanStack Start radi na Node/Vercel/Netlify/Cloudflare — vidi https://tanstack.com/start/latest/docs/framework/react/guide/hosting.
