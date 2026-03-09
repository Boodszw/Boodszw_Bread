#!/usr/bin/env bash
# Backup web search via Tavily API.
# Use Claude Code's built-in WebSearch first — only use this as a fallback.
# Usage: tools/web-search.sh "query" [max_results]
# Requires: TAVILY_API_KEY
set -euo pipefail

QUERY="$1"
MAX_RESULTS="${2:-5}"

if [ -z "${TAVILY_API_KEY:-}" ]; then
  echo "TAVILY_API_KEY not set — use Claude Code's built-in WebSearch instead." >&2
  exit 1
fi

curl -s "https://api.tavily.com/search" \
  -H "Content-Type: application/json" \
  -d "$(jq -n \
    --arg q "$QUERY" \
    --argjson max "$MAX_RESULTS" \
    '{
      api_key: env.TAVILY_API_KEY,
      query: $q,
      max_results: $max,
      include_answer: true,
      include_raw_content: false
    }')"
