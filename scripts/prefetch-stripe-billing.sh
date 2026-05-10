#!/usr/bin/env bash
# Pre-fetch Stripe API data OUTSIDE the Claude sandbox.
# Called by .github/workflows/aeon.yml before Claude runs. Saves JSON responses
# to .stripe-cache/ so the stripe-billing skill can read them without curl auth
# headers (which the sandbox blocks via env-var expansion).
#
# Required secret: STRIPE_API_KEY
#   The operator must add this to GitHub Actions secrets AND expose it to the
#   Run pre-fetch scripts step in .github/workflows/aeon.yml as:
#     STRIPE_API_KEY: ${{ secrets.STRIPE_API_KEY }}
#
# Args (passed by the workflow):
#   $1 = skill name (we only fire when it equals stripe-billing)
#   $2 = var (optional integer hours window; default 24)
set -euo pipefail

SKILL="${1:-}"
VAR="${2:-}"

if [ "$SKILL" != "stripe-billing" ]; then
  exit 0
fi

if [ -z "${STRIPE_API_KEY:-}" ]; then
  echo "stripe-billing prefetch: STRIPE_API_KEY not set, skipping"
  exit 0
fi

if echo "$VAR" | grep -Eq '^[0-9]+$'; then
  HOURS="$VAR"
else
  HOURS=24
fi

CUTOFF_TS=$(date -u -d "${HOURS} hours ago" +%s 2>/dev/null || date -u -v-${HOURS}H +%s)

mkdir -p .stripe-cache

stripe_get() {
  local outfile="$1" path="$2"
  echo "stripe-billing prefetch: GET $path"
  local response http_code body curl_exit=0
  response=$(curl -s --max-time 30 -w "\n__HTTP_CODE__%{http_code}" \
    -G "https://api.stripe.com${path}" \
    -u "${STRIPE_API_KEY}:" 2>&1) || curl_exit=$?
  if [ "$curl_exit" -ne 0 ]; then
    echo "::warning::stripe-billing prefetch: curl error $curl_exit on $path"
    return 1
  fi
  http_code=$(echo "$response" | grep '__HTTP_CODE__' | sed 's/__HTTP_CODE__//')
  body=$(echo "$response" | grep -v '__HTTP_CODE__')
  if [ "$http_code" != "200" ]; then
    echo "::warning::stripe-billing prefetch: HTTP $http_code on $path"
    echo "::warning::body: $(echo "$body" | head -c 300)"
    return 1
  fi
  echo "$body" > ".stripe-cache/$outfile"
  echo "stripe-billing prefetch: saved $outfile ($(echo "$body" | wc -c | tr -d ' ') bytes)"
}

stripe_get "subscriptions.json" "/v1/subscriptions?status=all&limit=100" || true
stripe_get "charges.json" "/v1/charges?limit=100&created%5Bgte%5D=${CUTOFF_TS}" || true
stripe_get "balance.json" "/v1/balance" || true

echo "stripe-billing prefetch: done"
ls -la .stripe-cache/ 2>/dev/null || true
