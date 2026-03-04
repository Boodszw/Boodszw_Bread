import Anthropic from "@anthropic-ai/sdk";
import { sendTelegram } from "./telegram";

// ─── Dynamic tool registry (populated by create_tool at runtime) ────────────

interface DynamicTool {
  definition: Anthropic.Tool;
  code: string; // JS function body — receives `input` as argument
}

const dynamicTools = new Map<string, DynamicTool>();

// ─── Static tool definitions ────────────────────────────────────────────────

const staticTools: Anthropic.Tool[] = [
  {
    name: "run_code",
    description:
      "Execute JavaScript code in-process. Has access to require, fetch, process.env. " +
      "Use for file I/O (fs), HTTP requests, shell commands (child_process.execSync), etc. " +
      "Return a value to see the result.",
    input_schema: {
      type: "object" as const,
      properties: {
        code: {
          type: "string",
          description: "JavaScript code to execute. The last expression is returned.",
        },
      },
      required: ["code"],
    },
  },
  {
    name: "create_tool",
    description:
      "Register a new tool that becomes available on the next iteration. " +
      "The tool's code receives an `input` object matching the schema.",
    input_schema: {
      type: "object" as const,
      properties: {
        name: { type: "string", description: "Tool name (snake_case)" },
        description: { type: "string", description: "What the tool does" },
        input_schema: {
          type: "object",
          description: "JSON Schema for the tool's input",
        },
        code: {
          type: "string",
          description:
            "JS function body. Receives `input` object. Has access to require, fetch, process.env. " +
            "Return a value or a Promise.",
        },
      },
      required: ["name", "description", "input_schema", "code"],
    },
  },
  {
    name: "send_telegram",
    description: "Send a Telegram notification message. Use to report task completion or errors.",
    input_schema: {
      type: "object" as const,
      properties: {
        message: { type: "string", description: "Message to send (keep concise, max ~200 chars)" },
      },
      required: ["message"],
    },
  },
];

// ─── Server-side tools (handled by Anthropic, not by us) ────────────────────

const serverTools: Anthropic.Messages.WebSearchTool20250305[] = [
  {
    type: "web_search_20250305",
    name: "web_search",
    max_uses: 10,
  },
];

// ─── Exports ────────────────────────────────────────────────────────────────

export function getTools(): Anthropic.Messages.ToolUnion[] {
  const dynamic = Array.from(dynamicTools.values()).map((d) => d.definition);
  return [...serverTools, ...staticTools, ...dynamic];
}

type ToolInput = Record<string, unknown>;

const OUTPUT_CAP = 12_000;

export async function executeTool(name: string, input: ToolInput): Promise<string> {
  console.log(`[tool] ${name}`, JSON.stringify(input).slice(0, 120));

  try {
    // Check dynamic tools first
    const dynamic = dynamicTools.get(name);
    if (dynamic) {
      const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
      const fn = new AsyncFunction("input", "require", "fetch", dynamic.code);
      const result = await fn(input, require, fetch);
      return String(result ?? "OK").slice(0, OUTPUT_CAP);
    }

    switch (name) {
      case "run_code": {
        const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
        const fn = new AsyncFunction("require", "fetch", input.code as string);
        const result = await fn(require, fetch);
        return String(result ?? "OK").slice(0, OUTPUT_CAP);
      }

      case "create_tool": {
        const toolName = input.name as string;
        const schema = input.input_schema as Anthropic.Tool["input_schema"];
        dynamicTools.set(toolName, {
          definition: {
            name: toolName,
            description: input.description as string,
            input_schema: schema,
          },
          code: input.code as string,
        });
        return `Tool "${toolName}" registered. It will be available on the next iteration.`;
      }

      case "send_telegram":
        return await sendTelegram(input.message as string);

      default:
        return `Unknown tool: ${name}`;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[tool error] ${name}: ${message}`);
    return `Error: ${message}`;
  }
}
