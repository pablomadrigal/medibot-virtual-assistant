# Quick Reference - MediBot Development Workflow

## 🚀 Start New Feature
```bash
# Create worktree for new feature
./management/manage-worktrees.sh create feature-name

# Open in IDE
./management/manage-worktrees.sh open feature-name
```

## 🔄 During Development
```bash
# Check status of all worktrees
./management/manage-worktrees.sh status

# Sync all worktrees with main
./management/manage-worktrees.sh sync

# Push all clean branches
./management/manage-worktrees.sh push
```

## ✅ Complete Feature
```bash
# Run complete workflow (updates specs, creates PR, cleans up)
./management/feature-completion.sh complete feature-name
```

## 📊 Check Progress
```bash
# Show completion status
./management/feature-completion.sh status

# Show task mapping
./management/manage-worktrees.sh tasks
```

## 🧹 Manual Cleanup
```bash
# Clean up after PR merge (if needed)
./management/feature-completion.sh cleanup feature-name
```

## 📋 Feature Order
1. `docker-setup` - Project structure and Docker environment
2. `database-layer` - Data models and repositories  
3. `backend-api` - Authentication and API services
4. `conversational-ai` - AI conversation system
5. `patient-interface` - React chat UI
6. `doctor-interface` - Doctor dashboard

## 🔧 Prerequisites
- GitHub CLI: `brew install gh && gh auth login`
- Docker installed and running
- Node.js and npm/yarn installed

## 💡 Tips
- Always sync before starting work: `./management/manage-worktrees.sh sync`
- Use descriptive commit messages
- Test thoroughly before completing feature
- Review PR description before submitting