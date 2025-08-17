# SPEC AI Coder

An all-in-one AI extension for spec-driven development with a powerful, built-in LLM router. This extension integrates the functionality of the original Kiro for CC extension with the powerful Claude Code Router, creating a seamless, self-contained, and feature-rich experience.

## Features

### 🚀 Integrated LLM Router
- **Built-in Router:** The Claude Code Router is now fully integrated. No need to install a separate command-line tool.
- **Multi-Provider Support:** Connect to dozens of LLM providers like OpenRouter, OpenAI, Ollama, DeepSeek, and more.
- **Advanced Configuration:** Use the built-in Settings UI to manage providers, API keys, models, and routing rules.
- **Dynamic Model Fetching:** Automatically fetch the list of available models from supported providers (e.g., OpenRouter) with the click of a button.
- **Custom Transformers:** Configure request/response transformers and manage your own custom transformer scripts directly from the UI.

### 💬 Modern Chat Interface
- **Interactive Chat Panel:** All interactions with the AI now happen in a modern, chat-based UI instead of a raw terminal.
- **Slash Command Helper:** Type `/` in the chat input to get a list of available commands like `/help` and `/model`.
- **Tools Menu (Coming Soon):** A dedicated menu to manage and interact with LLM tools is planned.

### 📝 Spec-Driven Development
- **Create Specs**: Generate requirements, design, and task documents with the help of your chosen LLM.
- **Visual Explorer**: Browse and manage specs in the sidebar.
- **Agent-based Workflows**: Use specialized sub-agents for creating requirements, design, and tasks.

### 🤖 AGENT & STEERING Management
- **Agent Explorer**: View and manage Claude Code agents at user and project levels.
- **Steering Documents**: Browse and edit global/project-specific guidelines in `CLAUDE.md` files.

## Installation

1. Open VSCode
2. Go to Extensions (Cmd+Shift+X)
3. Search for "Kiro Super Router" (Note: name will be different on marketplace)
4. Click Install

That's it! The router is built-in and will start automatically.

## Configuration
To configure the LLM router, open the command palette (Cmd+Shift+P) and run the command **"Kiro for CC: Open CCR Settings"**.

This will open a UI where you can manage all aspects of the router.

## Acknowledgements
This project would not be possible without the amazing work of the original creators:
- **Kiro for CC:** [notdp/kiro-for-cc](https://github.com/notdp/kiro-for-cc)
- **Claude Code Router:** [musistudio/claude-code-router](https://github.com/musistudio/claude-code-router)

We are immensely grateful for their contributions to the open-source community.

## License

MIT License - see [LICENSE](./LICENSE) for details
