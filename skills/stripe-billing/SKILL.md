---
name: Stripe Billing Monitor
description: Daily Stripe summary — subscription health, recent payments, failed charges, revenue total
var: ""
tags: [dev]
---
> **${var}** — Optional integer hours window for "recent" payments and failed charges (e.g. `48`). Empty = 24 hours. Non-numeric values fall back to 24 with a warning logged to `memory/logs/${today}.md`.

Today is ${today}. Your task is to read pre-fetched Stripe API data from `.stripe-cache/`, summarize subscription health, list recent payments, flag failed charges in the configured window, compute total revenue, and ship a one-shot operator-facing notification.

## Steps

1. **Guard on prefetch.** The Stripe API requires auth headers and the sandbox blocks env-var expansion in `curl`, so `scripts/prefetch-stripe-billing.sh` runs before this skill (see `## Sandbox note`). Verify the cache exists and the secret was set:
   ```bash
   if [ ! -d .stripe-cache ] || [ ! -s .stripe-cache/subscriptions.json ]; then
     ./notify "stripe-billing skipped: STRIPE_API_KEY not set or prefetch failed — add the secret to GitHub Actions and re-run"
     exit 0
   fi
   ```
   The prefetch script writes one of two files when the key is missing: nothing at all, or empty cache. Treat both as "skip cleanly". Exit 0, never fail loudly.

2. **Parse the window.** Resolve the hours window:
   ```bash
   if echo "${var}" | grep -Eq '^[0-9]+$'; then
     HOURS="${var}"
   else
     HOURS=24
     [ -n "${var}" ] && echo "[$(date -u +%H:%M)] stripe-billing: var '${var}' not numeric, defaulting to 24h" >> "memory/logs/${today}.md"
   fi
   CUTOFF_TS=$(date -u -d "${HOURS} hours ago" +%s 2>/dev/null || date -u -v-${HOURS}H +%s)
   ```
   Use `$CUTOFF_TS` to filter charges by `created` (Stripe uses Unix seconds).

3. **Summarize subscription health.** Read `.stripe-cache/subscriptions.json` (Stripe `GET /v1/subscriptions?status=all&limit=100`). Bucket by `status` and capture `cancel_at_period_end` pending churn:
   ```bash
   jq -r '
     .data
     | group_by(.status)
     | map({status: .[0].status, n: length})
     | (.[] | "\(.status): \(.n)")
   ' .stripe-cache/subscriptions.json
   PENDING_CANCEL=$(jq '[.data[] | select(.cancel_at_period_end == true and .status == "active")] | length' .stripe-cache/subscriptions.json)
   PAST_DUE=$(jq '[.data[] | select(.status == "past_due")] | length' .stripe-cache/subscriptions.json)
   ACTIVE=$(jq '[.data[] | select(.status == "active")] | length' .stripe-cache/subscriptions.json)
   TRIALING=$(jq '[.data[] | select(.status == "trialing")] | length' .stripe-cache/subscriptions.json)
   ```
   Note: results are capped at the prefetch limit (100). If `has_more=true`, append a `(showing first 100)` note in the output.

4. **List recent payments + total revenue.** Read `.stripe-cache/charges.json` (Stripe `GET /v1/charges?limit=100` with `created[gte]={CUTOFF_TS}`). Compute totals from `succeeded` charges only, treating `amount` as integer minor units (cents) and respecting per-charge `currency`:
   ```bash
   # Group succeeded charges by currency, sum amount, return "USD: 1234.56" lines
   REVENUE=$(jq -r --argjson cutoff "$CUTOFF_TS" '
     [.data[] | select(.status == "succeeded" and .created >= $cutoff)]
     | group_by(.currency)
     | map({cur: (.[0].currency | ascii_upcase), total: (map(.amount) | add)})
     | (.[] | "\(.cur): \(.total / 100 | tostring)")
   ' .stripe-cache/charges.json)
   PAID_COUNT=$(jq --argjson cutoff "$CUTOFF_TS" '[.data[] | select(.status == "succeeded" and .created >= $cutoff)] | length' .stripe-cache/charges.json)
   ```
   Pick the **top 5 succeeded charges by amount** for the notification:
   ```bash
   jq -r --argjson cutoff "$CUTOFF_TS" '
     [.data[] | select(.status == "succeeded" and .created >= $cutoff)]
     | sort_by(-.amount) | .[0:5]
     | (.[] | "- \(.amount / 100) \(.currency | ascii_upcase) — https://dashboard.stripe.com/payments/\(.id)")
   ' .stripe-cache/charges.json
   ```

