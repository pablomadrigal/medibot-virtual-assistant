import { RBACService, ROLE_PERMISSIONS } from '../rbac';

describe('RBACService', () => {
    describe('hasPermission', () => {
        it('should return true for patient with patient:read permission', () => {
            const result = RBACService.hasPermission('patient', 'patient:read');
            expect(result).toBe(true);
        });

        it('should return false for patient with consultation:review permission', () => {
            const result = RBACService.hasPermission('patient', 'consultation:review');
            expect(result).toBe(false);
        });

        it('should return true for doctor with consultation:review permission', () => {
            const result = RBACService.hasPermission('doctor', 'consultation:review');
            expect(result).toBe(true);
        });

        it('should return true for admin with system:admin permission', () => {
            const result = RBACService.hasPermission('admin', 'system:admin');
            expect(result).toBe(true);
        });

        it('should return false for invalid role', () => {
            const result = RBACService.hasPermission('invalid' as any, 'patient:read');
            expect(result).toBe(false);
        });
    });

    describe('hasAnyPermission', () => {
        it('should return true if user has at least one permission', () => {
            const permissions = ['patient:read', 'consultation:review'] as any[];
            const result = RBACService.hasAnyPermission('patient', permissions);
            expect(result).toBe(true); // patient has patient:read
        });

        it('should return false if user has none of the permissions', () => {
            const permissions = ['consultation:review', 'system:admin'] as any[];
            const result = RBACService.hasAnyPermission('patient', permissions);
            expect(result).toBe(false);
        });
    });

    describe('hasAllPermissions', () => {
        it('should return true if user has all permissions', () => {
            const permissions = ['patient:read', 'patient:write'] as any[];
            const result = RBACService.hasAllPermissions('patient', permissions);
            expect(result).toBe(true);
        });

        it('should return false if user is missing any permission', () => {
            const permissions = ['patient:read', 'consultation:review'] as any[];
            const result = RBACService.hasAllPermissions('patient', permissions);
            expect(result).toBe(false); // patient doesn't have consultation:review
        });
    });

    describe('getRolePermissions', () => {
        it('should return correct permissions for patient role', () => {
            const permissions = RBACService.getRolePermissions('patient');
            expect(permissions).toEqual(ROLE_PERMISSIONS.patient);
        });

        it('should return correct permissions for doctor role', () => {
            const permissions = RBACService.getRolePermissions('doctor');
            expect(permissions).toEqual(ROLE_PERMISSIONS.doctor);
        });

        it('should return empty array for invalid role', () => {
            const permissions = RBACService.getRolePermissions('invalid' as any);
            expect(permissions).toEqual([]);
        });
    });

    describe('canAccessPatientData', () => {
        it('should allow patient to access their own data', () => {
            const result = RBACService.canAccessPatientData('patient', 'user-123', 'user-123');
            expect(result).toBe(true);
        });

        it('should deny patient access to other patient data', () => {
            const result = RBACService.canAccessPatientData('patient', 'user-123', 'user-456');
            expect(result).toBe(false);
        });

        it('should allow doctor to access any patient data', () => {
            const result = RBACService.canAccessPatientData('doctor', 'doctor-123', 'patient-456');
            expect(result).toBe(true);
        });

        it('should allow admin to access any patient data', () => {
            const result = RBACService.canAccessPatientData('admin', 'admin-123', 'patient-456');
            expect(result).toBe(true);
        });
    });

    describe('canModifyPatientData', () => {
        it('should allow patient to modify their own data', () => {
            const result = RBACService.canModifyPatientData('patient', 'user-123', 'user-123');
            expect(result).toBe(true);
        });

        it('should deny patient modification of other patient data', () => {
            const result = RBACService.canModifyPatientData('patient', 'user-123', 'user-456');
            expect(result).toBe(false);
        });

        it('should allow doctor to modify any patient data', () => {
            const result = RBACService.canModifyPatientData('doctor', 'doctor-123', 'patient-456');
            expect(result).toBe(true);
        });
    });

    describe('canReviewConsultation', () => {
        it('should deny patient consultation review', () => {
            const result = RBACService.canReviewConsultation('patient');
            expect(result).toBe(false);
        });

        it('should allow doctor consultation review', () => {
            const result = RBACService.canReviewConsultation('doctor');
            expect(result).toBe(true);
        });

        it('should allow admin consultation review', () => {
            const result = RBACService.canReviewConsultation('admin');
            expect(result).toBe(true);
        });
    });

    describe('canStartConversation', () => {
        it('should allow patient to start conversation', () => {
            const result = RBACService.canStartConversation('patient');
            expect(result).toBe(true);
        });

        it('should deny doctor starting conversation', () => {
            const result = RBACService.canStartConversation('doctor');
            expect(result).toBe(false);
        });

        it('should allow admin to start conversation', () => {
            const result = RBACService.canStartConversation('admin');
            expect(result).toBe(true);
        });
    });

    describe('isValidRole', () => {
        it('should return true for valid roles', () => {
            expect(RBACService.isValidRole('patient')).toBe(true);
            expect(RBACService.isValidRole('doctor')).toBe(true);
            expect(RBACService.isValidRole('admin')).toBe(true);
        });

        it('should return false for invalid roles', () => {
            expect(RBACService.isValidRole('invalid')).toBe(false);
            expect(RBACService.isValidRole('')).toBe(false);
            expect(RBACService.isValidRole('PATIENT')).toBe(false);
        });
    });

    describe('ROLE_PERMISSIONS configuration', () => {
        it('should have all required roles defined', () => {
            expect(ROLE_PERMISSIONS).toHaveProperty('patient');
            expect(ROLE_PERMISSIONS).toHaveProperty('doctor');
            expect(ROLE_PERMISSIONS).toHaveProperty('admin');
        });

        it('should have patient permissions as subset of doctor permissions', () => {
            const patientPerms = ROLE_PERMISSIONS.patient;
            const doctorPerms = ROLE_PERMISSIONS.doctor;

            // Check that patients can read their own data
            expect(patientPerms).toContain('patient:read');
            expect(patientPerms).toContain('patient:write');

            // Check that doctors have broader access
            expect(doctorPerms).toContain('patient:read');
            expect(doctorPerms).toContain('consultation:review');
        });

        it('should have admin with all permissions', () => {
            const adminPerms = ROLE_PERMISSIONS.admin;

            expect(adminPerms).toContain('system:admin');
            expect(adminPerms).toContain('patient:delete');
            expect(adminPerms).toContain('anamnesis:delete');
        });
    });
});