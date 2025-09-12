import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { ConfigManager } from '../utils/configManager';
import { VSC_CONFIG_NAMESPACE } from '../constants';
import { getPermissionManager } from '../extension';
import { LLMProvider } from './llmProvider';

export class ClaudeCodeProvider implements LLMProvider {
    private context: vscode.ExtensionContext;
    private outputChannel: vscode.OutputChannel;
    private configManager: ConfigManager;

    constructor(context: vscode.ExtensionContext, outputChannel: vscode.OutputChannel) {
        this.context = context;
        this.outputChannel = outputChannel;

        this.configManager = ConfigManager.getInstance();
        this.configManager.loadSettings();
        // Listen for configuration changes
        vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration(VSC_CONFIG_NAMESPACE)) {
                this.configManager.loadSettings();
            }
        });
    }

    /**
     * Create a temporary file with content
     */
    private async createTempFile(content: string, prefix: string = 'prompt'): Promise<string> {
        const tempDir = this.context.globalStorageUri.fsPath;
        await vscode.workspace.fs.createDirectory(this.context.globalStorageUri);

        const tempFile = path.join(tempDir, `${prefix}-${Date.now()}.md`);
        await fs.promises.writeFile(tempFile, content);

        return this.convertPathIfWSL(tempFile);
    }



    /**
     * Convert Windows path to WSL path if needed
     * Example: C:\Users\username\file.txt -> /mnt/c/Users/username/file.txt
     */
    private convertPathIfWSL(filePath: string): string {
        // Check if running on Windows and path is a Windows path
        if (process.platform === 'win32' && filePath.match(/^[A-Za-z]:\\/)) {
            // Replace backslashes with forward slashes
            let wslPath = filePath.replace(/\\/g, '/');
            // Convert drive letter to WSL format (C: -> /mnt/c)
            wslPath = wslPath.replace(/^([A-Za-z]):/, (_match, drive) => `/mnt/${drive.toLowerCase()}`);
            return wslPath;
        }

        // Return original path if not on Windows or not a Windows path
        return filePath;
    }

    /**
     * Invokes Claude Code in a new terminal on the right side (split view) with the given prompt
     */
    async invokeSplitView(prompt: string, title: string = 'Kiro for AI'): Promise<void> {
        try {
            // 获取 PermissionManager 并检查权限
            const permissionManager = getPermissionManager();
            if (permissionManager) {
                const hasPermission = await permissionManager.checkPermission();
                if (!hasPermission) {
                    this.outputChannel.appendLine('[ClaudeCodeProvider] No permission, showing setup');
                    const granted = await permissionManager.showPermissionSetup();
                    if (!granted) {
                        throw new Error('Claude Code permissions not granted');
                    }
                }
            }
            // Create temp file with the prompt
            const promptFilePath = await this.createTempFile(prompt, 'prompt');

            const claudePath = this.configManager.get('claude.cliPath');
            // Build the command - use command substitution instead of input redirection
            let command = `${claudePath} --permission-mode bypassPermissions "$(cat "${promptFilePath}")"`;

            // Create a new terminal in the editor area (right side)
            const terminal = vscode.window.createTerminal({
                name: title,
                cwd: vscode.workspace.workspaceFolders?.[0]?.uri.fsPath,
                location: {
                    viewColumn: vscode.ViewColumn.Two  // Open in the second column (right side)
                }
            });

            // Show the terminal
            terminal.show();

            // Send the command directly without echo messages
            const delay = this.configManager.getTerminalDelay();
            setTimeout(() => {
                terminal.sendText(command, true); // true = add newline to execute
            }, delay); // Configurable delay to allow venv activation

            // Clean up temp files after a delay
            setTimeout(async () => {
                try {
                    await fs.promises.unlink(promptFilePath);
                    this.outputChannel.appendLine(`Cleaned up prompt file: ${promptFilePath}`);
                } catch (e) {
                    // Ignore cleanup errors
                    this.outputChannel.appendLine(`Failed to cleanup temp file: ${e}`);
                }
            }, 30000); // 30 seconds delay to give Claude time to read the file

            // If this is a spec creation, watch for the folder and rename the terminal
            if (title.includes('Creating Spec')) {
                this.setupSpecFolderWatcher(terminal);
            }

        } catch (error) {
            this.outputChannel.appendLine(`ERROR: Failed to send to Claude Code: ${error}`);
            vscode.window.showErrorMessage(`Failed to run Claude Code: ${error}`);
            throw error;
        }
    }

    /**
     * Set up a file system watcher to automatically rename the terminal
     * when a new spec folder is created
     */
    private async setupSpecFolderWatcher(terminal: vscode.Terminal): Promise<void> {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            return;
        }
        // Create watcher for new folders in the specs directory
        const watcher = vscode.workspace.createFileSystemWatcher(
            new vscode.RelativePattern(workspaceFolder, `${this.configManager.getPath('specs')}/*`),
            false, // Watch for creates
            true,  // Ignore changes
            true   // Ignore deletes
        );

        let disposed = false;

        // Handle folder creation
        const disposable = watcher.onDidCreate(async (uri) => {
            if (disposed) return;

            // Validate it's a directory
            try {
                const stats = await vscode.workspace.fs.stat(uri);
                if (stats.type !== vscode.FileType.Directory) {
                    this.outputChannel.appendLine(`[ClaudeCodeProvider] Skipping non-directory: ${uri.fsPath}`);
                    return;
                }
            } catch (error) {
                this.outputChannel.appendLine(`[ClaudeCodeProvider] Error checking path: ${error}`);
                return;
            }

            const specName = path.basename(uri.fsPath);
            this.outputChannel.appendLine(`[ClaudeCodeProvider] New spec detected: ${specName}`);
            try {
                await this.renameTerminal(terminal, `Spec: ${specName}`);
            } catch (error) {
                this.outputChannel.appendLine(`[ClaudeCodeProvider] Failed to rename terminal: ${error}`);
            }

            // Clean up after successful rename
            disposable.dispose();
            watcher.dispose();
            disposed = true;
        });

        // Auto-cleanup after timeout
        setTimeout(() => {
            if (!disposed) {
                this.outputChannel.appendLine(`[ClaudeCodeProvider] Watcher timeout - cleaning up`);
                disposable.dispose();
                watcher.dispose();
                disposed = true;
            }
        }, 60000); // 60 seconds timeout
    }

    /**
     * Rename a terminal
     */
    private async renameTerminal(terminal: vscode.Terminal, newName: string): Promise<void> {
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
     * Returns a promise that resolves when the command completes
     */
    async invokeHeadless(
        prompt: string
    ): Promise<{ exitCode: number | undefined; output?: string }> {
        // ... (rest of the method is unchanged)
        // 获取 PermissionManager 实例并检查权限
        const permissionManager = getPermissionManager();
        if (permissionManager) {
            const hasPermission = await permissionManager.checkPermission();
            if (!hasPermission) {
                this.outputChannel.appendLine('[ClaudeCodeProvider] No permission, showing setup');
                const granted = await permissionManager.showPermissionSetup();
                if (!granted) {
                    throw new Error('Claude Code permissions not granted');
                }
            }
        }

        this.outputChannel.appendLine(`[ClaudeCodeProvider] Invoking Claude Code in headless mode`);
        this.outputChannel.appendLine(`========================================`);
        this.outputChannel.appendLine(prompt);
        this.outputChannel.appendLine(`========================================`);

        // Get the workspace folder
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        const cwd = workspaceFolder?.uri.fsPath;

        // Create temp file with the prompt
        const promptFilePath = await this.createTempFile(prompt, 'background-prompt');

        const claudePath = this.configManager.get('claude.cliPath');
        // Build command using command substitution instead of file redirection
        let commandLine = `${claudePath} --permission-mode bypassPermissions "$(cat "${promptFilePath}")"`;

        // Create hidden terminal for background execution
        const terminal = vscode.window.createTerminal({
            name: 'Claude Code Background',
            cwd,
            hideFromUser: true
        });

        return new Promise((resolve) => {
            let shellIntegrationChecks = 0;
            // Wait for shell integration to be available
            const checkShellIntegration = setInterval(() => {
                shellIntegrationChecks++;

                if (terminal.shellIntegration) {
                    clearInterval(checkShellIntegration);

                    // Execute command with shell integration
                    const execution = terminal.shellIntegration.executeCommand(commandLine);

                    // Listen for command completion
                    const disposable = vscode.window.onDidEndTerminalShellExecution(event => {
                        if (event.terminal === terminal && event.execution === execution) {
                            disposable.dispose();

                            // Only log errors
                            if (event.exitCode !== 0) {
                                this.outputChannel.appendLine(`[Claude] Command failed with exit code: ${event.exitCode}`);
                                this.outputChannel.appendLine(`[Claude] Command was: ${commandLine}`);
                            }

                            resolve({
                                exitCode: event.exitCode,
                                output: undefined
                            });

                            // Clean up terminal and temp file after a short delay
                            setTimeout(async () => {
                                terminal.dispose();
                                try {
                                    await fs.promises.unlink(promptFilePath);
                                    this.outputChannel.appendLine(`[Claude] Cleaned up temp file: ${promptFilePath}`);
                                } catch (e) {
                                    // Ignore cleanup errors
                                    this.outputChannel.appendLine(`[Claude] Failed to cleanup temp file: ${e}`);
                                }
                            }, 1000);
                        }
                    });
                } else if (shellIntegrationChecks > 20) { // After 2 seconds
                    // Fallback: execute without shell integration
                    clearInterval(checkShellIntegration);
                    this.outputChannel.appendLine(`[Claude] Shell integration not available, using fallback mode`);
                    terminal.sendText(commandLine);

                    // Resolve after a reasonable delay since we can't track completion
                    setTimeout(async () => {
                        resolve({ exitCode: undefined });
                        terminal.dispose();
                        // Clean up temp file
                        try {
                            await fs.promises.unlink(promptFilePath);
                        } catch (e) {
                            // Ignore cleanup errors
                        }
                    }, 5000);
                }
            }, 100);
        });
    }

    /**
     * 创建权限设置终端（供 PermissionManager 使用）
     */
    static createPermissionTerminal(): vscode.Terminal {
        const configManager = ConfigManager.getInstance();
        const claudePath = configManager.get('claude.cliPath');
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        const terminal = vscode.window.createTerminal({
            name: 'Claude Code - Permission Setup',
            cwd: workspaceFolder,
            location: { viewColumn: vscode.ViewColumn.Two }
        });

        terminal.show();
        terminal.sendText(
            `${claudePath} --permission-mode bypassPermissions`,
            true
        );

        return terminal;
    }
}