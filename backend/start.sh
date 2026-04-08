#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

if [[ ! -f "dist/server.js" ]]; then
  echo "Missing dist/server.js. Run the backend build before starting."
  exit 1
fi

if [[ ! -f "dist/workers/email.worker.js" ]]; then
  echo "Missing dist/workers/email.worker.js. Run the backend build before starting."
  exit 1
fi

server_pid=""
worker_pid=""

shutdown() {
  local exit_code=${1:-0}

  trap - SIGINT SIGTERM EXIT

  if [[ -n "$server_pid" ]] && kill -0 "$server_pid" 2>/dev/null; then
    kill "$server_pid" 2>/dev/null || true
  fi

  if [[ -n "$worker_pid" ]] && kill -0 "$worker_pid" 2>/dev/null; then
    kill "$worker_pid" 2>/dev/null || true
  fi

  wait "$server_pid" "$worker_pid" 2>/dev/null || true

  exit "$exit_code"
}

trap 'shutdown 0' SIGINT SIGTERM
trap 'shutdown $?' EXIT

node dist/workers/email.worker.js &
worker_pid=$!
echo "Started email worker with PID $worker_pid"

node dist/server.js &
server_pid=$!
echo "Started API server with PID $server_pid"

set +e
wait -n "$server_pid" "$worker_pid"
exit_code=$?
set -e

echo "One process exited. Shutting down the remaining process..."
shutdown "$exit_code"