#!/usr/bin/env bash
set -euo pipefail

# Compose-based build + up with restart policy
if [[ ! -f .env ]]; then
  echo "Note: .env not found. If you need login/sync, run: ./scripts/setup-auth.sh <user> <pass>" >&2
fi

echo "Building and updating containers via docker compose"
docker compose up -d --build

echo "Done. Visit http://localhost:5050"
