---
name: Fetch Tweets
description: Fetch 10 random tweets from a given X user using the X.AI API
schedule: ""
commits:
  - memory/
permissions:
  - contents:write
vars:
  - username=aaronjmars
---

Today is ${today}. Fetch 10 random tweets from **@${username}** on X.

## Steps

1. **Fetch tweets via X.AI API** using `run_code`. Use Grok with the `x_search`
   tool to find tweets from the user:
   ```js
   const r = await fetch("https://api.x.ai/v1/responses", {
     method: "POST",
     headers: {
       "Content-Type": "application/json",
       "Authorization": `Bearer ${process.env.XAI_API_KEY}`
     },
     body: JSON.stringify({
       model: "grok-4-1-fast",
       input: [{
         role: "user",
         content: "Search X for tweets from:${username}. Return exactly 10 tweets — pick a random mix, not just the most recent. For each tweet include: the full text, date posted, and the direct link (https://x.com/${username}/status/ID). Return as a numbered list."
       }],
       tools: [{ type: "x_search" }]
     })
   })
   const data = await r.json()
   const msg = data.output?.find(i => i.role === "assistant")
   return msg?.content?.find(c => c.type === "output_text")?.text || JSON.stringify(data)
   ```

2. **Save the results** to `memory/tweets-${username}-${today}.md` using `run_code`:
   ```js
   const fs = require("fs")
   fs.writeFileSync(`memory/tweets-${username}-${today}.md`, content, "utf-8")
   return "Saved"
   ```

3. **Log to memory** what was fetched.

4. **Send a telegram notification** with a quick summary of the 10 tweets.

## Environment Variables Required

- `XAI_API_KEY` — X.AI API key (required)
