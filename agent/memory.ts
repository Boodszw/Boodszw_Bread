import fs from "fs";
import path from "path";

const MEMORY_PATH = path.join(process.cwd(), "memory", "MEMORY.md");
const LOGS_DIR = path.join(process.cwd(), "memory", "logs");

export function readMemory(): string {
  if (!fs.existsSync(MEMORY_PATH)) return "No memory yet.";
  return fs.readFileSync(MEMORY_PATH, "utf-8");
}

export function readTodayLog(): string {
  const today = new Date().toISOString().split("T")[0];
  const logPath = path.join(LOGS_DIR, `${today}.md`);
  if (!fs.existsSync(logPath)) return "";
  return fs.readFileSync(logPath, "utf-8");
}

export function appendTodayLog(task: string, result: string): void {
  if (!fs.existsSync(LOGS_DIR)) fs.mkdirSync(LOGS_DIR, { recursive: true });

  const today = new Date().toISOString().split("T")[0];
  const logPath = path.join(LOGS_DIR, `${today}.md`);
  const timestamp = new Date().toISOString();

  const entry = `\n## ${timestamp}\n**Task:** ${task}\n\n${result}\n\n---\n`;

  fs.appendFileSync(logPath, entry, "utf-8");
  console.log(`[memory] Logged to ${logPath}`);
}

