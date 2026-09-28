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

## Forma „Pridruži se“
`submitApplication` (TanStack server function). Ako je postavljen `APPLY_WEBHOOK_URL`
(npr. Formspree endpoint ili vlastiti API), prijava se šalje kao JSON; inače se zapisuje u log servera.

## Što još treba od tima
- Fotografije: `<Photo label="…" src="/img/…" />` — dimenzije i križići ostaju isti.
- Sponzorski paket: `SPONSOR_PACK_URL` u `components/Sections.tsx`.
- Privremeni sadržaj: brojke, novosti, logotipi sponzora, e-mail, kota „3 050 mm“.

## Deploy
TanStack Start radi na Node/Vercel/Netlify/Cloudflare — vidi https://tanstack.com/start/latest/docs/framework/react/guide/hosting.
