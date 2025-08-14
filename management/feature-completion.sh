#!/bin/bash

# MediBot Feature Completion & Cleanup Script
# This script handles the complete workflow when a feature/todo is finished

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MAIN_REPO="$(dirname "$SCRIPT_DIR")"
SPECS_DIR="$MAIN_REPO/.kiro/specs"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

echo -e "${PURPLE}🎯 MediBot Feature Completion Manager${NC}"
echo "=========================================="

# Function to check if GitHub CLI is installed
check_gh_cli() {
    if ! command -v gh &> /dev/null; then
        echo -e "${RED}❌ GitHub CLI (gh) is not installed${NC}"
        echo "Please install it first: brew install gh"
        exit 1
    fi
    
    # Check if user is authenticated
    if ! gh auth status &> /dev/null; then
        echo -e "${RED}❌ GitHub CLI is not authenticated${NC}"
        echo "Please run: gh auth login"
        exit 1
    fi
}

# Function to update specs and todos
update_specs() {
    local branch_name=$1
    local task_numbers=$2
    
    echo -e "\n${YELLOW}📝 Updating specs and todos...${NC}"
    
    # Find all spec files
    local spec_files=($(find "$SPECS_DIR" -name "*.md" -type f))
    
    if [ ${#spec_files[@]} -eq 0 ]; then
        echo -e "${YELLOW}⚠️  No spec files found in $SPECS_DIR${NC}"
        return 0
    fi
    
    echo -e "${BLUE}Found spec files:${NC}"
    for file in "${spec_files[@]}"; do
        echo "  - $(basename "$file")"
    done
    
    # Interactive task completion
    echo -e "\n${YELLOW}Please specify which tasks were completed (e.g., '1,2.1,3.2' or 'all'):${NC}"
    read -p "Tasks completed: " completed_tasks
    
    if [ "$completed_tasks" = "all" ]; then
        echo -e "${GREEN}✅ Marking all tasks as completed${NC}"
        # This would require more complex parsing - for now, manual update
        echo -e "${YELLOW}Please manually update the spec files to mark completed tasks${NC}"
    else
        echo -e "${GREEN}✅ Tasks completed: $completed_tasks${NC}"
        echo -e "${YELLOW}Please manually update the spec files to mark these tasks as completed${NC}"
    fi
    
    # Add completion timestamp
    local completion_note="## Completion Log\n\n- **Branch**: feature/$branch_name\n- **Completed**: $(date '+%Y-%m-%d %H:%M:%S')\n- **Tasks**: $completed_tasks\n"
    
    # Ask if user wants to add completion notes
    echo -e "\n${YELLOW}Add completion notes to specs? (y/n):${NC}"
    read -p "Add notes: " add_notes
    
    if [ "$add_notes" = "y" ] || [ "$add_notes" = "yes" ]; then
        echo -e "$completion_note" >> "$SPECS_DIR/medibot-virtual-assistant/tasks.md"
        echo -e "${GREEN}✅ Added completion notes to tasks.md${NC}"
    fi
}

# Function to create comprehensive PR
create_pr() {
    local branch_name=$1
    
    echo -e "\n${YELLOW}🚀 Creating comprehensive PR...${NC}"
    
    cd "$MAIN_REPO"
    
    # Check if we're on the correct branch
    local current_branch=$(git branch --show-current)
    if [ "$current_branch" != "feature/$branch_name" ]; then
        echo -e "${RED}❌ Not on feature/$branch_name branch${NC}"
        echo -e "${YELLOW}Current branch: $current_branch${NC}"
        return 1
    fi
    
    # Check if branch has commits
    if [ -z "$(git log --oneline HEAD ^main)" ]; then
        echo -e "${RED}❌ No commits found on current branch${NC}"
        return 1
    fi
    
    # Generate PR title and description
    local pr_title="feat: $(echo $branch_name | tr '-' ' ' | sed 's/\b\w/\U&/g')"
    
    # Create comprehensive PR description
    local pr_body="## 🎯 Feature Overview
This PR implements the $branch_name feature as part of the MediBot virtual assistant project.

## 📋 Tasks Completed
<!-- Please list the specific tasks/todos completed in this PR -->
- [ ] Task 1: Description
- [ ] Task 2: Description

## 🔧 Changes Made
<!-- Auto-generated summary of changes -->
$(git log --oneline HEAD ^main | sed 's/^/- /')

## 🧪 Testing
- [ ] Unit tests added/updated
- [ ] Integration tests passing
- [ ] Manual testing completed
- [ ] Docker environment tested

## 📚 Documentation
- [ ] Code comments added
- [ ] README updated (if needed)
- [ ] API documentation updated (if needed)

## 🔍 Review Checklist
- [ ] Code follows project standards
- [ ] No sensitive data exposed
- [ ] Error handling implemented
- [ ] Performance considerations addressed
- [ ] Security best practices followed

## 🔗 Related Issues
<!-- Link any related issues or specs -->
Closes #[issue-number]

## 📸 Screenshots (if applicable)
<!-- Add screenshots for UI changes -->

---
**Branch**: feature/$branch_name  
**Created**: $(date '+%Y-%m-%d %H:%M:%S')"
    
    # Push the branch first
    echo -e "${BLUE}Pushing branch to origin...${NC}"
    git push origin feature/$branch_name
    
    # Create the PR
    echo -e "${BLUE}Creating PR with GitHub CLI...${NC}"
    gh pr create \
        --title "$pr_title" \
        --body "$pr_body" \
        --base main \
        --head feature/$branch_name \
        --draft
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ PR created successfully!${NC}"
        
        # Open PR in browser for review
        echo -e "${YELLOW}Opening PR in browser for review...${NC}"
        gh pr view --web
        
        # Show PR URL
        local pr_url=$(gh pr view --json url --jq '.url')
        echo -e "${GREEN}PR URL: $pr_url${NC}"
        
        return 0
    else
        echo -e "${RED}❌ Failed to create PR${NC}"
        return 1
    fi
}

# Function to wait for PR merge and cleanup
cleanup_after_merge() {
    local branch_name=$1
    
    echo -e "\n${YELLOW}⏳ Waiting for PR to be merged...${NC}"
    echo -e "${BLUE}Please merge the PR when ready, then press Enter to continue cleanup${NC}"
    read -p "Press Enter after PR is merged..."
    
    # Check if PR is actually merged
    cd "$MAIN_REPO"
    git fetch origin
    
    if git branch -r --merged origin/main | grep -q "origin/feature/$branch_name"; then
        echo -e "${GREEN}✅ PR has been merged!${NC}"
        
        # Clean up the branch
        echo -e "${YELLOW}🗑️  Cleaning up branch...${NC}"
        
        # Switch to main and pull latest
        git checkout main
        git pull origin main
        
        # Delete local branch
        git branch -d feature/$branch_name 2>/dev/null || git branch -D feature/$branch_name
        echo -e "${GREEN}✅ Deleted local branch: feature/$branch_name${NC}"
        
        # Delete remote branch
        git push origin --delete feature/$branch_name
        echo -e "${GREEN}✅ Deleted remote branch: feature/$branch_name${NC}"
        
        # Clean up remote tracking
        git remote prune origin
        
        echo -e "${GREEN}🎉 Cleanup completed successfully!${NC}"
        
        # Ask about creating new branch
        create_next_branch
        
    else
        echo -e "${RED}❌ PR doesn't appear to be merged yet${NC}"
        echo -e "${YELLOW}Please check the PR status and try again${NC}"
        return 1
    fi
}

# Function to create next branch
create_next_branch() {
    echo -e "\n${YELLOW}🌿 Create new branch for next feature? (y/n):${NC}"
    read -p "Create new branch: " create_new
    
    if [ "$create_new" = "y" ] || [ "$create_new" = "yes" ]; then
        echo -e "${BLUE}Available upcoming features:${NC}"
        echo "  1. conversational-ai (Next Priority)"
        echo "  2. patient-interface"
        echo "  3. doctor-interface"
        echo "  4. livekit-integration"
        echo "  5. custom (specify name)"
        
        read -p "Enter feature name or number: " next_feature
        
        case $next_feature in
            1) next_feature="conversational-ai" ;;
            2) next_feature="patient-interface" ;;
            3) next_feature="doctor-interface" ;;
            4) next_feature="livekit-integration" ;;
            5) 
                read -p "Enter custom feature name: " next_feature
                ;;
        esac
        
        # Create new branch
        echo -e "${YELLOW}Creating branch for: $next_feature${NC}"
        git checkout -b "feature/$next_feature"
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ New branch created: feature/$next_feature${NC}"
            echo -e "${BLUE}You can now start developing on this branch${NC}"
        else
            echo -e "${RED}❌ Failed to create new branch${NC}"
        fi
    fi
}

