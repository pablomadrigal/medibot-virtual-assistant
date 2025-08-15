# LiveKit Agent Deployment Guide

## Overview

This guide will help you deploy the medical consultation agent to LiveKit Cloud and integrate it with your frontend application.

## Prerequisites

1. **LiveKit Cloud Account**: Sign up at https://cloud.livekit.io
2. **API Keys**: Get your LiveKit API key and secret from the dashboard
3. **Environment Variables**: Configure all required API keys in your `.env` file

## Step 1: Environment Setup

Ensure your `.env` file contains all required variables:

```bash
# LiveKit Configuration
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=your-api-key
LIVEKIT_API_SECRET=your-api-secret
NEXT_PUBLIC_LIVEKIT_URL=wss://your-project.livekit.cloud

# AI Provider Keys
OPENAI_API_KEY=your-openai-api-key
DEEPGRAM_API_KEY=your-deepgram-api-key
CARTESIA_API_KEY=your-cartesia-api-key

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

## Step 2: Deploy Agent to LiveKit Cloud

### Option A: Using LiveKit Cloud Dashboard (Recommended)

1. **Build Docker Image**:
   ```bash
   cd agent
   docker build -t medical-consultation-agent:latest .
   ```

2. **Push to Container Registry**:
   ```bash
   # Tag for your registry (replace with your registry)
   docker tag medical-consultation-agent:latest your-registry/medical-consultation-agent:latest
   docker push your-registry/medical-consultation-agent:latest
   ```

3. **Deploy via LiveKit Cloud Dashboard**:
   - Go to https://cloud.livekit.io
   - Navigate to "Agents" section
   - Click "Create Agent"
   - Fill in the details:
     - **Name**: `medical-consultation-agent`
     - **Image**: `your-registry/medical-consultation-agent:latest`
     - **Environment Variables**: Add all required env vars
     - **Resource Limits**: 1 CPU, 2GB RAM (adjust as needed)

### Option B: Using LiveKit CLI

1. **Install LiveKit CLI**:
   ```bash
   npm install -g @livekit/cli
   ```

2. **Login to LiveKit Cloud**:
   ```bash
   livekit login
   ```

3. **Deploy Agent**:
   ```bash
   livekit agent deploy \
     --name medical-consultation-agent \
     --image your-registry/medical-consultation-agent:latest \
     --env LIVEKIT_URL=$LIVEKIT_URL \
     --env LIVEKIT_API_KEY=$LIVEKIT_API_KEY \
     --env LIVEKIT_API_SECRET=$LIVEKIT_API_SECRET \
     --env OPENAI_API_KEY=$OPENAI_API_KEY \
     --env DEEPGRAM_API_KEY=$DEEPGRAM_API_KEY \
     --env CARTESIA_API_KEY=$CARTESIA_API_KEY
   ```

## Step 3: Test Agent Deployment

1. **Check Agent Status**:
   ```bash
   livekit agent list
   ```

2. **Test Agent Console**:
   ```bash
   livekit agent console medical-consultation-agent
   ```

3. **Test Agent Job Creation**:
   ```bash
   curl -X POST http://localhost:3000/api/livekit/agent-job \
     -H "Content-Type: application/json" \
     -d '{"roomName":"test-room","participantName":"test-user"}'
   ```

## Step 4: Frontend Integration

The frontend has been updated to:

1. **Create Agent Jobs**: Uses `/api/livekit/agent-job` endpoint
2. **Connect to LiveKit**: Uses the deployed agent
3. **Handle Real-time Communication**: Processes agent responses

### Testing the Integration

1. **Start the Frontend**:
   ```bash
   yarn dev
   ```

2. **Navigate to Consultation Page**:
   - Go to `/consultation`
   - Click "Iniciar Consulta"
   - Test voice interaction

## Step 5: Troubleshooting

### Common Issues

1. **Agent Not Responding**:
   - Check agent logs in LiveKit Cloud dashboard
   - Verify environment variables are set correctly
   - Ensure agent is deployed and running

2. **Connection Errors**:
   - Verify `LIVEKIT_URL` is correct
   - Check API key and secret
   - Ensure frontend can reach LiveKit Cloud

3. **Audio Issues**:
   - Check browser permissions for microphone
   - Verify Deepgram and Cartesia API keys
   - Test with different browsers

### Debug Commands

```bash
# Check agent logs
livekit agent logs medical-consultation-agent

# Test agent health
curl -X GET https://your-project.livekit.cloud/health

# Check room status
livekit room list
```

## Step 6: Production Deployment

### Environment Variables for Production

```bash
# Production LiveKit URL
LIVEKIT_URL=wss://your-production-project.livekit.cloud
NEXT_PUBLIC_LIVEKIT_URL=wss://your-production-project.livekit.cloud

# Production API Keys
OPENAI_API_KEY=sk-prod-...
DEEPGRAM_API_KEY=dg_prod_...
CARTESIA_API_KEY=cartesia_prod_...
```

### Scaling Considerations

1. **Agent Scaling**: Configure auto-scaling in LiveKit Cloud
2. **Resource Limits**: Monitor CPU and memory usage
3. **Concurrent Sessions**: Test with multiple users
4. **Error Handling**: Implement proper fallbacks

## Step 7: Monitoring and Logging

### LiveKit Cloud Monitoring

- **Agent Metrics**: CPU, memory, response time
- **Room Metrics**: Active rooms, participants
- **Error Logs**: Failed connections, agent errors

### Application Monitoring

- **Frontend Errors**: Browser console errors
- **API Errors**: Server-side error logs
- **User Experience**: Response times, audio quality

## Next Steps

1. **Performance Optimization**: Optimize agent response times
2. **Feature Enhancement**: Add more medical consultation features
3. **Security**: Implement additional security measures
4. **Compliance**: Ensure HIPAA compliance for medical data

## Support

- **LiveKit Documentation**: https://docs.livekit.io
- **LiveKit Community**: https://discord.gg/livekit
- **Agent Framework**: https://docs.livekit.io/agents
