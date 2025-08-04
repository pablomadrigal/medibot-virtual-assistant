const nextJest = require('next/jest')

// Create Jest config with Next.js
const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/__tests__/**/*.test.tsx'
  ],
  testPathIgnorePatterns: [
    '<rootDir>/.next/', 
    '<rootDir>/node_modules/',
    // Skip API route tests in CI since they need Next.js environment
    ...(process.env.CI ? ['<rootDir>/src/app/api/'] : [])
  ],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
  ],
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  // Reduce workers in CI for stability
  ...(process.env.CI && { maxWorkers: 1 }),
  // Disable coverage collection in CI to avoid SWC issues
  collectCoverage: !process.env.CI,
}

module.exports = createJestConfig(customJestConfig)
