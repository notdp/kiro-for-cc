import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { SteeringManager } from '../features/steering/steeringManager';
import { getLLMProvider } from '../extension';
import { LLMProvider } from './llmProvider';

export class SteeringExplorerProvider implements vscode.TreeDataProvider<SteeringItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<SteeringItem | undefined | null | void> = new vscode.EventEmitter<SteeringItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<SteeringItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private steeringManager!: SteeringManager;
    private isLoading: boolean = false;
    private llmProvider: LLMProvider | undefined;

    constructor(private context: vscode.ExtensionContext) {
        // We'll set the steering manager later from extension.ts
    }

    setSteeringManager(steeringManager: SteeringManager) {
        this.steeringManager = steeringManager;
    }

    refresh(): void {
        this.isLoading = true;
        this._onDidChangeTreeData.fire(); // Show loading state immediately
        
        // Use a small timeout to allow the UI to update to the loading state
        setTimeout(() => {
            this.llmProvider = getLLMProvider();
            this.isLoading = false;
            this._onDidChangeTreeData.fire(); // Show actual content
        }, 100);
    }

    getTreeItem(element: SteeringItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: SteeringItem): Promise<SteeringItem[]> {
        this.llmProvider = getLLMProvider();
        if (!this.llmProvider) {
            // Provider not ready yet, show loading or empty
            return [new SteeringItem('Initializing provider...', vscode.TreeItemCollapsibleState.None, 'steering-loading', '', this.context)];
        }
        const steeringFilename = this.llmProvider.getSteeringFilename();

        if (!element) {
            // Root level
            const items: SteeringItem[] = [];

            if (this.isLoading) {
                return [new SteeringItem('Loading steering documents...', vscode.TreeItemCollapsibleState.None, 'steering-loading', '', this.context)];
            }

            // Check existence of steering files
            const globalSteeringFile = path.join(process.env.HOME || '', '.claude', steeringFilename);
            const globalExists = fs.existsSync(globalSteeringFile);

            let projectSteeringFile = '';
            let projectExists = false;
            if (vscode.workspace.workspaceFolders) {
                projectSteeringFile = path.join(vscode.workspace.workspaceFolders[0].uri.fsPath, steeringFilename);
                projectExists = fs.existsSync(projectSteeringFile);
            }

            // Add Global and Project Rules if they exist
            if (globalExists) {
                items.push(new SteeringItem(
                    'Global Rule',
                    vscode.TreeItemCollapsibleState.None,
                    'steering-file-global',
                    globalSteeringFile,
                    this.context,
                    {
                        command: 'vscode.open',
                        title: `Open Global ${steeringFilename}`,
                        arguments: [vscode.Uri.file(globalSteeringFile)]
                    },
                    undefined,
                    steeringFilename
                ));
            }

            if (projectExists) {
                items.push(new SteeringItem(
                    'Project Rule',
                    vscode.TreeItemCollapsibleState.None,
                    'steering-file-project',
                    projectSteeringFile,
                    this.context,
                    {
                        command: 'vscode.open',
                        title: `Open Project ${steeringFilename}`,
                        arguments: [vscode.Uri.file(projectSteeringFile)]
                    },
                    undefined,
                    steeringFilename
                ));
            }

            // Add traditional steering documents
            if (vscode.workspace.workspaceFolders && this.steeringManager) {
                const steeringDocs = await this.steeringManager.getSteeringDocuments();
                if (steeringDocs.length > 0) {
                    items.push(new SteeringItem('Steering Docs', vscode.TreeItemCollapsibleState.Expanded, 'steering-header', '', this.context));
                }
            }

            // Add create buttons for missing files
            if (!globalExists) {
                items.push(new SteeringItem(
                    'Create Global Rule',
                    vscode.TreeItemCollapsibleState.None,
                    'create-steering-file-global',
                    '',
                    this.context,
                    {
                        command: 'kfc.steering.createUserRule',
                        title: `Create Global ${steeringFilename}`
                    },
                    undefined,
                    steeringFilename
                ));
            }

            if (vscode.workspace.workspaceFolders && !projectExists) {
                items.push(new SteeringItem(
                    'Create Project Rule',
                    vscode.TreeItemCollapsibleState.None,
                    'create-steering-file-project',
                    '',
                    this.context,
                    {
                        command: 'kfc.steering.createProjectRule',
                        title: `Create Project ${steeringFilename}`
                    },
                    undefined,
                    steeringFilename
                ));
            }

            return items;
        } else if (element.contextValue === 'steering-header') {
            // Children of "Steering Docs"
            const items: SteeringItem[] = [];
            if (vscode.workspace.workspaceFolders && this.steeringManager) {
                const steeringDocs = await this.steeringManager.getSteeringDocuments();
                const workspacePath = vscode.workspace.workspaceFolders[0].uri.fsPath;

                for (const doc of steeringDocs) {
                    const relativePath = path.relative(workspacePath, doc.path);
                    items.push(new SteeringItem(
                        doc.name,
                        vscode.TreeItemCollapsibleState.None,
                        'steering-document',
                        doc.path,
                        this.context,
                        {
                            command: 'vscode.open',
                            title: 'Open Steering Document',
                            arguments: [vscode.Uri.file(doc.path)]
                        },
                        relativePath
                    ));
                }
            }
            return items;
        }

        return [];
    }
}

class SteeringItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly contextValue: string,
        public readonly resourcePath: string,
        private readonly context: vscode.ExtensionContext,
        public readonly command?: vscode.Command,
        private readonly filename?: string, // for steering-document description
        private readonly steeringFilename?: string // for dynamic labels
    ) {
        super(label, collapsibleState);

        // Set icons and tooltips based on type
        if (contextValue === 'steering-loading') {
            this.iconPath = new vscode.ThemeIcon('sync~spin');
            this.tooltip = 'Loading...';
        } else if (contextValue === 'steering-file-global') {
            this.iconPath = new vscode.ThemeIcon('globe');
            this.tooltip = `Global Steering File: ${resourcePath}`;
            this.description = `~/.claude/${this.steeringFilename}`;
        } else if (contextValue === 'steering-file-project') {
            this.iconPath = new vscode.ThemeIcon('root-folder');
            this.tooltip = `Project Steering File: ${resourcePath}`;
            this.description = this.steeringFilename;
        } else if (contextValue === 'create-steering-file-global') {
            this.iconPath = new vscode.ThemeIcon('globe');
            this.tooltip = `Click to create Global ${this.steeringFilename}`;
        } else if (contextValue === 'create-steering-file-project') {
            this.iconPath = new vscode.ThemeIcon('root-folder');
            this.tooltip = `Click to create Project ${this.steeringFilename}`;
        } else if (contextValue === 'steering-header') {
            this.iconPath = new vscode.ThemeIcon('folder--library');
            this.tooltip = 'Generated project steering documents';
        } else if (contextValue === 'steering-document') {
            this.iconPath = new vscode.ThemeIcon('file');
            this.tooltip = `Steering document: ${resourcePath}`;
            this.description = filename;
        }
    }
}