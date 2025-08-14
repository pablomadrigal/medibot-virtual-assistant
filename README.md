# MediBot - AI-Powered Pre-consultation Virtual Assistant

MediBot is an AI-powered virtual assistant designed to streamline the patient intake process in medical clinics and offices. The system automates initial data collection through a structured three-phase dialogue, allowing medical staff to focus on clinical care while ensuring patients can efficiently provide their information before appointments.

## 🏥 Overview

MediBot consists of three main components:
- **Conversational AI Agent**: Handles patient interactions through a structured dialogue
- **Backend API System**: Manages data storage, processing, and AI analysis
- **Doctor Interface**: Provides consultation management for medical professionals

## 🚀 Features

- **Structured Patient Intake**: Three-phase conversation flow (greeting, anamnesis, closure)
- **AI-Powered Analysis**: Automatic symptom analysis and preliminary recommendations
- **Doctor Dashboard**: Comprehensive consultation review and patient management
- **HIPAA Compliant**: Secure data handling with encryption and audit logging
- **Accessible Design**: WCAG 2.1 AA compliant interfaces
- **Simple Development**: Direct Node.js setup with hot reloading

## 📋 Project Structure

```
.kiro/specs/medibot-virtual-assistant/
├── requirements.md    # Detailed requirements in EARS format
├── design.md         # System architecture and technical design
└── tasks.md          # Implementation plan with actionable tasks
```

## 🛠 Technology Stack

**Frontend:**
- React.js with TypeScript
- Material-UI for medical-grade components
- WebSocket for real-time chat

**Backend:**
- Node.js with Express.js
- PostgreSQL for data storage
- Redis for session management
- JWT authentication

**AI Integration:**
- Open-source conversational AI (Rasa/Botpress)
- Natural Language Processing for medical data extraction

**Infrastructure:**
- Supabase cloud database
- HIPAA-compliant security measures

## 🏃‍♂️ Getting Started

### Prerequisites
- Node.js 18+
- Yarn package manager
- Git

### Development Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd AngularHelper
```

2. Install dependencies:
```bash
yarn install
```

3. Set up environment variables:
```bash
cp env.example .env
# Edit .env with your Supabase and OpenAI credentials
```

4. Start the development server:
```bash
yarn dev
```

5. Access the application:
- Main Application: http://localhost:3000
- API Endpoints: http://localhost:3000/api/*

## 📖 Documentation

- **[Requirements](/.kiro/specs/medibot-virtual-assistant/requirements.md)**: Detailed functional and non-functional requirements
- **[Design](/.kiro/specs/medibot-virtual-assistant/design.md)**: System architecture and technical specifications
- **[Implementation Plan](/.kiro/specs/medibot-virtual-assistant/tasks.md)**: Step-by-step development tasks

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

This project is currently in the specification phase. See the [tasks.md](/.kiro/specs/medibot-virtual-assistant/tasks.md) file for the complete implementation roadmap.

---

**Note**: This is a medical application. Ensure compliance with local healthcare regulations and data protection laws before deployment in production environments.