# MediBot Project Management

This directory contains scripts and documentation for managing the MediBot development workflow using Git worktrees and feature completion processes.

## Scripts Overview

### 1. `manage-worktrees.sh` - Worktree Management
Handles creation, management, and coordination of multiple Git worktrees for parallel development.

**Key Features:**
- Create and remove worktrees for different features
- Sync all worktrees with main branch
- Show status and task mapping
- Open worktrees in IDE/terminal

**Usage:**
```bash
./management/manage-worktrees.sh list          # Show all worktrees
./management/manage-worktrees.sh create auth   # Create new worktree
./management/manage-worktrees.sh sync          # Sync all with main
./management/manage-worktrees.sh tasks         # Show task mapping
```

### 2. `feature-completion.sh` - Feature Completion Workflow
Comprehensive script for completing features and cleaning up development environment.

**Complete Workflow:**
1. **Update Specs & Todos** - Mark completed tasks in spec files
2. **Create Comprehensive PR** - Generate detailed PR with GitHub CLI
3. **Wait for Merge** - Interactive wait for PR approval and merge
4. **Cleanup** - Remove worktree, delete branches, clean up Git
5. **Next Feature** - Optionally create new worktree for next feature

**Usage:**
```bash
./management/feature-completion.sh complete docker-setup  # Full workflow
./management/feature-completion.sh status                 # Show status
./management/feature-completion.sh cleanup auth          # Cleanup only
```

## Development Workflow

### Starting a New Feature

1. **Create Worktree:**
   ```bash
   ./management/manage-worktrees.sh create feature-name
   ```

2. **Open in IDE:**
   ```bash
   ./management/manage-worktrees.sh open feature-name
   ```

3. **Check Task Mapping:**
   ```bash
   ./management/manage-worktrees.sh tasks
   ```

### During Development

1. **Sync with Main Regularly:**
   ```bash
   ./management/manage-worktrees.sh sync
   ```

2. **Check Status:**
   ```bash
   ./management/manage-worktrees.sh status
   ```

3. **Push Changes:**
   ```bash
   ./management/manage-worktrees.sh push
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
   - Script will offer to create next worktree
   - Choose from predefined features or custom name

## Feature Mapping

Current worktree-to-task mapping:

| Worktree | Tasks | Description |
|----------|-------|-------------|
| `docker-setup` | 1, 2.1 | Project structure and Docker environment |
| `database-layer` | 2.2, 2.3, 2.4 | Patient, Anamnesis, and Consultation models |
| `backend-api` | 3, 4 | Authentication and core API services |
| `conversational-ai` | 5, 6 | AI conversation system and NLP processing |
| `patient-interface` | 7 | React chat UI and accessibility features |
| `doctor-interface` | 8 | Doctor dashboard and consultation management |

## Prerequisites

### Required Tools

1. **Git** - Version control with worktree support
2. **GitHub CLI** - For PR creation and management
   ```bash
   brew install gh
   gh auth login
   ```

3. **Node.js/npm** - For running the application
4. **Docker** - For containerized development

### Directory Structure

The scripts expect this directory structure:
```
medibot-project/                    # Main repository
├── management/                     # Management scripts
├── .kiro/specs/                   # Specification files
└── ...

medibot-worktrees/                 # Worktrees directory (sibling)
├── docker-setup/                 # Feature worktree
├── database-layer/               # Feature worktree
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
- Keep worktrees focused on specific feature sets
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
- Use descriptive branch names (feature/docker-setup)
- Delete branches after successful merge
- Keep main branch clean and deployable
- Use draft PRs for work-in-progress features

## Troubleshooting

### Common Issues

1. **GitHub CLI Not Authenticated:**
   ```bash
   gh auth login
   ```

2. **Worktree Directory Conflicts:**
   ```bash
   rm -rf ../medibot-worktrees/conflicted-branch
   git worktree prune
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
- **Task Tracking** - Maps worktrees to specific spec tasks
- **Automated Cleanup** - Maintains clean development environment
- **Documentation** - Generates comprehensive PR documentation

The workflow supports Kiro's autonomous development modes while maintaining human oversight for critical decisions like PR merging and feature planning.