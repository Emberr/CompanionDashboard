#!/usr/bin/env bash
set -euo pipefail

# One-liner prod-style build + run with unique image tag per commit

NAME="companion-dashboard"
TAG="${1:-}"

if [[ -z "$TAG" ]]; then
  if command -v git >/dev/null 2>&1 && git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    TAG=$(git rev-parse --short HEAD)
  else
    TAG=$(date +%s)
  fi
fi

echo "Building image: ${NAME}:${TAG}"
docker build -t "${NAME}:${TAG}" .

echo "Stopping existing container (if any)"
docker rm -f "${NAME}" >/dev/null 2>&1 || true

echo "Starting ${NAME} on host port 5050 -> container 8080"
docker run -d --name "${NAME}" -p 5050:8080 "${NAME}:${TAG}"

echo "Done. Visit http://localhost:5050"
echo "Current image tag: ${TAG}"
