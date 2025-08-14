#!/bin/bash

# Pre-push script to run the same checks as CI
# This helps catch issues before pushing to GitHub

set -e

echo "🚀 Running pre-push checks..."
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Run this script from the project root."
    exit 1
fi

echo "1️⃣ Running type check..."
npm run type-check
echo "✅ Type check passed"
echo ""

echo "2️⃣ Running linter..."
npm run lint
echo "✅ Linting passed"
echo ""

echo "3️⃣ Running all tests..."
npm test -- --coverage --watchAll=false
echo "✅ All tests passed"
echo ""

echo "4️⃣ Building application..."
npm run build
echo "✅ Build successful"
echo ""

echo "5️⃣ Running security audit..."
npm audit --audit-level=high
echo "✅ Security audit passed"
echo ""

echo "🎉 All pre-push checks passed!"
echo "Your code is ready to be pushed to GitHub."
echo ""
echo "The following will run automatically on GitHub:"
echo "- CI/CD Pipeline with Node.js 18.x and 20.x"
echo "- API Integration Tests with Supabase"
echo "- Security and Performance Checks"
echo "- Branch Protection Validation"