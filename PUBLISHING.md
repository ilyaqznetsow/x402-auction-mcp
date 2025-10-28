# Publishing Guide

This guide explains how to publish the x402 Auction MCP server so others can easily install and use it.

## Option 1: Publish to npm (Easiest for Users)

### Prerequisites
1. Create an account at [npmjs.com](https://www.npmjs.com/)
2. Login via command line: `npm login`

### Steps to Publish

1. **Update package.json with your details**:
   - Change `author` to your name/email
   - Update `repository.url` with your GitHub repo URL
   - Verify the version number

2. **Build the project**:
```bash
npm run build
```

3. **Test the package locally**:
```bash
npm pack
# This creates a .tgz file you can test with:
npm install -g ./x402-auction-mcp-1.0.0.tgz
```

4. **Publish to npm**:
```bash
npm publish
```

### After Publishing

Users can install with:
```bash
npm install -g x402-auction-mcp
```

Then configure Claude Desktop:
```json
{
  "mcpServers": {
    "x402-auction": {
      "command": "x402-auction-mcp"
    }
  }
}
```

**Note**: No need to specify full path when installed globally!

---

## Option 2: Publish to GitHub (Manual Install)

### Steps

1. **Create a GitHub repository**:
   - Go to github.com and create new repo: `x402-auction-mcp`

2. **Push your code**:
```bash
git remote add origin https://github.com/yourusername/x402-auction-mcp.git
git push -u origin main
```

3. **Create a release** (optional but recommended):
   - Go to Releases → Create new release
   - Tag: `v1.0.0`
   - Title: `Initial Release`
   - Describe features

### Users Install Via GitHub

Users clone and install:
```bash
git clone https://github.com/yourusername/x402-auction-mcp.git
cd x402-auction-mcp
npm install
npm run build
```

Then configure Claude Desktop with full path:
```json
{
  "mcpServers": {
    "x402-auction": {
      "command": "node",
      "args": ["/full/path/to/x402-auction-mcp/build/index.js"]
    }
  }
}
```

---

## Option 3: Both npm + GitHub (Recommended)

Publish to both for maximum reach:
1. Push to GitHub (source code)
2. Publish to npm (easy installation)
3. Link them in package.json (already done)

### Benefits
- ✅ Easy installation via npm
- ✅ Source code visible on GitHub
- ✅ Issues/discussions on GitHub
- ✅ Version control and releases
- ✅ npm shows GitHub link automatically

---

## Updating Your Package

When you make changes:

1. **Update version in package.json**:
```json
"version": "1.0.1"  // or 1.1.0, or 2.0.0
```

Follow [Semantic Versioning](https://semver.org/):
- **1.0.1** - Bug fixes
- **1.1.0** - New features (backward compatible)
- **2.0.0** - Breaking changes

2. **Commit and tag**:
```bash
git add .
git commit -m "Version 1.0.1: Fix bug description"
git tag v1.0.1
git push origin main --tags
```

3. **Publish update**:
```bash
npm run build
npm publish
```

---

## Marketing Your MCP Server

### npm Package Page
The package.json metadata will create a nice npm page with:
- Description
- Keywords (for search)
- GitHub link
- Installation instructions

### GitHub README
Your README.md will be the landing page showing:
- Features
- Installation
- Usage examples
- API documentation

### Share On
- Twitter/X with #MCP #Claude hashtags
- Reddit (r/ClaudeAI)
- Discord servers for AI/Claude
- Hacker News (Show HN)

---

## Quick Checklist Before Publishing

- [ ] Update `author` in package.json
- [ ] Update `repository.url` in package.json
- [ ] Add LICENSE file (✓ already done)
- [ ] README has clear installation instructions
- [ ] Code builds without errors (`npm run build`)
- [ ] Test locally first
- [ ] Create GitHub repo
- [ ] Push to GitHub
- [ ] Publish to npm
- [ ] Test installation as a user would
- [ ] Announce it!

---

## Example npm Commands

```bash
# First time setup
npm login

# Publish
npm publish

# Update
npm version patch  # or minor, or major
npm publish

# Unpublish (within 72 hours only)
npm unpublish x402-auction-mcp@1.0.0

# View your package
npm view x402-auction-mcp
```

---

## Support & Maintenance

Once published, monitor:
- GitHub Issues
- npm download stats
- User feedback

Keep it updated with:
- Bug fixes
- API changes
- Security updates
- New features

---

**Ready to publish?** Start with GitHub, then npm!

