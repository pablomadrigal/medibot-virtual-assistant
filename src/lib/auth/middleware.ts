import { NextRequest, NextResponse } from 'next/server';
import { JWTService, JWTPayload } from './jwt';
import { RBACService, Permission, UserRole } from './rbac';

export interface AuthenticatedRequest extends NextRequest {
  user?: JWTPayload;
}

export interface AuthMiddlewareOptions {
  requiredPermissions?: Permission[];
  requiredRole?: UserRole;
  allowSelfAccess?: boolean; // Allow users to access their own resources
}

/**
 * Authentication middleware for API routes
 */
export function withAuth(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>,
  options: AuthMiddlewareOptions = {}
) {
  return async (req: AuthenticatedRequest): Promise<NextResponse> => {
    try {
      // Extract token from Authorization header
      const authHeader = req.headers.get('authorization');
      const token = JWTService.extractTokenFromHeader(authHeader || undefined);

      if (!token) {
        return NextResponse.json(
          { 
            error: {
              code: 'UNAUTHORIZED',
              message: 'No authentication token provided',
              timestamp: new Date().toISOString()
            }
          },
          { status: 401 }
        );
      }

      // Verify and decode token
      let payload: JWTPayload;
      try {
        payload = JWTService.verifyToken(token);
      } catch (error) {
        return NextResponse.json(
          {
            error: {
              code: 'INVALID_TOKEN',
              message: error instanceof Error ? error.message : 'Token verification failed',
              timestamp: new Date().toISOString()
            }
          },
          { status: 401 }
        );
      }

      // Attach user to request
      req.user = payload;

      // Check role requirement
      if (options.requiredRole && payload.role !== options.requiredRole) {
        return NextResponse.json(
          {
            error: {
              code: 'INSUFFICIENT_PERMISSIONS',
              message: `Required role: ${options.requiredRole}`,
              timestamp: new Date().toISOString()
            }
          },
          { status: 403 }
        );
      }

      // Check permission requirements
      if (options.requiredPermissions && options.requiredPermissions.length > 0) {
        const hasPermissions = RBACService.hasAllPermissions(payload.role, options.requiredPermissions);
        
        if (!hasPermissions) {
          return NextResponse.json(
            {
              error: {
                code: 'INSUFFICIENT_PERMISSIONS',
                message: `Required permissions: ${options.requiredPermissions.join(', ')}`,
                timestamp: new Date().toISOString()
              }
            },
            { status: 403 }
          );
        }
      }

      // Call the actual handler
      return await handler(req);

    } catch (error) {
      console.error('Authentication middleware error:', error);
      return NextResponse.json(
        {
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Authentication failed',
            timestamp: new Date().toISOString()
          }
        },
        { status: 500 }
      );
    }
  };
}

/**
 * Middleware for patient resource access (allows self-access)
 */
export function withPatientAuth(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
) {
  return withAuth(async (req: AuthenticatedRequest) => {
    // Extract patient ID from URL if present
    const url = new URL(req.url);
    const pathSegments = url.pathname.split('/');
    const patientIdIndex = pathSegments.findIndex(segment => segment === 'patients') + 1;
    const patientId = pathSegments[patientIdIndex];

    // Check if user can access this patient's data
    if (patientId && req.user) {
      const canAccess = RBACService.canAccessPatientData(
        req.user.role,
        req.user.userId,
        patientId
      );

      if (!canAccess) {
        return NextResponse.json(
          {
            error: {
              code: 'FORBIDDEN',
              message: 'Access denied to patient data',
              timestamp: new Date().toISOString()
            }
          },
          { status: 403 }
        );
      }
    }

    return await handler(req);
  }, { requiredPermissions: ['patient:read'] });
}

/**
 * Middleware for doctor-only endpoints
 */
export function withDoctorAuth(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
) {
  return withAuth(handler, { requiredRole: 'doctor' });
}

/**
 * Middleware for admin-only endpoints
 */
export function withAdminAuth(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
) {
  return withAuth(handler, { requiredRole: 'admin' });
}

/**
 * Middleware for conversation endpoints
 */
export function withConversationAuth(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
) {
  return withAuth(handler, { requiredPermissions: ['conversation:participate'] });
}

/**
 * Rate limiting middleware (basic implementation)
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function withRateLimit(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>,
  options: { maxRequests: number; windowMs: number } = { maxRequests: 100, windowMs: 60000 }
) {
  return async (req: AuthenticatedRequest): Promise<NextResponse> => {
    const clientId = req.user?.userId || req.ip || 'anonymous';
    const now = Date.now();
    const windowStart = now - options.windowMs;

    // Clean up old entries
    rateLimitMap.forEach((value, key) => {
      if (value.resetTime < now) {
        rateLimitMap.delete(key);
      }
    });

    // Check current rate limit
    const current = rateLimitMap.get(clientId);
    if (current && current.resetTime > now) {
      if (current.count >= options.maxRequests) {
        return NextResponse.json(
          {
            error: {
              code: 'RATE_LIMIT_EXCEEDED',
              message: 'Too many requests',
              timestamp: new Date().toISOString()
            }
          },
          { status: 429 }
        );
      }
      current.count++;
    } else {
      rateLimitMap.set(clientId, {
        count: 1,
        resetTime: now + options.windowMs
      });
    }

    return await handler(req);
  };
}