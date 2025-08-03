# MediBot Project Management

This directory contains management scripts and tools for the MediBot project development workflow.

## Git Worktree Management

The `manage-worktrees.sh` script helps manage multiple git worktrees for parallel development on different features.

### Current Worktrees

The project is set up with the following worktrees for parallel development:

| Worktree | Branch | Tasks | Description |
|----------|--------|-------|-------------|
| `docker-setup` | `feature/docker-setup` | 1, 2.1 | Project structure and Docker environment setup |
| `database-layer` | `feature/database-layer` | 2.2-2.4 | Data models and repository implementations |
| `backend-api` | `feature/backend-api` | 3, 4 | Authentication, security, and core API services |
| `conversational-ai` | `feature/conversational-ai` | 5, 6 | AI conversation system and NLP processing |
| `patient-interface` | `feature/patient-interface` | 7 | React chat UI and patient-facing features |
| `doctor-interface` | `feature/doctor-interface` | 8 | Doctor dashboard and consultation management |

### Usage

From the project root directory:

```bash
# Show all worktrees
./management/manage-worktrees.sh list

# Show status of all branches
./management/manage-worktrees.sh status

# Show task mapping
./management/manage-worktrees.sh tasks

# Open a specific worktree in new terminal/IDE
./management/manage-worktrees.sh open docker-setup

# Sync all worktrees with main branch
./management/manage-worktrees.sh sync

# Push all clean feature branches
./management/manage-worktrees.sh push

# Create a new worktree
./management/manage-worktrees.sh create new-feature

# Remove a worktree
./management/manage-worktrees.sh remove old-feature

# Show help
./management/manage-worktrees.sh help
```

### Workflow

1. **Start Development**: Use `open <worktree>` to begin work on a specific feature
2. **Regular Sync**: Use `sync` to keep all worktrees updated with main branch
3. **Push Changes**: Use `push` to push all completed feature branches
4. **Status Check**: Use `status` to see which worktrees have uncommitted changes

### Directory Structure

```
project-root/
├── management/
│   ├── manage-worktrees.sh    # Worktree management script
│   └── README.md              # This file
└── ../medibot-worktrees/      # Worktree directories
    ├── docker-setup/
    ├── database-layer/
    ├── backend-api/
    ├── conversational-ai/
    ├── patient-interface/
    └── doctor-interface/
```

### Benefits of This Setup

- **Parallel Development**: Work on multiple features simultaneously
- **Context Switching**: Each worktree maintains its own working directory and branch state
- **Reduced Conflicts**: Separate environments prevent merge conflicts during development
- **Easy Testing**: Test different features independently
- **Organized Workflow**: Clear separation of concerns across different development streams

### Tips

- Each worktree is a complete working directory with its own branch
- Changes in one worktree don't affect others
- Use the sync command regularly to stay updated with main branch
- The script automatically handles terminal/IDE opening on macOS
- All worktrees share the same Git repository and history