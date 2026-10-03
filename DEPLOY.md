# Deploy to Cloudflare, from zero to live

Use the `cf` CLI. A step that works only with wrangler is marked **[wrangler]**.
The scripts do steps 3 to 9 for you. Read them before you run them.

1. Install and log in: `npm install -g cf`, then `cf auth login`.
   Run `cf auth whoami` and check the account. The scripts print it and ask you to confirm.
2. Install the packages: `npm install` in the root and in `cms/`.
   The CMS needs the Workers Paid plan (the Worker is larger than the free limit). The site fits the free plan.
3. Create the resources and the config: `./scripts/setup-cloudflare.sh`
   - It runs `cf d1 create` and `cf r2 buckets create-by-name` (only when they do not exist).
   - It writes the real IDs into `cms/wrangler.jsonc` and `cms/cloudflare.config.ts`.
   - It makes `PAYLOAD_SECRET` and saves the secrets in `cms/.secrets.env` (not in git).
4. Migrate the remote database **[wrangler]**: `cd cms && npm run migrate`.
   Payload migrations run through the `wrangler` library import. `cf d1 migrations apply` cannot run them.
5. Deploy the CMS **[wrangler]**: `cd cms && npm run deploy`.
   OpenNext runs `wrangler deploy` inside. `cf deploy` needs a Build Output Specification that OpenNext does not write.
6. Set the CMS secrets: `cf workers secrets update <NAME> --worker fesb-racing-cms --text <value>`
   for each name in `cms/.secrets.env` (`PAYLOAD_SECRET`, `FRONTEND_URL`, `REBUILD_WEBHOOK_URL`, `REBUILD_WEBHOOK_TOKEN`).
7. Load the data, first deploy only **[wrangler]**: `cd cms && NODE_ENV=production npm run seed`.
   Then open `<CMS_URL>/admin` and log in with the seed user.
8. Build and deploy the site: set `CMS_URL` to the public CMS address, then `npm run build`.
   - The build prerenders `/hr`, `/en`, the news list and every news page into `.output/public`.
   - Upload **[wrangler]**: `.output/server/wrangler.json` is the Worker config. `cf deploy` needs a
     Build Output Specification (`.cloudflare/output/v0`) that the Nitro preset does not write yet.
     Until it does, the upload needs `wrangler deploy` (the Nitro preset command) run by a human.
9. Set the webhook (the site rebuilds after a publish):
   - Create a GitHub fine-grained token for this repository with "Contents: read and write".
   - Add the repository secrets `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `CMS_URL`, `CMS_PUBLIC_URL`.
   - Set `REBUILD_WEBHOOK_URL=https://api.github.com/repos/OWNER/REPO/dispatches` and `REBUILD_WEBHOOK_TOKEN=<token>`
     as CMS secrets (step 6). The workflow `.github/workflows/deploy-site.yml` starts on `cms-publish`.
   - Other option: a Cloudflare Workers Builds deploy hook URL as `REBUILD_WEBHOOK_URL` (a plain POST).
10. Test: publish a news post in `/admin`. Wait 3 to 5 minutes. The post appears on the site.

## One command after step 1

```
./scripts/setup-cloudflare.sh   # once
./scripts/deploy.sh             # each deploy: migrate, CMS, site build
```

Both scripts can run again. Set `YES=1` to skip the prompts.
The site finds the CMS through `CMS_URL`. `deploy.sh` reads the CMS address from the deploy output and saves it in `.cloudflare.env`.
The build writes `CMS_URL` into the Worker `vars`, so the site needs no manual edit.
A service binding (see `cms/README.md`) is an option for run-time calls; the static pages do not need it.

See the section "CMS link" in `README.md` for the rebuild flow and the delay.
