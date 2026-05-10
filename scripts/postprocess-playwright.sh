#!/usr/bin/env bash
# Post-process Playwright jobs queued by the playwright-fetch skill.
# Reads .pending-playwright/*.json, runs headless Chromium for each,
# writes outputs to .playwright-cache/{slug}.{html,png,json}.
#
# Sandbox blocks Claude from launching Chromium during a run; this script
# runs in the full workflow env after Claude exits, so it can install
# playwright + chromium and execute the queued jobs.
set -euo pipefail

PENDING_DIR=".pending-playwright"
CACHE_DIR=".playwright-cache"

if [ ! -d "$PENDING_DIR" ] || [ -z "$(ls -A "$PENDING_DIR"/*.json 2>/dev/null)" ]; then
  echo "playwright-postprocess: no pending jobs"
  exit 0
fi

mkdir -p "$CACHE_DIR"

# Install playwright if missing (idempotent across runs in the same job).
if ! node -e "require.resolve('playwright')" >/dev/null 2>&1; then
  echo "playwright-postprocess: installing playwright npm package..."
  npm i --no-save playwright >/dev/null 2>&1 || {
    echo "playwright-postprocess: npm install failed, skipping all jobs"
    exit 0
  }
fi

# Install chromium browser binary (idempotent — playwright caches).
echo "playwright-postprocess: ensuring chromium browser is installed..."
npx playwright install chromium --with-deps >/dev/null 2>&1 \
  || npx playwright install chromium >/dev/null 2>&1 \
  || {
    echo "playwright-postprocess: chromium install failed, skipping all jobs"
    exit 0
  }

RUNNER=$(mktemp /tmp/playwright-runner.XXXXXX.js)
cat > "$RUNNER" <<'JS'
const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const url = process.env.PW_URL;
  const selector = process.env.PW_SELECTOR || '';
  const slug = process.env.PW_SLUG;
  const cacheDir = process.env.PW_CACHE_DIR || '.playwright-cache';

  const result = { url, selector, slug, ok: false, fetched_at: new Date().toISOString() };
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const ctx = await browser.newContext({
      userAgent: 'Mozilla/5.0 (compatible; aeon-playwright-fetch/1.0)',
      viewport: { width: 1280, height: 800 },
    });
    const page = await ctx.newPage();
    const resp = await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 });
    result.status = resp ? resp.status() : null;
    try { result.title = await page.title(); } catch (e) { result.title = null; }
    const html = await page.content();
    fs.writeFileSync(`${cacheDir}/${slug}.html`, html);
    try {
      await page.screenshot({ path: `${cacheDir}/${slug}.png`, fullPage: true });
      result.screenshot = `${cacheDir}/${slug}.png`;
    } catch (e) {
      result.screenshot_error = String(e && e.message ? e.message : e);
    }
    if (selector) {
      try {
        const text = await page.textContent(selector, { timeout: 5000 });
        result.selector_text = text != null ? text.trim() : null;
      } catch (e) {
        result.selector_text = null;
        result.selector_error = String(e && e.message ? e.message : e);
      }
    }
    result.ok = true;
  } catch (e) {
    result.error = String(e && e.message ? e.message : e);
  } finally {
    if (browser) { try { await browser.close(); } catch (_) {} }
    fs.writeFileSync(`${cacheDir}/${slug}.json`, JSON.stringify(result, null, 2));
  }
})();
JS

processed=0
for job_file in "$PENDING_DIR"/*.json; do
  [ -f "$job_file" ] || continue
  URL=$(jq -r '.url // empty' "$job_file")
  SELECTOR=$(jq -r '.selector // ""' "$job_file")
  SLUG=$(jq -r '.slug // empty' "$job_file")

  if [ -z "$URL" ] || [ -z "$SLUG" ]; then
    echo "playwright-postprocess: invalid job in $(basename "$job_file"), removing"
    rm -f "$job_file"
    continue
  fi

  echo "playwright-postprocess: fetching $URL (slug=$SLUG)"
  PW_URL="$URL" PW_SELECTOR="$SELECTOR" PW_SLUG="$SLUG" PW_CACHE_DIR="$CACHE_DIR" \
    timeout 90 node "$RUNNER" \
    || echo "playwright-postprocess: runner failed for slug=$SLUG (non-fatal)"

  rm -f "$job_file"
  processed=$((processed+1))
done

rm -f "$RUNNER"
echo "playwright-postprocess: processed $processed job(s); outputs in $CACHE_DIR/"
