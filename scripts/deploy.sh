#!/usr/bin/env bash
set -euo pipefail

echo "This script is deprecated. Use: ./scripts/manage.sh deploy"
exec ./scripts/manage.sh deploy "$@"
