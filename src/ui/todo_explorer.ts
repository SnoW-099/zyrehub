import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export class TodoProvider implements vscode.TreeDataProvider<TodoItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<TodoItem | undefined | void> = new vscode.EventEmitter<TodoItem | undefined | void>();
  readonly onDidChangeTreeData: vscode.Event<TodoItem | undefined | void> = this._onDidChangeTreeData.event;

  constructor(private workspaceRoot: string | undefined) {}

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: TodoItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: TodoItem): Promise<TodoItem[]> {
    if (!this.workspaceRoot) {
      return [];
    }

    if (element) {
      return [];
    } else {
      return this.scanTodos();
    }
  }

  private async scanTodos(): Promise<TodoItem[]> {
    const todos: TodoItem[] = [];
    const files = await vscode.workspace.findFiles('**/*.{ts,js,py,go,c,cpp,h,java,md}', '**/node_modules/**');

    for (const file of files) {
      const content = await vscode.workspace.fs.readFile(file);
      const text = content.toString();
      const lines = text.split('\n');

      lines.forEach((line, index) => {
        if (line.includes('TODO') || line.includes('FIXME') || line.includes('DEBUG')) {
          const label = line.trim().replace(/^\/\/|^\/\*|^\#|^\*/, '').trim();
          todos.push(new TodoItem(
            label,
            vscode.TreeItemCollapsibleState.None,
            {
              command: 'vscode.open',
              title: "Open File",
              arguments: [file, { selection: new vscode.Range(index, 0, index, line.length) }]
            }
          ));
        }
      });
    }

    return todos;
  }
}

class TodoItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly command?: vscode.Command
  ) {
    super(label, collapsibleState);
    this.tooltip = `${this.label}`;
    this.description = '';
    this.iconPath = new vscode.ThemeIcon('checklist');
  }
}
