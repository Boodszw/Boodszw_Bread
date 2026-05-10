---
name: Playwright Fetch
description: Browser-render a JS-heavy URL via headless Chromium with WebFetch fallback
var: ""
tags: [dev, research]
---
> **${var}** — Target URL plus optional extraction directives, pipe-separated. **Required.** Examples: `https://news.ycombinator.com`, `https://www.coingecko.com/en/coins/ethereum|selector:[data-coin-symbol]`, `https://github.com/anthropics/anthropic-sdk-python|extract:latest release tag`. If empty, exit `PLAYWRIGHT_FETCH_NO_VAR` and notify.

Today is ${today}. Your task is to scrape a JavaScript-heavy page that resists `curl` / `WebFetch`, capturing rendered HTML, a full-page screenshot, and any requested extractions. Claude's bash sandbox cannot launch Chromium during the run, so the actual browser work runs in `scripts/postprocess-playwright.sh` after Claude exits. This skill queues the job, does an immediate WebFetch preview as a fallback, and writes a summary the operator (or a downstream skill) can read once postprocess finishes.

## Steps

1. **Validate var.** If `${var}` is empty:
   ```bash
   ./notify "playwright-fetch aborted: var empty — pass a URL e.g. \"https://news.ycombinator.com|selector:.titleline\""
   exit 0
   ```
   Otherwise, parse:
   ```bash
   RAW="${var}"
   URL=$(printf '%s' "$RAW" | awk -F'|' '{print $1}' | xargs)
   SELECTOR=""
   EXTRACT=""
   IFS='|' read -ra PARTS <<< "$RAW"
   for part in "${PARTS[@]:1}"; do
     case "$part" in
       selector:*) SELECTOR="${part#selector:}" ;;
       extract:*)  EXTRACT="${part#extract:}" ;;
     esac
   done
   ```
   Reject anything that isn't an `http://` or `https://` URL with a public host (block `localhost`, `127.`, `0.0.0.0`, `::1`, `169.254.`, `10.`, `192.168.`, `172.16.`-`172.31.`):
   ```bash
   case "$URL" in
     http://*|https://*) ;;
     *) ./notify "playwright-fetch aborted: invalid URL scheme — \"$URL\""; exit 0 ;;
   esac
   HOST=$(printf '%s' "$URL" | sed -E 's#^https?://([^/:]+).*#\1#')
   case "$HOST" in
     localhost|127.*|0.0.0.0|::1|169.254.*|10.*|192.168.*|172.1[6-9].*|172.2[0-9].*|172.3[0-1].*)
       ./notify "playwright-fetch aborted: refused private/loopback host — $HOST"; exit 0 ;;
   esac
   SLUG=$(printf '%s' "$RAW" | sha1sum | cut -c1-12)
   ```

2. **Queue the Playwright job.** Write a JSON spec to `.pending-playwright/${SLUG}.json` — the postprocess script will pick it up after Claude finishes, install Playwright + Chromium if needed, and write outputs to `.playwright-cache/${SLUG}.{html,png,json}`:
   ```bash
   mkdir -p .pending-playwright
   jq -n \
     --arg url "$URL" \
     --arg selector "$SELECTOR" \
     --arg extract "$EXTRACT" \
     --arg slug "$SLUG" \
     --arg queued_at "$(date -u +%FT%TZ)" \
     '{url:$url, selector:$selector, extract:$extract, slug:$slug, queued_at:$queued_at}' \
     > ".pending-playwright/${SLUG}.json"
   ```

3. **WebFetch preview.** Run the built-in **WebFetch** tool on `$URL` with a prompt of `"Summarize the visible content. If asked, focus on: ${SELECTOR:-${EXTRACT:-general overview}}. Return at most 1500 chars."` Save the response to `.outputs/playwright-fetch-${SLUG}.txt`. If WebFetch fails (auth wall, JS-only page returning empty body, blocked), record `webfetch_status=failed` with a one-line reason — Playwright postprocess will still run.

4. **Write skill output.** Append a Markdown summary to `.outputs/playwright-fetch.md` (overwrite the section for this slug if already present):
   ```
   # playwright-fetch — ${SLUG}
   - URL: ${URL}
   - Selector: ${SELECTOR:-(none)}
   - Extract hint: ${EXTRACT:-(none)}
   - Queued: .pending-playwright/${SLUG}.json
   - Postprocess output: .playwright-cache/${SLUG}.{html,png,json}
   - WebFetch preview:
   {WebFetch text or "(failed: <reason>)"}
   ```

5. **Log.** Append to `memory/logs/${today}.md`:
   ```
   ### playwright-fetch
   - var: {first 80 chars of ${var}}
   - slug: ${SLUG}
   - host: ${HOST}
   - WebFetch preview: ok | failed (<reason>)
   - Playwright job queued: .pending-playwright/${SLUG}.json
   - Exit: PLAYWRIGHT_FETCH_OK
   ```

6. **Notify.** Send via `./notify` (≤4000 chars total — truncate the preview if needed):
   ```
   *playwright-fetch — ${SLUG}*
   URL: ${URL}
   ${SELECTOR:+Selector: \`$SELECTOR\`}
   ${EXTRACT:+Extract: $EXTRACT}
   WebFetch preview:
   {first ~1500 chars of preview, or "failed — Playwright postprocess will retry"}
   Full results when postprocess finishes: \`.playwright-cache/${SLUG}.{html,png,json}\`
   ```

## Sandbox note

Claude's bash sandbox in GitHub Actions blocks Chromium binaries. **Pattern: post-process.** This skill writes a job spec to `.pending-playwright/${SLUG}.json` during its run; `scripts/postprocess-playwright.sh` runs after Claude exits (full env, no sandbox), runs `npm i playwright` + `npx playwright install chromium` if absent, executes the job, and saves outputs. **WebFetch fallback**: every run also performs an immediate WebFetch on the URL so the operator gets text content even when Playwright is unavailable on a particular runner (e.g. when `npm install` is blocked by network policy). Both paths are captured in the notification.

## Exit taxonomy

| Code | When | Action |
|------|------|--------|
| `PLAYWRIGHT_FETCH_OK` | URL valid, job queued, WebFetch preview saved | Notify with preview + cache paths |
| `PLAYWRIGHT_FETCH_NO_VAR` | `${var}` empty | Notify abort reason; stop |
| `PLAYWRIGHT_FETCH_INVALID_URL` | URL fails scheme/host validation (SSRF guard) | Notify abort reason; stop |

## Constraints

- Only `http://` / `https://` URLs. Reject loopback / private-network hosts (SSRF guard).
- No new API keys. Playwright is an npm package, not an authed service.
- `.pending-playwright/` and `.playwright-cache/` are runtime directories — neither is committed.
- Do not embed secrets, cookies, or auth headers in the queued job spec.
- Per-job timeout enforced by postprocess (90s / page).
