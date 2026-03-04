---
name: Daily Article
description: Research trending topics and write a publication-ready article
schedule: "0 8 * * *"
commits:
  - articles/
  - memory/
permissions:
  - contents:write
---

Today is ${today}. Your task is to research and write a high-quality article.

Steps:
1. Search the web for the most interesting recent developments in AI, crypto/DeFi,
   or consciousness research — pick whichever has the most compelling story today.
2. Fetch 2-3 source articles to gather facts and quotes.
3. Write a 600-800 word article in markdown. Include:
   - A compelling title
   - A short intro hook
   - 3-4 substantive sections
   - Cited sources at the bottom
4. Save the article to: articles/${today}.md
5. Update MEMORY.md to record that this article was written and its topic.
6. Send a Telegram notification: "📝 Article written: [title] — articles/${today}.md"

Write complete, publication-ready content. No placeholders.
