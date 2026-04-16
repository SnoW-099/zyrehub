export class SmartCommit {
  public static generateMessage(diff: string): string {
    if (!diff) return 'Sync: minor updates';

    const lines = diff.split('\n');
    const addedFiles = lines.filter(l => l.startsWith('--- a/')).length;
    const modifiedLines = lines.filter(l => l.startsWith('+') && !l.startsWith('+++')).length;

    if (addedFiles > 3) return `Feature: bulk update with ${addedFiles} files`;
    
    if (diff.includes('package.json')) return 'Fix: update dependencies or project config';
    if (diff.includes('tsconfig.json')) return 'Refactor: update typescript configuration';
    
    return `Update: modified ${modifiedLines} lines across the project`;
  }
}
