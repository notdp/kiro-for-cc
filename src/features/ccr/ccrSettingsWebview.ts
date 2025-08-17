import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import axios from 'axios';

export class CcrSettingsWebview {
    public static currentPanel: CcrSettingsWebview | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        this._panel = panel;
        this._extensionUri = extensionUri;

        this._update();

        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        this._panel.webview.onDidReceiveMessage(
            async message => {
                switch (message.command) {
                    case 'save':
                        this.saveConfig(message.text);
                        return;
                    case 'editTransformer':
                        this.editTransformer(message.file);
                        return;
                    case 'createTransformer':
                        await this.createTransformer();
                        return;
                    case 'fetchModels':
                        await this.fetchModels(message.index, message.baseUrl, message.apiKey);
                        return;
                    case 'error':
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

        if (CcrSettingsWebview.currentPanel) {
            CcrSettingsWebview.currentPanel._panel.reveal(column);
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            'ccrSettings',
            'CCR Settings',
            column || vscode.ViewColumn.One,
            {
                enableScripts: true,
                localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'media')]
            }
        );

        CcrSettingsWebview.currentPanel = new CcrSettingsWebview(panel, extensionUri);
    }

    public dispose() {
        CcrSettingsWebview.currentPanel = undefined;
        this._panel.dispose();
        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }

    private async _update() {
        const webview = this._panel.webview;
        this._panel.title = 'CCR Settings';
        this._panel.webview.html = this._getHtmlForWebview(webview);

        try {
            const configPath = this.getConfigPath();
            const configContent = await fs.promises.readFile(configPath, 'utf-8');
            webview.postMessage({ command: 'loadConfig', text: configContent });
        } catch (error) {
            if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
                webview.postMessage({ command: 'loadConfig', text: '{}' });
            } else {
                vscode.window.showErrorMessage(`Error loading CCR config: ${error}`);
            }
        }