# Function to show completion status
show_completion_status() {
    echo -e "\n${GREEN}📊 Feature Completion Status:${NC}"
    
    # Show current branch
    echo -e "\n${BLUE}Current Branch:${NC}"
    cd "$MAIN_REPO"
    local current_branch=$(git branch --show-current)
    echo "  $current_branch"
    
    # Show feature branches
    echo -e "\n${BLUE}Feature Branches:${NC}"
    git branch | grep "feature/" | sed 's/^[* ]*//' | while read branch; do
        echo "  - $branch"
    done
    
    # Show recent PRs
    echo -e "\n${BLUE}Recent PRs:${NC}"
    gh pr list --limit 5 --state all | head -6
    
    # Show spec completion status
    if [ -f "$SPECS_DIR/medibot-virtual-assistant/tasks.md" ]; then
        echo -e "\n${BLUE}Task Completion Status:${NC}"
        grep -E "^- \[[ x]\]" "$SPECS_DIR/medibot-virtual-assistant/tasks.md" | head -10
    fi
}

# Main execution
case "$1" in
    "complete")
        if [ -z "$2" ]; then
            echo -e "${RED}❌ Please provide branch name${NC}"
            echo "Usage: $0 complete <branch-name>"
            exit 1
        fi
        
        check_gh_cli
        branch_name="$2"
        
        echo -e "${GREEN}🎯 Starting feature completion for: $branch_name${NC}"
        
        # Step 1: Update specs
        update_specs "$branch_name"
        
        # Step 2: Create PR
        if create_pr "$branch_name"; then
            # Step 3: Wait for merge and cleanup
            cleanup_after_merge "$branch_name"
        fi
        ;;
    
    "status")
        show_completion_status
        ;;
    
    "cleanup")
        if [ -z "$2" ]; then
            echo -e "${RED}❌ Please provide branch name${NC}"
            echo "Usage: $0 cleanup <branch-name>"
            exit 1
        fi
        
        check_gh_cli
        cleanup_after_merge "$2"
        ;;
    
    "help"|"--help"|"-h"|"")
        echo -e "\n${GREEN}MediBot Feature Completion Commands:${NC}"
        echo "  complete <branch>  - Complete full workflow for a feature"
        echo "  cleanup <branch>   - Clean up after PR merge"
        echo "  status            - Show completion status"
        echo "  help              - Show this help"
        echo ""
        echo -e "${YELLOW}Complete Workflow:${NC}"
        echo "  1. Updates specs and todos"
        echo "  2. Creates comprehensive PR with GitHub CLI"
        echo "  3. Waits for PR merge"
        echo "  4. Deletes branch and worktree"
        echo "  5. Optionally creates new worktree for next feature"
        echo ""
        echo -e "${YELLOW}Examples:${NC}"
        echo "  ./management/feature-completion.sh complete auth-feature"
        echo "  ./management/feature-completion.sh status"
        echo "  ./management/feature-completion.sh cleanup auth-feature"
        ;;
    
    *)
        echo -e "${RED}❌ Unknown command: $1${NC}"
        echo "Use './management/feature-completion.sh help' for available commands"
        exit 1
        ;;
esac