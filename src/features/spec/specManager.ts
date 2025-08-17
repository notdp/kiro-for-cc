import * as vscode from 'vscode';
import * as path from 'path';
import { ClaudeCodeProvider } from '../../providers/claudeCodeProvider';
import { ConfigManager } from '../../utils/configManager';
import { NotificationUtils } from '../../utils/notificationUtils';
import { PromptLoader } from '../../services/promptLoader';

export type SpecDocumentType = 'requirements' | 'design' | 'tasks';

export class SpecManager {
    private configManager: ConfigManager;
    private promptLoader: PromptLoader;

    constructor(
        private claudeProvider: ClaudeCodeProvider,
        private outputChannel: vscode.OutputChannel
    ) {
        this.configManager = ConfigManager.getInstance();
        this.configManager.loadSettings();
        this.promptLoader = PromptLoader.getInstance();
    }

    public getSpecBasePath(): string {
        return this.configManager.getPath('specs');
    }

    async create() {
        // Get feature description only
        const description = await vscode.window.showInputBox({
            title: '✨ Create New Spec ✨',
            prompt: 'Specs are a structured way to build features so you can plan before building',
            placeHolder: 'Enter your idea to generate requirement, design, and task specs...',
            ignoreFocusOut: false
        });

        if (!description) {
            return;
        }

        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            vscode.window.showErrorMessage('No workspace folder open');
            return;
        }

        // Show notification immediately after user input
        NotificationUtils.showAutoDismissNotification('Claude is creating your spec. Check the terminal for progress.');

        // Let Claude handle everything - directory creation, naming, and file creation
        // Load and render the spec creation prompt
        const prompt = this.promptLoader.renderPrompt('create-spec', {
            description,
            workspacePath: workspaceFolder.uri.fsPath,
            specBasePath: this.getSpecBasePath()
        });

        // Send to Claude and get the terminal
        const terminal = await this.claudeProvider.invokeClaudeSplitView(prompt, 'KFC - Creating Spec');

