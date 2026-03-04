import Anthropic from "@anthropic-ai/sdk";
import fs from "fs";
import path from "path";
import { getTools, executeTool } from "./tools/index";
import { readMemory, readTodayLog, appendTodayLog } from "./memory";

const client = new Anthropic();
const MAX_ITERATIONS = 30; // safety cap — prevents infinite loops

export async function runAgent(task: string): Promise<string> {
  // Build system prompt from SOUL.md + long-term memory + today's log
  const soul = fs.readFileSync(path.join(__dirname, "SOUL.md"), "utf-8");
  const memory = readMemory();
  const todayLog = readTodayLog();
  const today = new Date().toISOString().split("T")[0];

  const systemPrompt = [
    soul,
    `\n\n## Long-term Memory\n${memory}`,
    todayLog ? `\n\n## Today's Log (${today})\n${todayLog}` : "",
    `\n\n## Context\nToday is ${today}. Repo root: ${process.cwd()}`,
  ].join("");

  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: task },
  ];

  let iterations = 0;
  let finalResponse = "";

  console.log(`\n[agent] Starting task: ${task.slice(0, 80)}...\n`);

  while (iterations < MAX_ITERATIONS) {
    iterations++;

    const response = await client.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 4096,
      system: systemPrompt,
      tools: getTools(),
      messages,
    });

    console.log(`[agent] Iteration ${iterations} — stop_reason: ${response.stop_reason}`);

    // Log any text blocks as they arrive
    for (const block of response.content) {
      if (block.type === "text" && block.text) {
        process.stdout.write(block.text);
      }
    }

    if (response.stop_reason === "end_turn") {
      finalResponse = response.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("\n");
      break;
    }

    if (response.stop_reason === "tool_use") {
      // Add assistant turn
      messages.push({ role: "assistant", content: response.content });

      // Execute all tool calls in this turn
      const toolResults: Anthropic.ToolResultBlockParam[] = [];

      for (const block of response.content) {
        if (block.type === "tool_use") {
          // Server-side tools (web_search) are handled by Anthropic — skip
          if (block.name === "web_search") continue;

          const result = await executeTool(
            block.name,
            block.input as Record<string, unknown>
          );
          toolResults.push({
            type: "tool_result",
            tool_use_id: block.id,
            content: result,
          });
        }
      }

      // Feed results back
      messages.push({ role: "user", content: toolResults });
      continue;
    }

    // Unexpected stop reason
    console.warn(`[agent] Unexpected stop_reason: ${response.stop_reason}`);
    break;
  }

  if (iterations >= MAX_ITERATIONS) {
    finalResponse += "\n\n⚠️ Hit iteration limit — task may be incomplete.";
  }

  // Persist to daily log
  appendTodayLog(task, finalResponse);

  console.log(`\n[agent] Done in ${iterations} iterations.`);
  return finalResponse;
}
