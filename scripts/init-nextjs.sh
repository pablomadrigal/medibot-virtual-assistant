#!/bin/bash

# MediBot Next.js Initialization Script

echo "🏥 Initializing MediBot Next.js application..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check if yarn is installed
if ! command -v yarn &> /dev/null; then
    echo "❌ Yarn is not installed. Please install Yarn first."
    exit 1
fi

# Initialize Next.js app with TypeScript and Tailwind
echo "📦 Creating Next.js app with TypeScript and Tailwind CSS..."
yarn create next-app . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"

# Install additional dependencies for MediBot
echo "📦 Installing additional dependencies..."
yarn add \
  next-auth \
  jsonwebtoken @types/jsonwebtoken \
  bcryptjs @types/bcryptjs \
  pg @types/pg \
  redis \
  zod \
  react-hook-form @hookform/resolvers \
  lucide-react \
  clsx class-variance-authority tailwind-merge \
  @radix-ui/react-dialog \
  @radix-ui/react-dropdown-menu \
  @radix-ui/react-toast \
  @radix-ui/react-tabs \
  date-fns \
  socket.io socket.io-client

# Install dev dependencies
echo "📦 Installing development dependencies..."
yarn add -D \
  @typescript-eslint/eslint-plugin \
  @typescript-eslint/parser \
  prettier prettier-plugin-tailwindcss \
  jest @testing-library/react @testing-library/jest-dom \
  jest-environment-jsdom

# Create additional configuration files
echo "⚙️ Creating configuration files..."

# Update next.config.js for production builds
cat > next.config.js << 'EOF'
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  images: {
    domains: ['localhost'],
  },
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
    REDIS_URL: process.env.REDIS_URL,
    JWT_SECRET: process.env.JWT_SECRET,
    AI_SERVICE_API_KEY: process.env.AI_SERVICE_API_KEY,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  },
}

module.exports = nextConfig
EOF

# Update tailwind.config.js with medical theme
cat > tailwind.config.js << 'EOF'
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        medical: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        success: {
          50: '#f0fdf4',
          500: '#22c55e',
          600: '#16a34a',
        },
        warning: {
          50: '#fffbeb',
          500: '#f59e0b',
          600: '#d97706',
        },
        danger: {
          50: '#fef2f2',
          500: '#ef4444',
          600: '#dc2626',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}
EOF

# Create prettier config
cat > .prettierrc << 'EOF'
{
  "semi": false,
  "trailingComma": "es5",
  "singleQuote": true,
  "tabWidth": 2,
  "useTabs": false,
  "plugins": ["prettier-plugin-tailwindcss"]
}
EOF

# Create jest config
cat > jest.config.js << 'EOF'
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testEnvironment: 'jest-environment-jsdom',
}

module.exports = createJestConfig(customJestConfig)
EOF

# Create jest setup
cat > jest.setup.js << 'EOF'
import '@testing-library/jest-dom'
EOF

# Create basic API structure
echo "📁 Creating API structure..."
mkdir -p src/app/api/{auth,patients,anamnesis,conversations,health}

# Create health check endpoint
cat > src/app/api/health/route.ts << 'EOF'
import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'MediBot API'
  })
}
EOF

# Create lib directory structure
echo "📁 Creating lib structure..."
mkdir -p src/lib/{auth,database,redis,ai,utils}

# Create types directory
echo "📁 Creating types structure..."
mkdir -p src/types

# Create shared types file
cat > src/types/index.ts << 'EOF'
// Shared TypeScript interfaces for MediBot application

export interface Patient {
  id: string;
  name: string;
  dateOfBirth: string;
  createdAt: Date;
  updatedAt: Date;
  encryptedData?: any;
}

export interface Anamnesis {
  id: string;
  patientId: string;
  reasonForVisit: string;
  symptoms: string;
  duration: string;
  aiSummary?: string;
  aiRecommendations?: string[];
  createdAt: Date;
}

export interface Consultation {
  id: string;
  patientId: string;
  anamnesisId: string;
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  doctorNotes?: string;
  reviewedAt?: Date;
  createdAt: Date;
}

export interface ConversationState {
  sessionId: string;
  currentPhase: 'greeting' | 'anamnesis' | 'closure';
  collectedData: {
    name?: string;
    dateOfBirth?: string;
    reasonForVisit?: string;
    symptoms?: string;
    duration?: string;
  };
  attemptCount: number;
  lastMessage: string;
  isComplete: boolean;
}
EOF

echo ""
echo "✅ Next.js application initialized successfully!"
echo ""
echo "📋 What was created:"
echo "  - Next.js 14 with TypeScript and App Router"
echo "  - Tailwind CSS with medical theme"
echo "  - ESLint and Prettier configuration"
echo "  - Jest testing setup"
echo "  - Basic API structure"
echo "  - Shared types and utilities"
echo ""
echo "🚀 Next steps:"
echo "  1. Run 'yarn dev' to start development server"
echo "  2. Run 'docker-compose up -d' to start with database"
echo ""