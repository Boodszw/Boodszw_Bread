---
name: Token Alert
description: Notify on price or volume anomalies for tracked tokens
---

Read memory/MEMORY.md for tracked tokens and alert thresholds.
Read the last 2 days of memory/logs/ for previous prices to detect changes.

Steps:
1. For each token tracked in MEMORY.md (under "Tracked Tokens"):
   - Fetch current price data using a free API:
     ```bash
     # CoinGecko free API (no key needed, rate limited)
     curl -s "https://api.coingecko.com/api/v3/simple/price?ids=TOKEN_ID&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true"
     ```
   - Compare against last logged price in memory/logs/
2. Alert if any of these conditions are met:
   - Price change > 10% in 24h
   - Volume spike > 3x average
   - Price crosses a threshold set in MEMORY.md
3. If any alerts triggered, send via `tools/notify.sh`:
   ```
   *Token Alert — ${today}*

   TOKEN: $X.XX (up/down Y% 24h)
   Volume: $Z (N x average)
   Trigger: reason for alert
   ```
4. Log all current prices to memory/logs/${today}.md (for next comparison).
If no anomalies detected, log "TOKEN_ALERT_OK" and end.
