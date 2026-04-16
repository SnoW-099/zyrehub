import simpleGit, { SimpleGit } from 'simple-git';

export class GitManager {
  private git: SimpleGit;
  private projectPath: string;

  constructor(projectPath: string) {
    this.projectPath = projectPath;
    this.git = simpleGit(projectPath);
  }

  public async isRepo(): Promise<boolean> {
    try {
      return await this.git.checkIsRepo();
    } catch {
      return false;
    }
  }

  public async init(): Promise<void> {
    if (!(await this.isRepo())) {
      await this.git.init();
    }
  }

  public async addAll(): Promise<void> {
    await this.git.add('.');
  }

  public async commit(message: string): Promise<void> {
    await this.git.commit(message);
  }

  public async addRemote(name: string, url: string): Promise<void> {
    const remotes = await this.git.getRemotes();
    const existing = remotes.find(r => r.name === name);
    if (existing) {
      await this.git.remote(['set-url', name, url]);
    } else {
      await this.git.addRemote(name, url);
    }
  }

  public async push(remote: string = 'origin', branch: string = 'main'): Promise<void> {
    await this.git.push(remote, branch, ['-u']);
  }

  public async getStatus() {
    return await this.git.status();
  }

  public async getDiff() {
    return await this.git.diff();
  }
}
