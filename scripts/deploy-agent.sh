#!/bin/bash

# Deploy Medical Consultation Agent to LiveKit Cloud
# This script uses the LiveKit Cloud API to deploy the agent

set -e

# Load environment variables
source .env

# Check required environment variables
if [ -z "$LIVEKIT_URL" ] || [ -z "$LIVEKIT_API_KEY" ] || [ -z "$LIVEKIT_API_SECRET" ]; then
    echo "Error: Missing required LiveKit environment variables"
    echo "Please ensure LIVEKIT_URL, LIVEKIT_API_KEY, and LIVEKIT_API_SECRET are set in your .env file"
    exit 1
fi

# Extract LiveKit Cloud URL from WebSocket URL
LIVEKIT_CLOUD_URL=$(echo $LIVEKIT_URL | sed 's/wss:\/\//https:\/\//')

echo "Deploying medical consultation agent to LiveKit Cloud..."
echo "LiveKit Cloud URL: $LIVEKIT_CLOUD_URL"

# Create agent deployment payload
cat > /tmp/agent-deployment.json << EOF
{
  "name": "medical-consultation-agent",
  "image": "pablomadrigal/medical-consultation-agent:latest",
  "env": [
    {
      "name": "LIVEKIT_URL",
      "value": "$LIVEKIT_URL"
    },
    {
      "name": "LIVEKIT_API_KEY", 
      "value": "$LIVEKIT_API_KEY"
    },
    {
      "name": "LIVEKIT_API_SECRET",
      "value": "$LIVEKIT_API_SECRET"
    },
    {
      "name": "OPENAI_API_KEY",
      "value": "$OPENAI_API_KEY"
    },
    {
      "name": "DEEPGRAM_API_KEY",
      "value": "$DEEPGRAM_API_KEY"
    },
    {
      "name": "CARTESIA_API_KEY",
      "value": "$CARTESIA_API_KEY"
    }
  ]
}
EOF

# Deploy agent using LiveKit Cloud API
echo "Sending deployment request..."
curl -X POST \
  "$LIVEKIT_CLOUD_URL/api/agents" \
  -H "Authorization: Bearer $LIVEKIT_API_KEY:$LIVEKIT_API_SECRET" \
  -H "Content-Type: application/json" \
  -d @/tmp/agent-deployment.json

echo ""
echo "Agent deployment request sent!"
echo "Check your LiveKit Cloud dashboard for deployment status."
echo ""
echo "Note: If this fails, you may need to use the LiveKit Cloud dashboard"
echo "or contact LiveKit support to enable agent features for your account."

# Clean up
rm -f /tmp/agent-deployment.json
