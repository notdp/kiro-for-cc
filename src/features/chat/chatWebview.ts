import * as vscode from 'vscode';

export class ChatWebview {
    public static currentPanel: ChatWebview | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        this._panel = panel;
        this._extensionUri = extensionUri;

        this._panel.webview.html = this._getHtmlForWebview(this._panel.webview);

        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        this._panel.webview.onDidReceiveMessage(
            message => {
                switch (message.command) {
                    case 'alert':
                        vscode.window.showErrorMessage(message.text);
                        return;
                }
            },
            null,
            this._disposables
        );
    }

    public static createOrShow(extensionUri: vscode.Uri) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        if (ChatWebview.currentPanel) {
            ChatWebview.currentPanel._panel.reveal(column);
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            'kiroChat',
            'SPEC AI Chat',
            vscode.ViewColumn.Two, // Open in a side column
            {
                enableScripts: true,
                localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'media')]
            }
        );

        ChatWebview.currentPanel = new ChatWebview(panel, extensionUri);
    }

    public postMessage(message: any) {
        this._panel.webview.postMessage(message);
    }

    public dispose() {
        ChatWebview.currentPanel = undefined;
        this._panel.dispose();
        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }

    private _getHtmlForWebview(webview: vscode.Webview): string {
        const nonce = getNonce();
        return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>SPEC AI Chat</title>
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; display: flex; flex-direction: column; height: 100vh; margin: 0; color: #ccc; }
                    #message-list { flex-grow: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column;}
                    .message { max-width: 80%; margin-bottom: 15px; padding: 10px 15px; border-radius: 18px; line-height: 1.4; }
                    .user-message { background-color: #0e639c; color: white; align-self: flex-end; margin-left: 20%; }
                    .bot-message { background-color: #2a2a2a; color: #e0e0e0; align-self: flex-start; margin-right: 20%; white-space: pre-wrap; }
                    #input-area { display: flex; padding: 10px; border-top: 1px solid #444; }
                    #prompt-input { flex-grow: 1; background-color: #3c3c3c; color: #f0f0f0; border: 1px solid #555; border-radius: 5px; padding: 10px; font-size: 1em; }
                    #slash-commands { position: absolute; bottom: 60px; left: 20px; background-color: #3c3c3c; border: 1px solid #555; border-radius: 5px; max-height: 200px; overflow-y: auto; display: none; }
                    .command-item { padding: 8px 12px; cursor: pointer; }
                    .command-item:hover { background-color: #555; }
                    button { background-color: #0e639c; color: white; padding: 10px 15px; border: none; border-radius: 5px; cursor: pointer; margin-left: 10px; }
                </style>
            </head>
            <body>
                <div id="message-list"></div>
                <div id="input-area">
                    <textarea id="prompt-input" placeholder="Chat interaction will be enabled in a future update..."></textarea>
                    <button id="tools-btn" title="Tools (coming soon)">🧰</button>
                </div>
                <div id="slash-commands"></div>

                <script nonce="${nonce}">
                    const vscode = acquireVsCodeApi();
                    const messageList = document.getElementById('message-list');
                    const promptInput = document.getElementById('prompt-input');
                    const slashCommandsContainer = document.getElementById('slash-commands');

                    window.addEventListener('message', event => {
                        const message = event.data;
                        switch (message.command) {
                            case 'addUserMessage':
                                addMessage('user', message.text);
                                break;
                            case 'addBotMessage':
                                addMessage('bot', message.text);
                                break;
                        }
                    });

                    function addMessage(role, text) {
                        const messageEl = document.createElement('div');
                        messageEl.className = 'message ' + (role === 'user' ? 'user-message' : 'bot-message');
                        messageEl.textContent = text;
                        messageList.appendChild(messageEl);
                        messageList.scrollTop = messageList.scrollHeight;
                    }

                    const slashCommands = [
                        { command: '/help', description: 'Show help' },
                        { command: '/model', description: 'Switch model' },
                        { command: '/clear', description: 'Clear chat' },
                    ];

                    promptInput.addEventListener('input', () => {
                        const text = promptInput.value;
                        if (text.endsWith('/')) {
                            renderSlashCommands(slashCommands);
                            slashCommandsContainer.style.display = 'block';
                        } else {
                            slashCommandsContainer.style.display = 'none';
                        }
                    });

                    function renderSlashCommands(commands) {
                        slashCommandsContainer.innerHTML = '';
                        commands.forEach(cmd => {
                            const itemEl = document.createElement('div');
                            itemEl.className = 'command-item';
                            itemEl.textContent = \`\${cmd.command} - \${cmd.description}\`;
                            itemEl.dataset.command = cmd.command;
                            slashCommandsContainer.appendChild(itemEl);
                        });
                    }

                    slashCommandsContainer.addEventListener('click', (event) => {
                        if (event.target.classList.contains('command-item')) {
                            const command = event.target.dataset.command;
                            promptInput.value = promptInput.value.slice(0, -1) + command + ' ';
                            promptInput.focus();
                            slashCommandsContainer.style.display = 'none';
                        }
                    });

                </script>
            </body>
            </html>`;
    }
}

function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
