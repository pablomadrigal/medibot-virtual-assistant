# MediBot - AI-Powered Medical Consultation Assistant

MediBot is a comprehensive AI-powered medical consultation system that combines real-time voice interaction with intelligent medical analysis. The system features a Python-based LiveKit agent for voice processing and a Next.js frontend for patient and doctor interfaces.

## 🏥 Overview

MediBot consists of four main components:
- **LiveKit Voice Agent**: Python-based AI agent for real-time voice consultations
- **Next.js Frontend**: React-based patient and doctor interfaces
- **Backend API System**: Manages data storage, processing, and AI analysis
- **Supabase Database**: Secure patient data management with HIPAA compliance

## 🚀 Features

- **Continuous Voice Interaction**: Professional voice activity detection and turn detection - no need for manual talk buttons
- **Real-time Voice Consultation**: LiveKit-powered voice interaction with AI agent
- **Multi-language Support**: Spanish-speaking medical assistant
- **Structured Medical Flow**: Three-phase consultation process (patient input, doctor review, prescription)
- **AI-Powered Analysis**: Automatic symptom analysis and medical recommendations
- **Doctor Dashboard**: Comprehensive consultation review and patient management
- **HIPAA Compliant**: Secure data handling with encryption and audit logging
- **Docker Deployment**: Containerized agent for easy deployment and scaling

## 📋 Project Structure

```
.kiro/specs/medibot-virtual-assistant/
├── requirements.md    # Detailed requirements in EARS format
├── design.md         # System architecture and technical design
└── tasks.md          # Implementation plan with actionable tasks
```

## 🛠 Technology Stack

**Frontend:**
- Next.js 14 with TypeScript
- React with Tailwind CSS
- LiveKit Client for real-time voice communication
- Web Audio API for voice activity detection
- MediaRecorder API for continuous audio capture

**Backend:**
- Next.js API Routes
- Supabase for database and authentication
- JWT authentication with role-based access control
- OpenAI Whisper for speech-to-text
- OpenAI TTS for text-to-speech

**AI Agent (Python):**
- LiveKit Agents framework
- OpenAI GPT-4o-mini for conversation
- Deepgram for Speech-to-Text (STT)
- Cartesia for Text-to-Speech (TTS)
- Docker containerization

## 🎤 Voice Features

**Continuous Voice Interaction:**
- **Voice Activity Detection**: Automatically detects when the user starts and stops speaking
- **Turn Detection**: Intelligently determines when the user has finished speaking
- **Real-time Audio Processing**: Processes voice input continuously without manual intervention
- **Professional UI**: Clean, medical-grade interface with visual feedback
- **Audio Level Monitoring**: Real-time visualization of voice input levels
- **Automatic Transcription**: Converts speech to text using OpenAI Whisper
- **Natural Responses**: AI responds with natural, conversational Spanish

**How it Works:**
1. User connects to the voice consultation
2. System automatically starts listening for voice input
3. When voice is detected, recording begins automatically
4. When silence is detected (1.5 seconds), recording stops
5. Audio is processed and transcribed to text
6. AI generates a response and converts it to speech
7. Response is played back to the user
8. Process continues seamlessly for natural conversation flow

**Infrastructure:**
- Supabase cloud database (PostgreSQL)
- LiveKit Cloud for real-time communication
- Docker Compose for local development
- HIPAA-compliant security measures

## 🏃‍♂️ Getting Started

### Prerequisites
- Node.js 18+
- Python 3.11+
- Docker and Docker Compose
- Yarn package manager
- Git

### Environment Variables

This application requires several environment variables to function properly. Copy the example file and configure your variables:

```bash
cp env.example .env.local
```

**Required Variables:**
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key
- `LIVEKIT_URL`: Your LiveKit Cloud WebSocket URL
- `LIVEKIT_API_KEY`: Your LiveKit API key
- `LIVEKIT_API_SECRET`: Your LiveKit API secret
- `OPENAI_API_KEY`: OpenAI API key for AI features
- `DEEPGRAM_API_KEY`: Deepgram API key for speech-to-text
- `CARTESIA_API_KEY`: Cartesia API key for text-to-speech

