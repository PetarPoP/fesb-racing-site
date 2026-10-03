#!/usr/bin/env bash
# One-time setup for the Cloudflare resources. It is safe to run again.
#   1. Show the account and ask for a check.
#   2. Create the D1 database and the R2 bucket with cf (only when they do not exist).
#   3. Write the real IDs into cms/wrangler.jsonc and cms/cloudflare.config.ts.
#   4. Ask for the Worker secrets and save them in cms/.secrets.env (deploy.sh sets them with cf).
# Set YES=1 to accept the defaults without a prompt. Set DRY_RUN=1 to change nothing.
set -euo pipefail
# shellcheck source=scripts/lib.sh
. "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

need cf "Install it: npm install -g cf"
need python3 "It reads the JSON answers of cf."
DRY_RUN="${DRY_RUN:-0}"
run() { if [ "$DRY_RUN" = "1" ]; then info "[dry run] $*"; else "$@"; fi; }

show_account

WRANGLER="$CMS_DIR/wrangler.jsonc"
CFCONF="$CMS_DIR/cloudflare.config.ts"
[ -f "$WRANGLER" ] && [ -f "$CFCONF" ] || die "Run this script in the repository. Missing cms/wrangler.jsonc or cms/cloudflare.config.ts."

# ---- D1 ----
say "D1 database: $D1_NAME"
D1_ID="$(sed -n 's/.*"database_id": *"\([^"]*\)".*/\1/p' "$WRANGLER" | head -n 1)"
if [ -n "$D1_ID" ] && [ "$D1_ID" != "PLACEHOLDER_D1_DATABASE_ID" ]; then
  info "wrangler.jsonc already has the ID $D1_ID. Nothing to create."
else
  D1_ID="$(cf d1 list --name "$D1_NAME" 2>/dev/null | json_id_by_name "$D1_NAME" || true)"
  if [ -z "$D1_ID" ]; then
    confirm "Create the D1 database '$D1_NAME'?" || die "Stopped."
    run cf d1 create --name "$D1_NAME"
    if [ "$DRY_RUN" = "1" ]; then D1_ID="DRY_RUN_ID"; else D1_ID="$(cf d1 list --name "$D1_NAME" | json_id_by_name "$D1_NAME")"; fi
  else
    info "The database exists already: $D1_ID"
  fi
  [ -n "$D1_ID" ] || die "Could not read the D1 ID. Run: cf d1 list --name $D1_NAME"
  info "Write the ID into the config files."
  if [ "$DRY_RUN" != "1" ]; then
    sed -i "s|PLACEHOLDER_D1_DATABASE_ID|$D1_ID|g" "$WRANGLER" "$CFCONF"
  fi
fi

# ---- R2 ----
say "R2 bucket: $R2_BUCKET"
if cf r2 buckets list 2>/dev/null | grep -q "\"$R2_BUCKET\""; then
  info "The bucket exists already."
else
  confirm "Create the R2 bucket '$R2_BUCKET'?" || die "Stopped."
  run cf r2 buckets create-by-name "$R2_BUCKET"
fi
if [ "$DRY_RUN" != "1" ]; then
  sed -i "s|placeholder-fesb-racing-media|$R2_BUCKET|g" "$WRANGLER" "$CFCONF"
fi

# ---- Secrets ----
say "Worker secrets for the CMS (saved in cms/.secrets.env, not in git)"
PAYLOAD_SECRET="$(env_get "$SECRETS_FILE" PAYLOAD_SECRET)"
if [ -z "$PAYLOAD_SECRET" ]; then
  need openssl "It makes the PAYLOAD_SECRET."
  PAYLOAD_SECRET="$(openssl rand -hex 32)"
  info "Made a new PAYLOAD_SECRET."
else
  info "PAYLOAD_SECRET exists already. It is kept."
fi
FRONTEND_URL="$(env_get "$SECRETS_FILE" FRONTEND_URL)"
ask FRONTEND_URL "Public URL of the site (for live preview, empty = later)" "${FRONTEND_URL:-}"
REBUILD_WEBHOOK_URL="$(env_get "$SECRETS_FILE" REBUILD_WEBHOOK_URL)"
ask REBUILD_WEBHOOK_URL "Deploy hook URL (REBUILD_WEBHOOK_URL, empty = later)" "${REBUILD_WEBHOOK_URL:-}"
if [ "$DRY_RUN" != "1" ]; then
  env_set "$SECRETS_FILE" PAYLOAD_SECRET "$PAYLOAD_SECRET"
  if [ -n "$FRONTEND_URL" ]; then env_set "$SECRETS_FILE" FRONTEND_URL "$FRONTEND_URL"; fi
  if [ -n "$REBUILD_WEBHOOK_URL" ]; then env_set "$SECRETS_FILE" REBUILD_WEBHOOK_URL "$REBUILD_WEBHOOK_URL"; fi
fi

# ---- Local file for the site build ----
say "CMS address for the site"
if [ -z "$(env_get "$ENV_FILE" CMS_URL)" ]; then
  info "CMS_URL is not known yet. deploy.sh reads it from the CMS deploy and writes it to .cloudflare.env."
else
  info "CMS_URL=$(env_get "$ENV_FILE" CMS_URL)"
fi

say "Done. Next: ./scripts/deploy.sh"