        try {
            const pluginsPath = this.getPluginsPath();
            const files = await fs.promises.readdir(pluginsPath);
            const jsFiles = files.filter(file => file.endsWith('.js'));
            webview.postMessage({ command: 'loadTransformers', files: jsFiles });
        } catch (error) {
            if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
                webview.postMessage({ command: 'loadTransformers', files: [] });
            } else {
                vscode.window.showErrorMessage(`Error loading custom transformers: ${error}`);
            }
        }
    }

    private async saveConfig(content: string) {
        try {
            const configPath = this.getConfigPath();
            const configDir = path.dirname(configPath);
            await fs.promises.mkdir(configDir, { recursive: true });
            await fs.promises.writeFile(configPath, content);
            vscode.window.showInformationMessage('CCR settings saved successfully.');
        } catch (error) {
            vscode.window.showErrorMessage(`Error saving CCR config: ${error}`);
        }
    }

    private getConfigPath(): string {
        return path.join(os.homedir(), '.claude-code-router', 'config.json');
    }

    private getPluginsPath(): string {
        return path.join(os.homedir(), '.claude-code-router', 'plugins');
    }

    private async fetchModels(index: number, baseUrl: string, apiKey: string) {
        if (!baseUrl.includes('openrouter.ai')) {
            this._panel.webview.postMessage({ command: 'modelsFetched', index, models: ['Provider not supported for fetching'] });
            return;
        }
        try {
            const response = await axios.get('https://openrouter.ai/api/v1/models');
            const models = (response.data as any).data.map((model: any) => model.id);
            this._panel.webview.postMessage({ command: 'modelsFetched', index, models });
        } catch (error: any) {
            vscode.window.showErrorMessage(`Failed to fetch models: ${error.message}`);
            this._panel.webview.postMessage({ command: 'modelsFetched', index, models: [`Error: ${error.message}`] });
        }
    }

    private async editTransformer(fileName: string) {
        const filePath = path.join(this.getPluginsPath(), fileName);
        try {
            const uri = vscode.Uri.file(filePath);
            const document = await vscode.workspace.openTextDocument(uri);
            await vscode.window.showTextDocument(document);
        } catch (error) {
            vscode.window.showErrorMessage(`Could not open transformer file: ${error}`);
        }
    }

    private async createTransformer() {
        const fileName = await vscode.window.showInputBox({
            prompt: 'Enter a filename for the new transformer (e.g., my-transformer.js)',
            validateInput: input => {
                if (!input || !input.endsWith('.js')) {
                    return 'Filename must end with .js';
                }
                return null;
            }
        });
        if (fileName) {
            const pluginsPath = this.getPluginsPath();
            await fs.promises.mkdir(pluginsPath, { recursive: true });
            const filePath = path.join(pluginsPath, fileName);
            const template = `/**
 * Custom CCR Transformer
 * @param {object} request
 * @returns {object}
 */
module.exports.request = function(request) {
    return request;
};

/**
 * @param {object} response
 * @returns {object}
 */
module.exports.response = function(response) {
    return response;
};
`;
            await fs.promises.writeFile(filePath, template);
            await this.editTransformer(fileName);
            this._update();
        }
    }

    private _getHtmlForWebview(webview: vscode.Webview): string {
        return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>CCR Settings</title>
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 0 20px; color: #ccc; }
                    .container { max-width: 800px; margin: 0 auto; }
                    h1, h2 { color: #c8c8c8; border-bottom: 1px solid #555; padding-bottom: 5px;}
                    .section { background-color: #2a2a2a; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
                    .provider { border: 1px solid #444; padding: 15px; margin-bottom: 15px; border-radius: 5px; }
                    label { display: block; margin-bottom: 5px; font-weight: bold; }
                    input, textarea, select { width: 95%; padding: 8px; margin-bottom: 10px; border: 1px solid #555; background-color: #3c3c3c; color: #f0f0f0; border-radius: 3px; }
                    textarea { height: 80px; font-family: monospace; }
                    button { background-color: #0e639c; color: white; padding: 10px 15px; border: none; border-radius: 5px; cursor: pointer; margin-right: 10px; }
                    button:hover { background-color: #1177bb; }
                    .input-with-button { display: flex; align-items: center; }
                    .input-with-button input { flex-grow: 1; margin-right: -2px; }
                    .input-with-button button { border-top-left-radius: 0; border-bottom-left-radius: 0; }
                    .remove-btn { background-color: #9c2b2b; }
                    .remove-btn:hover { background-color: #bb3d3d; }
                    .transformer-item { display: flex; justify-content: space-between; align-items: center; padding: 8px; border-bottom: 1px solid #444; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>SPEC AI Coder Settings</h1>
                    <p>Manage settings for the integrated AI Router. The file is located at <code>~/.claude-code-router/config.json</code></p>

                    <div id="settings-form">
                        <div class="section">
                            <h2>Providers</h2>
                            <div id="providers-list"></div>
                            <button id="add-provider-btn">Add Provider</button>
                        </div>
                        <div class="section">
                            <h2>Router</h2>
                            <div id="router-config"></div>
                        </div>
                        <div class="section">
                            <h2>Custom Transformers</h2>
                            <p>Manage custom transformer scripts located in <code>~/.claude-code-router/plugins/</code></p>
                            <div id="custom-transformers-list"></div>
                            <button id="create-transformer-btn">Create New Transformer</button>
                        </div>
                        <div class="section">
                            <h2>Speech-to-Text (STT)</h2>
                            <div id="stt-config"></div>
                        </div>
                    </div>
                    <button id="save-button">Save Settings</button>
                </div>

                <script>
                    const vscode = acquireVsCodeApi();
                    let config = {};

                    const providersList = document.getElementById('providers-list');
                    const addProviderBtn = document.getElementById('add-provider-btn');
                    const saveButton = document.getElementById('save-button');
                    const createTransformerBtn = document.getElementById('create-transformer-btn');
                    const customTransformersList = document.getElementById('custom-transformers-list');

                    window.addEventListener('message', event => {
                        const message = event.data;
                        switch(message.command) {
                            case 'loadConfig':
                                try {
                                    config = JSON.parse(message.text);
                                    if (!config.Providers) config.Providers = [];
                                    if (!config.Router) config.Router = {};
                                    if (!config.STT) config.STT = {};
                                    renderProviders();
                                    renderSTT();
                                } catch (e) {
                                    vscode.postMessage({ command: 'error', text: 'Error parsing config JSON: ' + e });
                                    config = { Providers: [], Router: {}, STT: {} };
                                }
                                break;
                            case 'loadTransformers':
                                renderCustomTransformers(message.files);
                                break;
                            case 'modelsFetched':
                                const { index, models } = message;
                                const modelsTextArea = document.getElementById(\`provider-models-\${index}\`);
                                if (modelsTextArea) {
                                    modelsTextArea.value = models.join(', ');
                                    modelsTextArea.dispatchEvent(new Event('input'));
                                }
                                const fetchBtn = document.getElementById(\`fetch-btn-\${index}\`);
                                if(fetchBtn) {
                                    fetchBtn.textContent = 'Fetch Models';
                                    fetchBtn.disabled = false;
                                }
                                break;
                        }
                    });

                    document.getElementById('stt-config').addEventListener('input', (event) => {
                        const target = event.target;
                        if(target.id === 'stt-provider') config.STT.provider = target.value;
                        else if (target.id === 'stt-api-key') config.STT.apiKey = target.value;
                    });

                    providersList.addEventListener('click', (event) => {
                        const target = event.target;
                        if (target.classList.contains('fetch-models-btn')) {
                            const index = parseInt(target.dataset.index, 10);
                            const provider = config.Providers[index];
                            if (provider && provider.api_base_url) {
                                target.textContent = 'Fetching...';
                                target.disabled = true;
                                vscode.postMessage({ command: 'fetchModels', index: index, baseUrl: provider.api_base_url, apiKey: provider.api_key });
                            }
                        } else if (target.classList.contains('remove-btn')) {
                            const index = parseInt(target.dataset.index, 10);
                            config.Providers.splice(index, 1);
                            renderProviders();
                        }
                    });

                    function toggleFetchButton(element, index) {
                        const fetchBtn = document.getElementById(\`fetch-btn-\${index}\`);
                        if (fetchBtn) {
                            fetchBtn.style.display = element.value.includes('openrouter.ai') ? 'inline-block' : 'none';
                        }
                    }

                    function renderProviders() {
                        providersList.innerHTML = '';
                        if (!config.Providers) return;
                        config.Providers.forEach((provider, index) => {
                            const providerEl = document.createElement('div');
                            providerEl.className = 'provider';
                            providerEl.innerHTML = \\\`
                                <h3>Provider: \${provider.name || ''}</h3>
                                <label for="provider-name-\${index}">Name</label>
                                <input type="text" id="provider-name-\${index}" value="\${provider.name || ''}" data-index="\${index}" data-field="name">
                                <label for="provider-api_base_url-\${index}">API Base URL</label>
                                <div class="input-with-button">
                                    <input type="text" id="provider-api_base_url-\${index}" value="\${provider.api_base_url || ''}" data-index="\${index}" data-field="api_base_url" oninput="toggleFetchButton(this, \${index})">
                                    <button class="fetch-models-btn" id="fetch-btn-\${index}" data-index="\${index}" style="display: none;">Fetch Models</button>
                                </div>
                                <label for="provider-api_key-\${index}">API Key</label>
                                <input type="text" id="provider-api_key-\${index}" value="\${provider.api_key || ''}" data-index="\${index}" data-field="api_key">
                                <label for="provider-models-\${index}">Models (comma-separated)</label>
                                <textarea id="provider-models-\${index}" data-index="\${index}" data-field="models">\${(provider.models || []).join(', ')}</textarea>
                                <label for="provider-transformer-\${index}">Transformer Config (JSON)</label>
                                <textarea id="provider-transformer-\${index}" data-index="\${index}" data-field="transformer">\${provider.transformer ? JSON.stringify(provider.transformer, null, 2) : ''}</textarea>
                                <button class="remove-btn" data-index="\${index}">Remove Provider</button>
                            \\\`;
                            providersList.appendChild(providerEl);
                            const apiUrlInput = providerEl.querySelector(\`#provider-api_base_url-\${index}\`);
                            toggleFetchButton(apiUrlInput, index);
                        });
                        renderRouter();
                    }

                    function renderRouter() {
                        const routerConfigEl = document.getElementById('router-config');
                        if (!config.Router) config.Router = {};
                        const routes = ['default', 'background', 'think', 'longContext', 'webSearch'];
                        let routerHTML = '';
                        const availableModels = config.Providers.flatMap(p => p.models.map(m => \`\${p.name},\${m}\`));
                        routes.forEach(route => {
                            const currentValue = config.Router[route] || '';
                            routerHTML += \\\`
                                <label for="router-\${route}">\${route}</label>
                                <select id="router-\${route}" data-field="\${route}">
                                    <option value="">-- Not Set --</option>
                                    \${availableModels.map(model => \`<option value="\${model}" \${model === currentValue ? 'selected' : ''}>\${model}</option>\`).join('')}
                                </select>
                            \\\`;
                        });
                        routerConfigEl.innerHTML = routerHTML;
                    }

                    function renderSTT() {
                        const sttConfigEl = document.getElementById('stt-config');
                        if (!config.STT) config.STT = {};
                        sttConfigEl.innerHTML = \\\`
                            <label for="stt-provider">Provider (e.g., openai-whisper)</label>
                            <input type="text" id="stt-provider" value="\${config.STT.provider || ''}">
                            <label for="stt-api-key">API Key</label>
                            <input type="text" id="stt-api-key" value="\${config.STT.apiKey || ''}">
                        \\\`;
                    }

                    function renderCustomTransformers(files) {
                        customTransformersList.innerHTML = '';
                        if (!files || files.length === 0) {
                            customTransformersList.innerHTML = '<p>No custom transformers found.</p>';
                            return;
                        }
                        files.forEach(file => {
                            const itemEl = document.createElement('div');
                            itemEl.className = 'transformer-item';
                            itemEl.innerHTML = \\\`
                                <span>\${file}</span>
                                <button class="edit-transformer-btn" data-file="\${file}">Edit</button>
                            \\\`;
                            customTransformersList.appendChild(itemEl);
                        });
                    }

                    addProviderBtn.addEventListener('click', () => {
                        if (!config.Providers) config.Providers = [];
                        config.Providers.push({ name: '', api_base_url: '', api_key: '', models: [] });
                        renderProviders();
                    });

                    document.getElementById('router-config').addEventListener('change', (event) => {
                        const target = event.target;
                        const field = target.dataset.field;
                        if (field) config.Router[field] = target.value;
                    });

                    providersList.addEventListener('input', (event) => {
                        const target = event.target;
                        const index = parseInt(target.dataset.index, 10);
                        const field = target.dataset.field;
                        if (field === 'models') {
                            config.Providers[index][field] = target.value.split(',').map(s => s.trim()).filter(Boolean);
                        } else if (field === 'transformer') {
                            try {
                                target.style.border = '1px solid #555';
                                if (target.value) {
                                    config.Providers[index][field] = JSON.parse(target.value);
                                } else {
                                    delete config.Providers[index][field];
                                }
                            } catch (e) {
                                target.style.border = '1px solid red';
                            }
                        } else {
                            config.Providers[index][field] = target.value;
                        }
                    });

                    createTransformerBtn.addEventListener('click', () => vscode.postMessage({ command: 'createTransformer' }));

                    customTransformersList.addEventListener('click', (event) => {
                        if (event.target.classList.contains('edit-transformer-btn')) {
                            vscode.postMessage({ command: 'editTransformer', file: event.target.dataset.file });
                        }
                    });

                    saveButton.addEventListener('click', () => {
                        const textareas = document.querySelectorAll('textarea[data-field="transformer"]');
                        for (const ta of textareas) {
                            if (ta.style.borderColor === 'red') {
                                vscode.postMessage({ command: 'error', text: 'Cannot save: Invalid JSON in one or more Transformer Configs.' });
                                return;
                            }
                        }
                        vscode.postMessage({ command: 'save', text: JSON.stringify(config, null, 2) });
                    });
                </script>
            </body>
            </html>`;
    }
}