## 🚀 Quick Start (5 minutes)

### 1. Prerequisites
```bash
# Install required tools
brew install node yarn docker
# or on Ubuntu/Debian:
# curl -fsSL https://get.docker.com -o get-docker.sh && sh get-docker.sh
```

### 2. Clone and Setup
```bash
git clone <repository-url>
cd AngularHelper
yarn install
```

### 3. Configure Environment
```bash
cp env.example .env.local
# Edit .env.local with your API keys (see Configuration section below)
```

### 4. Start Services
```bash
# Start the LiveKit agent
docker-compose up -d

# Start the frontend
yarn dev
```

### 5. Test the System
- Open http://localhost:3000/consultation
- Click "Iniciar Consulta"
- Click "Hablar" to start voice interaction
- Speak in Spanish about your symptoms

## 🔧 Configuration

### Required API Keys

You'll need these services set up:

1. **LiveKit Cloud** (Voice communication)
   - Sign up at https://cloud.livekit.io
   - Get your API key and secret

2. **OpenAI** (AI conversation)
   - Get API key from https://platform.openai.com

3. **Deepgram** (Speech-to-Text)
   - Sign up at https://deepgram.com
   - Get API key

4. **Cartesia** (Text-to-Speech)
   - Sign up at https://cartesia.ai
   - Get API key

5. **Supabase** (Database)
   - Create project at https://supabase.com
   - Get project URL and keys

### Environment Variables

Add these to your `.env.local`:

```bash
# AI Services
OPENAI_API_KEY=sk-your-openai-key
DEEPGRAM_API_KEY=your-deepgram-key
CARTESIA_API_KEY=your-cartesia-key

# LiveKit
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=your-livekit-key
LIVEKIT_API_SECRET=your-livekit-secret
NEXT_PUBLIC_LIVEKIT_URL=wss://your-project.livekit.cloud

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-key
```

## 🧪 Testing

### Test the Agent
```bash
# Test locally
cd agent
python test_agent.py

# Test Docker agent
docker exec medical-consultation-agent python test_agent.py
```

### Test the Frontend
```bash
# Check if services are running
docker-compose ps
curl http://localhost:3000/api/health
```

### Test Voice Interaction
1. Go to http://localhost:3000/consultation
2. Click "Iniciar Consulta"
3. Allow microphone access
4. Click "Hablar" and speak in Spanish
5. The agent should respond with voice and text

## 🚀 Production Deployment

### Option 1: Vercel + LiveKit Cloud (Recommended)

#### Frontend Deployment (Vercel)
```bash
npm i -g vercel
vercel
```

Configure these environment variables in Vercel dashboard:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `LIVEKIT_URL`
- `LIVEKIT_API_KEY`
- `LIVEKIT_API_SECRET`
- `OPENAI_API_KEY`
- `DEEPGRAM_API_KEY`
- `CARTESIA_API_KEY`

#### Agent Deployment (LiveKit Cloud)
1. **Build and push Docker image:**
```bash
docker build -t medical-consultation-agent:latest ./agent
docker tag medical-consultation-agent:latest your-registry/medical-consultation-agent:latest
docker push your-registry/medical-consultation-agent:latest
```

2. **Deploy via LiveKit Cloud Dashboard:**
- Go to https://cloud.livekit.io
- Navigate to "Agents" section
- Click "Create Agent"
- Configure:
  - **Name**: `medical-consultation-agent`
  - **Image**: `your-registry/medical-consultation-agent:latest`
  - **Environment Variables**: Add all from your `.env` file

### Option 2: Self-Hosted Deployment

#### Frontend (Any Node.js Host)
```bash
yarn build
yarn start
```

Deploy to your preferred platform:
- Railway
- Render
- DigitalOcean App Platform
- AWS Elastic Beanstalk

