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
        ./management/feature-branch.sh create "$2"
        ;;
    
    "sync")
        echo -e "${YELLOW}🔄 Syncing with main branch...${NC}"
        ./management/feature-branch.sh sync
        ;;
    
    "status")
        echo -e "${GREEN}📊 Development Status${NC}"
        ./management/feature-branch.sh status
        echo ""
        ./management/feature-completion.sh status
        ;;
    
    "complete")
        echo -e "${GREEN}✅ Completing feature: $2${NC}"
        ./management/feature-completion.sh complete "$2"
        ;;
    
    "tasks")
        echo -e "${GREEN}📋 Task Mapping${NC}"
        ./management/feature-branch.sh tasks
        ;;
    
    "help"|"")
        echo -e "\n${GREEN}Quick Commands:${NC}"
        echo "  start <feature>    - Create new feature branch"
        echo "  sync              - Sync with main branch"
        echo "  status            - Show development status"
        echo "  complete <feature> - Complete feature workflow"
        echo "  tasks             - Show task mapping"
        echo ""
        echo -e "${YELLOW}Examples:${NC}"
        echo "  ./management/dev-workflow.sh start conversational-ai"
        echo "  ./management/dev-workflow.sh sync"
        echo "  ./management/dev-workflow.sh complete conversational-ai"
        echo ""
        echo -e "${BLUE}For detailed help:${NC}"
        echo "  ./management/feature-branch.sh help"
        echo "  ./management/feature-completion.sh help"
        ;;
    
    *)
        echo -e "${YELLOW}Unknown command. Use 'help' for available commands.${NC}"
        ;;
esac