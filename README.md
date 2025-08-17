# SPEC AI Coder

## Vision
An all-in-one, voice-enabled AI extension for spec-driven development. This tool integrates a powerful, local LLM routing server with a modern chat interface, inspired by best-in-class tools like Kiro and GitHub Copilot, to create a seamless and powerful coding assistant.

## Current Features (Completed)

This version represents a major architectural overhaul, successfully integrating the following features:

*   **Integrated LLM Router:**
    *   The **Claude Code Router** is now fully bundled inside the extension. No external CLI tool is required.
    *   The router starts automatically with VS Code.
    *   A comprehensive **Settings UI** allows for full configuration of the router (`~/.claude-code-router/config.json`).
*   **Advanced Provider & Model Management:**
    *   Configure multiple LLM providers (Ollama, OpenAI, OpenRouter, etc.).
    *   Dynamically fetch model lists from supported providers (e.g., OpenRouter) with a "Fetch Models" button.
    *   Configure complex transformer objects for each provider.
    *   Create and edit custom transformer scripts from the UI.
*   **Modern Chat Interface:**
    *   All AI interactions now happen in a dedicated **Chat Panel**.
    *   A **Slash Command Helper** (`/`) provides easy access to commands.

## Current Status: Build Errors Present
**Important:** While the features above are implemented in the code, the project currently has known build errors that prevent it from being packaged and run. The immediate next step is to fix these errors.

## Future Roadmap (Planned Features)

Once the build is stable, we plan to implement the following major features:

*   **Voice Capabilities:**
    *   **Voice-to-Text:** Integrate microphone audio capture directly into the chat UI.
    *   **Configurable STT Models:** Route captured audio to different speech-to-text models (like OpenAI's Whisper) via the router.
    *   **Text-to-Speech:** Add the ability for the AI's responses to be read aloud.
*   **Enhanced IDE Integration:**
    *   **Context-Aware Chat:** Make the chat assistant aware of the code in your active editor.
    *   **Inline Code Suggestions:** Provide AI-powered code completions and suggestions directly in the editor.
*   **Advanced Agent Features:**
    *   **Tools Menu:** A dedicated UI to manage and interact with the tools available to the LLM.
    *   **Custom Agent Creation:** A UI for users to define their own specialized agents.

## Acknowledgements
This project would not be possible without the amazing work of the original creators:
- **Kiro for CC:** [notdp/kiro-for-cc](https://github.com/notdp/kiro-for-cc)
- **Claude Code Router:** [musistudio/claude-code-router](https://github.com/musistudio/claude-code-router)
