# 🚀 AuthKit Deployment Guide

## Prerequisites

1. **npm Account**: Create account at [npmjs.com](https://npmjs.com)
2. **GitHub Repository**: Create `authkit/authkit` repository
3. **GitHub Secrets**: Set up `NPM_TOKEN` in repository secrets

## Step-by-Step Deployment

### 1. Initial Setup

```bash
# Create GitHub repository
# Set up local git
git init
git add .
git commit -m "Initial release of AuthKit"
git remote add origin https://github.com/authkit/authkit.git
git push -u origin main
```

### 2. Configure npm Publishing

```bash
# Login to npm (one-time)
npm login

# Get npm token from ~/.npmrc or npm config
# Add NPM_TOKEN to GitHub repository secrets
```

### 3. Create GitHub Release

```bash
# Create and push version tag
npm run release:patch  # or release:minor / release:major

# This will:
# 1. Update package.json versions
# 2. Create git tag
# 3. Push to GitHub
# 4. Trigger automated release workflow
```

### 4. Automated Publishing

The release workflow will automatically:
- ✅ Build all packages
- ✅ Run tests
- ✅ Publish to npm
- ✅ Create GitHub release

### 5. Verify Deployment

```bash
# Check npm packages
npm view authkit
npm view create-authkit

# Test CLI
npm create authkit@latest --help

# Install and test
npm install authkit
npm create authkit@latest test-app
```

## Manual Publishing (Alternative)

If automated publishing fails:

```bash
# Build packages
npm run build

# Publish individually
npm run publish:authkit
npm run publish:cli

# Or publish manually
cd packages/authkit && npm publish
cd ../create-authkit && npm publish
```

## Post-Deployment Checklist

- [ ] Packages published to npm
- [ ] CLI tool available globally
- [ ] GitHub releases created
- [ ] Documentation updated
- [ ] Social media announcement
- [ ] Discord/Community notification

## Troubleshooting

### Publishing Issues

**403 Forbidden**
```bash
# Check npm token permissions
npm whoami
npm config list
```

**Package Already Exists**
```bash
# Bump version first
npm version patch
npm run publish:all
```

**Build Failures**
```bash
# Test locally first
npm run build
node test.js
npm run typecheck
```

### GitHub Actions Issues

**Workflow Not Triggering**
- Check tag format: `v1.0.0`
- Ensure secrets are set: `NPM_TOKEN`
- Check repository permissions

**Publishing Failures**
- Verify npm token validity
- Check package names don't conflict
- Ensure build completes successfully

## Maintenance

### Regular Releases

```bash
# For bug fixes
npm run release:patch

# For new features
npm run release:minor

# For breaking changes
npm run release:major
```

### Monitoring

- Watch npm download stats
- Monitor GitHub issues
- Track CI/CD pipeline health
- Update dependencies regularly

## Emergency Rollback

If a release has issues:

```bash
# Deprecate problematic version
npm deprecate authkit@1.0.1 "Use 1.0.2 instead"

# Or unpublish (within 24 hours)
npm unpublish authkit@1.0.1
```

---

**🎉 AuthKit is now live and ready for users!**
