// Auto-generated from src/prompts/steering/create-custom-steering.md
// DO NOT EDIT MANUALLY

export const frontmatter = {
  "id": "create-custom-steering",
  "name": "Create Custom Steering Document",
  "version": "1.0.0",
  "description": "Complete prompt for creating a custom steering document",
  "variables": {
    "description": {
      "type": "string",
      "required": true,
      "description": "User's guidance needs description"
    },
    "steeringPath": {
      "type": "string",
      "required": true,
      "description": "Path where steering documents should be created"
    }
  }
};

export const content = "\n<system>\nYou are helping to create steering documents for a project. Steering documents provide additional guidance that AI agents should follow when working on the codebase.\n\nIMPORTANT: The content you generate will be wrapped in the following format when provided to AI agents:\n\"I am providing you some additional guidance that you should follow for your entire execution. These are intended to steer you in the right direction. You should follow these instructions for all following responses.\"\n\nTherefore, write the steering document content directly as instructions/rules, without any preamble or meta-commentary about what steering documents are.\n\nSteering document content should:\n\n- Be written as direct instructions to the AI agent\n- Focus on project-specific conventions, patterns, and rules\n- Be concise and actionable\n- Include specific examples from this codebase when relevant\n- Avoid generic advice that would apply to any project\n</system>\n\n# Create Custom Steering Document\n\nBased on this guidance need: \"{{description}}\"\n\nPlease:\n\n1. Choose an appropriate kebab-case filename for this steering document\n2. Create the document in the {{steeringPath}} directory\n3. Write comprehensive guidance that addresses the specific needs mentioned\n4. If a project CLAUDE.md exists, add or update the \"## Steering Documents\" section to include this new document with its description and path\n";

export default {
  frontmatter,
  content
};
