import * as vscode from 'vscode';

export class WelcomeProvider {
  public static readonly viewType = 'zyrehub.welcome';

  public static show(extensionUri: vscode.Uri, context: vscode.ExtensionContext) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    const panel = vscode.window.createWebviewPanel(
      WelcomeProvider.viewType,
      'Welcome to ZyreHub',
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: [
          vscode.Uri.joinPath(extensionUri, 'Assets')
        ]
      }
    );

    const logoPath = panel.webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'Assets', 'logo.png'));
    const config = vscode.workspace.getConfiguration('zyrehub');
    const existingToken = config.get<string>('githubToken') || '';

    panel.webview.html = this.getHtmlForWebview(panel.webview, logoPath.toString(), existingToken);

    panel.webview.onDidReceiveMessage(
      async message => {
        switch (message.command) {
          case 'saveToken':
            await config.update('githubToken', message.token, vscode.ConfigurationTarget.Global);
            vscode.window.showInformationMessage('ZyreHub: GitHub Token saved successfully!');
            panel.dispose();
            return;
          case 'exploreDashboard':
            vscode.commands.executeCommand('zyrehub.openDashboard');
            panel.dispose();
            return;
          case 'openSettings':
            vscode.commands.executeCommand('workbench.action.openSettings', 'zyrehub.githubToken');
            return;
        }
      },
      undefined,
      context.subscriptions
    );
  }

  private static getHtmlForWebview(webview: vscode.Webview, logoUrl: string, currentToken: string) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to ZyreHub Pro</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; 
            margin: 0; 
            padding: 0; 
            display: flex; 
            flex-direction: column; 
            align-items: center; 
            color: var(--vscode-foreground); 
            background-color: var(--vscode-editor-background); 
        }
        .hero {
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            padding: 60px 20px 40px;
            max-width: 700px;
        }
        .logo {
            width: 100px;
            height: 100px;
            margin-bottom: 20px;
            animation: fadeInDown 0.8s ease-out;
        }
        h1 {
            font-size: 2.5em;
            margin: 0 0 10px 0;
            font-weight: 300;
        }
        h1 strong {
            font-weight: 700;
            color: var(--vscode-textLink-foreground);
        }
        p.subtitle {
            font-size: 1.2em;
            color: var(--vscode-descriptionForeground);
            margin-bottom: 40px;
        }
        .features {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            width: 100%;
            margin-bottom: 50px;
        }
        .feature-card {
            background: var(--vscode-sideBar-background);
            padding: 24px;
            border-radius: 8px;
            border: 1px solid var(--vscode-widget-border);
            text-align: left;
            transition: transform 0.2s;
        }
        .feature-card:hover {
            transform: translateY(-5px);
            border-color: var(--vscode-focusBorder);
        }
        .feature-card h3 {
            margin-top: 0;
            font-size: 1.1em;
            color: var(--vscode-textLink-foreground);
        }
        .feature-card p {
            margin: 10px 0 0 0;
            color: var(--vscode-foreground);
            font-size: 0.9em;
            line-height: 1.5;
            opacity: 0.8;
        }
        .onboarding-card {
            background: var(--vscode-editorWidget-background);
            border: 1px solid var(--vscode-focusBorder);
            padding: 30px;
            border-radius: 12px;
            width: 100%;
            max-width: 600px;
            margin-bottom: 40px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }
        .onboarding-card h2 {
            margin-top: 0;
        }
        input[type="password"] {
            width: 100%;
            padding: 12px;
            font-size: 1em;
            margin-top: 10px;
            margin-bottom: 20px;
            box-sizing: border-box;
            background: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
            border-radius: 4px;
        }
        input[type="password"]:focus {
            outline: rgb(0, 120, 212) auto 1px;
            border-color: var(--vscode-focusBorder);
        }
        .btn-group {
            display: flex;
            gap: 15px;
        }
        button {
            padding: 12px 24px;
            font-size: 1em;
            font-weight: 600;
            cursor: pointer;
            border-radius: 4px;
            border: none;
            transition: opacity 0.2s;
        }
        button:hover {
            opacity: 0.9;
        }
        .btn-primary {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
        }
        .btn-secondary {
            background: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
        }
        
        @keyframes fadeInDown {
            from { opacity: 0; transform: translateY(-20px); }
            to { opacity: 1; transform: translateY(0); }
        }
    </style>
</head>
<body>
    <div class="hero">
        <img src="${logoUrl}" alt="ZyreHub Logo" class="logo">
        <h1>Welcome to <strong>ZyreHub</strong> Pro</h1>
        <p class="subtitle">Your ultimate developer assistant. Smarter Git, proactive health checks, and minimalist automation.</p>

        <div class="features">
            <div class="feature-card">
                <h3>Smart Sync</h3>
                <p>One-click Git automation. ZyreHub stages your files, generates an intelligent commit message, and pushes to remote.</p>
            </div>
            <div class="feature-card">
                <h3>Project Health</h3>
                <p>A real-time dashboard tracking your code's quality, exposing missing tests, missing config files, and detecting security leaks.</p>
            </div>
            <div class="feature-card">
                <h3>Interactive TODOs</h3>
                <p>Never lose a TODO again. We scan your entire workspace for FIXME, DEBUG, and HACK tags and group them elegantly.</p>
            </div>
            <div class="feature-card">
                <h3>Fast Fix</h3>
                <p>Instantly format your file by trimming trailing whitespaces and enforcing clean EOF newlines with a single command.</p>
            </div>
        </div>

        <div class="onboarding-card">
            <h2>Unlock Pro Features</h2>
            <p>To use <strong>Smart Sync</strong> and <strong>Gist Sharing</strong>, ZyreHub needs a GitHub Personal Access Token (classic) with <code>repo</code> and <code>gist</code> scopes.</p>
            
            <input type="password" id="gh-token" placeholder="ghp_xxxxxxxxxxxxxxxxxxxx" value="${currentToken}">
            
            <div class="btn-group">
                <button class="btn-primary" id="save-btn">Save Token & Continue</button>
                <button class="btn-secondary" id="skip-btn">Explore Dashboard</button>
            </div>
            <p style="font-size: 12px; margin-top: 15px; opacity: 0.7;">
                <a href="#" id="settings-link" style="color: var(--vscode-textLink-foreground);">Or configure this later in VS Code Settings</a>
            </p>
        </div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();

        document.getElementById('save-btn').addEventListener('click', () => {
            const token = document.getElementById('gh-token').value;
            if (token) {
                vscode.postMessage({ command: 'saveToken', token: token });
            }
        });

        document.getElementById('skip-btn').addEventListener('click', () => {
            vscode.postMessage({ command: 'exploreDashboard' });
        });

        document.getElementById('settings-link').addEventListener('click', (e) => {
            e.preventDefault();
            vscode.postMessage({ command: 'openSettings' });
        });
    </script>
</body>
</html>`;
  }
}
