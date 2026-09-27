#!/usr/bin/env bash
# Keeps the trip site up. Run it under tmux so it survives the terminal:
#   tmux new -d -s trip-site trip-site/serve.sh
#   tmux attach -t trip-site
# bun --watch reloads on edits to index.ts / data.json; the loop covers a
# crash or a syntax error that takes the process down entirely.
set -u
cd "$(dirname "$0")/.."
export PORT="${PORT:-3000}"
LOG="${LOG:-/tmp/trip-site.log}"

while true; do
  echo "=== $(date -Is) starting trip site on :$PORT ===" | tee -a "$LOG"
  bun --watch trip-site/index.ts 2>&1 | tee -a "$LOG"
  echo "=== $(date -Is) exited (code ${PIPESTATUS[0]}), restarting in 2s ===" | tee -a "$LOG"
  sleep 2
done
