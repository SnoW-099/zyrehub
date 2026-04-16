import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    console.log('ZyreHub is now active!');

    // Command: Fast Fix
    let fastFixCommand = vscode.commands.registerCommand('zyrehub.fastFix', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showInformationMessage('No active editor found for Fast Fix.');
            return;
        }

        const document = editor.document;
        const text = document.getText();
        
        // 1. Remove trailing whitespaces
        const cleanedText = text.replace(/[ \t]+$/gm, '');
        
        // 2. Ensure trailing newline
        const finalText = cleanedText.endsWith('\n') ? cleanedText : cleanedText + '\n';
        
        if (text !== finalText) {
            const fullRange = new vscode.Range(
                document.positionAt(0),
                document.positionAt(text.length)
            );
            
            await editor.edit(editBuilder => {
                editBuilder.replace(fullRange, finalText);
            });
            vscode.window.showInformationMessage('ZyreHub: Fast Fix applied!');
        } else {
            vscode.window.showInformationMessage('ZyreHub: File is already clean!');
        }
    });

    // Command: Quick Commit
    let quickCommitCommand = vscode.commands.registerCommand('zyrehub.quickCommit', async () => {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            vscode.window.showErrorMessage('No workspace folder found for Quick Commit.');
            return;
        }

        const msg = await vscode.window.showInputBox({
            prompt: 'Enter commit message (ZyreHub will auto-stage all changes)',
            placeHolder: 'e.g. feat: add new component'
        });

        if (!msg) {
            return; // user canceled
        }

        // Logic for Quick commit will be implemented here (calling git from terminal or using git extension API)
        const terminal = vscode.window.createTerminal('ZyreHub Git');
        terminal.sendText(`git add .`);
        terminal.sendText(`git commit -m "${msg}"`);
        terminal.show();
        vscode.window.showInformationMessage(`ZyreHub: Quick Commit executed -> ${msg}`);
    });

    context.subscriptions.push(fastFixCommand);
    context.subscriptions.push(quickCommitCommand);
}

export function deactivate() {}
