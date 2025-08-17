import * as vscode from 'vscode';
import axios from 'axios';
import { ConfigManager } from '../utils/configManager';
import { ChatWebview } from '../features/chat/chatWebview';
import { VSC_CONFIG_NAMESPACE } from '../constants';
import { getPermissionManager } from '../extension';

interface ClaudeCodeRequest {
    model: string;
    messages: any[];
    system?: any;
    tools?: any[];
    thinking?: any;
    metadata?: {
        user_id: string;
    };
}

export class ClaudeCodeProvider {
    private context: vscode.ExtensionContext;
    private outputChannel: vscode.OutputChannel;
    private configManager: ConfigManager;
    private routerBaseUrl: string;

    constructor(context: vscode.ExtensionContext, outputChannel: vscode.OutputChannel) {
        this.context = context;
        this.outputChannel = outputChannel;

        this.configManager = ConfigManager.getInstance();
        this.configManager.loadSettings();

        // TODO: Make the port configurable from the ccr settings file
        this.routerBaseUrl = 'http://localhost:3456';

        // Listen for configuration changes
        vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration(VSC_CONFIG_NAMESPACE)) {
                this.configManager.loadSettings();
            }
        });
    }

    private createPayloadFromPrompt(prompt: string): ClaudeCodeRequest {
        // This is a simplified example.
        // A more advanced implementation would parse the prompt to separate system messages, user messages, tools, etc.
        // For now, we assume the entire prompt is a user message.
        return {
            model: 'default', // The router will resolve this
            messages: [{ role: 'user', content: prompt }],
            metadata: {
                user_id: `vscode-session_${Date.now()}`
            }
        };
    }

    private async invoke(prompt: string): Promise<any> {
        this.outputChannel.appendLine(`[ClaudeCodeProvider] Invoking router via HTTP...`);
        const payload = this.createPayloadFromPrompt(prompt);

        try {
            const response = await axios.post(`${this.routerBaseUrl}/v1/messages`, payload, {
                headers: { 'Content-Type': 'application/json' }
            });
            this.outputChannel.appendLine(`[ClaudeCodeProvider] Received response from router.`);
            return response.data;
        } catch (error: any) {
            this.outputChannel.appendLine(`ERROR: Failed to POST to Claude Code Router: ${error.message}`);
            if (error.response) {
                this.outputChannel.appendLine(`Response data: ${JSON.stringify(error.response.data)}`);
            }
            vscode.window.showErrorMessage(`Failed to communicate with Claude Code Router: ${error.message}`);
            throw error;
        }
    }

    /**
     * Invokes the router and displays the interaction in the Chat Webview.
     */
    async invokeClaudeSplitView(prompt: string, title: string = 'Kiro for Claude Code'): Promise<vscode.Terminal | undefined> {
        try {
            // Create or show the chat panel
            ChatWebview.createOrShow(this.context.extensionUri);
            const chatPanel = ChatWebview.currentPanel;

            if (chatPanel) {
                // Post the user's prompt to the webview
                chatPanel.postMessage({ command: 'addUserMessage', text: prompt });

                // Get the response from the router
                const response = await this.invoke(prompt);
                const responseContent = response.content.map((c: any) => c.text).join('\n');

                // Post the bot's response to the webview
                chatPanel.postMessage({ command: 'addBotMessage', text: responseContent });
            }

            // The method signature still requires a Terminal, but we no longer use it.
            // Returning undefined is now the standard behavior.
            return undefined;

        } catch (error) {
            this.outputChannel.appendLine(`ERROR in invokeClaudeSplitView: ${error}`);
            // The error is already shown by the invoke method and in the chat panel.
            ChatWebview.currentPanel?.postMessage({ command: 'addBotMessage', text: `Error: ${error}` });
            throw error;
        }
    }

    /**
     * Rename a terminal
     */
    async renameTerminal(terminal: vscode.Terminal, newName: string): Promise<void> {
        // Make sure the terminal is active
        terminal.show();

        // Small delay to ensure terminal is focused
        await new Promise(resolve => setTimeout(resolve, 100));
        this.outputChannel.appendLine(`[ClaudeCodeProvider] ${terminal.name} Terminal renamed to: ${newName}`);

        // Execute the rename command
        await vscode.commands.executeCommand('workbench.action.terminal.renameWithArg', {
            name: newName
        });
    }

    /**
     * Execute Claude command with specific tools in background
     * This is now refactored to use the internal router server.
     */
    async invokeClaudeHeadless(
        prompt: string
    ): Promise<{ exitCode: number | undefined; output?: string }> {
        try {
            const response = await this.invoke(prompt);
            // Success
            return {
                exitCode: 0,
                output: JSON.stringify(response)
            };
        } catch(e) {
            // Failure
            return {
                exitCode: 1,
                output: e instanceof Error ? e.message : String(e)
            };
        }
    }

    /**
     * 创建权限设置终端（供 PermissionManager 使用）
     */
    static createPermissionTerminal(): vscode.Terminal {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        const terminal = vscode.window.createTerminal({
            name: 'Claude Code - Permission Setup',
            cwd: workspaceFolder,
            location: { viewColumn: vscode.ViewColumn.Two }
        });

        terminal.show();
        terminal.sendText(
            'claude --permission-mode bypassPermissions',
            true
        );

        return terminal;
    }
}