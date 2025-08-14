import '@testing-library/jest-dom';
import 'whatwg-fetch';

// Jest setup file - Set up environment variables for tests
process.env.NODE_ENV = 'test'
process.env.JWT_SECRET = 'test-jwt-secret'
process.env.ENCRYPTION_KEY = 'test-32-character-secret-key-here'

// Polyfill Web APIs for Next.js API route tests
const { TextEncoder, TextDecoder } = require('util')

global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder
global.ReadableStream = require('web-streams-polyfill').ReadableStream

const crypto = require('crypto')

Object.defineProperty(global.self, 'crypto', {
  value: {
    ...crypto,
    subtle: {
      digest: (algorithm, data) => {
        const hash = crypto.createHash(algorithm.toLowerCase().replace('-', ''))
        hash.update(data)
        return Promise.resolve(hash.digest())
      },
    },
    randomUUID: () => '123e4567-e89b-12d3-a456-426614174000',
    createCipheriv: crypto.createCipheriv,
    createDecipheriv: crypto.createDecipheriv,
  },
})
