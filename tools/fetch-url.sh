#!/usr/bin/env bash
# Usage: tools/fetch-url.sh "https://example.com"
# Returns clean markdown via Jina Reader (free, no API key)
set -euo pipefail

URL="$1"

curl -sL "https://r.jina.ai/${URL}" \
  -H "Accept: text/markdown" \
  -H "X-Return-Format: markdown"
