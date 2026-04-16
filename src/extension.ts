import * as vscode from 'vscode';
import { GitManager } from './core/git_manager';
import { GitHubAPI } from './core/github_api';
import { Validator } from './core/validator';
import { SmartCommit } from './core/smart_commit';
import { TodoProvider } from './ui/todo_explorer';
import { ReadmeWizard } from './ui/readme_wizard';

export function activate(context: vscode.ExtensionContext) {
    console.log('ZyreHub is now active!');

    // --- 1. Git & GitHub Sync ---
    const syncCommand = vscode.commands.registerCommand('zyrehub.sync', async () => {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            vscode.window.showErrorMessage('No workspace folder open.');
            return;
        }

        const projectPath = workspaceFolders[0].uri.fsPath;
        const git = new GitManager(projectPath);
        const config = vscode.workspace.getConfiguration('zyrehub');
        let token = config.get<string>('githubToken');

        if (!token) {
            token = await vscode.window.showInputBox({ 
                prompt: 'Enter GitHub Token', 
                password: true,
                placeHolder: 'Settings > Developer Settings > Tokens (classic)'
            });
            if (token) await config.update('githubToken', token, vscode.ConfigurationTarget.Global);
            else return;
        }

        const github = new GitHubAPI(token);

        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "ZyreHub Syncing...",
            cancellable: false
        }, async (progress) => {
            progress.report({ message: "Checking repo..." });
            if (!(await git.isRepo())) {
                const init = await vscode.window.showInformationMessage('No Git repo found. Init?', 'Yes', 'No');
                if (init === 'Yes') await git.init();
                else return;
            }

            progress.report({ message: "Staging and suggesting commit..." });
            await git.addAll();
            const diff = await git.getDiff();
            const suggestion = SmartCommit.generateMessage(diff);

            const msg = await vscode.window.showInputBox({ prompt: 'Commit message', value: suggestion });
            if (!msg) return;

            await git.commit(msg);

            const status = await git.getStatus();
            if (!status.tracking) {
                const createRemote = await vscode.window.showInformationMessage('No remote. Create on GitHub?', 'Yes', 'No');
                if (createRemote === 'Yes') {
                    const repoName = await vscode.window.showInputBox({ prompt: 'Repo name', value: 'MyProject' });
                    if (repoName) {
                        const repo = await github.createRepository(repoName);
                        await git.addRemote('origin', repo.clone_url);
                    }
                }
            }

            progress.report({ message: "Pushing..." });
            await git.push('origin', 'main');
            vscode.window.showInformationMessage('ZyreHub: Successfully synced to GitHub!');
        });
    });

    // --- 2. Quality & Security ---
    const validateCommand = vscode.commands.registerCommand('zyrehub.validate', () => {
        const root = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        if (!root) return;
        
        const validator = new Validator(root);
        const res = validator.validate();
        if (res.valid) vscode.window.showInformationMessage('✅ ZyreHub: Project follows best practices!');
        else vscode.window.showWarningMessage('⚠️ ZyreHub warnings: ' + res.warnings.slice(0, 2).join(', '));
    });

    const securityCommand = vscode.commands.registerCommand('zyrehub.securityCheck', () => {
        const root = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        if (!root) return;
        
        const validator = new Validator(root);
        const threats = validator.checkSecurity();
        if (threats.length === 0) vscode.window.showInformationMessage('🛡️ ZyreHub: No sensitive files exposed.');
        else vscode.window.showErrorMessage('❗ ZyreHub Security Alert: ' + threats.join(' | '));
    });

    const fastFixCommand = vscode.commands.registerCommand('zyrehub.fastFix', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;
        const text = editor.document.getText();
        const cleaned = text.replace(/[ \t]+$/gm, '');
        const final = cleaned.endsWith('\n') ? cleaned : cleaned + '\n';
        if (text !== final) {
            await editor.edit(b => b.replace(new vscode.Range(0, 0, editor.document.lineCount, 0), final));
            vscode.window.showInformationMessage('ZyreHub: File cleaned!');
        }
    });

    // --- 3. UI Providers ---
    const todoProvider = new TodoProvider(vscode.workspace.workspaceFolders?.[0]?.uri.fsPath);
    vscode.window.registerTreeDataProvider('zyrehubTodoExplorer', todoProvider);
    
    const refreshTodos = vscode.commands.registerCommand('zyrehub.refreshTodos', () => todoProvider.refresh());

    const readmeWizardCommand = vscode.commands.registerCommand('zyrehub.readmeWizard', () => {
        ReadmeWizard.show(context.extensionUri);
    });

    context.subscriptions.push(
        syncCommand, 
        validateCommand, 
        securityCommand, 
        fastFixCommand, 
        readmeWizardCommand,
        refreshTodos
    );
}

export function deactivate() {}
