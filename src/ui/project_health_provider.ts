import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

interface ProjectStats {
  totalFiles: number;
  totalLines: number;
  languages: { [ext: string]: number };
}

export class ProjectHealthProvider implements vscode.TreeDataProvider<HealthItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<HealthItem | undefined | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  constructor(private workspaceRoot: string | undefined) {}

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: HealthItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: HealthItem): Promise<HealthItem[]> {
    if (!this.workspaceRoot) {
      return [];
    }

    if (element) {
      return element.children || [];
    }

    const items: HealthItem[] = [];

    // --- Project Stats ---
    const stats = this.getProjectStats();
    const statsItem = new HealthItem(
      `📊 Project Stats`,
      vscode.TreeItemCollapsibleState.Expanded,
      'project',
      undefined
    );
    statsItem.children = [
      new HealthItem(
        `${stats.totalFiles.toLocaleString()} files`,
        vscode.TreeItemCollapsibleState.None,
        'file',
        'file'
      ),
      new HealthItem(
        `${stats.totalLines.toLocaleString()} lines of code`,
        vscode.TreeItemCollapsibleState.None,
        'code',
        'code'
      ),
    ];

    // Top languages
    const topLangs = Object.entries(stats.languages)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);

    if (topLangs.length > 0) {
      const langsItem = new HealthItem(
        `🏆 Top Languages`,
        vscode.TreeItemCollapsibleState.Collapsed,
        'symbol-class',
        undefined
      );
      langsItem.children = topLangs.map(([ext, count]) =>
        new HealthItem(
          `${ext} — ${count} files`,
          vscode.TreeItemCollapsibleState.None,
          'symbol-file',
          'symbol-file'
        )
      );
      statsItem.children.push(langsItem);
    }

    items.push(statsItem);

    // --- Validation ---
    const validationItem = new HealthItem(
      `🩺 Validation`,
      vscode.TreeItemCollapsibleState.Expanded,
      'beaker',
      undefined
    );
    const validationChildren: HealthItem[] = [];

    const hasReadme = fs.existsSync(path.join(this.workspaceRoot, 'README.md'));
    validationChildren.push(new HealthItem(
      hasReadme ? '✅ README.md found' : '⚠️ README.md missing',
      vscode.TreeItemCollapsibleState.None,
      hasReadme ? 'pass' : 'warning',
      hasReadme ? 'pass' : 'warning'
    ));

    const hasGitignore = fs.existsSync(path.join(this.workspaceRoot, '.gitignore'));
    validationChildren.push(new HealthItem(
      hasGitignore ? '✅ .gitignore found' : '⚠️ .gitignore missing',
      vscode.TreeItemCollapsibleState.None,
      hasGitignore ? 'pass' : 'warning',
      hasGitignore ? 'pass' : 'warning'
    ));

    const hasPackageJson = fs.existsSync(path.join(this.workspaceRoot, 'package.json'));
    validationChildren.push(new HealthItem(
      hasPackageJson ? '✅ package.json found' : 'ℹ️ No package.json',
      vscode.TreeItemCollapsibleState.None,
      hasPackageJson ? 'pass' : 'info',
      hasPackageJson ? 'pass' : 'info'
    ));

    const hasLicense = fs.existsSync(path.join(this.workspaceRoot, 'LICENSE')) ||
                       fs.existsSync(path.join(this.workspaceRoot, 'LICENSE.md'));
    validationChildren.push(new HealthItem(
      hasLicense ? '✅ LICENSE found' : '⚠️ LICENSE missing',
      vscode.TreeItemCollapsibleState.None,
      hasLicense ? 'pass' : 'warning',
      hasLicense ? 'pass' : 'warning'
    ));

    validationItem.children = validationChildren;
    items.push(validationItem);

    // --- Security ---
    const securityItem = new HealthItem(
      `🛡️ Security`,
      vscode.TreeItemCollapsibleState.Expanded,
      'shield',
      undefined
    );
    const sensitivePatterns = ['.env', '.pem', 'id_rsa', 'id_ed25519', 'credentials.json'];
    const threats: string[] = [];
    try {
      const files = fs.readdirSync(this.workspaceRoot);
      for (const pattern of sensitivePatterns) {
        if (files.some(f => f.includes(pattern))) {
          threats.push(pattern);
        }
      }
    } catch {}

    if (threats.length === 0) {
      securityItem.children = [
        new HealthItem(
          '✅ No sensitive files exposed',
          vscode.TreeItemCollapsibleState.None,
          'pass',
          'pass'
        ),
      ];
    } else {
      securityItem.children = threats.map(t =>
        new HealthItem(
          `❗ Exposed: ${t}`,
          vscode.TreeItemCollapsibleState.None,
          'error',
          'error'
        )
      );
    }

    items.push(securityItem);

    return items;
  }

  private getProjectStats(): ProjectStats {
    let totalFiles = 0;
    let totalLines = 0;
    const languages: { [ext: string]: number } = {};

    const scanDir = (dir: string) => {
      try {
        const entries = fs.readdirSync(dir);
        for (const entry of entries) {
          if (['node_modules', '.git', 'dist', 'out', '.vscode'].includes(entry)) { continue; }
          const fullPath = path.join(dir, entry);
          const stat = fs.statSync(fullPath);
          if (stat.isDirectory()) {
            scanDir(fullPath);
          } else {
            totalFiles++;
            const ext = path.extname(entry) || 'no-ext';
            languages[ext] = (languages[ext] || 0) + 1;
            try {
              const content = fs.readFileSync(fullPath, 'utf8');
              totalLines += content.split('\n').length;
            } catch {}
          }
        }
      } catch {}
    };

    if (this.workspaceRoot) {
      scanDir(this.workspaceRoot);
    }

    return { totalFiles, totalLines, languages };
  }
}

export class HealthItem extends vscode.TreeItem {
  children?: HealthItem[];

  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    iconId: string,
    themeIconId?: string
  ) {
    super(label, collapsibleState);
    if (themeIconId) {
      this.iconPath = new vscode.ThemeIcon(themeIconId);
    }
  }
}
