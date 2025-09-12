import * as vscode from 'vscode';
import { LLMProvider } from './llmProvider';
import { ConfigManager } from '../utils/configManager';
import { GoogleGenerativeAI } from '@google/generative-ai';

export class GeminiCodeProvider implements LLMProvider {
    private configManager: ConfigManager;
    private genAI: GoogleGenerativeAI;

    constructor(private outputChannel: vscode.OutputChannel) {
        this.configManager = ConfigManager.getInstance();
        const apiKey = this.configManager.get<string>('gemini.apiKey');
        if (!apiKey) {
            vscode.window.showErrorMessage('Gemini API key not configured. Please set it in the settings.');
            throw new Error('Gemini API key not configured.');
        }
        this.genAI = new GoogleGenerativeAI(apiKey);
    }

    async invokeSplitView(prompt: string, title: string): Promise<void> {
        this.outputChannel.appendLine(`[GeminiCodeProvider] Invoking Gemini in split view`);
        this.outputChannel.appendLine(`========================================`);
        this.outputChannel.appendLine(prompt);
        this.outputChannel.appendLine(`========================================`);

        const modelName = this.configManager.get<string>('gemini.model') || 'gemini-pro';
        const model = this.genAI.getGenerativeModel({ model: modelName });

        try {
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            const doc = await vscode.workspace.openTextDocument({
                content: text,
                language: 'markdown'
            });
            await vscode.window.showTextDocument(doc, vscode.ViewColumn.Two);
        } catch (error) {
            this.outputChannel.appendLine(`[GeminiCodeProvider] Error: ${error}`);
            vscode.window.showErrorMessage(`Failed to invoke Gemini: ${error}`);
            throw error;
        }
    }

    async invokeHeadless(prompt: string): Promise<{ exitCode: number | undefined; output?: string }> {
        this.outputChannel.appendLine(`[GeminiCodeProvider] Invoking Gemini in headless mode`);
        this.outputChannel.appendLine(`========================================`);
        this.outputChannel.appendLine(prompt);
        this.outputChannel.appendLine(`========================================`);

        const modelName = this.configManager.get<string>('gemini.model') || 'gemini-pro';
        const model = this.genAI.getGenerativeModel({ model: modelName });

        try {
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            return { exitCode: 0, output: text };
        } catch (error) {
            this.outputChannel.appendLine(`[GeminiCodeProvider] Error: ${error}`);
            return { exitCode: 1, output: `${error}` };
        }
    }
}
