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
      `Project Stats`,
      vscode.TreeItemCollapsibleState.Expanded,
      'project',
      undefined
    );
    statsItem.children = [
      new HealthItem(
        `Files`,
        vscode.TreeItemCollapsibleState.None,
        'file',
        'file',
        `${stats.totalFiles.toLocaleString()}`
      ),
      new HealthItem(
        `Lines of code`,
        vscode.TreeItemCollapsibleState.None,
        'code',
        'code',
        `${stats.totalLines.toLocaleString()}`
      ),
    ];

    // Top languages
    const topLangs = Object.entries(stats.languages)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);

    if (topLangs.length > 0) {
      const langsItem = new HealthItem(
        `Top Languages`,
        vscode.TreeItemCollapsibleState.Collapsed,
        'symbol-class',
        undefined
      );
      langsItem.children = topLangs.map(([ext, count]) =>
        new HealthItem(
          `${ext}`,
          vscode.TreeItemCollapsibleState.None,
          'symbol-file',
          'symbol-file',
          `${count} files`
        )
      );
      statsItem.children.push(langsItem);
    }

    items.push(statsItem);

    // --- Validation ---
    const validationItem = new HealthItem(
      `Validation`,
      vscode.TreeItemCollapsibleState.Expanded,
      'beaker',
      undefined
    );
    const validationChildren: HealthItem[] = [];

    const hasReadme = fs.existsSync(path.join(this.workspaceRoot, 'README.md'));
    validationChildren.push(new HealthItem(
      `README.md`,
      vscode.TreeItemCollapsibleState.None,
      hasReadme ? 'pass' : 'warning',
      hasReadme ? 'pass' : 'warning',
      hasReadme ? 'Found' : 'Missing'
    ));

    const hasGitignore = fs.existsSync(path.join(this.workspaceRoot, '.gitignore'));
    validationChildren.push(new HealthItem(
      `.gitignore`,
      vscode.TreeItemCollapsibleState.None,
      hasGitignore ? 'pass' : 'warning',
      hasGitignore ? 'pass' : 'warning',
      hasGitignore ? 'Found' : 'Missing'
    ));

    const hasPackageJson = fs.existsSync(path.join(this.workspaceRoot, 'package.json'));
    validationChildren.push(new HealthItem(
      `package.json`,
      vscode.TreeItemCollapsibleState.None,
      hasPackageJson ? 'pass' : 'info',
      hasPackageJson ? 'pass' : 'info',
      hasPackageJson ? 'Found' : 'Missing'
    ));

    const hasLicense = fs.existsSync(path.join(this.workspaceRoot, 'LICENSE')) ||
                       fs.existsSync(path.join(this.workspaceRoot, 'LICENSE.md'));
    validationChildren.push(new HealthItem(
      `LICENSE`,
      vscode.TreeItemCollapsibleState.None,
      hasLicense ? 'pass' : 'warning',
      hasLicense ? 'pass' : 'warning',
      hasLicense ? 'Found' : 'Missing'
    ));

    validationItem.children = validationChildren;
    items.push(validationItem);

    // --- Security ---
    const securityItem = new HealthItem(
      `Security`,
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
          'Sensitive files',
          vscode.TreeItemCollapsibleState.None,
          'pass',
          'pass',
          'None exposed'
        ),
      ];
    } else {
      securityItem.children = threats.map(t =>
        new HealthItem(
          `Exposed`,
          vscode.TreeItemCollapsibleState.None,
          'error',
          'error',
          `${t}`
        )
      );
    }

    items.push(securityItem);

    // --- Potential Issues / Code Smells ---
    const issuesItem = new HealthItem(
      `Potential Issues`,
      vscode.TreeItemCollapsibleState.Expanded,
      'warning',
      undefined
    );
    const issueChildren: HealthItem[] = [];

    // 1. Check for tests
    const testFiles = await vscode.workspace.findFiles('**/*.{test,spec}.{ts,js,jsx,tsx}', '**/node_modules/**');
    if (testFiles.length === 0) {
      issueChildren.push(new HealthItem(
        'Unit tests',
        vscode.TreeItemCollapsibleState.None,
        'beaker',
        'beaker',
        'None detected'
      ));
    } else {
      issueChildren.push(new HealthItem(
        `Unit tests`,
        vscode.TreeItemCollapsibleState.None,
        'pass',
        'pass',
        `Found ${testFiles.length} files`
      ));
    }

    // 2. package.json details
    if (hasPackageJson) {
      try {
        const pkg = JSON.parse(fs.readFileSync(path.join(this.workspaceRoot, 'package.json'), 'utf8'));
        if (!pkg.description || pkg.description.trim() === '') {
          issueChildren.push(new HealthItem(
            'package.json',
            vscode.TreeItemCollapsibleState.None,
            'warning',
            'warning',
            'Missing description'
          ));
        }
        if (!pkg.author || pkg.author.trim() === '') {
          issueChildren.push(new HealthItem(
            'package.json',
            vscode.TreeItemCollapsibleState.None,
            'warning',
            'warning',
            'Missing author'
          ));
        }
      } catch (e) {}
    }

    if (issueChildren.length === 0) {
      issueChildren.push(new HealthItem(
        'Potential issues',
        vscode.TreeItemCollapsibleState.None,
        'pass',
        'pass',
        'None found'
      ));
    } else {
      issuesItem.children = issueChildren;
      items.push(issuesItem);
    }

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
    themeIconId?: string,
    description?: string
  ) {
    super(label, collapsibleState);
    if (themeIconId) {
      this.iconPath = new vscode.ThemeIcon(themeIconId);
    }
    if (description) {
      this.description = description;
    }
  }
}
