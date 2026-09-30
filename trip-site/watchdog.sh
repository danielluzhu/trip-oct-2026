#!/usr/bin/env bash
# Run from cron every minute (and @reboot). serve.sh already restarts bun when
# it crashes; this covers the rest: the tmux session gone (killed, reboot) or
# a server that is running but has stopped answering.
set -u
cd "$(dirname "$0")/.."
export PATH="$HOME/.bun/bin:/usr/local/bin:/usr/bin:/bin"
PORT="${PORT:-3000}"
LOG="${LOG:-/tmp/trip-site.log}"
SESSION=trip-site

healthy() { curl -fs -o /dev/null --max-time 5 "http://localhost:$PORT/"; }

healthy && exit 0

if tmux has-session -t "$SESSION" 2>/dev/null; then
  # Give serve.sh's own restart loop (and bun --watch reloads) a chance first.
  sleep 15
  healthy && exit 0
  echo "=== $(date -Is) watchdog: no response on :$PORT, restarting session ===" >> "$LOG"
  tmux kill-session -t "$SESSION"
else
  echo "=== $(date -Is) watchdog: session missing, starting ===" >> "$LOG"
fi
pkill -f "bun --watch trip-site/index.ts" 2>/dev/null
tmux new -d -s "$SESSION" trip-site/serve.sh
