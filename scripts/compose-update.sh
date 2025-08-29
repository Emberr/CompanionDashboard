#!/usr/bin/env bash
set -euo pipefail

# Compose-based build + up with restart policy

echo "Building and updating container via docker compose"
docker compose up -d --build

echo "Done. Visit http://localhost:5050"
