import * as vscode from 'vscode';
import * as path from 'path';

import { Validator } from '../core/validator';

export class SidebarProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'zyrehub.sidebar.main';
  private _view?: vscode.WebviewView;

  constructor(private readonly _extensionUri: vscode.Uri) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;
    webviewView.webview.options = { EnableScripts: true } as any;
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri]
    };

    webviewView.webview.html = this.getHtmlForWebview();

    webviewView.webview.onDidReceiveMessage(async (data) => {
      switch (data.command) {
        case 'saveToken': {
          const config = vscode.workspace.getConfiguration('zyrehub');
          await config.update('githubToken', data.token, vscode.ConfigurationTarget.Global);
          vscode.window.showInformationMessage('ZyreHub: Token saved via Sidebar!');
          break;
        }
        case 'openFolder': {
          vscode.commands.executeCommand('vscode.openFolder');
          break;
        }
        case 'actionSync': {
          vscode.commands.executeCommand('zyrehub.sync');
          break;
        }
        case 'actionHealth': {
          vscode.commands.executeCommand('zyrehub.validate');
          break;
        }
        case 'actionSecurity': {
          vscode.commands.executeCommand('zyrehub.securityCheck');
          break;
        }
        case 'actionFormat': {
          vscode.commands.executeCommand('zyrehub.fastFix');
          break;
        }
      }
    });

    this.updateWebview();
  }

  public updateWebview() {
    if (this._view) {
      this._view.webview.html = this.getHtmlForWebview();
    }
  }

  private getHtmlForWebview(): string {
    const config = vscode.workspace.getConfiguration('zyrehub');
    const existingToken = config.get<string>('githubToken') || '';
    const workspaceFolders = vscode.workspace.workspaceFolders;
    const hasFolder = !!(workspaceFolders && workspaceFolders.length > 0);

    // Dynamic metrics if folder is open
    let healthSubtitle = 'No folder open';
    let todoSubtitle = 'No folder open';
    let isFolderOpenHtml = ``;

    if (hasFolder) {
      const rootPath = workspaceFolders[0].uri.fsPath;
      const validator = new Validator(rootPath);
      const valResult = validator.validate();
      const threats = validator.checkSecurity();

      const issuesCount = valResult.warnings.length + threats.length;
      healthSubtitle = issuesCount === 0 ? 'Clean workspace' : `${issuesCount} warnings found`;

      todoSubtitle = 'Scanning complete';
      
      // we can replace the Open Folder buttons with something else when a folder is open.
      isFolderOpenHtml = `
      <style>
        .open-btn { display: none !important; }
        .dynamic-stat { display: block !important; margin-top: 15px; font-size: 11px; opacity: 0.8;}
      </style>
      `;
    }

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ZyreHub Sidebar</title>
    <style>
        :root {
            --zh-bg: var(--vscode-sideBar-background);
            --zh-panel: var(--vscode-editorWidget-background);
            --zh-border: var(--vscode-widget-border);
            --zh-text: var(--vscode-foreground);
            --zh-subtext: var(--vscode-descriptionForeground);
            --zh-purple: #816ebf;
            --zh-purple-bg: rgba(129, 110, 191, 0.15);
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: var(--zh-bg);
            color: var(--zh-text);
            padding: 16px;
            margin: 0;
        }

        /* Header Style */
        .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 24px;
        }
        .header-left {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        .logo-box {
            background-color: var(--zh-purple-bg);
            color: var(--zh-purple);
            border: 1px solid rgba(129, 110, 191, 0.3);
            border-radius: 8px;
            width: 36px;
            height: 36px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            font-size: 14px;
        }
        .title {
            font-size: 16px;
            font-weight: 600;
            margin: 0;
        }
        .pro-badge {
            background-color: var(--zh-purple-bg);
            color: var(--zh-purple);
            border: 1px solid rgba(129, 110, 191, 0.3);
            font-size: 10px;
            font-weight: 700;
            padding: 4px 8px;
            border-radius: 4px;
            letter-spacing: 1px;
        }

        /* Token Box */
        .token-box {
            background-color: transparent;
            border: 1px solid var(--zh-border);
            border-radius: 8px;
            padding: 12px;
            margin-bottom: 24px;
        }
        .section-title {
            font-size: 11px;
            font-weight: 700;
            color: var(--zh-subtext);
            letter-spacing: 1px;
            text-transform: uppercase;
            margin-bottom: 8px;
            margin-top: 0;
        }
        .input-group {
            display: flex;
            gap: 8px;
        }
        input {
            flex: 1;
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
            border-radius: 6px;
            padding: 8px 12px;
            font-size: 13px;
            outline: none;
        }
        input:focus {
            border-color: var(--vscode-focusBorder);
        }
        .btn {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            border-radius: 6px;
            padding: 8px 16px;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            transition: opacity 0.2s;
        }
        .btn:hover {
            background-color: var(--vscode-button-hoverBackground);
        }
        .btn-outline {
            background-color: transparent;
            border: 1px solid var(--zh-border);
            color: var(--zh-text);
            width: 100%;
            margin-top: 12px;
            padding: 12px;
        }
        .btn-outline:hover {
            border-color: var(--zh-subtext);
            background-color: var(--vscode-list-hoverBackground);
        }

        hr {
            border: none;
            border-top: 1px solid var(--zh-border);
            margin: 20px 0;
        }

        /* Quick Actions Grid */
        .actions-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
            margin-bottom: 24px;
        }
        .action-card {
            background-color: transparent;
            border: 1px solid var(--zh-border);
            border-radius: 6px;
            padding: 12px;
            font-size: 12px;
            font-weight: 500;
            cursor: pointer;
            text-align: center;
            transition: all 0.2s;
        }
        .action-card:hover {
            background-color: var(--vscode-list-hoverBackground);
            border-color: var(--zh-subtext);
        }

        /* Workspace Grid */
        .workspace-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
        }
        .workspace-card {
            background-color: transparent;
            border: 1px solid var(--zh-border);
            border-radius: 8px;
            padding: 16px;
        }
        .ws-title {
            font-size: 13px;
            font-weight: 600;
            margin: 0 0 6px 0;
        }
        .ws-subtitle {
            font-size: 11px;
            color: var(--zh-subtext);
            margin: 0;
            display: flex;
            align-items: center;
            gap: 6px;
        }
        .dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background-color: var(--zh-subtext);
        }
        .dot.active {
            background-color: #4caf50;
        }
        .dynamic-stat {
            display: none;
        }

        ${isFolderOpenHtml}
    </style>
