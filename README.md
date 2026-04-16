<div align="left">
  <img src="https://img.shields.io/badge/VS_CODE_EXTENSION-282c34?style=flat-square&logo=visualstudiocode&logoColor=white" alt="VS Code Extension" />
  <h1>ZyreHub — Git Automation & Project Health</h1>
  <p>Automates repetitive Git workflows, surfaces project health metrics, and audits for exposed credentials — all from a native VS Code sidebar.</p>
  <p>
    <b>Publisher</b> snow-099 &nbsp;&nbsp;|&nbsp;&nbsp; <b>Version</b> 1.1.1 &nbsp;&nbsp;|&nbsp;&nbsp; <b>Released</b> April 2026 &nbsp;&nbsp;|&nbsp;&nbsp; <b>Platform</b> Universal 
  </p>
</div>

<br>

### FEATURES

<table>
  <tr>
    <td width="33%">
      <b>Smart Git sync</b><br><br>
      Stages changes, generates commit message suggestions from <code>git diff</code>, and pushes to remote. Handles repo initialization if none exists.
    </td>
    <td width="33%">
      <b>Project health dashboard</b><br><br>
      Tracks file count, LOC, language breakdown, test coverage, and missing config files in real time from the sidebar.
    </td>
    <td width="33%">
      <b>TODO explorer</b><br><br>
      Scans the workspace for <code>TODO</code>, <code>FIXME</code>, <code>HACK</code>, and <code>NOTE</code> tags, grouped by file with one-click navigation.
    </td>
  </tr>
  <tr>
    <td>
      <b>Credential audit</b><br><br>
      Detects accidentally committed secrets — <code>.env</code>, <code>id_rsa</code>, <code>.pem</code>, <code>credentials.json</code> — before they leave your machine.
    </td>
    <td>
      <b>README wizard</b><br><br>
      Generates a structured <code>README.md</code> from a form. No manual formatting required.
    </td>
    <td>
      <b>Gist sharing</b><br><br>
      Select any code block and publish it as a GitHub Gist in one command.
    </td>
  </tr>
</table>

### REQUIREMENTS

* Visual Studio Code 1.75 or later
* Git installed and available on PATH
* A GitHub account for remote sync and Gist features
* GitHub Personal Access Token (classic) with `repo` and `gist` scopes — required only for Smart Sync, auto-repository creation, and Gist sharing. Local features work without a token.

### GETTING STARTED

1. Install the extension from the VS Code Marketplace and open any project folder.
2. Open the `ZyreHub sidebar` using the icon in the Activity Bar or via `Ctrl+Shift+P` → `ZyreHub: Open Sidebar`.
3. To enable remote features, go to `Settings` → `Extensions` → `ZyreHub` and add your GitHub Personal Access Token. The token is stored locally in VS Code's secret storage and never transmitted to third parties.
4. Run `ZyreHub: Sync Repository` to perform your first smart commit, or open the `Project Health` panel to review your workspace.

> [!WARNING]
> Your GitHub token is stored exclusively in VS Code's built-in secret storage. ZyreHub does not operate any external server and does not transmit credentials outside of authenticated GitHub API calls.

### EXTENSION SETTINGS

* `zyrehub.githubToken` — GitHub Personal Access Token for remote operations

<br>
<hr>

<div align="left">
  <small>Report issues or follow development on the <a href="https://github.com/SnoW-099/zyrehub">GitHub repository</a>. Contributions and bug reports are welcome.</small>
</div>
