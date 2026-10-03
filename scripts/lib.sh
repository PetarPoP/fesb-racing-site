# Shared helpers for setup-cloudflare.sh and deploy.sh. Source this file. Do not run it.
# shellcheck shell=bash

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CMS_DIR="$ROOT/cms"
ENV_FILE="$ROOT/.cloudflare.env"      # local values: CMS_URL (not in git)
SECRETS_FILE="$CMS_DIR/.secrets.env"  # CMS Worker secrets (not in git)

# Names. Change them with an environment variable before the first run.
D1_NAME="${D1_NAME:-fesb-racing-cms}"
R2_BUCKET="${R2_BUCKET:-fesb-racing-media}"
CMS_WORKER="${CMS_WORKER:-fesb-racing-cms}"  # must match "name" in cms/wrangler.jsonc

say()  { printf '\n== %s\n' "$*"; }
info() { printf '   %s\n' "$*"; }
die()  { printf 'ERROR: %s\n' "$*" >&2; exit 1; }

need() { command -v "$1" >/dev/null 2>&1 || die "Missing command: $1. $2"; }

# Ask a yes/no question. YES=1 answers yes without a prompt. Default is no.
confirm() {
  [ "${YES:-0}" = "1" ] && return 0
  local answer
  read -r -p "$1 [y/N] " answer
  [ "$answer" = "y" ] || [ "$answer" = "Y" ]
}

# Ask for a value. Usage: ask VAR "Prompt" [default]
ask() {
  local var="$1" prompt="$2" default="${3:-}" value
  if [ -n "${!var:-}" ]; then return 0; fi
  if [ "${YES:-0}" = "1" ]; then printf -v "$var" '%s' "$default"; return 0; fi
  read -r -p "$prompt${default:+ [$default]}: " value
  printf -v "$var" '%s' "${value:-$default}"
}

# Show the account that cf uses. The user must check it before any change.
show_account() {
  say "Cloudflare account"
  cf auth whoami || die "cf is not logged in. Run: cf auth login"
  confirm "Is this the right account?" || die "Stopped. Use: cf auth login --help or --profile to change the account."
}

# Find the id of a named object in a JSON answer from cf. Reads stdin. Prints the id or nothing.
json_id_by_name() {
  python3 -c '
import json, sys
name = sys.argv[1]
try:
    data = json.load(sys.stdin)
except Exception:
    sys.exit(0)
def walk(x):
    if isinstance(x, dict):
        if x.get("name") == name:
            for key in ("uuid", "id"):
                if x.get(key):
                    print(x[key])
                    return True
        return any(walk(v) for v in x.values())
    if isinstance(x, list):
        return any(walk(v) for v in x)
    return False
walk(data)
' "$1"
}

# Read or write one KEY=value line in an env file.
env_get() { [ -f "$1" ] && sed -n "s/^$2=//p" "$1" | tail -n 1 || true; }
env_set() {
  local file="$1" key="$2" value="$3"
  touch "$file"; chmod 600 "$file"
  if grep -q "^$key=" "$file"; then
    local tmp; tmp="$(mktemp)"
    grep -v "^$key=" "$file" > "$tmp"; printf '%s=%s\n' "$key" "$value" >> "$tmp"; cat "$tmp" > "$file"; rm -f "$tmp"
  else
    printf '%s=%s\n' "$key" "$value" >> "$file"
  fi
}
