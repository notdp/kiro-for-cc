import * as vscode from 'vscode';
import { LLMProvider } from './llmProvider';
import { ConfigManager } from '../utils/configManager';
import OpenAI from 'openai';

export class CodexCodeProvider implements LLMProvider {
    private configManager: ConfigManager;
    private openai: OpenAI;

    constructor(private outputChannel: vscode.OutputChannel) {
        this.configManager = ConfigManager.getInstance();
        const apiKey = this.configManager.get<string>('codex.apiKey');
        if (!apiKey) {
            vscode.window.showErrorMessage('Codex API key not configured. Please set it in the settings.');
            throw new Error('Codex API key not configured.');
        }
        this.openai = new OpenAI({ apiKey });
    }

    getSteeringFilename(): string {
        return 'AGENTS.md';
    }

    async invokeSplitView(prompt: string, title: string): Promise<void> {
        this.outputChannel.appendLine(`[CodexCodeProvider] Invoking Codex in split view`);
        this.outputChannel.appendLine(`========================================`);
        this.outputChannel.appendLine(prompt);
        this.outputChannel.appendLine(`========================================`);

        const model = this.configManager.get<string>('codex.model') || 'text-davinci-002';

        try {
            const completion = await this.openai.completions.create({
                model,
                prompt,
                max_tokens: 2048,
            });
            const text = completion.choices[0].text;

            const doc = await vscode.workspace.openTextDocument({
                content: text,
                language: 'markdown'
            });
            await vscode.window.showTextDocument(doc, vscode.ViewColumn.Two);
        } catch (error) {
            this.outputChannel.appendLine(`[CodexCodeProvider] Error: ${error}`);
            vscode.window.showErrorMessage(`Failed to invoke Codex: ${error}`);
            throw error;
        }
    }

    async invokeHeadless(prompt: string): Promise<{ exitCode: number | undefined; output?: string }> {
        this.outputChannel.appendLine(`[CodexCodeProvider] Invoking Codex in headless mode`);
        this.outputChannel.appendLine(`========================================`);
        this.outputChannel.appendLine(prompt);
        this.outputChannel.appendLine(`========================================`);

        const model = this.configManager.get<string>('codex.model') || 'text-davinci-002';

        try {
            const completion = await this.openai.completions.create({
                model,
                prompt,
                max_tokens: 2048,
            });
            const text = completion.choices[0].text;
            return { exitCode: 0, output: text };
        } catch (error) {
            this.outputChannel.appendLine(`[CodexCodeProvider] Error: ${error}`);
            return { exitCode: 1, output: `${error}` };
        }
    }
}
