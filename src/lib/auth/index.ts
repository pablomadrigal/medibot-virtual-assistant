// Authentication module exports

import { JWTService, type JWTPayload, type AuthTokens } from './jwt';
import {
  RBACService,
  ROLE_PERMISSIONS,
  type UserRole,
  type Permission,
  type RolePermissions
} from './rbac';
import {
  withAuth,
  withPatientAuth,
  withDoctorAuth,
  withAdminAuth,
  withConversationAuth,
  withRateLimit,
  type AuthenticatedRequest,
  type AuthMiddlewareOptions
} from './middleware';
import { authConfig, serviceConfig, validateAuthConfig, type AuthConfig } from './config';

// Re-export everything
export { JWTService, type JWTPayload, type AuthTokens };
export {
  RBACService,
  ROLE_PERMISSIONS,
  type UserRole,
  type Permission,
  type RolePermissions
};
export {
  withAuth,
  withPatientAuth,
  withDoctorAuth,
  withAdminAuth,
  withConversationAuth,
  withRateLimit,
  type AuthenticatedRequest,
  type AuthMiddlewareOptions
};
export { authConfig, serviceConfig, validateAuthConfig, type AuthConfig };

// Default export for convenience
const authModule = {
  JWTService,
  RBACService,
  authConfig
};

export default authModule;