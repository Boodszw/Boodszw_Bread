---
name: Fetch URL
description: Pull and summarize any URL on demand
---

This skill is triggered on demand (via Telegram or workflow_dispatch). Expects a URL in the trigger message.

Steps:
1. Read memory/MEMORY.md for context.
2. Fetch the URL content using WebFetch (fall back to `tools/fetch-url.sh`).
3. Summarize the content in 3-5 key points.
4. If relevant to topics in MEMORY.md, note the connection.
5. Send the summary via `tools/notify.sh`.
6. Log what you did to memory/logs/${today}.md.
