---
name: Dependency Check
description: Flag outdated or vulnerable dependencies across watched repos
---

Read memory/MEMORY.md and memory/watched-repos.md for repos to check.
Read the last 7 days of memory/logs/ to avoid re-reporting known issues.

Steps:
1. For each repo in watched-repos.md:
   - Check for Dependabot alerts:
     ```bash
     gh api repos/owner/repo/dependabot/alerts --jq '.[] | select(.state=="open") | {package: .security_advisory.summary, severity: .security_vulnerability.severity, created: .created_at}'
     ```
   - Check for outdated packages if package.json exists:
     ```bash
     gh api repos/owner/repo/contents/package.json --jq '.content' | base64 -d | jq '.dependencies, .devDependencies'
     ```
2. Categorize findings:
   - **Critical/High** — security vulnerabilities that need immediate attention
   - **Medium** — outdated deps with known issues
   - **Low** — routine version bumps
3. For critical/high findings, create an issue if one doesn't exist:
   ```bash
   gh issue create -R owner/repo --title "Security: vulnerability in package" --body "details" --label "urgent"
   ```
4. Send a summary via `tools/notify.sh` for any critical/high findings.
5. Log what you checked to memory/logs/${today}.md.
If no issues found, log "DEPENDENCY_CHECK_OK" and end.
