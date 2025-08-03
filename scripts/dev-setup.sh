#!/bin/bash

# MediBot Development Setup Script

echo "🏥 Setting up MediBot development environment..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Initialize Next.js app if package.json doesn't exist
if [ ! -f package.json ]; then
    echo "🚀 Initializing Next.js application with Yarn..."
    chmod +x scripts/init-nextjs.sh
    ./scripts/init-nextjs.sh
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "✅ .env file created. Please update it with your configuration."
fi

# Build and start development containers
echo "🐳 Building and starting Docker containers..."
docker-compose down
docker-compose build
docker-compose up -d

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 10

# Check if containers are running
echo "🔍 Checking container status..."
docker-compose ps

echo ""
echo "🎉 MediBot development environment is ready!"
echo ""
echo "📋 Available services:"
echo "  - MediBot App (Frontend + Backend): http://localhost:3000"
echo "  - PostgreSQL Database: localhost:5432"
echo "  - Redis Cache: localhost:6379"
echo ""
echo "📚 Useful commands:"
echo "  - View app logs: docker-compose logs -f app"
echo "  - Stop services: docker-compose down"
echo "  - Restart services: docker-compose restart"
echo "  - Access database: docker-compose exec postgres psql -U medibot_user -d medibot"
echo "  - Run without Docker: yarn dev (after setting up local DB)"
echo ""