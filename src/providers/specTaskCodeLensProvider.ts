import * as vscode from 'vscode';
import { ConfigManager } from '../utils/configManager';

export class SpecTaskCodeLensProvider implements vscode.CodeLensProvider {
    private _onDidChangeCodeLenses: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();
    public readonly onDidChangeCodeLenses: vscode.Event<void> = this._onDidChangeCodeLenses.event;
    private configManager: ConfigManager;

    constructor() {
        this.configManager = ConfigManager.getInstance();
        this.configManager.loadSettings();
        vscode.workspace.onDidChangeConfiguration((_) => {
            this._onDidChangeCodeLenses.fire();
        });
    }

    public provideCodeLenses(document: vscode.TextDocument, token: vscode.CancellationToken): vscode.CodeLens[] | Thenable<vscode.CodeLens[]> {
        // Pattern is already filtered by registration, but double-check for tasks.md  
        const specDir = this.configManager.getPath('specs');
        if (!document.fileName.includes(specDir) || !document.fileName.endsWith('tasks.md')) {
            return [];
        }

        const codeLenses: vscode.CodeLens[] = [];
        const text = document.getText();
        // 使用正则分割，同时处理 Windows (CRLF) 和 Unix (LF) 换行符
        const lines = text.split(/\r?\n/);

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            // 匹配任务列表格式: - [ ] 任务描述
            const taskMatch = line.match(/^(\s*)- \[ \] (.+)$/);

            if (taskMatch) {
                const range = new vscode.Range(i, 0, i, line.length);
                const taskDescription = taskMatch[2];

                // 创建 CodeLens
                const codeLens = new vscode.CodeLens(range, {
                    title: "▶ Start Task",
                    tooltip: "Click to implement this task with Claude Code",
                    command: "kfc.spec.implTask",
                    arguments: [document.uri, i, taskDescription]
                });

                codeLenses.push(codeLens);
            }
        }

        return codeLenses;
    }

    public resolveCodeLens(codeLens: vscode.CodeLens, token: vscode.CancellationToken) {
        return codeLens;
    }
}
