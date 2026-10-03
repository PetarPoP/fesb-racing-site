#!/usr/bin/env bash
# Deploy the CMS and then the site. It is safe to run again.
#   1. Show the account and ask for a check.
#   2. Migrate the remote D1, build and deploy the CMS (npm run deploy in cms/, works only with wrangler).
#   3. Set the CMS Worker secrets from cms/.secrets.env with cf.
#   4. Read the CMS address and keep it in .cloudflare.env (CMS_URL).
#   5. Build the site (prerender reads the CMS) and deploy it.
# Set YES=1 to skip the prompts. Set SKIP_CMS=1 or SKIP_SITE=1 to do one part.
set -euo pipefail
# shellcheck source=scripts/lib.sh
. "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

need cf "Install it: npm install -g cf"
need npm "Install Node.js 24."
grep -rq "PLACEHOLDER_D1_DATABASE_ID\|placeholder-fesb-racing-media" "$CMS_DIR/wrangler.jsonc" "$CMS_DIR/cloudflare.config.ts" \
  && die "The config still has placeholders. Run ./scripts/setup-cloudflare.sh first."

show_account

if [ "${SKIP_CMS:-0}" != "1" ]; then
  say "CMS: migrate, build and deploy"
  [ -f "$SECRETS_FILE" ] || die "Missing $SECRETS_FILE. Run ./scripts/setup-cloudflare.sh first."
  info "WARNING: this step works only with wrangler. 'npm run deploy' in cms/ runs the Payload migration"
  info "(wrangler library) and 'opennextjs-cloudflare deploy' (wrangler inside). cf has no command for it yet."
  confirm "Migrate the REMOTE database and deploy the CMS Worker '$CMS_WORKER'?" || die "Stopped."
  OUT="$(mktemp)"
  (cd "$CMS_DIR" && npm run deploy) 2>&1 | tee "$OUT"
  FOUND="$(grep -Eo 'https://[A-Za-z0-9.-]+\.workers\.dev' "$OUT" | head -n 1 || true)"
  rm -f "$OUT"
  if [ -n "$FOUND" ]; then
    env_set "$ENV_FILE" CMS_URL "$FOUND"
    info "CMS_URL=$FOUND (saved in .cloudflare.env)"
  fi

  say "CMS: Worker secrets (cf)"
  while IFS='=' read -r key value; do
    [ -n "$key" ] || continue
    info "Set secret $key"
    cf workers secrets update "$key" --worker "$CMS_WORKER" --text "$value" >/dev/null
  done < "$SECRETS_FILE"
  info "First deploy only: load the data with: cd cms && NODE_ENV=production npm run seed"
fi

if [ "${SKIP_SITE:-0}" != "1" ]; then
  say "Site: build and deploy"
  CMS_URL="${CMS_URL:-$(env_get "$ENV_FILE" CMS_URL)}"
  if [ -z "$CMS_URL" ]; then
    ask CMS_URL "Public URL of the CMS Worker (https://...)" ""
    [ -n "$CMS_URL" ] || die "CMS_URL is needed. The site build reads the news from it."
    env_set "$ENV_FILE" CMS_URL "$CMS_URL"
  fi
  export CMS_URL
  [ -d "$ROOT/node_modules" ] || (cd "$ROOT" && npm install)
  (cd "$ROOT" && npm run build)
  info "Prerendered pages: $(find "$ROOT/.output/public" -name '*.html' | wc -l)"
  if [ -f "$ROOT/.cloudflare/output/v0/config.json" ]; then
    (cd "$ROOT" && cf deploy --prebuilt)
  else
    cat <<'MSG'
   The build is ready in .output (Nitro cloudflare-module: .output/server and .output/public).
   cf deploy needs a Build Output Specification, and Nitro does not write one yet.
   This upload step works only with wrangler. See DEPLOY.md, step "Deploy the site".
MSG
  fi
fi

say "Done"
info "Last step: set the deploy hook in the CMS (REBUILD_WEBHOOK_URL). See DEPLOY.md."
