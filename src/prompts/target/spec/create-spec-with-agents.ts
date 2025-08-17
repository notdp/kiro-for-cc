// Auto-generated from src/prompts/spec/create-spec-with-agents.md
// DO NOT EDIT MANUALLY

export const frontmatter = {
  "id": "create-spec-with-agents",
  "name": "Create Spec with Subagents",
  "version": "1.0.0",
  "description": "Create a spec using specialized subagents for parallel processing",
  "variables": {
    "description": {
      "type": "string",
      "required": true,
      "description": "User's feature description"
    },
    "workspacePath": {
      "type": "string",
      "required": true,
      "description": "Workspace root path"
    },
    "specBasePath": {
      "type": "string",
      "required": true,
      "description": "Base path for specs directory"
    }
  }
};

export const content = "<user_input>\nLAUNCH A SPEC DEVELOPMENT WORKFLOW\n\nCreate a requirements document for a new feature\n\nFeature Description: {{description}}\n\nWorkspace path: {{workspacePath}}\nSpec base path: {{specBasePath}}\n\nYou have full control over the naming and file creation.\n</user_input>\n";

export default {
  frontmatter,
  content
};
