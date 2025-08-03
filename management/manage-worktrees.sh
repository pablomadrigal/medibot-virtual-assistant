#!/bin/bash

# MediBot Worktree Management Script
# This script helps manage multiple git worktrees for parallel development

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MAIN_REPO="$(dirname "$SCRIPT_DIR")"
WORKTREE_BASE="$(dirname "$MAIN_REPO")/medibot-worktrees"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🏥 MediBot Worktree Manager${NC}"
echo "=================================="

# Function to show current worktrees
show_worktrees() {
    echo -e "\n${GREEN}📋 Current Worktrees:${NC}"
    cd "$MAIN_REPO"
    git worktree list
    cd - > /dev/null
}

# Function to show branch status
show_status() {
    echo -e "\n${YELLOW}📊 Branch Status:${NC}"
    for worktree in $(ls -1 $WORKTREE_BASE 2>/dev/null); do
        if [ -d "$WORKTREE_BASE/$worktree" ]; then
            echo -e "\n${BLUE}Branch: feature/$worktree${NC}"
            cd "$WORKTREE_BASE/$worktree"
            git status --porcelain | head -5
            if [ $? -eq 0 ] && [ -n "$(git status --porcelain)" ]; then
                echo "  📝 Has changes"
            else
                echo "  ✅ Clean"
            fi
            cd - > /dev/null
        fi
    done
}

# Function to sync all worktrees with main
sync_all() {
    echo -e "\n${YELLOW}🔄 Syncing all worktrees with main...${NC}"
    
    # First, fetch latest changes from main repo
    cd "$MAIN_REPO"
    git fetch origin
    
    for worktree in $(ls -1 $WORKTREE_BASE 2>/dev/null); do
        if [ -d "$WORKTREE_BASE/$worktree" ]; then
            echo -e "\n${BLUE}Syncing feature/$worktree...${NC}"
            cd "$WORKTREE_BASE/$worktree"
            git fetch origin
            git rebase origin/main
            cd - > /dev/null
        fi
    done
    echo -e "\n${GREEN}✅ All worktrees synced!${NC}"
}

# Function to push all branches
push_all() {
    echo -e "\n${YELLOW}🚀 Pushing all feature branches...${NC}"
    
    for worktree in $(ls -1 $WORKTREE_BASE 2>/dev/null); do
        if [ -d "$WORKTREE_BASE/$worktree" ]; then
            echo -e "\n${BLUE}Pushing feature/$worktree...${NC}"
            cd "$WORKTREE_BASE/$worktree"
            if [ -n "$(git status --porcelain)" ]; then
                echo "  📝 Has uncommitted changes, skipping..."
            else
                git push origin feature/$worktree
            fi
            cd - > /dev/null
        fi
    done
    echo -e "\n${GREEN}✅ All clean branches pushed!${NC}"
}

# Function to open specific worktree in new terminal/IDE
open_worktree() {
    local branch_name=$1
    local worktree_path="$WORKTREE_BASE/$branch_name"
    
    if [ -d "$worktree_path" ]; then
        echo -e "${GREEN}📂 Opening $branch_name worktree...${NC}"
        echo "Path: $worktree_path"
        
        # Open in new terminal tab (macOS)
        if command -v osascript &> /dev/null; then
            osascript -e "tell application \"Terminal\" to do script \"cd '$worktree_path' && echo 'Working on feature/$branch_name' && git status\""
        fi
        
        # You can also open in VS Code if available
        if command -v code &> /dev/null; then
            code "$worktree_path"
        fi
    else
        echo -e "${RED}❌ Worktree $branch_name not found${NC}"
    fi
}

# Function to create a new worktree
create_worktree() {
    local branch_name=$1
    if [ -z "$branch_name" ]; then
        echo -e "${RED}❌ Please provide a branch name${NC}"
        return 1
    fi
    
    echo -e "${YELLOW}🌿 Creating new worktree: feature/$branch_name${NC}"
    cd "$MAIN_REPO"
    git worktree add "$WORKTREE_BASE/$branch_name" -b "feature/$branch_name"
    echo -e "${GREEN}✅ Worktree created at: $WORKTREE_BASE/$branch_name${NC}"
    cd - > /dev/null
}

# Function to remove a worktree
remove_worktree() {
    local branch_name=$1
    if [ -z "$branch_name" ]; then
        echo -e "${RED}❌ Please provide a branch name${NC}"
        return 1
    fi
    
    echo -e "${YELLOW}🗑️  Removing worktree: feature/$branch_name${NC}"
    cd "$MAIN_REPO"
    git worktree remove "$WORKTREE_BASE/$branch_name"
    git branch -d "feature/$branch_name"
    echo -e "${GREEN}✅ Worktree removed${NC}"
    cd - > /dev/null
}

# Function to show task mapping for each worktree
show_tasks() {
    echo -e "\n${GREEN}📋 Worktree Task Mapping:${NC}"
    echo -e "\n${BLUE}docker-setup${NC} → Tasks 1, 2.1"
    echo "  - Project structure and Docker environment"
    echo "  - Database schema and Docker configuration"
    
    echo -e "\n${BLUE}database-layer${NC} → Tasks 2.2, 2.3, 2.4"
    echo "  - Patient, Anamnesis, and Consultation models"
    echo "  - Repository implementations with CRUD operations"
    
    echo -e "\n${BLUE}backend-api${NC} → Tasks 3, 4"
    echo "  - Authentication and security infrastructure"
    echo "  - Core API services (Patient, Anamnesis, Doctor)"
    
    echo -e "\n${BLUE}conversational-ai${NC} → Tasks 5, 6"
    echo "  - AI conversation system and NLP processing"
    echo "  - Conversation service API and WebSocket support"
    
    echo -e "\n${BLUE}patient-interface${NC} → Task 7"
    echo "  - React chat UI and accessibility features"
    echo "  - WebSocket integration for real-time messaging"
    
    echo -e "\n${BLUE}doctor-interface${NC} → Task 8"
    echo "  - Doctor dashboard and consultation management"
    echo "  - Patient detail views and notes functionality"
}

# Main menu
case "$1" in
    "list"|"ls")
        show_worktrees
        ;;
    "status"|"st")
        show_status
        ;;
    "sync")
        sync_all
        ;;
    "push")
        push_all
        ;;
    "open")
        open_worktree "$2"
        ;;
    "create")
        create_worktree "$2"
        ;;
    "remove"|"rm")
        remove_worktree "$2"
        ;;
    "tasks")
        show_tasks
        ;;
    "help"|"--help"|"-h"|"")
        echo -e "\n${GREEN}Available commands:${NC}"
        echo "  list, ls          - Show all worktrees"
        echo "  status, st        - Show status of all branches"
        echo "  sync              - Sync all worktrees with main branch"
        echo "  push              - Push all clean feature branches"
        echo "  open <branch>     - Open specific worktree in new terminal/IDE"
        echo "  create <branch>   - Create new worktree"
        echo "  remove <branch>   - Remove worktree and branch"
        echo "  tasks             - Show task mapping for each worktree"
        echo "  help              - Show this help"
        echo ""
        echo -e "${YELLOW}Examples:${NC}"
        echo "  ./management/manage-worktrees.sh list"
        echo "  ./management/manage-worktrees.sh open docker-setup"
        echo "  ./management/manage-worktrees.sh create authentication"
        echo "  ./management/manage-worktrees.sh sync"
        echo "  ./management/manage-worktrees.sh tasks"
        ;;
    *)
        echo -e "${RED}❌ Unknown command: $1${NC}"
        echo "Use './management/manage-worktrees.sh help' for available commands"
        ;;
esac