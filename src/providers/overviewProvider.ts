import * as vscode from 'vscode';
import { VSC_CONFIG_NAMESPACE } from '../constants';

export class OverviewProvider implements vscode.TreeDataProvider<OverviewItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<OverviewItem | undefined | null | void> = new vscode.EventEmitter<OverviewItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<OverviewItem | undefined | null | void> = this._onDidChangeTreeData.event;
    
    constructor(private context: vscode.ExtensionContext) {}
    
    refresh(): void {
        this._onDidChangeTreeData.fire();
    }
    
    getTreeItem(element: OverviewItem): vscode.TreeItem {
        return element;
    }
    
    async getChildren(element?: OverviewItem): Promise<OverviewItem[]> {
        if (element) {
            return [];
        }

        const config = vscode.workspace.getConfiguration(VSC_CONFIG_NAMESPACE);
        const currentProvider = config.get('ai.provider');

        const items: OverviewItem[] = [
            new OverviewItem(`AI Provider: ${currentProvider}`, vscode.TreeItemCollapsibleState.None, {
                command: 'kfc.ai.selectProvider',
                title: 'Select AI Provider'
            }),
            new OverviewItem('Open Settings File', vscode.TreeItemCollapsibleState.None, {
                command: 'kfc.settings.open',
                title: 'Open Settings File'
            }),
            new OverviewItem('Check for Updates', vscode.TreeItemCollapsibleState.None, {
                command: 'kfc.checkForUpdates',
                title: 'Check for Updates'
            }),
            new OverviewItem('Help', vscode.TreeItemCollapsibleState.None, {
                command: 'kfc.help.open',
                title: 'Help'
            })
        ];

        return items;
    }
}

class OverviewItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly command?: vscode.Command
    ) {
        super(label, collapsibleState);
    }
}