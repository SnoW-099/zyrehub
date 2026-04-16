import * as vscode from 'vscode';
import * as path from 'path';

type TodoType = 'TODO' | 'FIXME' | 'DEBUG' | 'HACK' | 'NOTE';

const TODO_ICONS: Record<TodoType, string> = {
  TODO: 'circle-large-outline',
  FIXME: 'bug',
  DEBUG: 'debug',
  HACK: 'flame',
  NOTE: 'note',
};

const TODO_PATTERNS: TodoType[] = ['TODO', 'FIXME', 'DEBUG', 'HACK', 'NOTE'];

export class TodoProvider implements vscode.TreeDataProvider<TodoNode> {
  private _onDidChangeTreeData: vscode.EventEmitter<TodoNode | undefined | void> = new vscode.EventEmitter<TodoNode | undefined | void>();
  readonly onDidChangeTreeData: vscode.Event<TodoNode | undefined | void> = this._onDidChangeTreeData.event;

  constructor(private workspaceRoot: string | undefined) {}

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: TodoNode): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: TodoNode): Promise<TodoNode[]> {
    if (!this.workspaceRoot) {
      return [];
    }

    if (element) {
      return element.children || [];
    }

    return this.scanTodos();
  }

  private async scanTodos(): Promise<TodoNode[]> {
    const fileMap = new Map<string, TodoNode[]>();
    const files = await vscode.workspace.findFiles(
      '**/*.{ts,js,tsx,jsx,py,go,c,cpp,h,java,rs,rb,md,css,scss,html}',
      '**/node_modules/**'
    );

    for (const file of files) {
      const content = await vscode.workspace.fs.readFile(file);
      const text = content.toString();
      const lines = text.split('\n');

      lines.forEach((line, index) => {
        for (const pattern of TODO_PATTERNS) {
          if (line.includes(pattern)) {
            const label = line.trim()
              .replace(/^\/\/\s*/, '')
              .replace(/^\/\*\s*/, '')
              .replace(/^\*\s*/, '')
              .replace(/^#\s*/, '')
              .replace(/^<!--\s*/, '')
              .trim();

            const fileName = path.basename(file.fsPath);
            if (!fileMap.has(file.fsPath)) {
              fileMap.set(file.fsPath, []);
            }

            const todoItem = new TodoNode(
              label,
              vscode.TreeItemCollapsibleState.None,
              undefined,
              {
                command: 'vscode.open',
                title: 'Open File',
                arguments: [
                  file,
                  { selection: new vscode.Range(index, 0, index, line.length) }
                ]
              }
            );
            todoItem.iconPath = new vscode.ThemeIcon(TODO_ICONS[pattern] || 'circle-large-outline');
            todoItem.description = `Line ${index + 1}`;
            todoItem.tooltip = `${fileName}:${index + 1}\n${label}`;

            fileMap.get(file.fsPath)!.push(todoItem);
            break; // Only match first pattern per line
          }
        }
      });
    }

    if (fileMap.size === 0) {
      const emptyItem = new TodoNode(
        'No TODOs found',
        vscode.TreeItemCollapsibleState.None
      );
      emptyItem.iconPath = new vscode.ThemeIcon('pass');
      emptyItem.description = 'Code is clean';
      return [emptyItem];
    }

    // Group by file
    const fileNodes: TodoNode[] = [];
    for (const [filePath, todos] of fileMap) {
      const fileName = path.basename(filePath);
      const dirName = path.relative(this.workspaceRoot!, path.dirname(filePath));
      const fileNode = new TodoNode(
        fileName,
        vscode.TreeItemCollapsibleState.Expanded,
        todos
      );
      fileNode.iconPath = new vscode.ThemeIcon('file-code');
      fileNode.description = dirName || '.';
      fileNode.tooltip = filePath;
      fileNodes.push(fileNode);
    }

    return fileNodes;
  }
}

class TodoNode extends vscode.TreeItem {
  children?: TodoNode[];

  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    children?: TodoNode[],
    public readonly command?: vscode.Command
  ) {
    super(label, collapsibleState);
    this.children = children;
  }
}
