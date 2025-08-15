#!/bin/bash

# LiveKit Agent Deployment Script
# This script builds and deploys the medical consultation agent

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
AGENT_NAME="medical-consultation-agent"
DOCKER_IMAGE="medical-consultation-agent:latest"
CONTAINER_NAME="medical-consultation-agent"

echo -e "${GREEN}🚀 Starting LiveKit Agent Deployment${NC}"

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo -e "${RED}❌ Error: .env file not found${NC}"
    echo "Please create a .env file with your LiveKit credentials and AI provider keys"
    exit 1
fi

# Load environment variables
source .env

# Check required environment variables
required_vars=("LIVEKIT_URL" "LIVEKIT_API_KEY" "LIVEKIT_API_SECRET" "OPENAI_API_KEY" "DEEPGRAM_API_KEY" "CARTESIA_API_KEY")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo -e "${RED}❌ Error: $var is not set in .env file${NC}"
        exit 1
    fi
done

echo -e "${GREEN}✅ Environment variables validated${NC}"

# Stop existing container if running
if docker ps -q -f name=$CONTAINER_NAME | grep -q .; then
    echo -e "${YELLOW}🛑 Stopping existing container...${NC}"
    docker stop $CONTAINER_NAME
    docker rm $CONTAINER_NAME
fi

# Remove existing image if exists
if docker images -q $DOCKER_IMAGE | grep -q .; then
    echo -e "${YELLOW}🗑️  Removing existing image...${NC}"
    docker rmi $DOCKER_IMAGE
fi

# Test the agent before building
echo -e "${GREEN}🧪 Testing agent before deployment...${NC}"
cd agent
python test_agent.py
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Agent tests failed. Please fix the issues before deployment.${NC}"
    exit 1
fi
cd ..

# Build the Docker image
echo -e "${GREEN}🔨 Building Docker image...${NC}"
docker build -t $DOCKER_IMAGE ./agent

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Docker image built successfully${NC}"
else
    echo -e "${RED}❌ Failed to build Docker image${NC}"
    exit 1
fi

# Run the container
echo -e "${GREEN}🚀 Starting agent container...${NC}"
docker run -d \
    --name $CONTAINER_NAME \
    --env-file .env \
    -p 8080:8080 \
    --restart unless-stopped \
    $DOCKER_IMAGE

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Agent container started successfully${NC}"
else
    echo -e "${RED}❌ Failed to start agent container${NC}"
    exit 1
fi

# Wait for container to be ready
echo -e "${YELLOW}⏳ Waiting for agent to be ready...${NC}"
sleep 10

# Check container status
if docker ps -q -f name=$CONTAINER_NAME | grep -q .; then
    echo -e "${GREEN}✅ Agent is running successfully${NC}"
    echo -e "${GREEN}📊 Container logs:${NC}"
    docker logs $CONTAINER_NAME --tail 20
else
    echo -e "${RED}❌ Agent container is not running${NC}"
    echo -e "${YELLOW}📋 Container logs:${NC}"
    docker logs $CONTAINER_NAME
    exit 1
fi

echo -e "${GREEN}🎉 LiveKit Agent deployment completed successfully!${NC}"
echo -e "${GREEN}📝 Next steps:${NC}"
echo -e "  1. Test the agent using: python agent/medical_agent.py console"
echo -e "  2. Deploy to LiveKit Cloud using their dashboard"
echo -e "  3. Update your frontend to connect to the agent"
