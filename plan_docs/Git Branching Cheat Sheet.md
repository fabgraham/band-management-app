
# 🧠 Git Branching Cheat Sheet – Create, Discard, or Merge

This cheat sheet helps you manage Git branches for testing features, models, or experimental code safely using Git and GitHub.

---

## 🔧 1. Create a branch and add experimental changes

```bash
# Create and switch to a new branch
git checkout -b project-a/feature-name

# Stage and commit changes
git add .
git commit -m "feature: add login prompt for model A"

# Push branch to GitHub (first time only)
git push -u origin project-a/feature-name
```

> All future `git push` will go to this branch until you switch.

---

## ❌ 2. Don't like the result? Discard the branch and return to main

```bash
# Switch back to main
git checkout main

# Delete the local branch (force delete if needed)
git branch -D project-a/feature-name

# Delete the remote branch on GitHub
git push origin --delete project-a/feature-name
```

> Use `-d` (lowercase) instead of `-D` to prevent deleting unmerged branches accidentally.

---

## ✅ 3. Like the result? Merge it into `main` and delete the branch

```bash
# Make sure your experiment branch is fully pushed
git checkout project-a/feature-name
git push

# Switch to main and update it
git checkout main
git pull

# Merge your experiment branch into main
git merge project-a/feature-name

# Push updated main to GitHub
git push

# Clean up the branch (local and remote)
git branch -d project-a/feature-name
git push origin --delete project-a/feature-name
```

---

## 🧯 Optional Safety Tools

```bash
# See what changed between main and the experiment branch
git diff main..project-a/feature-name

# Stash uncommitted changes (if switching branches)
git stash push -m "wip: modelA tweak"
git stash list
git stash pop
```
