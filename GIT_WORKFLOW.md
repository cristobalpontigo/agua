# AGUAS Git Workflow Guide

## 📚 Quick Reference

### View repository status
```bash
git status
```

### View commit history
```bash
git log --oneline
git log --graph --decorate --oneline --all
```

### Create a feature branch
```bash
git checkout -b feature/feature-name
```

### Stage and commit changes
```bash
git add .
git commit -m "type: description of changes"
```

### Switch branches
```bash
git checkout main
git checkout feature/your-branch
```

### Merge a branch
```bash
git merge feature/your-branch
```

## 📝 Commit Message Convention

Use the following format:
```
type: subject

body (optional)

footer (optional)
```

**Types:**
- `feat:` A new feature
- `fix:` A bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting)
- `refactor:` Code refactoring
- `perf:` Performance improvements
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

**Examples:**
```bash
git commit -m "feat: Add billing report feature"
git commit -m "fix: Resolve database connection issue"
git commit -m "docs: Update README with API endpoints"
```

## 🌿 Branch Naming Convention

- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation
- `refactor/description` - Code refactoring

**Example:**
```bash
git checkout -b feature/client-billing-dates
git checkout -b fix/sales-validation
git checkout -b docs/api-documentation
```

## 🚀 Publishing to GitHub

1. Create a new repository on GitHub
2. Add the remote:
   ```bash
   git remote add origin https://github.com/username/aguas.git
   ```

3. Push the code:
   ```bash
   git push -u origin master
   ```

4. For future pushes:
   ```bash
   git push
   ```

## 🔄 Updating Local Repository

```bash
git pull origin main  # Pull latest changes
git fetch             # Get updates without merging
```

## 💾 Undoing Changes

```bash
# Discard changes in working directory
git restore file.ts

# Unstage changes
git restore --staged file.ts

# Undo last commit (keep changes)
git reset --soft HEAD~1

# Undo last commit (discard changes)
git reset --hard HEAD~1
```

## 🔍 Viewing Differences

```bash
# See what's changed
git diff

# See staged changes
git diff --staged

# Compare branches
git diff main feature/your-branch
```

## 📌 Tags (for releases)

```bash
# Create a tag
git tag -a v1.0.0 -m "Release version 1.0.0"

# List tags
git tag -l

# Push tags
git push origin --tags
```

## ⚙️ Git Configuration

```bash
# View current config
git config --local --list

# Set user name
git config --global user.name "Your Name"

# Set user email
git config --global user.email "email@example.com"
```

## 📖 More Information

- [Git Documentation](https://git-scm.com/doc)
- [GitHub Guides](https://guides.github.com/)
- [Conventional Commits](https://www.conventionalcommits.org/)
