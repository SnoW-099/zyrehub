import * as vscode from 'vscode';

interface QuickAction {
  label: string;
  command: string;
  icon: string;
  detail: string;
}

const ACTIONS: QuickAction[] = [
  { label: 'Smart Sync', command: 'zyrehub.sync', icon: 'cloud-upload', detail: 'Stage, commit & push in one click' },
  { label: 'Health Check', command: 'zyrehub.validate', icon: 'checklist', detail: 'Validate project best practices' },
  { label: 'Security Audit', command: 'zyrehub.securityCheck', icon: 'shield', detail: 'Scan for exposed secrets' },
  { label: 'README Wizard', command: 'zyrehub.readmeWizard', icon: 'book', detail: 'Generate a professional README' },
  { label: 'Share as Gist', command: 'zyrehub.shareGist', icon: 'link-external', detail: 'Share selected code on GitHub Gists' },
  { label: 'Fast Fix', command: 'zyrehub.fastFix', icon: 'sparkle', detail: 'Clean trailing whitespace & format' },
  { label: 'Open Dashboard', command: 'zyrehub.openDashboard', icon: 'dashboard', detail: 'Full project overview' },
];

export class QuickActionsProvider implements vscode.TreeDataProvider<QuickActionItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<QuickActionItem | undefined | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  getTreeItem(element: QuickActionItem): vscode.TreeItem {
    return element;
  }

  getChildren(): QuickActionItem[] {
    return ACTIONS.map(action => new QuickActionItem(action));
  }
}

class QuickActionItem extends vscode.TreeItem {
  constructor(action: QuickAction) {
    super(action.label, vscode.TreeItemCollapsibleState.None);
    this.tooltip = action.detail;
    this.description = action.detail;
    this.iconPath = new vscode.ThemeIcon(action.icon);
    this.command = {
      command: action.command,
      title: action.label,
    };
  }
}
