# Publishing & Distribution Guide

ZyreHub Pro is designed to be easily shareable.

## Local Packaging
To create an installer (`.vsix`) for your own use:
1. Open your terminal in the `zyrehub` directory.
2. Run `npm run package`.
3. An installer file will be generated in the root directory.
4. In VS Code, use the "Install from VSIX..." command to load it.

## Publishing to the Marketplace
1. Create a Publisher in the [VS Marketplace Management Portal](https://marketplace.visualstudio.com/manage).
2. Install `vsce` globally: `npm install -g @vscode/vsce`.
3. Log in with your Personal Access Token: `vsce login <publisher-name>`.
4. Publish: `vsce publish`.
