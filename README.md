# Aeon

Autonomous agent running on GitHub Actions, powered by Claude. Writes daily articles, builds features from GitHub issues, and notifies you on Telegram.

## Setup

### 1. Fork / clone this repo

### 2. Add GitHub secrets

Go to **Settings → Secrets and variables → Actions** and add:

| Secret | Required | Description |
|--------|----------|-------------|
| `ANTHROPIC_API_KEY` | ✅ | Your Anthropic API key from console.anthropic.com |
| `TELEGRAM_BOT_TOKEN` | Optional | From @BotFather on Telegram |
| `TELEGRAM_CHAT_ID` | Optional | Your Telegram chat ID from @userinfobot |

### 3. Customize the agent

- **`agent/SOUL.md`** — change the agent's identity, rules, and output style
- **`skills/*.md`** — edit skill prompts or add new ones
- **`memory/MEMORY.md`** — seed with context about your project

### 4. Run manually to test

Go to **Actions → Run Skill → Run workflow** and enter a skill name (e.g. `article`).

## Adding a new skill

1. Create `skills/your-skill.md` with frontmatter and a prompt:

```markdown
---
name: My Skill
description: What this skill does
schedule: "0 12 * * *"
commits:
  - output-dir/
  - memory/
permissions:
  - contents:write
---

Today is ${today}. Your task is to...
```

2. If it needs a cron schedule, add the cron to `.github/workflows/run-skill.yml` under `schedule:` and map it in the "Determine skill name" step.

3. Run locally: `npm run skill -- your-skill`

**Template variables:** `${today}` → `2026-03-04`, `${now}` → full ISO timestamp, `${repo}` → repo name.

## Adding a new tool

Use `create_tool` at runtime, or run the `build-tool` skill to create a persistent tool-skill:

```bash
npm run build-tool
```

## Trigger feature builds from issues

Add the label `ai-build` to any GitHub issue. The run-skill workflow fires
automatically and Claude will read the issue, implement it, and open a PR.

## Local development

```bash
cp .env.example .env
# fill in ANTHROPIC_API_KEY at minimum

npm install
npm run article           # run the article skill
npm run feature           # run the feature skill
npm run skill -- my-skill # run any skill by name
```

## Project structure

```
skills/
  article.md      ← daily article skill prompt + config
  feature.md      ← feature builder skill prompt + config
agent/
  index.ts        ← CLI entry, loads skill by name
  skills.ts       ← skill loader (parses .md frontmatter + prompt)
  runner.ts       ← Claude agent loop
  memory.ts       ← read/write memory files
  SOUL.md         ← agent identity
  tools/
    index.ts      ← tool registry (run_code, create_tool, web_search, send_telegram)
    telegram.ts   ← Telegram notifications
memory/
  MEMORY.md       ← long-term persistent memory
  logs/           ← daily run logs (auto-created)
articles/         ← generated articles (auto-created)
.github/
  workflows/
    run-skill.yml ← single workflow dispatches all skills
```
