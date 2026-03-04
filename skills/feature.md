---
name: Feature Builder
description: Build new features from GitHub issues or improve the agent
schedule: "0 2 * * 1"
commits:
  - memory/
permissions:
  - contents:write
  - pull-requests:write
  - issues:read
---

Today is ${today}. Your task is to build a new feature for this repository.

Steps:
1. Read the open GitHub issues labelled "ai-build" to find what to work on.
   If there are none, read MEMORY.md to see if there's a previously planned feature,
   or pick a reasonable improvement to the agent itself (e.g. a new tool, better prompts).
2. Read the relevant existing files to understand the codebase.
3. Implement the feature in TypeScript. Write clean, typed code.
4. Run `npm run build` to verify it compiles. Fix any errors.
5. Create a PR with a clear title and description explaining what was built and why.
6. Update MEMORY.md to record what was built.
7. Send a Telegram notification: "🚀 Feature built: [feature name] — PR: [url]"

Write complete, working code. No TODOs or placeholders.
