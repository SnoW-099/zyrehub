import { Octokit } from 'octokit';

export class GitHubAPI {
  private octokit: Octokit;

  constructor(token: string) {
    this.octokit = new Octokit({ auth: token });
  }

  public async createRepository(name: string, description: string = '', isPrivate: boolean = true) {
    try {
      const { data } = await this.octokit.rest.repos.createForAuthenticatedUser({
        name,
        description,
        private: isPrivate,
      });
      return data;
    } catch (error: any) {
      if (error.status === 422) {
        throw new Error(`Repository "${name}" already exists on GitHub.`);
      }
      throw error;
    }
  }

  public async getUser() {
    const { data } = await this.octokit.rest.users.getAuthenticated();
    return data;
  }
}
