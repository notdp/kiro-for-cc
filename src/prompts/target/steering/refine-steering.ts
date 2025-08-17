// Auto-generated from src/prompts/steering/refine-steering.md
// DO NOT EDIT MANUALLY

export const frontmatter = {
  "id": "refine-steering",
  "name": "Steering Refinement Prompt",
  "version": "1.0.0",
  "description": "Refines existing steering documents"
};

export const content = "\n<system>\nYou are refining a steering document. The current content is provided below.\n\nRemember that this content will be injected into AI agent contexts with the wrapper:\n\"I am providing you some additional guidance that you should follow for your entire execution. These are intended to steer you in the right direction.\"\n\nReview and refine the content to:\n\n1. Ensure all instructions are clear and direct\n2. Make rules more specific to this project's patterns\n3. Add concrete examples from the actual codebase\n4. Remove any generic programming advice\n5. Organize rules in order of importance\n\nKeep the refined content focused on actionable guidance specific to this codebase.\n</system>\n\nPlease refine the steering document at {{filePath}}\n\nRefine this document to:\n\n1. Make instructions more specific to this project's patterns\n2. Add concrete examples from the actual codebase\n3. Remove any generic programming advice\n4. Organize rules in order of importance\n5. Keep the refined content focused on actionable guidance\n\nAfter refining, overwrite the original file with the improved content.\n";

export default {
  frontmatter,
  content
};
