import * as vscode from 'vscode';
import * as path from 'path';

import { Validator } from '../core/validator';
import { TimeTracker } from '../core/time_tracker';

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

    this.updateWebview();

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

  public postMessage(message: any) {
    if (this._view) {
      this._view.webview.postMessage(message);
    }
  }

  public async updateWebview() {
    if (this._view) {
      this._view.webview.html = await this.getHtmlForWebview();
    }
  }

  private async getHtmlForWebview(): Promise<string> {
    const config = vscode.workspace.getConfiguration('zyrehub');
    const existingToken = config.get<string>('githubToken') || '';
    const workspaceFolders = vscode.workspace.workspaceFolders;
    const hasFolder = !!(workspaceFolders && workspaceFolders.length > 0);

    const timeTracker = TimeTracker.getInstance();
    const sessionTime = timeTracker.getFormattedSessionTime();

    // Dynamic metrics if folder is open
    let healthSubtitle = 'No folder open';
    let todoSubtitle = 'No folder open';
    let auditMsg = '';
    let isFolderOpenHtml = ``;

    if (hasFolder) {
      const rootPath = workspaceFolders[0].uri.fsPath;
      const validator = new Validator(rootPath);
      const valResult = validator.validate();
      const threats = validator.checkSecurity();
      const audit = await validator.auditDependencies();

      let issuesCount = valResult.warnings.length + threats.length;
      if (audit && audit.vulnerabilities > 0) {
        issuesCount += audit.vulnerabilities;
        auditMsg = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px; vertical-align: -2px;"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>${audit.vulnerabilities} vulnerable dependencies`;
      }

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
            --zh-text: var(--vscode-foreground);
            --zh-subtext: var(--vscode-descriptionForeground);
            --zh-purple: #9d84e8;
            --zh-purple-bg: rgba(129, 110, 191, 0.15);
            --zh-card-bg: var(--vscode-editorWidget-background, rgba(130, 130, 130, 0.04));
            --zh-border: var(--vscode-widget-border, rgba(130, 130, 130, 0.1));
            --zh-hover: var(--vscode-list-hoverBackground, rgba(130, 130, 130, 0.08));
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: var(--zh-bg);
            color: var(--zh-text);
            padding: 16px;
            margin: 0;
            line-height: 1.4;
        }

        /* Header Style */
        .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 28px;
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
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            font-size: 13px;
        }
        .title {
            font-size: 15px;
            font-weight: 600;
            margin: 0;
        }
        .header-right {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .time-badge {
            font-size: 11px;
            color: var(--zh-subtext);
            background: var(--zh-card-bg);
            border: 1px solid var(--zh-border);
            padding: 4px 8px;
            border-radius: 12px;
        }

        /* Sections */
        .section-title {
            font-size: 11px;
            font-weight: 700;
            color: var(--zh-subtext);
            letter-spacing: 0.5px;
            text-transform: uppercase;
            margin: 0 0 10px 0;
        }

        /* Token Box */
        .token-card {
            background-color: var(--zh-card-bg);
            border: 1px solid var(--zh-border);
            border-radius: 8px;
            padding: 14px;
            margin-bottom: 28px;
        }
        .input-group {
            display: flex;
            gap: 8px;
            margin-top: 8px;
        }
        input {
            flex: 1;
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--zh-border);
            border-radius: 6px;
            padding: 6px 10px;
            font-size: 12px;
            outline: none;
        }
        input:focus {
            border-color: var(--vscode-focusBorder);
        }
        .btn-primary {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            border-radius: 6px;
            padding: 6px 12px;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
        }
        .btn-primary:hover {
            background-color: var(--vscode-button-hoverBackground);
        }

        /* Shared Card Styles */
        .card {
            background-color: var(--zh-card-bg);
            border: 1px solid var(--zh-border);
            border-radius: 8px;
            padding: 14px;
            margin-bottom: 12px;
            transition: border-color 0.2s, background-color 0.2s;
        }
        .card.clickable:hover {
            background-color: var(--zh-hover);
            border-color: var(--vscode-focusBorder);
            cursor: pointer;
        }

        /* Quick Actions Grid */
        .actions-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            margin-bottom: 28px;
        }
        .action-btn {
            background-color: var(--zh-card-bg);
            border: 1px solid var(--zh-border);
            border-radius: 6px;
            padding: 10px;
            font-size: 12px;
            font-weight: 500;
            cursor: pointer;
            text-align: center;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            color: var(--zh-text);
            transition: all 0.2s;
        }
        .action-btn:hover {
            background-color: var(--zh-hover);
            border-color: var(--vscode-focusBorder);
        }

        /* Workspace List */
        .workspace-list {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }
        .ws-header {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 6px;
        }
        .ws-title {
            font-size: 13px;
            font-weight: 600;
            margin: 0;
        }
        .ws-subtitle {
            font-size: 12px;
            color: var(--zh-subtext);
            margin: 0;
        }
        .ws-audit {
            margin-top: 6px;
            font-size: 11px;
            padding: 6px;
            background: rgba(211, 47, 47, 0.1);
            color: #ff5252;
            border-radius: 4px;
            display: inline-block;
        }
        .dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background-color: var(--zh-subtext);
        }
        .dot.active {
            background-color: #4caf50;
        }

        /* Hidden dynamic states */
        .dynamic-stat { display: none; margin-top: 10px; font-size: 11px; color: var(--zh-purple); }
        .open-btn-container { margin-top: 12px; }
        
        .btn-outline {
            background-color: transparent;
            border: 1px solid var(--zh-border);
            color: var(--zh-text);
            border-radius: 6px;
            padding: 8px 12px;
            font-size: 12px;
            cursor: pointer;
            width: 100%;
        }
        .btn-outline:hover {
            background-color: var(--zh-hover);
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
        <div class="header-right">
            <span class="time-badge" id="session-time">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:2px"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                ${sessionTime}
            </span>
        </div>
    </div>

    <!-- Token Box -->
    <div class="token-card">
        <p class="section-title">GitHub Token</p>
        <p style="font-size: 11px; margin:0; color: var(--zh-subtext);">Required for remote features.</p>
        <div class="input-group">
            <input type="password" id="gh-token" placeholder="ghp_..." value="${existingToken}">
            <button class="btn-primary" id="save-btn">Save</button>
        </div>
    </div>

    <p class="section-title">Quick Actions</p>
    <div class="actions-grid">
        <button class="action-btn" id="btn-sync">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 2v6h-6"></path><path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path><path d="M3 22v-6h6"></path><path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path></svg>
            Sync
        </button>
        <button class="action-btn" id="btn-health">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
            Health
        </button>
        <button class="action-btn" id="btn-security">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
            Audit
        </button>
        <button class="action-btn" id="btn-format">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
            Fix
        </button>
    </div>

    <p class="section-title">Workspace</p>
    <div class="workspace-list">
        
        <!-- Health Card -->
        <div class="card clickable" id="card-health">
            <div class="ws-header">
                <div class="dot ${hasFolder ? 'active' : ''}"></div>
                <h3 class="ws-title">Project Health</h3>
            </div>
            <p class="ws-subtitle">${healthSubtitle}</p>
            ${auditMsg ? `<div class="ws-audit">${auditMsg}</div>` : ''}
            
            <div class="dynamic-stat">View dashboard →</div>
            <div class="open-btn-container">
                <button class="btn-outline open-btn">Open Folder</button>
            </div>
        </div>

        <!-- TODO Card -->
        <div class="card clickable" id="card-todo">
            <div class="ws-header">
                <div class="dot ${hasFolder ? 'active' : ''}"></div>
                <h3 class="ws-title">TODO Explorer</h3>
            </div>
            <p class="ws-subtitle">${todoSubtitle}</p>
            
            <div class="dynamic-stat">Check tags →</div>
            <div class="open-btn-container">
                <button class="btn-outline open-btn">Open Folder</button>
            </div>
        </div>

    </div>

    <script>
        const vscode = acquireVsCodeApi();

        window.addEventListener('message', event => {
            const message = event.data;
            if (message.command === 'updateTime') {
                const badge = document.getElementById('session-time');
                badge.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:2px"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg> ' + message.time;
            }
        });

        document.getElementById('save-btn').addEventListener('click', () => {
            const token = document.getElementById('gh-token').value;
            vscode.postMessage({ command: 'saveToken', token: token });
        });

        const openBtns = document.querySelectorAll('.open-btn');
        openBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                vscode.postMessage({ command: 'openFolder' });
            });
        });

        // Trigger dashboard commands when clicking the cards (if folder is open)
        document.getElementById('card-health').addEventListener('click', () => {
            vscode.postMessage({ command: 'actionHealth' });
        });
        document.getElementById('card-todo').addEventListener('click', () => {
            vscode.postMessage({ command: 'actionHealth' }); // Can route to a TODO generic command later
        });

        document.getElementById('btn-sync').addEventListener('click', () => vscode.postMessage({ command: 'actionSync' }));
        document.getElementById('btn-health').addEventListener('click', () => vscode.postMessage({ command: 'actionHealth' }));
        document.getElementById('btn-security').addEventListener('click', () => vscode.postMessage({ command: 'actionSecurity' }));
        document.getElementById('btn-format').addEventListener('click', () => vscode.postMessage({ command: 'actionFormat' }));
    </script>
</body>
</html>`;
  }
}