5. **Detect failed charges.** Same source. Filter `status == "failed"` within the window. List up to 10 with reason and dashboard link:
   ```bash
   FAILED_COUNT=$(jq --argjson cutoff "$CUTOFF_TS" '[.data[] | select(.status == "failed" and .created >= $cutoff)] | length' .stripe-cache/charges.json)
   FAILED_LINES=$(jq -r --argjson cutoff "$CUTOFF_TS" '
     [.data[] | select(.status == "failed" and .created >= $cutoff)]
     | sort_by(-.created) | .[0:10]
     | (.[] | "- \(.amount / 100) \(.currency | ascii_upcase) — \(.failure_message // .failure_code // "unknown reason") — https://dashboard.stripe.com/payments/\(.id)")
   ' .stripe-cache/charges.json)
   ```
   If `FAILED_COUNT > 0`, mark the notification with a `⚠` flag and surface the list. Stripe's `failure_message` is a human-readable string; `failure_code` is the machine code — fall back to whichever is non-null.

6. **Read available balance.** Optional — read `.stripe-cache/balance.json` if present (Stripe `GET /v1/balance`):
   ```bash
   if [ -s .stripe-cache/balance.json ]; then
     jq -r '.available[] | "\(.currency | ascii_upcase) available: \(.amount / 100)"' .stripe-cache/balance.json
   fi
   ```
   Skip silently if the file is missing.

7. **Log.** Append to `memory/logs/${today}.md`:
   ```
   ### stripe-billing
   - Window: ${HOURS}h
   - Subscriptions: ${ACTIVE} active, ${TRIALING} trialing, ${PAST_DUE} past_due, ${PENDING_CANCEL} pending-cancel
   - Payments: ${PAID_COUNT} succeeded
   - Revenue: ${REVENUE}
   - Failed: ${FAILED_COUNT}
   - Exit: STRIPE_BILLING_OK (or STRIPE_BILLING_NO_KEY if step 1 short-circuited)
   ```

8. **Notify.** Send via `./notify` (single message, ≤4000 chars total). Format:
   ```
   *Stripe billing — ${HOURS}h window*
   Subscriptions: ${ACTIVE} active · ${TRIALING} trialing · ${PAST_DUE} past_due · ${PENDING_CANCEL} pending-cancel
   Revenue: ${REVENUE}
   Payments: ${PAID_COUNT} succeeded
   ${FAILED_COUNT > 0 ? "⚠ Failed: ${FAILED_COUNT}" : "Failed: 0"}

   *Top payments*
   {top 5 succeeded charges, one per line, full https://dashboard.stripe.com/payments/{id} URL}

   {If failures > 0:}
   *Failures*
   {failed charges block from step 5, one per line, full URL}

   {If balance present:}
   Available: {currency totals from step 6}
   ```
   Truncate the failures list before the URL list — never split a URL across the 4000-char boundary. If the joined message would exceed 4000 chars, drop the failures block and append `(more failures — see Stripe dashboard)` instead. If `PAID_COUNT == 0` and `FAILED_COUNT == 0` and no subscription change since yesterday's log, send the notification anyway (operators rely on the daily heartbeat to know the skill ran).

## Sandbox note

Stripe API requires a secret-key header (`Authorization: Bearer $STRIPE_API_KEY` or `-u "$STRIPE_API_KEY:"`), which means in-Claude `curl` can't make the calls — the GitHub Actions sandbox blocks env-var expansion in headers. This skill uses the **pre-fetch** pattern (per CLAUDE.md):

- `scripts/prefetch-stripe-billing.sh` runs before Claude starts, with full env access. It checks `STRIPE_API_KEY`, calls `https://api.stripe.com/v1/subscriptions`, `https://api.stripe.com/v1/charges`, and `https://api.stripe.com/v1/balance`, and writes JSON to `.stripe-cache/`.
- If `STRIPE_API_KEY` is unset, the prefetch script exits 0 silently. Step 1 of this skill detects the missing cache and notifies a clean abort.
- The operator must add `STRIPE_API_KEY: ${{ secrets.STRIPE_API_KEY }}` to the `Run pre-fetch scripts` env block in `.github/workflows/aeon.yml` for the prefetch script to see the secret.

`WebFetch` is **not** a viable fallback for Stripe — it can't send custom auth headers. Pre-fetch is the only correct pattern here.
