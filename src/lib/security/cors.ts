import { NextRequest, NextResponse } from 'next/server';

export interface CORSOptions {
  origin?: string | string[] | boolean;
  methods?: string[];
  allowedHeaders?: string[];
  exposedHeaders?: string[];
  credentials?: boolean;
  maxAge?: number;
  preflightContinue?: boolean;
  optionsSuccessStatus?: number;
}

// Default CORS configuration for Docker environment
const defaultCORSOptions: CORSOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.ALLOWED_ORIGINS?.split(',') || false
    : true, // Allow all origins in development
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'X-Session-ID',
    'X-Request-ID'
  ],
  exposedHeaders: [
    'X-Total-Count',
    'X-Page-Count',
    'X-Rate-Limit-Remaining',
    'X-Rate-Limit-Reset'
  ],
  credentials: true,
  maxAge: 86400, // 24 hours
  optionsSuccessStatus: 200
};

export class CORSService {
  /**
   * Apply CORS headers to response
   */
  static applyCORS(
    request: NextRequest, 
    response: NextResponse, 
    options: CORSOptions = defaultCORSOptions
  ): NextResponse {
    const origin = request.headers.get('origin');
    const requestMethod = request.method;

    // Handle origin
    if (options.origin === true) {
      response.headers.set('Access-Control-Allow-Origin', origin || '*');
    } else if (typeof options.origin === 'string') {
      response.headers.set('Access-Control-Allow-Origin', options.origin);
    } else if (Array.isArray(options.origin)) {
      if (origin && options.origin.includes(origin)) {
        response.headers.set('Access-Control-Allow-Origin', origin);
      }
    }

    // Handle credentials
    if (options.credentials) {
      response.headers.set('Access-Control-Allow-Credentials', 'true');
    }

    // Handle methods
    if (options.methods) {
      response.headers.set('Access-Control-Allow-Methods', options.methods.join(', '));
    }

    // Handle allowed headers
    if (options.allowedHeaders) {
      response.headers.set('Access-Control-Allow-Headers', options.allowedHeaders.join(', '));
    }

    // Handle exposed headers
    if (options.exposedHeaders) {
      response.headers.set('Access-Control-Expose-Headers', options.exposedHeaders.join(', '));
    }

    // Handle max age for preflight requests
    if (requestMethod === 'OPTIONS' && options.maxAge) {
      response.headers.set('Access-Control-Max-Age', options.maxAge.toString());
    }

    return response;
  }

  /**
   * Handle preflight OPTIONS request
   */
  static handlePreflight(request: NextRequest, options: CORSOptions = defaultCORSOptions): NextResponse {
    const response = new NextResponse(null, { 
      status: options.optionsSuccessStatus || 200 
    });
    
    return this.applyCORS(request, response, options);
  }

  /**
   * CORS middleware for API routes
   */
  static middleware(options: CORSOptions = defaultCORSOptions) {
    return (handler: (req: NextRequest) => Promise<NextResponse>) => {
      return async (request: NextRequest): Promise<NextResponse> => {
        // Handle preflight requests
        if (request.method === 'OPTIONS') {
          return this.handlePreflight(request, options);
        }

        // Process the actual request
        const response = await handler(request);
        
        // Apply CORS headers to the response
        return this.applyCORS(request, response, options);
      };
    };
  }
}

// Security headers configuration
export interface SecurityHeadersOptions {
  contentSecurityPolicy?: string;
  strictTransportSecurity?: string;
  xFrameOptions?: string;
  xContentTypeOptions?: string;
  referrerPolicy?: string;
  permissionsPolicy?: string;
}

const defaultSecurityHeaders: SecurityHeadersOptions = {
  contentSecurityPolicy: process.env.NODE_ENV === 'production'
    ? "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' ws: wss:; frame-ancestors 'none';"
    : "default-src 'self' 'unsafe-inline' 'unsafe-eval'; connect-src 'self' ws: wss: http: https:;",
  strictTransportSecurity: 'max-age=31536000; includeSubDomains; preload',
  xFrameOptions: 'DENY',
  xContentTypeOptions: 'nosniff',
  referrerPolicy: 'strict-origin-when-cross-origin',
  permissionsPolicy: 'camera=(), microphone=(), geolocation=(), payment=()'
};

export class SecurityHeadersService {
  /**
   * Apply security headers to response
   */
  static applySecurityHeaders(
    response: NextResponse,
    options: SecurityHeadersOptions = defaultSecurityHeaders
  ): NextResponse {
    // Content Security Policy
    if (options.contentSecurityPolicy) {
      response.headers.set('Content-Security-Policy', options.contentSecurityPolicy);
    }

    // Strict Transport Security (HTTPS only)
    if (options.strictTransportSecurity && process.env.NODE_ENV === 'production') {
      response.headers.set('Strict-Transport-Security', options.strictTransportSecurity);
    }

    // X-Frame-Options
    if (options.xFrameOptions) {
      response.headers.set('X-Frame-Options', options.xFrameOptions);
    }

    // X-Content-Type-Options
    if (options.xContentTypeOptions) {
      response.headers.set('X-Content-Type-Options', options.xContentTypeOptions);
    }

    // Referrer Policy
    if (options.referrerPolicy) {
      response.headers.set('Referrer-Policy', options.referrerPolicy);
    }

    // Permissions Policy
    if (options.permissionsPolicy) {
      response.headers.set('Permissions-Policy', options.permissionsPolicy);
    }

    // Additional security headers
    response.headers.set('X-DNS-Prefetch-Control', 'off');
    response.headers.set('X-Download-Options', 'noopen');
    response.headers.set('X-Permitted-Cross-Domain-Policies', 'none');

    return response;
  }

  /**
   * Security headers middleware
   */
  static middleware(options: SecurityHeadersOptions = defaultSecurityHeaders) {
    return (handler: (req: NextRequest) => Promise<NextResponse>) => {
      return async (request: NextRequest): Promise<NextResponse> => {
        const response = await handler(request);
        return this.applySecurityHeaders(response, options);
      };
    };
  }
}

// Combined security middleware (CORS + Security Headers)
export function withSecurity(
  handler: (req: NextRequest) => Promise<NextResponse>,
  corsOptions: CORSOptions = defaultCORSOptions,
  securityOptions: SecurityHeadersOptions = defaultSecurityHeaders
) {
  return CORSService.middleware(corsOptions)(
    SecurityHeadersService.middleware(securityOptions)(handler)
  );
}