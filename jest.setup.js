import '@testing-library/jest-dom'

// Mock environment variables for tests
process.env.DB_HOST = 'localhost'
process.env.DB_PORT = '5432'
process.env.DB_NAME = 'medibot_test'
process.env.DB_USER = 'medibot_user'
process.env.DB_PASSWORD = 'medibot_password'
process.env.ENCRYPTION_KEY = 'test-32-character-secret-key-here'