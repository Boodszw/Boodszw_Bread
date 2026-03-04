import { readFileSync, readdirSync } from "fs";
import { join } from "path";

export interface SkillConfig {
  name: string;
  description: string;
  schedule: string;
  commits: string[];
  permissions: string[];
}

export interface Skill {
  config: SkillConfig;
  prompt: string;
}

const SKILLS_DIR = join(__dirname, "..", "skills");

// ─── Frontmatter parser ────────────────────────────────────────────────────────

function parseFrontmatter(raw: string): { meta: Record<string, string | string[]>; body: string } {
  const lines = raw.split("\n");

  if (lines[0]?.trim() !== "---") {
    return { meta: {}, body: raw };
  }

  let endIndex = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === "---") {
      endIndex = i;
      break;
    }
  }
  if (endIndex === -1) {
    return { meta: {}, body: raw };
  }

  const meta: Record<string, string | string[]> = {};
  let currentKey = "";

  for (let i = 1; i < endIndex; i++) {
    const line = lines[i];

    // Array item: "  - value"
    if (/^\s+-\s+/.test(line) && currentKey) {
      const value = line.replace(/^\s+-\s+/, "").trim();
      const existing = meta[currentKey];
      if (Array.isArray(existing)) {
        existing.push(value);
      } else {
        meta[currentKey] = [value];
      }
      continue;
    }

    // Key-value: "key: value" or "key: \"value\""
    const match = line.match(/^(\w+):\s*(.*)/);
    if (match) {
      currentKey = match[1];
      const raw = match[2].trim().replace(/^["']|["']$/g, "");
      if (raw) {
        meta[currentKey] = raw;
      }
      // If no value, next lines may be array items
    }
  }

  const body = lines.slice(endIndex + 1).join("\n").trim();
  return { meta, body };
}

// ─── Template interpolation ────────────────────────────────────────────────────

function interpolate(template: string): string {
  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const vars: Record<string, string> = {
    today,
    now: now.toISOString(),
    repo: process.env.GITHUB_REPOSITORY || "aeon",
  };

  return template.replace(/\$\{(\w+)\}/g, (_, key) => vars[key] ?? `\${${key}}`);
}

// ─── Public API ────────────────────────────────────────────────────────────────

function toStringArray(val: string | string[] | undefined): string[] {
  if (!val) return [];
  return Array.isArray(val) ? val : [val];
}

export function loadSkill(name: string): Skill {
  const filePath = join(SKILLS_DIR, `${name}.md`);
  const raw = readFileSync(filePath, "utf-8");
  const { meta, body } = parseFrontmatter(raw);

  const config: SkillConfig = {
    name: (meta.name as string) || name,
    description: (meta.description as string) || "",
    schedule: (meta.schedule as string) || "",
    commits: toStringArray(meta.commits),
    permissions: toStringArray(meta.permissions),
  };

  return { config, prompt: interpolate(body) };
}

export function listSkills(): string[] {
  return readdirSync(SKILLS_DIR)
    .filter((f) => f.endsWith(".md"))
    .map((f) => f.replace(/\.md$/, ""));
}
