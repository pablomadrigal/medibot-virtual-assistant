# Quick Reference - MediBot Development Workflow

## 🚀 Start New Feature
```bash
# Create feature branch
./management/feature-branch.sh create feature-name

# Check available features
./management/feature-branch.sh list
```

## 🔄 During Development
```bash
# Check current branch status
./management/feature-branch.sh status

# Sync with main branch
./management/feature-branch.sh sync

# Push changes
git push origin feature/feature-name
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
./management/feature-branch.sh tasks
```

## 🧹 Manual Cleanup
```bash
# Clean up after PR merge (if needed)
./management/feature-completion.sh cleanup feature-name
```

## 📋 Feature Order
1. `core-setup` - Project structure and Supabase environment ✅
2. `database-layer` - Data models and repositories ✅
3. `backend-api` - Authentication and API services ✅
4. `conversational-ai` - AI conversation system 🔄 Next
5. `patient-interface` - React chat UI 📋 Planned
6. `doctor-interface` - Doctor dashboard 📋 Planned
7. `livekit-integration` - Video consultation features 🔄 Partially Implemented

## 🔧 Prerequisites
- GitHub CLI: `brew install gh && gh auth login`
- Node.js 18+ and Yarn installed
- Supabase project configured

## 💡 Tips
- Always sync before starting work: `./management/feature-branch.sh sync`
- Use descriptive commit messages
- Test thoroughly before completing feature
- Review PR description before submitting
- Keep feature branches focused and small