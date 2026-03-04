import "dotenv/config";
import { runAgent } from "./runner";
import { loadSkill, listSkills } from "./skills";

async function main() {
  const skillName = process.argv[2];

  if (!skillName) {
    console.error(`Usage: ts-node agent/index.ts <skill>`);
    console.error(`Available skills: ${listSkills().join(", ")}`);
    process.exit(1);
  }

  let skill;
  try {
    skill = loadSkill(skillName);
  } catch {
    console.error(`Unknown skill: "${skillName}"`);
    console.error(`Available skills: ${listSkills().join(", ")}`);
    process.exit(1);
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("Error: ANTHROPIC_API_KEY environment variable is required");
    process.exit(1);
  }

  try {
    const result = await runAgent(skill.prompt);
    console.log("\n✅ Task complete\n");
    console.log(result);
  } catch (err) {
    console.error("❌ Agent error:", err);
    process.exit(1);
  }
}

main();
