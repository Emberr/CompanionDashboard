#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   ./scripts/setup-auth.sh <username> <password> [jwt-secret]
# Generates a bcrypt hash using Docker (no local Node needed) and writes .env for compose.

if [[ $# -lt 2 ]]; then
  echo "Usage: $0 <username> <password> [jwt-secret]" >&2
  exit 1
fi

USER="$1"
PASS="$2"
JWT="${3:-}"

if [[ -z "$JWT" ]]; then
  # Generate a random JWT secret
  if command -v openssl >/dev/null 2>&1; then
    JWT=$(openssl rand -hex 32)
  else
    JWT=$(LC_ALL=C tr -dc 'A-Za-z0-9' </dev/urandom | head -c 48)
  fi
fi

echo "Generating bcrypt hash in a disposable container..."
HASH=$(docker run --rm -i node:20-alpine sh -lc "npm -s add bcryptjs >/dev/null 2>&1 && node -e 'import(\"bcryptjs\").then(async m=>{const s=await m.genSalt(10);const h=await m.hash(process.argv[1],s);console.log(h);})' '$PASS'" )

if [[ -z "$HASH" ]]; then
  echo "Failed to generate bcrypt hash." >&2
  exit 1
fi

cat > .env <<EOF
AUTH_USERNAME=$USER
AUTH_PASSWORD_HASH=$HASH
JWT_SECRET=$JWT
# Set to true if serving over HTTPS to mark cookies Secure
COOKIE_SECURE=false
EOF

echo "\nWrote .env with AUTH_USERNAME, AUTH_PASSWORD_HASH, JWT_SECRET"
echo "You can now run: docker compose up -d --build"