</head>
<body>

    <!-- Header -->
    <div class="header">
        <div class="header-left">
            <div class="logo-box">ZH</div>
            <h1 class="title">ZyreHub</h1>
        </div>
        <div class="pro-badge">PRO</div>
    </div>

    <!-- Token Box -->
    <div class="token-box">
        <p class="section-title">GITHUB TOKEN</p>
        <div class="input-group">
            <input type="password" id="gh-token" placeholder="ghp_..." value="${existingToken}">
            <button class="btn" id="save-btn">Save</button>
        </div>
    </div>

    <p class="section-title">QUICK ACTIONS</p>
    <div class="actions-grid">
        <div class="action-card" id="btn-sync">Smart Sync</div>
        <div class="action-card" id="btn-health">Health Check</div>
        <div class="action-card" id="btn-security">Audit Secrets</div>
        <div class="action-card" id="btn-format">Fast Fix</div>
    </div>

    <p class="section-title">WORKSPACE</p>
    <div class="workspace-grid">
        
        <!-- Health Card -->
        <div class="workspace-card">
            <p class="ws-title">Project Health</p>
            <p class="ws-subtitle">
                <span class="dot ${hasFolder ? 'active' : ''}"></span>
                ${healthSubtitle}
            </p>
            <div class="dynamic-stat">View metrics in dashboard -></div>
            <button class="btn btn-outline open-btn" id="open-folder-1">Open Folder</button>
        </div>

        <!-- TODO Card -->
        <div class="workspace-card">
            <p class="ws-title">TODO Explorer</p>
            <p class="ws-subtitle">
                <span class="dot ${hasFolder ? 'active' : ''}"></span>
                ${todoSubtitle}
            </p>
            <div class="dynamic-stat">Check files for tags -></div>
            <button class="btn btn-outline open-btn" id="open-folder-2">Open Folder</button>
        </div>

    </div>

    <script>
        const vscode = acquireVsCodeApi();

        document.getElementById('save-btn').addEventListener('click', () => {
            const token = document.getElementById('gh-token').value;
            vscode.postMessage({ command: 'saveToken', token: token });
        });

        const openBtns = document.querySelectorAll('.open-btn');
        openBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                vscode.postMessage({ command: 'openFolder' });
            });
        });

        document.getElementById('btn-sync').addEventListener('click', () => {
            vscode.postMessage({ command: 'actionSync' });
        });
        document.getElementById('btn-health').addEventListener('click', () => {
            vscode.postMessage({ command: 'actionHealth' });
        });
        document.getElementById('btn-security').addEventListener('click', () => {
            vscode.postMessage({ command: 'actionSecurity' });
        });
        document.getElementById('btn-format').addEventListener('click', () => {
            vscode.postMessage({ command: 'actionFormat' });
        });
    </script>
</body>
</html>`;
  }
}
