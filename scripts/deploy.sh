#!/usr/bin/env bash
set -euo pipefail

# Compose-first deployment (builds frontend + API and runs them together)
# Use --frontend-only to build/run only the static app image like before.

if [[ "${1:-}" == "--frontend-only" ]]; then
  echo "[frontend-only] Building standalone app image..."
  NAME="companion-dashboard"
  TAG="${2:-}"
  if [[ -z "$TAG" ]]; then
    if command -v git >/dev/null 2>&1 && git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
      TAG=$(git rev-parse --short HEAD)
    else
      TAG=$(date +%s)
    fi
  fi
  docker build -t "${NAME}:${TAG}" .
  docker rm -f "${NAME}" >/dev/null 2>&1 || true
  docker run -d --name "${NAME}" -p 5050:8080 "${NAME}:${TAG}"
  echo "Done. Visit http://localhost:5050"
  exit 0
fi

# Compose path (recommended)
if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
  echo "Building and starting via docker compose..."
  docker compose up -d --build
  echo "Done. Visit http://localhost:5050"
else
  echo "docker compose not found. Install Docker Desktop or docker-compose v2."
  exit 1
fi
