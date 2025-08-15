# Quick Start: LiveKit Agent Deployment

## 🚀 Quick Setup (5 minutes)

### 1. Verify Environment Variables

Make sure your `.env` file has all required variables:

```bash
# Copy from env.example and fill in your values
cp env.example .env
```

Required variables:
- `LIVEKIT_URL` - Your LiveKit Cloud WebSocket URL
- `LIVEKIT_API_KEY` - Your LiveKit API key
- `LIVEKIT_API_SECRET` - Your LiveKit API secret
- `OPENAI_API_KEY` - Your OpenAI API key
- `DEEPGRAM_API_KEY` - Your Deepgram API key
- `CARTESIA_API_KEY` - Your Cartesia API key

### 2. Test the Agent Locally

```bash
# Test agent configuration
cd agent
python test_agent.py
```

### 3. Deploy to LiveKit Cloud

#### Option A: Using LiveKit Cloud Dashboard (Recommended)

1. **Build and push Docker image**:
   ```bash
   # Build the image
   docker build -t medical-consultation-agent:latest ./agent
   
   # Tag for your registry (replace with your registry)
   docker tag medical-consultation-agent:latest your-registry/medical-consultation-agent:latest
   docker push your-registry/medical-consultation-agent:latest
   ```

2. **Deploy via LiveKit Cloud Dashboard**:
   - Go to https://cloud.livekit.io
   - Navigate to "Agents" section
   - Click "Create Agent"
   - Fill in:
     - **Name**: `medical-consultation-agent`
     - **Image**: `your-registry/medical-consultation-agent:latest`
     - **Environment Variables**: Add all from your `.env` file

#### Option B: Using LiveKit CLI

```bash
# Install LiveKit CLI
npm install -g @livekit/cli

# Login to LiveKit Cloud
livekit login

# Deploy agent
livekit agent deploy \
  --name medical-consultation-agent \
  --image your-registry/medical-consultation-agent:latest \
  --env-file .env
```

### 4. Test the Integration

```bash
# Start the frontend
yarn dev

# Test agent job creation
curl -X POST http://localhost:3000/api/livekit/agent-job \
  -H "Content-Type: application/json" \
  -d '{"roomName":"test-room","participantName":"test-user"}'
```

### 5. Use the Application

1. Open http://localhost:3000/consultation
2. Click "Iniciar Consulta"
3. Test voice interaction

## 🔧 Troubleshooting

### Agent Not Responding
- Check agent logs in LiveKit Cloud dashboard
- Verify all environment variables are set
- Test agent locally: `python agent/test_agent.py`

### Connection Errors
- Verify `LIVEKIT_URL` is correct (should start with `wss://`)
- Check API key and secret
- Ensure frontend can reach LiveKit Cloud

### Audio Issues
- Check browser microphone permissions
- Verify Deepgram and Cartesia API keys
- Test with different browsers

## 📚 Next Steps

- Read the full [LiveKit Deployment Guide](management/LIVEKIT_DEPLOYMENT_GUIDE.md)
- Check the [Integration Diagnosis](management/LIVEKIT_INTEGRATION_DIAGNOSIS.md)
- Join the [LiveKit Community](https://discord.gg/livekit)

## 🆘 Need Help?

1. Check the troubleshooting section above
2. Review the full deployment guide
3. Check LiveKit Cloud dashboard for agent logs
4. Join the LiveKit Discord community
