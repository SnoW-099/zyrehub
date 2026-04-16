import * as fs from 'fs';
import * as path from 'path';

export interface ValidationResult {
  valid: boolean;
  warnings: string[];
}

export class Validator {
  private projectPath: string;

  constructor(projectPath: string) {
    this.projectPath = projectPath;
  }

  public validate(): ValidationResult {
    const warnings: string[] = [];

    if (!fs.existsSync(path.join(this.projectPath, 'README.md'))) {
      warnings.push('README.md is missing.');
    }

    if (!fs.existsSync(path.join(this.projectPath, '.gitignore'))) {
      warnings.push('.gitignore is missing.');
    }

    const pkgPath = path.join(this.projectPath, 'package.json');
    if (fs.existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
        if (!pkg.description || pkg.description.trim() === '') {
          warnings.push('package.json is missing a description.');
        }
        if (!pkg.author || pkg.author.trim() === '') {
          warnings.push('package.json is missing an author.');
        }
      } catch (e) {}
    }

    const hasTests = this.hasTestFiles(this.projectPath);
    if (!hasTests) {
      warnings.push('No automated tests detected (.test.ts, .spec.js, etc).');
    }

    this.checkLargeFiles(this.projectPath, warnings);

    return {
      valid: warnings.length === 0,
      warnings,
    };
  }

  public checkSecurity(): string[] {
    const sensitivePatterns = ['.env', '.pem', 'id_rsa', 'id_ed25519', 'credentials.json'];
    const threats: string[] = [];
    
    try {
      const files = fs.readdirSync(this.projectPath);
      for (const pattern of sensitivePatterns) {
        if (files.some(f => f.includes(pattern))) {
          threats.push(`Potential sensitive file detected: ${pattern}`);
        }
      }
    } catch (e) {
      // Ignore read errors
    }
    
    return threats;
  }

  private checkLargeFiles(dir: string, warnings: string[]) {
    try {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        if (file === 'node_modules' || file === '.git' || file === 'dist' || file === 'out') continue;
        
        const filePath = path.join(dir, file);
        const stats = fs.statSync(filePath);
        
        if (stats.isDirectory()) {
          this.checkLargeFiles(filePath, warnings);
        } else if (stats.size > 10 * 1024 * 1024) { // 10MB
          warnings.push(`Large file detected: ${file} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
        }
      }
    } catch (e) {}
  }

  private hasTestFiles(dir: string): boolean {
    try {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        if (['node_modules', '.git', 'dist', 'out'].includes(file)) continue;
        const filePath = path.join(dir, file);
        const stats = fs.statSync(filePath);
        if (stats.isDirectory()) {
          if (file === 'test' || file === 'tests') return true;
          if (this.hasTestFiles(filePath)) return true;
        } else {
          if (file.includes('.test.') || file.includes('.spec.')) return true;
        }
      }
    } catch (e) {}
    return false;
  }
}