#### Agent (Self-Hosted LiveKit)
```bash
# Deploy LiveKit Server
docker run --rm -p 7880:7880 -p 7881:7881 -p 7882:7882/udp \
  livekit/livekit-server \
  --keys "your-api-key: your-api-secret"

# Deploy the agent
docker-compose -f docker-compose.prod.yml up -d
```

## 🔍 Monitoring and Health Checks

### Agent Health Monitoring
```bash
# Check agent status
docker-compose ps
docker-compose logs livekit-agent

# Test agent functionality
docker exec medical-consultation-agent python test_agent.py
```

### Application Monitoring
```bash
# Frontend health check
curl https://your-domain.com/api/health

# API endpoints
curl https://your-domain.com/api/livekit/token
```

## 🐛 Troubleshooting

### Common Issues

**Agent not connecting:**
```bash
# Check agent logs
docker-compose logs livekit-agent

# Verify environment variables
docker exec medical-consultation-agent env | grep LIVEKIT

# Test agent locally
cd agent && python test_agent.py
```

**Voice not working:**
- Check microphone permissions in browser
- Verify Deepgram and Cartesia API keys
- Check browser console for errors

**Frontend errors:**
```bash
# Check if all services are running
docker-compose ps
yarn dev
```

### Debug Mode
```bash
# Enable debug logging
LOG_LEVEL=DEBUG docker-compose up
NODE_ENV=development DEBUG=* yarn dev
```

## 📖 Documentation

- **[Requirements](/.kiro/specs/medibot-virtual-assistant/requirements.md)**: Detailed functional and non-functional requirements
- **[Design](/.kiro/specs/medibot-virtual-assistant/design.md)**: System architecture and technical specifications
- **[Implementation Plan](/.kiro/specs/medibot-virtual-assistant/tasks.md)**: Step-by-step development tasks
- **[LiveKit Integration Diagnosis](management/LIVEKIT_INTEGRATION_DIAGNOSIS.md)**: Troubleshooting guide for LiveKit integration
- **[Quick Start LiveKit](agent/QUICK_START_LIVEKIT.md)**: Quick setup guide for the Python agent

## 🔒 Security & Compliance

- HIPAA-compliant data encryption at rest and in transit
- Role-based access control with JWT authentication
- Comprehensive audit logging
- Input validation and sanitization
- Secure API endpoints with rate limiting

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run integration tests
npm run test:integration

# Run end-to-end tests
npm run test:e2e

# Run security tests
npm run test:security
```

## 📦 Deployment

The application can be deployed to any Node.js hosting platform:

```bash
# Build for production
yarn build

# Start production server
yarn start
```

### Vercel Deployment
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in this repository
- Review the documentation in the `.kiro/specs/` directory
- Check the implementation tasks for development guidance

## 🏗 Development Status

This project is currently in active development with the following completed features:

### ✅ Completed
- **Core Infrastructure**: Next.js setup with TypeScript and Tailwind CSS
- **Database Layer**: Complete Supabase integration with data models and repositories
- **Authentication**: JWT-based authentication with role-based access control
- **API Services**: Patient and anamnesis management APIs
- **LiveKit Agent**: Python-based voice agent with Docker deployment
- **Frontend Interfaces**: Patient consultation and doctor dashboard interfaces
- **Voice Processing**: Real-time voice interaction with STT/LLM/TTS pipeline

### 🔄 In Progress
- **LiveKit Integration**: Real-time voice consultation flow
- **Medical Analysis**: AI-powered symptom analysis and recommendations

### 📋 Planned
- **Advanced Medical Features**: Prescription generation and medical history tracking
- **Multi-language Support**: Additional language support for the agent
- **Mobile Optimization**: Responsive design for mobile devices

See the [tasks.md](/.kiro/specs/medibot-virtual-assistant/tasks.md) file for the complete implementation roadmap.

---

**Note**: This is a medical application. Ensure compliance with local healthcare regulations and data protection laws before deployment in production environments.