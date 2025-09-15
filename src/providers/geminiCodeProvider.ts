import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as child_process from 'child_process';
import { LLMProvider } from './llmProvider';
import { ConfigManager } from '../utils/configManager';

export class GeminiCodeProvider implements LLMProvider {
    private configManager: ConfigManager;

    constructor(private context: vscode.ExtensionContext, private outputChannel: vscode.OutputChannel) {
        this.configManager = ConfigManager.getInstance();
    }

    getSteeringFilename(): string {
        return 'AGENTS.md';
    }

    private async createTempFile(content: string, prefix: string = 'prompt'): Promise<string> {
        const tempDir = this.context.globalStorageUri.fsPath;
        await vscode.workspace.fs.createDirectory(this.context.globalStorageUri);
        const tempFile = path.join(tempDir, `${prefix}-${Date.now()}.md`);
        await fs.promises.writeFile(tempFile, content);
        return this.convertPathIfWSL(tempFile);
    }

    private convertPathIfWSL(filePath: string): string {
        if (process.platform === 'win32' && filePath.match(/^[A-Za-z]:\\/)) {
            let wslPath = filePath.replace(/\\/g, '/');
            wslPath = wslPath.replace(/^([A-Za-z]):/, (_match, drive) => `/mnt/${drive.toLowerCase()}`);
            return wslPath;
        }
        return filePath;
    }

    async invokeSplitView(prompt: string, title: string): Promise<void> {
        this.outputChannel.appendLine(`[GeminiCodeProvider] Invoking Gemini in split view`);
        this.outputChannel.appendLine(`========================================`);
        this.outputChannel.appendLine(prompt);
        this.outputChannel.appendLine(`========================================`);

        const modelName = this.configManager.get<string>('gemini.model') || 'gemini-pro';
        const promptFilePath = await this.createTempFile(prompt, 'gemini-prompt');

        // Use 'cat' to pipe the prompt to the gemini cli
        const command = `cat "${promptFilePath}" | gemini -m "${modelName}"`;

        const terminal = vscode.window.createTerminal({
            name: title,
            cwd: vscode.workspace.workspaceFolders?.[0]?.uri.fsPath,
            location: {
                viewColumn: vscode.ViewColumn.Two
            }
        });
        terminal.show();

        // Add a small delay for safety
        setTimeout(() => {
            terminal.sendText(command, true);
        }, 500);

        // Clean up temp file
        setTimeout(async () => {
            try {
                await fs.promises.unlink(promptFilePath);
            } catch (e) {
                // Ignore cleanup errors
            }
        }, 30000);
    }

    async invokeHeadless(prompt: string): Promise<{ exitCode: number | undefined; output?: string }> {
        this.outputChannel.appendLine(`[GeminiCodeProvider] Invoking Gemini in headless mode`);
        this.outputChannel.appendLine(`========================================`);
        this.outputChannel.appendLine(prompt);
        this.outputChannel.appendLine(`========================================`);

        const modelName = this.configManager.get<string>('gemini.model') || 'gemini-pro';
        const promptFilePath = await this.createTempFile(prompt, 'gemini-headless-prompt');
        const command = `cat "${promptFilePath}" | gemini -m "${modelName}"`;

        const cwd = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

        return new Promise((resolve) => {
            child_process.exec(command, { cwd }, (error, stdout, stderr) => {
                // Clean up temp file
                fs.promises.unlink(promptFilePath).catch(() => {});

                if (error) {
                    this.outputChannel.appendLine(`[GeminiCodeProvider] Headless exec error: ${error.message}`);
                    this.outputChannel.appendLine(`[GeminiCodeProvider] Stderr: ${stderr}`);
                    resolve({ exitCode: error.code, output: stderr });
                } else {
                    this.outputChannel.appendLine(`[GeminiCodeProvider] Headless exec success.`);
                    resolve({ exitCode: 0, output: stdout });
                }
            });
        });
    }
}
