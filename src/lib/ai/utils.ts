import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { openai, AI_CONFIG, RATE_LIMIT_CONFIG } from './client';
import { AIResponseSchema, AIErrorResponseSchema, RateLimitErrorSchema, type AIErrorResponse } from './validation';

// Simple in-memory rate limiting
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export class RateLimiter {
  static checkRateLimit(identifier: string): { allowed: boolean; retryAfter?: number } {
    const now = Date.now();
    const key = identifier;
    const current = requestCounts.get(key);

    if (!current || now > current.resetTime) {
      // Reset counter
      requestCounts.set(key, { count: 1, resetTime: now + 60000 }); // 1 minute
      return { allowed: true };
    }

    if (current.count >= RATE_LIMIT_CONFIG.maxRequestsPerMinute) {
      return { allowed: false, retryAfter: Math.ceil((current.resetTime - now) / 1000) };
    }

    current.count++;
    return { allowed: true };
  }
}

export class AIErrorHandler {
  static handleOpenAIError(error: any): AIErrorResponse {
    if (error.code === 'rate_limit_exceeded') {
      return {
        success: false,
        error: 'AI service rate limit exceeded',
        code: 'RATE_LIMIT',
        timestamp: new Date().toISOString(),
      };
    }

    if (error.code === 'insufficient_quota') {
      return {
        success: false,
        error: 'AI service quota exceeded',
        code: 'QUOTA_EXCEEDED',
        timestamp: new Date().toISOString(),
      };
    }

    return {
      success: false,
      error: 'AI service temporarily unavailable',
      code: 'SERVICE_ERROR',
      timestamp: new Date().toISOString(),
    };
  }

  static handleValidationError(error: any): AIErrorResponse {
    return {
      success: false,
      error: 'Invalid request data',
      code: 'VALIDATION_ERROR',
      timestamp: new Date().toISOString(),
    };
  }
}

export class AIResponseFormatter {
  static formatSuccessResponse(data: any, disclaimer?: string): any {
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
      requestId: generateRequestId(),
      disclaimer: disclaimer || 'This AI-generated content is for informational purposes only and should not replace professional medical advice.',
    };
  }

  static formatErrorResponse(error: string, code?: string): AIErrorResponse {
    return {
      success: false,
      error,
      code,
      timestamp: new Date().toISOString(),
      requestId: generateRequestId(),
    };
  }
}

export class AISafetyChecker {
  static checkMedicalSafety(content: string): { safe: boolean; warnings: string[] } {
    const warnings: string[] = [];
    const dangerousKeywords = [
      'suicide', 'self-harm', 'overdose', 'illegal drugs',
      'prescription abuse', 'drug trafficking'
    ];

    const lowerContent = content.toLowerCase();
    const foundKeywords = dangerousKeywords.filter(keyword => 
      lowerContent.includes(keyword)
    );

    if (foundKeywords.length > 0) {
      warnings.push(`Content contains potentially concerning keywords: ${foundKeywords.join(', ')}`);
    }

    return {
      safe: warnings.length === 0,
      warnings
    };
  }

  static addMedicalDisclaimer(content: string): string {
    return `${content}\n\nIMPORTANT: This AI-generated content is for informational purposes only and should not replace professional medical advice, diagnosis, or treatment. Always consult with a qualified healthcare provider.`;
  }
}

// Utility functions
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .substring(0, 2000); // Limit length
}

export function extractIdentifier(req: NextRequest): string {
  // Use IP address or user agent as identifier for rate limiting
  const ip = req.headers.get('x-forwarded-for') || 
             req.headers.get('x-real-ip') || 
             'unknown';
  return ip;
}

export async function callOpenAI(prompt: string, systemPrompt?: string): Promise<string> {
  try {
    if (!openai) {
      throw new Error('OpenAI client is not available. Please check your API key configuration.');
    }

    const messages = [
      ...(systemPrompt ? [{ role: 'system' as const, content: systemPrompt }] : []),
      { role: 'user' as const, content: prompt }
    ];

    const completion = await openai.chat.completions.create({
      model: AI_CONFIG.model,
      messages,
      temperature: AI_CONFIG.temperature,
      max_tokens: AI_CONFIG.maxTokens,
      top_p: AI_CONFIG.topP,
      frequency_penalty: AI_CONFIG.frequencyPenalty,
      presence_penalty: AI_CONFIG.presencePenalty,
    });

    return completion.choices[0]?.message?.content || '';
  } catch (error) {
    throw error;
  }
}

/**
 * Initialize OpenAI client only when needed, not at module level
 * This prevents build-time errors when OPENAI_API_KEY is not available
 */
export const getOpenAI = () => {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured');
  }
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
};

/**
 * Check if OpenAI API key is configured
 */
export const isOpenAIConfigured = () => {
  return !!process.env.OPENAI_API_KEY;
}; 