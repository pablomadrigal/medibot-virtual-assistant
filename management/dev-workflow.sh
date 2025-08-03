#!/bin/bash

# MediBot Development Workflow Helper
# Quick access to common development tasks

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}🏥 MediBot Development Workflow${NC}"
echo "================================"

case "$1" in
    "start")
        echo -e "${GREEN}🚀 Starting new feature: $2${NC}"
        ./management/manage-worktrees.sh create "$2"
        ./management/manage-worktrees.sh open "$2"
        ;;
    
    "sync")
        echo -e "${YELLOW}🔄 Syncing all worktrees...${NC}"
        ./management/manage-worktrees.sh sync
        ;;
    
    "status")
        echo -e "${GREEN}📊 Development Status${NC}"
        ./management/manage-worktrees.sh status
        echo ""
        ./management/feature-completion.sh status
        ;;
    
    "complete")
        echo -e "${GREEN}✅ Completing feature: $2${NC}"
        ./management/feature-completion.sh complete "$2"
        ;;
    
    "tasks")
        echo -e "${GREEN}📋 Task Mapping${NC}"
        ./management/manage-worktrees.sh tasks
        ;;
    
    "help"|"")
        echo -e "\n${GREEN}Quick Commands:${NC}"
        echo "  start <feature>    - Create and open new feature worktree"
        echo "  sync              - Sync all worktrees with main"
        echo "  status            - Show development status"
        echo "  complete <feature> - Complete feature workflow"
        echo "  tasks             - Show task mapping"
        echo ""
        echo -e "${YELLOW}Examples:${NC}"
        echo "  ./management/dev-workflow.sh start docker-setup"
        echo "  ./management/dev-workflow.sh sync"
        echo "  ./management/dev-workflow.sh complete docker-setup"
        echo ""
        echo -e "${BLUE}For detailed help:${NC}"
        echo "  ./management/manage-worktrees.sh help"
        echo "  ./management/feature-completion.sh help"
        ;;
    
    *)
        echo -e "${YELLOW}Unknown command. Use 'help' for available commands.${NC}"
        ;;
esac