#!/bin/bash

# MediBot Feature Branch Management Script
# This script helps manage feature branches for development

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MAIN_REPO="$(dirname "$SCRIPT_DIR")"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🏥 MediBot Feature Branch Manager${NC}"
echo "====================================="

# Function to show current branch status
show_status() {
    echo -e "\n${YELLOW}📊 Current Branch Status:${NC}"
    cd "$MAIN_REPO"
    
    local current_branch=$(git branch --show-current)
    echo -e "${BLUE}Current Branch:${NC} $current_branch"
    
    if [ "$current_branch" != "main" ]; then
        echo -e "${BLUE}Branch Status:${NC}"
        git status --porcelain | head -5
        if [ -n "$(git status --porcelain)" ]; then
            echo "  📝 Has uncommitted changes"
        else
            echo "  ✅ Clean"
        fi
        
        echo -e "\n${BLUE}Commits ahead of main:${NC}"
        git log --oneline main..HEAD | head -5
    else
        echo "  ✅ On main branch"
    fi
    
    cd - > /dev/null
}

# Function to sync with main branch
sync_with_main() {
    echo -e "\n${YELLOW}🔄 Syncing with main branch...${NC}"
    
    cd "$MAIN_REPO"
    local current_branch=$(git branch --show-current)
    
    # Fetch latest changes
    git fetch origin
    
    if [ "$current_branch" = "main" ]; then
        echo -e "${BLUE}Pulling latest changes to main...${NC}"
        git pull origin main
    else
        echo -e "${BLUE}Rebasing feature/$current_branch on main...${NC}"
        git rebase origin/main
    fi
    
    echo -e "${GREEN}✅ Sync completed!${NC}"
    cd - > /dev/null
}

# Function to create a new feature branch
create_branch() {
    local branch_name=$1
    if [ -z "$branch_name" ]; then
        echo -e "${RED}❌ Please provide a branch name${NC}"
        return 1
    fi
    
    echo -e "${YELLOW}🌿 Creating new feature branch: feature/$branch_name${NC}"
    cd "$MAIN_REPO"
    
    # Ensure we're on main and up to date
    git checkout main
    git pull origin main
    
    # Create and checkout new branch
    git checkout -b "feature/$branch_name"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Feature branch created: feature/$branch_name${NC}"
        echo -e "${BLUE}You can now start developing on this branch${NC}"
    else
        echo -e "${RED}❌ Failed to create branch${NC}"
        return 1
    fi
    
    cd - > /dev/null
}

# Function to list available features
list_features() {
    echo -e "\n${GREEN}📋 Available Features:${NC}"
    echo -e "\n${BLUE}🔄 Next Priority:${NC}"
    echo "  conversational-ai - AI conversation system and NLP processing"
    
    echo -e "\n${BLUE}📋 Planned Features:${NC}"
    echo "  patient-interface - React chat UI and accessibility features"
    echo "  doctor-interface - Doctor dashboard and consultation management"
    echo "  livekit-integration - Video consultation features"
    
    echo -e "\n${BLUE}✅ Completed Features:${NC}"
    echo "  core-setup - Project structure and Supabase environment"
    echo "  database-layer - Patient, Anamnesis, and Consultation models"
    echo "  backend-api - Authentication and core API services"
}

# Function to show task mapping for each feature
show_tasks() {
    echo -e "\n${GREEN}📋 Feature Task Mapping:${NC}"
    
    echo -e "\n${BLUE}🔄 conversational-ai${NC} → Tasks 5, 6"
    echo "  - AI conversation system and NLP processing"
    echo "  - Conversation service API and WebSocket support"
    
    echo -e "\n${BLUE}📋 patient-interface${NC} → Task 7"
    echo "  - React chat UI and accessibility features"
    echo "  - WebSocket integration for real-time messaging"
    
    echo -e "\n${BLUE}📋 doctor-interface${NC} → Task 8"
    echo "  - Doctor dashboard and consultation management"
    echo "  - Patient detail views and notes functionality"
    
    echo -e "\n${BLUE}📋 livekit-integration${NC} → Task 9"
    echo "  - Video consultation features"
    echo "  - LiveKit integration for real-time video"
    
    echo -e "\n${BLUE}✅ core-setup${NC} → Tasks 1, 2.1 (Completed)"
    echo "  - Project structure and Supabase environment"
    echo "  - Database schema and configuration"
    
    echo -e "\n${BLUE}✅ database-layer${NC} → Tasks 2.2, 2.3, 2.4 (Completed)"
    echo "  - Patient, Anamnesis, and Consultation models"
    echo "  - Repository implementations with CRUD operations"
    
    echo -e "\n${BLUE}✅ backend-api${NC} → Tasks 3, 4 (Completed)"
    echo "  - Authentication and security infrastructure"
    echo "  - Core API services (Patient, Anamnesis, Doctor)"
}

# Function to show all feature branches
show_branches() {
    echo -e "\n${GREEN}📋 Feature Branches:${NC}"
    cd "$MAIN_REPO"
    
    echo -e "\n${BLUE}Local Feature Branches:${NC}"
    git branch | grep "feature/" | sed 's/^[* ]*//' | while read branch; do
        echo "  - $branch"
    done
    
    echo -e "\n${BLUE}Remote Feature Branches:${NC}"
    git branch -r | grep "origin/feature/" | sed 's/origin\///' | while read branch; do
        echo "  - $branch"
    done
    
    cd - > /dev/null
}

# Main menu
case "$1" in
    "status"|"st")
        show_status
        ;;
    "sync")
        sync_with_main
        ;;
    "create")
        create_branch "$2"
        ;;
    "list"|"ls")
        list_features
        ;;
    "branches")
        show_branches
        ;;
    "tasks")
        show_tasks
        ;;
    "help"|"--help"|"-h"|"")
        echo -e "\n${GREEN}Available commands:${NC}"
        echo "  status, st        - Show current branch status"
        echo "  sync              - Sync current branch with main"
        echo "  create <name>     - Create new feature branch"
        echo "  list, ls          - List available features"
        echo "  branches          - Show all feature branches"
        echo "  tasks             - Show task mapping for each feature"
        echo "  help              - Show this help"
        echo ""
        echo -e "${YELLOW}Examples:${NC}"
        echo "  ./management/feature-branch.sh status"
        echo "  ./management/feature-branch.sh create conversational-ai"
        echo "  ./management/feature-branch.sh sync"
        echo "  ./management/feature-branch.sh tasks"
        echo "  ./management/feature-branch.sh list"
        ;;
    *)
        echo -e "${RED}❌ Unknown command: $1${NC}"
        echo "Use './management/feature-branch.sh help' for available commands"
        ;;
esac
