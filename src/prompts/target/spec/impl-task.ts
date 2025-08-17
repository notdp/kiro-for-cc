// Auto-generated from src/prompts/spec/impl-task.md
// DO NOT EDIT MANUALLY

export const frontmatter = {
  "id": "impl-task",
  "name": "Implement Task",
  "version": "1.0.0",
  "description": "Implement a task after a spec workflow",
  "variables": {
    "taskFilePath": {
      "type": "string",
      "required": true,
      "description": "Path for task file"
    },
    "taskDescription": {
      "type": "string",
      "required": true,
      "description": "Description for task"
    }
  }
};

export const content = "<user_input>\nI just completed a spec workflow and now need to implement one of the specific tasks.\n\nTask File Path: {{taskFilePath}}\nTask Description: {{taskDescription}}\n\nPlease help me:\n\n1. First use the *spec-system-prompt-loader* sub agent to load the spec workflow system prompts and understand the complete context\n2. Review the requirements and design documents in the spec folder\n3. Implement this task based on existing codebase patterns and conventions\n4. Ensure code quality, including error handling, performance, and security\n5. Add comprehensive unit tests for the implemented code\n\nLet's start implementing this task!\n</user_input>\n";

export default {
  frontmatter,
  content
};
