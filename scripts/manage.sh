#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR=$(cd "$(dirname "$0")/.." && pwd)
cd "$ROOT_DIR"

APP_NAME="companion-dashboard"
API_NAME="companion-dashboard-api"
APP_URL="${APP_URL:-http://localhost:5050}"

# Detect docker compose (v2 preferred)
if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
  COMPOSE=(docker compose)
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE=(docker-compose)
else
  echo "Docker Compose not found. Install Docker Desktop or docker-compose v2." >&2
  exit 1
fi

say() { echo -e "\033[1;36m[manage]\033[0m $*"; }
warn() { echo -e "\033[1;33m[warn]\033[0m $*"; }
err() { echo -e "\033[1;31m[error]\033[0m $*"; }

need_cmd() {
  command -v "$1" >/dev/null 2>&1 || { err "Missing required command: $1"; exit 1; }
}

gen_bcrypt() {
  local pass="$1"
  docker run --rm -i node:20-alpine sh -lc "npm -s add bcryptjs >/dev/null 2>&1 && node -e 'import(\"bcryptjs\").then(async m=>{const s=await m.genSalt(10);const h=await m.hash(process.argv[1],s);console.log(h);})' '$pass'"
}

cmd_help() {
  cat <<EOF
Usage: ./scripts/manage.sh <command> [args]

Commands:
  setup-auth <user> <pass> [jwt]   Generate bcrypt hash + write .env (API auth)
  deploy                            Build + start via docker compose
  redeploy                          Stop + remove containers, then deploy
  status                            Show compose services status
  logs [service]                    Tail logs (default: app and api)
  down [--purge]                    Stop and remove containers (purge also removes volume)
  reset-auth                        Remove stored auth (enables signup again)
  doctor                            Run diagnostics against running stack
  open                              Print URL and try to open in browser

Env:
  APP_URL         Default: $APP_URL
EOF
}

ensure_env_local() {
  if [[ ! -f .env.local ]]; then
    warn ".env.local not found. Vite keys won't be baked. Create it with VITE_GEMINI_API_KEY=..."
  else
    say "Found .env.local"
  fi
}

ensure_env_api() {
  if [[ ! -f .env ]]; then
    warn ".env not found. Run: ./scripts/manage.sh setup-auth <user> <pass>"
    return 1
  else
    say "Found .env"
  fi
}

cmd_setup_auth() {
  local user="${1:-}" pass="${2:-}" jwt="${3:-}"
  [[ -z "$user" || -z "$pass" ]] && { err "Usage: ./scripts/manage.sh setup-auth <user> <pass> [jwt]"; exit 1; }

  say "Generating bcrypt hash..."
  local hash
  hash=$(gen_bcrypt "$pass")
  if [[ -z "$hash" ]]; then err "Failed to generate bcrypt hash"; exit 1; fi

  if [[ -z "$jwt" ]]; then
    if command -v openssl >/dev/null 2>&1; then
      jwt=$(openssl rand -hex 32)
    else
      jwt=$(LC_ALL=C tr -dc 'A-Za-z0-9' </dev/urandom | head -c 48)
    fi
  fi

  cat > .env <<EOF
AUTH_USERNAME=$user
AUTH_PASSWORD_HASH=$hash
JWT_SECRET=$jwt
COOKIE_SECURE=false
EOF
  say "Wrote .env with AUTH_USERNAME, AUTH_PASSWORD_HASH, JWT_SECRET"
}

cmd_deploy() {
  ensure_env_local || true
  ensure_env_api || true
  say "Building and starting via docker compose..."
  "${COMPOSE[@]}" up -d --build
  say "Done. URL: $APP_URL"
}

cmd_redeploy() {
  say "Stopping containers..."
  "${COMPOSE[@]}" down || true
  cmd_deploy
}

cmd_status() {
  "${COMPOSE[@]}" ps
}

cmd_logs() {
  local svc="${1:-}"
  if [[ -z "$svc" ]]; then
    "${COMPOSE[@]}" logs -f app api
  else
    "${COMPOSE[@]}" logs -f "$svc"
  fi
}

cmd_down() {
  local purge="${1:-}"
  if [[ "$purge" == "--purge" ]]; then
    warn "Removing containers and volumes (data will be deleted)"
    "${COMPOSE[@]}" down -v || true
  else
    "${COMPOSE[@]}" down || true
  fi
}

cmd_reset_auth() {
  say "Removing stored auth file to re-enable signup..."
  "${COMPOSE[@]}" exec -T api sh -lc 'rm -f /app/data/auth.json && ls -l /app/data || true' || warn "API not running; run deploy first"
}

cmd_doctor() {
  say "Compose status:"; "${COMPOSE[@]}" ps || true
  echo
  say "API health:"; curl -fsS "$APP_URL/api/health" || echo "(unreachable)"
  echo
  say "Auth debug:"; curl -fsS "$APP_URL/api/auth/debug" || echo "(unreachable)"
  echo
  say "Env files:"; ls -l .env .env.local 2>/dev/null || true
}

cmd_open() {
  say "URL: $APP_URL"
  if command -v xdg-open >/dev/null 2>&1; then xdg-open "$APP_URL" >/dev/null 2>&1 || true; fi
  if command -v open >/dev/null 2>&1; then open "$APP_URL" >/dev/null 2>&1 || true; fi
}

case "${1:-help}" in
  help|-h|--help) shift; cmd_help "$@" ;;
  setup-auth) shift; cmd_setup_auth "$@" ;;
  deploy) shift; cmd_deploy "$@" ;;
  redeploy) shift; cmd_redeploy "$@" ;;
  status) shift; cmd_status "$@" ;;
  logs) shift; cmd_logs "$@" ;;
  down) shift; cmd_down "$@" ;;
  reset-auth) shift; cmd_reset_auth "$@" ;;
  doctor) shift; cmd_doctor "$@" ;;
  open) shift; cmd_open "$@" ;;
  *) err "Unknown command: ${1:-}"; cmd_help; exit 1 ;;
esac

