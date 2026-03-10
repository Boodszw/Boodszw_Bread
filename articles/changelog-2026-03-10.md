# Changelog — Week of 2026-03-10

## aaronjmars/aeon

### Features
- Add reddit-digest skill — fetches and summarizes top Reddit posts from tracked subreddits using public JSON API (62acb9d)
- Scheduler runs all matching skills in parallel — first match runs in current job, additional matches dispatched as separate workflow runs (748585e)
- Vars input for passing parameters to skills from UI (e.g. topic=rust, query=solana NFT) (6e13f5b)
- Configurable default model in aeon.yml — model priority: workflow_dispatch > aeon.yml > claude-opus-4-6 (af1050c)
- Add Telegram polling for bidirectional messaging — polls every 5 min, interprets and acts on messages (54f44ad)
- Add aeon.yml config, remove schedule from skill files — centralized scheduling (5bfffb7)
- Wire Etherscan, CoinGecko, and Alchemy API keys through workflows (27ac4d9)
- 5-minute heartbeat loop, minute matching in scheduler (0a63fc3)
- Add tools, 25 new skills, multi-channel notifications, and enabled flag (777c817)
- Add search_papers tool via Semantic Scholar API (8fa33ce)
- Add generic digest skill + Telegram webhook (14d558a)
- Add fetch-tweets skill using X.AI + x_search (b6e5e2e)
- Initial commit — aeon agent with run_code, create_tool, web_search (6a8ed8d)

### Fixes
- Add reddit-digest to workflow dropdown (a6c50be)
- Auto-resolve merge conflicts in append-only files + production schedules (843f35a)
- Route all skill notifications through notify.sh for multi-channel fan-out (e014d95)
- Workflow reliability — concurrency groups, two-pass YAML parser, push retries, ack logic (477009a)
- Broaden notify.sh allowedTools patterns (54d7709)
- Full cron parser (all 5 fields), topic-based memory split, billing docs (6806430)
- Pass both ANTHROPIC_API_KEY and CLAUDE_CODE_OAUTH_TOKEN to CLI (39e32c1)
- Use compiled JS in workflow, fix __dirname paths for dist/ (a40471f)

### Performance
- Fully parallel runs with unique concurrency group per run (94561ac)

### Refactoring
- Inline notify into workflow, remove notify.sh — script generated at runtime (38b18f7)
- Replace custom agent with Claude Code CLI — delete agent/ directory, add CLAUDE.md (e3c330e)
- Simplify tooling, merge workflows, SKILL.md format (ad8c150)

### Security
- Replace --dangerously-skip-permissions with --allowedTools whitelist + prompt injection defense (4e49afb)

### Docs
- Move logo to right of title (8600d3e)
- Move banner below description, logo inline with title (34bc64d)
- Add banner + avatar images, clean up stale skill refs (c5d854e)
- Add skill composition pattern to CLAUDE.md (ffc3a55)
- Mark Telegram secrets as recommended in README (c5dd291)
- Expand skill descriptions in project structure (c45ce35)
- Use template instead of fork in README (89578b8)
- Rewrite README with full skill catalog and new tagline (5092e7e)
- Add instant webhook option for Telegram (6c2cbec)

### Chores
- Remove substack-draft skill — no usable API (dfeba7d)
- Remove load-skill.js, let Claude read skills directly (4f15564)
- Remove empty output dirs, create on demand (c208138)
- Clean repo into public template (b4c4ab2)
- Remove .env.example (49a07ed)
- Remove subscribers/webhook/vercel — digest sends directly via send_telegram (f245183)
- Simplify: drop Upstash/CRON_SECRET, use local subscribers.json + GitHub API (7fa86bc)
- Various auto-commits for articles, digests, reflections, and Telegram messages
