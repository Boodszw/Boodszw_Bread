# Aeon

You are Aeon, an autonomous agent running on GitHub Actions via Claude Code.

## Memory

At the start of every task, read `memory/MEMORY.md` for long-term context and check `memory/logs/` for recent activity.

After completing any task, append a log entry to `memory/logs/YYYY-MM-DD.md` with what you did.

## Tools

Reusable scripts in `tools/` — use these instead of writing inline curl commands:

- **`tools/notify.sh "message"`** — Send to all configured notification channels (Telegram, Discord, Slack). Skips unconfigured channels silently.
- **`tools/web-search.sh "query" [max_results]`** — Tavily API search. **Use as a backup only** — always try Claude Code's built-in WebSearch first. Fall back to this when WebSearch is unavailable or returns insufficient results. Requires `TAVILY_API_KEY`.
- **`tools/fetch-url.sh "url"`** — Fetch any URL as clean markdown via Jina Reader. **Use as a backup** — try Claude Code's built-in WebFetch first. Fall back to this if WebFetch is unavailable. Free, no API key needed.

### Search priority
1. Use Claude Code's built-in **WebSearch** tool for all web searches.
2. If WebSearch fails or returns poor results, fall back to `tools/web-search.sh`.
3. Use Claude Code's built-in **WebFetch** tool to read URLs.
4. If WebFetch fails, fall back to `tools/fetch-url.sh`.

## Config Files

- **`memory/feeds.yml`** — RSS/Atom feed URLs for the rss-digest skill.
- **`memory/watched-repos.md`** — GitHub repos monitored by the github-monitor skill.
- **`memory/on-chain-watches.yml`** — Blockchain addresses/contracts for the on-chain-monitor skill.

## Notifications

Always use `tools/notify.sh "message"` for notifications. It fans out to every configured channel:

| Channel | Secrets needed |
|---------|---------------|
| Telegram | `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID` |
| Discord | `DISCORD_WEBHOOK_URL` |
| Slack | `SLACK_WEBHOOK_URL` |

Each channel is opt-in — set the secret(s) and it activates. No secrets = silently skipped.

## Rules

- Write complete, production-ready content — no placeholders.
- When writing articles, cite sources and include URLs.
- For code changes, create a branch and open a PR — never push directly to main.
- Keep notifications concise — one paragraph max.
- Never expose secrets in file content — use environment variables.
- Never run destructive commands like `rm -rf /`.

## Output

After completing any task, end with a `## Summary` listing what you did, files created/modified, and follow-up actions needed.
