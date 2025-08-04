import { NextRequest, NextResponse } from 'next/server'
import { APIError } from '@/types'

// Error response helper
export function createErrorResponse(
  code: string,
  message: string,
  status: number = 500,
  details?: any
): NextResponse {
  const error: APIError = {
    error: {
      code,
      message,
      details,
      timestamp: new Date().toISOString()
    }
  }
  
  return NextResponse.json(error, { status })
}

// Success response helper
export function createSuccessResponse(
  data: any,
  status: number = 200,
  message?: string
): NextResponse {
  const response = {
    success: true,
    data,
    ...(message && { message })
  }
  
  return NextResponse.json(response, { status })
}

// Request validation middleware
export function validateContentType(request: NextRequest): boolean {
  const contentType = request.headers.get('content-type')
  return contentType?.includes('application/json') ?? false
}

// UUID validation helper
export function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(id)
}

// Async error handler wrapper
export function withErrorHandler(
  handler: (request: NextRequest, ...args: any[]) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: any[]): Promise<NextResponse> => {
    try {
      return await handler(request, ...args)
    } catch (error) {
      console.error('API Error:', error)
      
      if (error instanceof SyntaxError) {
        return createErrorResponse(
          'INVALID_JSON',
          'Invalid JSON in request body',
          400
        )
      }
      
      return createErrorResponse(
        'INTERNAL_ERROR',
        'An unexpected error occurred',
        500
      )
    }
  }
}

// Rate limiting helper (basic implementation)
const requestCounts = new Map<string, { count: number; resetTime: number }>()

export function checkRateLimit(
  clientId: string,
  maxRequests: number = 100,
  windowMs: number = 60000
): boolean {
  const now = Date.now()
  const clientData = requestCounts.get(clientId)
  
  if (!clientData || now > clientData.resetTime) {
    requestCounts.set(clientId, { count: 1, resetTime: now + windowMs })
    return true
  }
  
  if (clientData.count >= maxRequests) {
    return false
  }
  
  clientData.count++
  return true
}

// CORS headers helper
export function addCorsHeaders(response: NextResponse): NextResponse {
  response.headers.set('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGINS || '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  response.headers.set('Access-Control-Max-Age', '86400')
  
  return response
}