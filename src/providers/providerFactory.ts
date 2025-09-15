import * as vscode from 'vscode';
import { ConfigManager } from '../utils/configManager';
import { LLMProvider } from './llmProvider';
import { ClaudeCodeProvider } from './claudeCodeProvider';
import { GeminiCodeProvider } from './geminiCodeProvider';
import { CodexCodeProvider } from './codexCodeProvider';

export function createLLMProvider(context: vscode.ExtensionContext, outputChannel: vscode.OutputChannel): LLMProvider {
    const configManager = ConfigManager.getInstance();
    const provider = configManager.get('ai.provider');

    if (provider === 'Gemini') {
        try {
            return new GeminiCodeProvider(context, outputChannel);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to initialize Gemini provider: ${error}. Falling back to Claude.`);
            return new ClaudeCodeProvider(context, outputChannel);
        }
    }

    if (provider === 'Codex') {
        try {
            return new CodexCodeProvider(context, outputChannel);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to initialize Codex provider: ${error}. Falling back to Claude.`);
            return new ClaudeCodeProvider(context, outputChannel);
        }
    }

    return new ClaudeCodeProvider(context, outputChannel);
}
