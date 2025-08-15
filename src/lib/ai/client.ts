import OpenAI from 'openai';
import { isOpenAIConfigured } from './utils';

// Validate OpenAI API key
const openaiApiKey = process.env.OPENAI_API_KEY;

// Initialize OpenAI client (only if API key is available)
export const openai = openaiApiKey ? new OpenAI({
  apiKey: openaiApiKey,
  ...process.env.NODE_ENV === 'test' && { dangerouslyAllowBrowser: true },
}) : null;

// Log configuration status
if (!openaiApiKey) {
  console.warn('⚠️  OPENAI_API_KEY is not configured. AI features will be disabled.');
}

// AI model configuration
export const AI_CONFIG = {
  model: 'gpt-4' as const,
  temperature: 0.7,
  maxTokens: 2000,
  topP: 0.9,
  frequencyPenalty: 0.1,
  presencePenalty: 0.1,
};

// Rate limiting configuration
export const RATE_LIMIT_CONFIG = {
  maxRequestsPerMinute: 10,
  maxRequestsPerHour: 100,
}; 