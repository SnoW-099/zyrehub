import { Octokit } from 'octokit';

export class GistManager {
  private octokit: Octokit;

  constructor(token: string) {
    this.octokit = new Octokit({ auth: token });
  }

  public async createGist(filename: string, content: string, description: string = 'Created with ZyreHub', isPublic: boolean = false) {
    try {
      const { data } = await this.octokit.rest.gists.create({
        description,
        public: isPublic,
        files: {
          [filename]: {
            content: content
          }
        }
      });
      return data;
    } catch (error: any) {
      throw new Error(`Failed to create Gist: ${error.message}`);
    }
  }
}
