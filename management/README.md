# MediBot Project Management

This directory contains scripts and documentation for managing the MediBot development workflow using simplified feature branches and automated PR processes.

## Semantic PR Titles and Conventional Commits

To avoid semantic PR checker errors, always use conventional commit prefixes in your PR titles:

### Required PR Title Format
```
<type>: <description>
```

### Valid Types
- **feat:** - New features (e.g., "feat: add user authentication")
- **fix:** - Bug fixes (e.g., "fix: resolve login validation issue")
- **docs:** - Documentation changes (e.g., "docs: update API documentation")
- **style:** - Code style changes (e.g., "style: format code with prettier")
- **refactor:** - Code refactoring (e.g., "refactor: simplify authentication logic")
- **test:** - Adding or updating tests (e.g., "test: add unit tests for auth service")
- **chore:** - Maintenance tasks (e.g., "chore: update dependencies")

### Examples
✅ **Correct:**
- `feat: migrate to Supabase and enhance consultation flow`
- `fix: resolve patient data validation issue`
- `refactor: simplify project architecture and management system`
- `docs: update deployment instructions`

❌ **Incorrect:**
- `Migrate to Supabase and enhance consultation flow`
- `Fix patient data validation`
- `Update documentation`

### Why This Matters
The project uses `amannn/action-semantic-pull-request@v5` which enforces conventional commit standards. This helps with:
- Automated changelog generation
- Semantic versioning
- Release automation
- Code review consistency

## Quick Reference

### PR Title Format (Required)
```
<type>: <description>
```
**Examples:** `feat: add user authentication`, `fix: resolve login issue`, `refactor: simplify auth logic`

### Common Types
- `feat:` - New features
- `fix:` - Bug fixes  
- `refactor:` - Code refactoring
- `docs:` - Documentation
- `test:` - Tests
- `chore:` - Maintenance

## Scripts Overview

### 1. `feature-branch.sh` - Feature Branch Management
Handles creation and management of feature branches for development.

**Key Features:**
- Create new feature branches from main
- Show current branch status
- Sync with main branch
- List available features

**Usage:**
```bash
./management/feature-branch.sh create auth     # Create new feature branch
./management/feature-branch.sh status          # Show current status
./management/feature-branch.sh sync            # Sync with main
./management/feature-branch.sh list            # List available features
```

### 2. `feature-completion.sh` - Feature Completion Workflow
Comprehensive script for completing features and cleaning up development environment.

**Complete Workflow:**
1. **Update Specs & Todos** - Mark completed tasks in spec files
2. **Create Comprehensive PR** - Generate detailed PR with GitHub CLI
3. **Wait for Merge** - Interactive wait for PR approval and merge
4. **Cleanup** - Delete branches, clean up Git
5. **Next Feature** - Optionally create new branch for next feature

**Usage:**
```bash
./management/feature-completion.sh complete auth-feature  # Full workflow
./management/feature-completion.sh status                 # Show status
./management/feature-completion.sh cleanup auth-feature   # Cleanup only
```

## Development Workflow

### Starting a New Feature

1. **Create Feature Branch:**
   ```bash
   ./management/feature-branch.sh create feature-name
   ```

2. **Check Available Features:**
   ```bash
   ./management/feature-branch.sh list
   ```

3. **Check Task Mapping:**
   ```bash
   ./management/feature-branch.sh tasks
   ```

### During Development

1. **Sync with Main Regularly:**
   ```bash
   ./management/feature-branch.sh sync
   ```

2. **Check Status:**
   ```bash
   ./management/feature-branch.sh status
   ```

3. **Push Changes:**
   ```bash
   git push origin feature/feature-name
   ```

### Completing a Feature

1. **Run Complete Workflow:**
   ```bash
   ./management/feature-completion.sh complete feature-name
   ```

2. **Follow Interactive Prompts:**
   - Specify completed tasks
   - Review generated PR
   - Wait for PR merge
   - Confirm cleanup

3. **Optional: Create Next Feature:**
   - Script will offer to create next branch
   - Choose from predefined features or custom name

## Feature Mapping

Current feature-to-task mapping:

| Feature | Tasks | Description | Status |
|---------|-------|-------------|--------|
| `core-setup` | 1, 2.1 | Project structure and Supabase environment | ✅ Completed |
| `database-layer` | 2.2, 2.3, 2.4 | Patient, Anamnesis, and Consultation models | ✅ Completed |
| `backend-api` | 3, 4 | Authentication and core API services | ✅ Completed |
| `conversational-ai` | 5, 6 | AI conversation system and NLP processing | 🔄 Next |
| `patient-interface` | 7 | React chat UI and accessibility features | 📋 Planned |
| `doctor-interface` | 8 | Doctor dashboard and consultation management | 📋 Planned |
| `livekit-integration` | 9 | Video consultation features | 🔄 Partially Implemented |

## Prerequisites

### Required Tools

1. **Git** - Version control with feature branch support
2. **GitHub CLI** - For PR creation and management
   ```bash
   brew install gh
   gh auth login
   ```

3. **Node.js 18+** - For running the application
4. **Yarn** - Package manager
5. **Supabase CLI** - For database management (optional)

### Directory Structure

The scripts expect this directory structure:
```
AngularHelper/                     # Main repository
├── management/                    # Management scripts
├── .kiro/specs/                  # Specification files
├── src/                          # Source code
└── ...
```

## PR Template

The feature completion script generates comprehensive PRs with:

- **Feature Overview** - Clear description of what was implemented
- **Tasks Completed** - Checklist of completed spec tasks
- **Changes Made** - Auto-generated commit summary
- **Testing Checklist** - Unit, integration, and manual testing
- **Documentation** - Code comments and documentation updates
- **Review Checklist** - Code standards and security considerations
- **Related Issues** - Links to specs and issues

## Best Practices

### Development
- Keep feature branches focused on specific features
- Sync with main branch regularly to avoid conflicts
- Write comprehensive commit messages
- Test thoroughly before marking feature complete

### Feature Completion
- Update spec files to mark completed tasks
- Ensure all tests pass before creating PR
- Review PR description and add screenshots if needed
- Wait for proper code review before merging
- Clean up promptly after merge to keep environment tidy

### Branch Management
- Use descriptive branch names (feature/auth-feature)
- Delete branches after successful merge
- Keep main branch clean and deployable
- Use draft PRs for work-in-progress features

## Troubleshooting

### Common Issues

1. **GitHub CLI Not Authenticated:**
   ```bash
   gh auth login
   ```

2. **Branch Conflicts:**
   ```bash
   git checkout main
   git pull origin main
   git checkout feature/your-branch
   git rebase main
   ```

3. **Branch Not Merged:**
   - Check PR status on GitHub
   - Ensure all checks pass
   - Get required approvals

4. **Permission Issues:**
   ```bash
   chmod +x management/*.sh
   ```

### Getting Help

- Run any script with `help` argument for usage information
- Check script output for detailed error messages
- Review Git worktree documentation for advanced usage

## Integration with Kiro

These scripts integrate with Kiro's development workflow:

- **Specs Integration** - Updates `.kiro/specs/` files automatically
- **Task Tracking** - Maps features to specific spec tasks
- **Automated Cleanup** - Maintains clean development environment
- **Documentation** - Generates comprehensive PR documentation

The workflow supports Kiro's autonomous development modes while maintaining human oversight for critical decisions like PR merging and feature planning.