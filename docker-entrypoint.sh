#!/bin/sh
set -e

echo "Running database migration..."
/usr/local/bin/biway-admin db-migration --database "${BIWAY_DB_PATH}"

echo "Starting biway-admin on ${BIWAY_LISTEN}:${BIWAY_PORT}..."
exec /usr/local/bin/biway-admin serve \
  --listen "${BIWAY_LISTEN}" \
  --port "${BIWAY_PORT}" \
  --database "${BIWAY_DB_PATH}" \
  --config "/data/biway.yml"