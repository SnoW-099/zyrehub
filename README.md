<div align="center">
  <img src="https://raw.githubusercontent.com/SnoW-099/zyrehub/main/Assets/logo.png" alt="ZyreHub Logo" width="120" />
  <h1>ZyreHub Pro</h1>
  <p>The ultimate developer assistant for Visual Studio Code.</p>

  <p>
    <a href="https://github.com/SnoW-099/zyrehub"><img src="https://img.shields.io/badge/VS%20Code-1.80%2B-blue.svg" alt="VS Code Version"></a>
    <a href="https://github.com/SnoW-099/zyrehub"><img src="https://img.shields.io/github/license/SnoW-099/zyrehub" alt="License"></a>
    <a href="https://github.com/SnoW-099/zyrehub"><img src="https://img.shields.io/badge/status-active-success.svg" alt="Status"></a>
  </p>
</div>

---

## 🚀 Overview

**ZyreHub** transforms your Visual Studio Code into a smart, minimalist developer hub. It automates repetitive Git tasks, enforces project health, audits for security leaks, and perfectly integrates into your sidebar with a beautiful Apple-inspired aesthetic.

## ✨ Features

### 1. The ZyreHub Sidebar
A powerful, native-feeling control center right in your VS Code explorer:
- **⚡ Quick Actions**: Instantly execute Smart Syncs, Health Checks, or Code formatting without opening the command palette.
- **💚 Project Health**: A real-time dashboard analyzing your project. It automatically tracks files/LOC, language stats, unit test coverage, missing configuration files (`README.md`, `package.json`, `.gitignore`), and warns you of code smells.
- **✅ TODO Explorer**: Automatically scans your entire workspace for `TODO`, `FIXME`, `HACK`, `DEBUG`, and `NOTE` tags, grouping them beautifully by file. Click on any item to jump straight to the source code.

### 2. Smart Git Automation
- **`ZyreHub: Sync Repository` (Smart Commit)**: Automatically stages your changes, generates intelligent commit message suggestions based on your `git diff`, creates local commits, and pushes to your remote branch. If your project isn't initialized or doesn't have a remote on GitHub? ZyreHub handles setting it up for you!

### 3. Interactive Webview Dashboards
- **Welcome Onboarding**: A gorgeous interactive screen that guides you on your first launch to configure everything automatically.
- **Pro Dashboard**: A sleek, large-format overview of your project stats with quick-action buttons.
- **README Wizard**: Tired of writing READMEs by hand? Open the `ZyreHub: README Wizard` to visually generate a beautifully formatted `README.md` just by filling out an aesthetic form.

### 4. Advanced Security & Quality of Life
- **Security Audit**: Scans your local workspace for accidentally exposed credentials (`.env`, `id_rsa`, `.pem`, `credentials.json`) and warns you.
- **Share as Gist**: Select any piece of code and instantly publish it as a GitHub Gist to share with your team.
- **Fast Fix**: Execute `ZyreHub: Fast Fix` to automatically strip trailing whitespaces and ensure your file ends with a clean newline.

## 🛠️ Installation & Setup

1. Install the extension from the VS Code Marketplace.
2. Open any folder/workspace.
3. The **Welcome to ZyreHub** screen will greet you.
4. Input your **GitHub Personal Access Token (classic)** with `repo` and `gist` scopes to unlock all Pro Features (Smart Sync, Gists, Auto-Repositories).
5. Open the ZyreHub Sidebar (the 🚀 icon) and enjoy!

## ⚙️ Extension Settings

This extension contributes the following settings:
* `zyrehub.githubToken`: Your GitHub Personal Access Token for remote repository operations.

---

<div align="center">
  <b>Built with ❤️ for elegant developers.</b>
</div>
