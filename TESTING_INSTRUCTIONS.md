# SPEC AI Coder: Installation and Testing Guide

Hello! This guide will walk you through installing the extension from the `.vsix` file and testing the features we've built.

## 1. How to Install the Extension

Here’s how to install the `.vsix` file from the release you created:

1.  **Download the `.vsix` file** from the "Assets" section of the release you created on GitHub.
2.  Open VS Code.
3.  Go to the **Extensions** view (click the square icon on the left sidebar).
4.  Click the `...` (More Actions) menu in the top-right corner of the Extensions view.
5.  Select **"Install from VSIX..."**.
6.  In the file dialog that opens, choose the `.vsix` file you just downloaded.
7.  After installation, it's a good idea to **restart VS Code** to make sure everything is loaded correctly.

## 2. How to Test the Features

Let's do a walkthrough to test the main features we've built.

### Part A: Test the Router Configuration & Dynamic Models

1.  First, let's configure the router. Open the Command Palette (`Cmd+Shift+P` on Mac, `Ctrl+Shift+P` on Windows/Linux).
2.  Type and run the command: **`SPEC AI Coder: Open CCR Settings`**.
3.  The settings page we built should open. Let's try adding a provider like OpenRouter:
    *   Click **"Add Provider"**.
    *   For **Name**, type `openrouter`.
    *   For **API Base URL**, enter `https://openrouter.ai/api/v1/chat/completions`.
4.  Now, let's test the dynamic model fetching. Click the **"Fetch Models"** button that appeared next to the URL.
    *   The **"Models (comma-separated)"** text area should automatically fill with a long list of model IDs.
5.  Enter your OpenRouter **API Key**.
6.  In the **"Router"** section below, find the **"default"** dropdown and select one of the OpenRouter models from the list (e.g., `openrouter,anthropic/claude-3.5-sonnet`).
7.  Click the **"Save Settings"** button at the bottom.

### Part B: Test the Chat UI & End-to-End Flow

1.  Now that the router is configured, let's see it in action. Click on the extension's icon in the activity bar (it may still have the old Kiro icon for now).
2.  In the "Specs" view, click the **`+` (Create New Spec)** button.
3.  When prompted, enter a simple feature idea, like `a simple calculator`.
4.  **Observe the result:** A new panel titled **"Kiro Chat"** should open on the side.
    *   You should see your prompt (`a simple calculator`) appear in a blue "user" message bubble.
    *   After a moment, the AI's response should appear below it in a gray "bot" message bubble.
5.  This confirms the entire flow is working: the UI calls the provider, which calls our internal router, which used the settings you just configured to call OpenRouter, and the response was successfully displayed in our new chat UI.

### Part C: Test the Slash Commands

1.  In the "Kiro Chat" panel, find the text input box at the bottom.
2.  Type a single `/`.
3.  A small popup should immediately appear above the input box with a list of commands like `/help` and `/model`. This confirms the slash command helper is working.

---

Please go through these steps and let me know how it goes. If you encounter any issues or have any feedback, I'll be here to help us fix them. Once you're happy with the result, we can move on to planning the next set of features!
