---
name: Build Tool
description: Design and build a new reusable tool as a skill
schedule: ""
commits:
  - skills/
  - memory/
permissions:
  - contents:write
---

Your task is to design and build a new reusable tool-skill.

## Steps

1. **Decide what to build.** Check open issues (via `run_code` + `gh issue list`)
   and memory for tool ideas. Pick the most useful one, or reason about what
   capability gap exists.

2. **Research.** Use `run_code` with fetch to look up APIs, patterns, or
   documentation needed for the tool.

3. **Design the tool.** Define:
   - Name and description
   - Input schema (what parameters it takes)
   - Implementation (JS code body)

4. **Test it.** Use `create_tool` to register the tool, then call it to verify
   it works. Iterate on failures.

5. **Write a skill file.** Create a new `.md` file in `skills/` that:
   - Has frontmatter (name, description, schedule, commits, permissions)
   - Contains a prompt that uses `create_tool` to define the tool at the start
   - Documents usage and examples
   Save it via `run_code`:
   ```js
   require("fs").writeFileSync("skills/my-tool.md", content, "utf-8")
   ```

6. **Update memory.** Record what tool was built and when via `run_code` + fs.

7. **Notify.** Use `send_telegram` to report: what tool was built, what it does.

## Guidelines

- Keep tool code focused — one tool, one job.
- Include error handling in the tool code.
- Test with real inputs before saving.
- If the tool needs env vars, document which ones in the skill prompt.
