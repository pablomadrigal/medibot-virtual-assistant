import '@testing-library/jest-dom'

// Jest setup file - Set up environment variables for tests
process.env.NODE_ENV = 'test'
process.env.JWT_SECRET = 'test-jwt-secret'
process.env.ENCRYPTION_KEY = 'test-32-character-secret-key-here'

// Database environment variables for tests
process.env.DB_HOST = 'localhost'
process.env.DB_PORT = '5432'
process.env.DB_NAME = 'medibot_test'
process.env.DB_USER = 'medibot_user'
process.env.DB_PASSWORD = 'medibot_password'
