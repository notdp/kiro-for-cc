// Auto-generated from src/prompts/steering/init-steering.md
// DO NOT EDIT MANUALLY

export const frontmatter = {
  "id": "init-steering",
  "name": "Initialize Steering",
  "version": "1.0.0",
  "description": "Complete prompt for initializing steering documents",
  "variables": {
    "steeringPath": {
      "type": "string",
      "required": true,
      "description": "Path where steering documents should be created"
    }
  }
};

export const content = "\n<system>\nYou are analyzing a codebase to create steering documents that will guide AI assistants working on this project.\n\n## Context\n\nSteering documents will be injected into AI conversations with this wrapper:\n\"I am providing you some additional guidance that you should follow for your entire execution. These are intended to steer you in the right direction. You should follow these instructions for all following responses.\"\n\n## Writing Guidelines\n\nWrite content as direct instructions to the AI agent:\n\n- Use imperative mood (\"Use X\", \"Avoid Y\", \"Always Z\")\n- Be specific to THIS codebase's patterns and conventions\n- Include concrete examples from actual files when relevant\n- Skip generic programming advice\n\n## Required Files\n\nCreate exactly these three files by analyzing the codebase:\n\n1. **{{steeringPath}}/product.md**\n   - Product purpose and core features\n   - User value proposition\n   - Key business logic rules\n\n2. **{{steeringPath}}/tech.md**\n   - Tech stack and frameworks used\n   - Build system and dependencies\n   - Common commands (build, test, run, deploy)\n   - Project-specific conventions\n\n3. **{{steeringPath}}/structure.md**\n   - Directory organization\n   - File naming patterns\n   - Component/module architecture\n   - Key file locations\n\n## Important\n\n- Check if files exist before creating (DO NOT overwrite)\n- Write directly to filesystem\n- Keep content concise but complete\n- If CLAUDE.md exists, update its \"## Steering Documents\" section\n</system>\n\n# Initialize Steering Documents\n\nAnalyze this repository and create basic steering rules that would help guide an AI assistant.\n\nSteering documents are markdown files that should be created in the '{{steeringPath}}' directory.\n\nFocus on project conventions, code style, architecture patterns, and any specific rules that should be followed when working with this codebase.\n\nFor the initial setup, please create the following files:\n\n- product.md: Short summary of the product, its purpose, key features, and user value proposition\n- tech.md: Build system used, tech stack, libraries, frameworks etc. Include a section for common commands (building, testing, running, etc.)\n- structure.md: Project organization, folder structure, and key file locations\n\nThe goal is to be succinct, but capture information that will be useful for an AI assistant operating in this project.\n\nIMPORTANT:\n\n1. Write each file directly to the filesystem at the appropriate path in {{steeringPath}}/\n2. Check if any of these files already exist before creating them. If a file already exists, DO NOT modify or overwrite it - skip it completely\n3. Only create files that don't exist\n4. If a project CLAUDE.md exists, create or update the \"## Steering Documents\" section listing all steering documents with their descriptions and paths\n";

export default {
  frontmatter,
  content
};
