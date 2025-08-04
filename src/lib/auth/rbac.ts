// Role-Based Access Control (RBAC) system for MediBot

export type UserRole = 'patient' | 'doctor' | 'admin';

export type Permission = 
  | 'patient:read'
  | 'patient:write'
  | 'patient:delete'
  | 'anamnesis:read'
  | 'anamnesis:write'
  | 'anamnesis:delete'
  | 'consultation:read'
  | 'consultation:write'
  | 'consultation:review'
  | 'conversation:start'
  | 'conversation:participate'
  | 'system:admin'
  | 'audit:read';

export interface RolePermissions {
  [key: string]: Permission[];
}

// Define permissions for each role
export const ROLE_PERMISSIONS: RolePermissions = {
  patient: [
    'patient:read',
    'patient:write',
    'anamnesis:write',
    'conversation:start',
    'conversation:participate'
  ],
  doctor: [
    'patient:read',
    'patient:write',
    'anamnesis:read',
    'anamnesis:write',
    'consultation:read',
    'consultation:write',
    'consultation:review',
    'audit:read'
  ],
  admin: [
    'patient:read',
    'patient:write',
    'patient:delete',
    'anamnesis:read',
    'anamnesis:write',
    'anamnesis:delete',
    'consultation:read',
    'consultation:write',
    'consultation:review',
    'conversation:start',
    'conversation:participate',
    'system:admin',
    'audit:read'
  ]
};

export class RBACService {
  /**
   * Check if a role has a specific permission
   */
  static hasPermission(role: UserRole, permission: Permission): boolean {
    const rolePermissions = ROLE_PERMISSIONS[role];
    return rolePermissions ? rolePermissions.includes(permission) : false;
  }

  /**
   * Check if a role has any of the specified permissions
   */
  static hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
    return permissions.some(permission => this.hasPermission(role, permission));
  }

  /**
   * Check if a role has all of the specified permissions
   */
  static hasAllPermissions(role: UserRole, permissions: Permission[]): boolean {
    return permissions.every(permission => this.hasPermission(role, permission));
  }

  /**
   * Get all permissions for a role
   */
  static getRolePermissions(role: UserRole): Permission[] {
    return ROLE_PERMISSIONS[role] || [];
  }

  /**
   * Check if user can access patient data (own data or doctor/admin)
   */
  static canAccessPatientData(userRole: UserRole, userId: string, patientId: string): boolean {
    // Patients can only access their own data
    if (userRole === 'patient') {
      return userId === patientId;
    }
    
    // Doctors and admins can access any patient data
    return userRole === 'doctor' || userRole === 'admin';
  }

  /**
   * Check if user can modify patient data
   */
  static canModifyPatientData(userRole: UserRole, userId: string, patientId: string): boolean {
    // Only allow modification if user has write permission and can access the data
    return this.hasPermission(userRole, 'patient:write') && 
           this.canAccessPatientData(userRole, userId, patientId);
  }

  /**
   * Check if user can review consultations
   */
  static canReviewConsultation(userRole: UserRole): boolean {
    return this.hasPermission(userRole, 'consultation:review');
  }

  /**
   * Check if user can start conversations
   */
  static canStartConversation(userRole: UserRole): boolean {
    return this.hasPermission(userRole, 'conversation:start');
  }

  /**
   * Validate role string
   */
  static isValidRole(role: string): role is UserRole {
    return ['patient', 'doctor', 'admin'].includes(role);
  }
}