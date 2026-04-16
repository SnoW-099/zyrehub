import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export class DashboardProvider {
  public static readonly viewType = 'zyrehub.dashboard';

  public static async show(extensionUri: vscode.Uri) {
    const panel = vscode.window.createWebviewPanel(
      DashboardProvider.viewType,
      'ZyreHub Dashboard',
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: [
          vscode.Uri.joinPath(extensionUri, 'media'),
          vscode.Uri.joinPath(extensionUri, 'Assets')
        ]
      }
    );

    const stats = await this.getProjectStats();
    panel.webview.html = this.getHtmlForWebview(panel.webview, extensionUri, stats);

    panel.webview.onDidReceiveMessage(
      message => {
        switch (message.command) {
          case 'runAction':
            vscode.commands.executeCommand(message.action);
            return;
        }
      },
      undefined
    );
  }

  private static async getProjectStats() {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) return null;

    const rootPath = workspaceFolders[0].uri.fsPath;
    let totalFiles = 0;
    let totalLines = 0;
    const languages: { [key: string]: number } = {};

    const scanDir = (dir: string) => {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        if (file === 'node_modules' || file === '.git' || file === 'dist' || file === 'out') continue;
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
          scanDir(filePath);
        } else {
          totalFiles++;
          const ext = path.extname(file) || 'no-ext';
          languages[ext] = (languages[ext] || 0) + 1;
          try {
            const content = fs.readFileSync(filePath, 'utf8');
            totalLines += content.split('\n').length;
          } catch (e) {}
        }
      }
    };

    try {
      scanDir(rootPath);
    } catch (e) {}

    return { totalFiles, totalLines, languages };
  }

  private static getHtmlForWebview(webview: vscode.Webview, extensionUri: vscode.Uri, stats: any) {
    const logoPath = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'Assets', 'logo.png'));

    const langHtml = stats ? Object.entries(stats.languages)
      .sort((a: any, b: any) => b[1] - a[1])
      .slice(0, 5)
      .map(([ext, count]) => `<li>${ext}: ${count} files</li>`)
      .join('') : 'No data';

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>ZyreHub Dashboard</title>
    <style>
        body { font-family: 'Segoe UI', sans-serif; padding: 30px; color: var(--vscode-foreground); background-color: var(--vscode-editor-background); }
        .container { max-width: 800px; margin: 0 auto; }
        .header { display: flex; align-items: center; gap: 20px; margin-bottom: 40px; }
        .logo { width: 80px; height: 80px; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .card { background: var(--vscode-sideBar-background); padding: 20px; border-radius: 8px; border: 1px solid var(--vscode-widget-border); }
        .card h2 { margin-top: 0; color: var(--vscode-button-background); }
        .stats-list { list-style: none; padding: 0; }
        .stats-list li { margin-bottom: 8px; font-size: 1.1em; }
        .btn { display: block; width: 100%; padding: 12px; margin-bottom: 10px; background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: none; border-radius: 4px; cursor: pointer; text-align: center; font-weight: bold; }
        .btn:hover { background: var(--vscode-button-hoverBackground); }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="${logoPath}" class="logo">
            <div>
                <h1>ZyreHub Pro Dashboard</h1>
                <p>Welcome back, developer. Your project is looking sharp.</p>
            </div>
        </div>

        <div class="grid">
            <div class="card">
                <h2>📊 Project Stats</h2>
                <ul class="stats-list">
                    <li>Files: <strong>${stats?.totalFiles || 0}</strong></li>
                    <li>Lines of Code: <strong>${stats?.totalLines || 0}</strong></li>
                </ul>
                <hr>
                <h3>Top Languages</h3>
                <ul>${langHtml}</ul>
            </div>

            <div class="card">
                <h2>⚡ Quick Actions</h2>
                <button class="btn" onclick="run('zyrehub.sync')">🔥 Full Sync (Smart Commit)</button>
                <button class="btn" onclick="run('zyrehub.validate')">📋 Health Check</button>
                <button class="btn" onclick="run('zyrehub.readmeWizard')">📝 README Wizard</button>
                <button class="btn" onclick="run('zyrehub.shareGist')">🔗 Share selection as Gist</button>
            </div>
        </div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        function run(action) {
            vscode.postMessage({ command: 'runAction', action });
        }
    </script>
</body>
</html>`;
  }
}
