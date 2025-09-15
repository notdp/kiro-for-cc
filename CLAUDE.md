# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a VSCode extension called "Kiro for Claude Code" that enhances Claude Code with structured spec-driven development features. The extension provides visual management of specs (requirements, design, tasks) and steering documents.

## Development Commands

```bash
# Install dependencies
npm install

# Compile TypeScript (one-time)
npm run compile

# Watch mode for development (auto-compile on changes)
npm run watch

# Package the extension into .vsix file
npm run package

# Run in VSCode
# Press F5 in VSCode to launch Extension Development Host
```

## Architecture

### Project Structure

```plain
src/
├── extension.ts           # Extension entry point, command registration
├── constants.ts          # Centralized configuration constants
├── features/            # Business logic for features
│   ├── spec/
│   │   └── specManager.ts      # Spec lifecycle management
│   └── steering/
│       └── steeringManager.ts  # Steering document management
├── providers/           # VSCode TreeDataProviders
│   ├── claudeCodeProvider.ts   # Claude CLI integration
│   ├── specExplorerProvider.ts # Spec tree view
│   ├── steeringExplorerProvider.ts # Steering tree view
│   ├── hooksExplorerProvider.ts    # Hooks tree view
│   ├── mcpExplorerProvider.ts      # MCP servers tree view
│   └── overviewProvider.ts         # Settings overview
├── prompts/            # AI prompt templates
│   ├── specPrompts.ts          # Spec generation prompts
│   └── steeringPrompts.ts      # Steering doc prompts
└── utils/              # Utility functions
    └── configManager.ts        # Configuration management
```

### Core Components

1. **Extension Entry** (`src/extension.ts`): Registers all commands and initializes providers
2. **Feature Managers** (`src/features/`): Business logic for specs and steering documents
3. **Providers** (`src/providers/`): VSCode TreeDataProviders for UI views
4. **Prompts** (`src/prompts/`): AI prompt templates for spec generation

### Key Patterns

- **Manager Pattern**: Each feature has a Manager class that handles file operations and business logic
- **Provider Pattern**: Each tree view has a Provider class extending `vscode.TreeDataProvider`
- **Command Registration**: All commands are registered in `activate()` with pattern `kfc.{feature}.{action}`

### Data Structure

User data is stored in workspace `.claude/` directory:

```plain
.claude/
├── specs/{spec-name}/
│   ├── requirements.md
│   ├── design.md
│   └── tasks.md
├── steering/*.md
└── settings/kfc-settings.json
```

## Spec Workflow Implementation

The spec workflow follows these states:

1. Requirements → Review → Design
2. Design → Review → Tasks
3. Tasks → Review → Complete

Each transition requires explicit user approval. The workflow is implemented in `specPrompts.ts` and enforced by the spec agent system prompt.

## Claude Code Integration

The extension integrates with Claude CLI through the `ClaudeCodeProvider`:

- Sends commands via VS Code terminal
- Uses temporary files for long prompts
- Supports system prompts for context injection
- Terminal commands are built with format: `claude [options] < promptFile`

## Testing & Debugging

Currently, the claudeCodeProvider has a test echo command at line 62:

```typescript
let command = `echo "HELLO WORLD"`;
```

This should be replaced with actual Claude CLI integration when testing is complete.

## Important Implementation Notes

1. **File Operations**: Always use `vscode.Uri` and workspace-relative paths
2. **Tree Updates**: Call `refresh()` on providers after any data changes
3. **Error Handling**: All file operations should have try-catch blocks
4. **User Prompts**: Use `vscode.window.showInputBox()` for user input
5. **Context Menus**: Defined in `package.json` under `contributes.menus`

## Extension Points

- **New Managers**: Add to `src/features/` following existing patterns
- **New Providers**: Add to `src/providers/` extending `TreeDataProvider`
- **New Commands**: Register in `extension.ts` and add to `package.json`
- **New Prompts**: Add to `src/prompts/` for AI-assisted features
