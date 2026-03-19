#!/usr/bin/env bash
set -euo pipefail

if [ -n "${1:-}" ]; then
  DATABASE_URL="$1"
fi

if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL is required. Set it or pass as first argument."
  exit 1
fi

shopt -s nullglob
migration_files=(db/migrations/*.sql)

if [ ${#migration_files[@]} -eq 0 ]; then
  echo "No migration files found in db/migrations."
  exit 0
fi

for migration in "${migration_files[@]}"; do
  echo "Applying ${migration}..."
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$migration"
done

echo "Migrations complete."