        // Set up automatic terminal renaming when spec folder is created
        this.setupSpecFolderWatcher(workspaceFolder, terminal);
    }

    async createWithAgents() {
        // Get feature description only
        const description = await vscode.window.showInputBox({
            title: '✨ Create New Spec with Agents ✨',
            prompt: 'This will use specialized subagents for creating requirements, design, and tasks',
            placeHolder: 'Enter your idea to generate requirement, design, and task specs...',
            ignoreFocusOut: false
        });

        if (!description) {
            return;
        }

        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            vscode.window.showErrorMessage('No workspace folder open');
            return;
        }

        // Show notification immediately after user input
        NotificationUtils.showAutoDismissNotification('Claude is creating your spec with specialized agents. Check the terminal for progress.');

        // Use the specialized subagent prompt
        const prompt = this.promptLoader.renderPrompt('create-spec-with-agents', {
            description,
            workspacePath: workspaceFolder.uri.fsPath,
            specBasePath: this.getSpecBasePath()
        });

        // Send to Claude and get the terminal
        const terminal = await this.claudeProvider.invokeClaudeSplitView(prompt, 'KFC - Creating Spec (Agents)');

        // Set up automatic terminal renaming when spec folder is created
        this.setupSpecFolderWatcher(workspaceFolder, terminal);
    }

    async implTask(taskFilePath: string, taskDescription: string) {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            vscode.window.showErrorMessage('No workspace folder open');
            return;
        }

        // Show notification immediately after user input
        NotificationUtils.showAutoDismissNotification('Claude is implementing your task. Check the terminal for progress.');

        const prompt = this.promptLoader.renderPrompt('impl-task', {
            taskFilePath,
            taskDescription
        });

        await this.claudeProvider.invokeClaudeSplitView(prompt, 'KFC - Implementing Task');
    }

    /**
     * Set up a file system watcher to automatically rename the terminal 
     * when a new spec folder is created
     */
    private async setupSpecFolderWatcher(workspaceFolder: vscode.WorkspaceFolder, terminal: vscode.Terminal): Promise<void> {
        // Create watcher for new folders in the specs directory
        const watcher = vscode.workspace.createFileSystemWatcher(
            new vscode.RelativePattern(workspaceFolder, `${this.getSpecBasePath()}/*`),
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
                    this.outputChannel.appendLine(`[SpecManager] Skipping non-directory: ${uri.fsPath}`);
                    return;
                }
            } catch (error) {
                this.outputChannel.appendLine(`[SpecManager] Error checking path: ${error}`);
                return;
            }

            const specName = path.basename(uri.fsPath);
            this.outputChannel.appendLine(`[SpecManager] New spec detected: ${specName}`);
            try {
                await this.claudeProvider.renameTerminal(terminal, `Spec: ${specName}`);
            } catch (error) {
                this.outputChannel.appendLine(`[SpecManager] Failed to rename terminal: ${error}`);
            }

            // Clean up after successful rename
            this.disposeWatcher(disposable, watcher);
            disposed = true;
        });

        // Auto-cleanup after timeout
        setTimeout(() => {
            if (!disposed) {
                this.outputChannel.appendLine(`[SpecManager] Watcher timeout - cleaning up`);
                this.disposeWatcher(disposable, watcher);
                disposed = true;
            }
        }, 60000); // 60 seconds timeout
    }

    /**
     * Dispose watcher and its event handler
     */
    private disposeWatcher(disposable: vscode.Disposable, watcher: vscode.FileSystemWatcher): void {
        disposable.dispose();
        watcher.dispose();
        this.outputChannel.appendLine(`[SpecManager] Watcher disposed`);
    }

    async navigateToDocument(specName: string, type: SpecDocumentType) {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            return;
        }

        const docPath = path.join(
            workspaceFolder.uri.fsPath,
            this.getSpecBasePath(),
            specName,
            `${type}.md`
        );

        try {
            const doc = await vscode.workspace.openTextDocument(docPath);
            await vscode.window.showTextDocument(doc);
        } catch (error) {
            // File doesn't exist, look for already open virtual documents
            // Create unique identifier for this spec document
            const uniqueMarker = `<!-- kiro-spec: ${specName}/${type} -->`;

            for (const doc of vscode.workspace.textDocuments) {
                // Check if this is an untitled document with our unique marker
                if (doc.isUntitled && doc.getText().includes(uniqueMarker)) {
                    // Found our specific virtual document, show it
                    await vscode.window.showTextDocument(doc, {
                        preview: false,
                        viewColumn: vscode.ViewColumn.Active
                    });
                    return;
                }
            }

            // No existing virtual document found, create a new one
            let placeholderContent = `${uniqueMarker}
# ${type.charAt(0).toUpperCase() + type.slice(1)} Document

This document has not been created yet.`;

            if (type === 'design') {
                placeholderContent += '\n\nPlease approve the requirements document first.';
            } else if (type === 'tasks') {
                placeholderContent += '\n\nPlease approve the design document first.';
            } else if (type === 'requirements') {
                placeholderContent += '\n\nRun "Create New Spec" to generate this document.';
            }

            // Create a new untitled document
            const doc = await vscode.workspace.openTextDocument({
                content: placeholderContent,
                language: 'markdown'
            });

            // Show it
            await vscode.window.showTextDocument(doc, {
                preview: false,
                viewColumn: vscode.ViewColumn.Active
            });
        }
    }

    async delete(specName: string): Promise<void> {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            vscode.window.showErrorMessage('No workspace folder open');
            return;
        }

        const specPath = path.join(
            workspaceFolder.uri.fsPath,
            this.getSpecBasePath(),
            specName
        );

        try {
            await vscode.workspace.fs.delete(vscode.Uri.file(specPath), { recursive: true });
            await NotificationUtils.showAutoDismissNotification(`Spec "${specName}" deleted successfully`);
        } catch (error) {
            this.outputChannel.appendLine(`[SpecManager] Failed to delete spec: ${error}`);
            vscode.window.showErrorMessage(`Failed to delete spec: ${error}`);
        }
    }

    async getSpecList(): Promise<string[]> {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            return [];
        }

        const specsPath = path.join(workspaceFolder.uri.fsPath, this.getSpecBasePath());

        // Check if directory exists first before creating
        try {
            await vscode.workspace.fs.stat(vscode.Uri.file(specsPath));
        } catch {
            // Directory doesn't exist, create it
            try {
                this.outputChannel.appendLine('[SpecManager] Creating .claude/specs directory');
                await vscode.workspace.fs.createDirectory(vscode.Uri.file(path.dirname(specsPath)));
                await vscode.workspace.fs.createDirectory(vscode.Uri.file(specsPath));
            } catch {
                // Ignore errors
            }
        }

        try {
            const entries = await vscode.workspace.fs.readDirectory(vscode.Uri.file(specsPath));
            return entries
                .filter(([, type]) => type === vscode.FileType.Directory)
                .map(([name]) => name);
        } catch (error) {
            // Directory doesn't exist yet
            return [];
        }
    }
}