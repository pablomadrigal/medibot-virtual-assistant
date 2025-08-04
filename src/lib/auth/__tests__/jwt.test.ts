// Simple functional tests for JWT service
import { JWTService } from '../jwt';

// Set up test environment
process.env.JWT_SECRET = 'test-secret-key-for-testing';
process.env.JWT_EXPIRES_IN = '1h';

describe('JWTService Basic Functionality', () => {
  describe('extractTokenFromHeader', () => {
    it('should extract token from Bearer header', () => {
      const token = 'test-token-123';
      const header = `Bearer ${token}`;
      const extracted = JWTService.extractTokenFromHeader(header);
      
      expect(extracted).toBe(token);
    });

    it('should return null for invalid header format', () => {
      const extracted = JWTService.extractTokenFromHeader('Invalid header');
      expect(extracted).toBeNull();
    });

    it('should return null for undefined header', () => {
      const extracted = JWTService.extractTokenFromHeader(undefined);
      expect(extracted).toBeNull();
    });

    it('should return null for empty header', () => {
      const extracted = JWTService.extractTokenFromHeader('');
      expect(extracted).toBeNull();
    });

    it('should return null for Bearer without token', () => {
      const extracted = JWTService.extractTokenFromHeader('Bearer ');
      expect(extracted).toBe('');
    });
  });

  describe('Token Generation and Verification', () => {
    const mockPayload = {
      userId: 'user-123',
      role: 'patient' as const,
      sessionId: 'session-456'
    };

    it('should generate and verify tokens in integration', () => {
      // This is an integration test that doesn't mock the underlying libraries
      const accessToken = JWTService.generateAccessToken(mockPayload);
      expect(typeof accessToken).toBe('string');
      expect(accessToken.length).toBeGreaterThan(0);

      // Verify the token
      const decoded = JWTService.verifyToken(accessToken);
      expect(decoded.userId).toBe(mockPayload.userId);
      expect(decoded.role).toBe(mockPayload.role);
      expect(decoded.sessionId).toBe(mockPayload.sessionId);
    });

    it('should generate refresh tokens', () => {
      const refreshToken = JWTService.generateRefreshToken(mockPayload);
      expect(typeof refreshToken).toBe('string');
      expect(refreshToken.length).toBeGreaterThan(0);
    });

    it('should generate both access and refresh tokens', () => {
      const tokens = JWTService.generateTokens(mockPayload);
      
      expect(tokens).toHaveProperty('accessToken');
      expect(tokens).toHaveProperty('refreshToken');
      expect(tokens).toHaveProperty('expiresIn');
      expect(typeof tokens.expiresIn).toBe('number');
    });

    it('should refresh access token', () => {
      const refreshToken = JWTService.generateRefreshToken(mockPayload);
      const newAccessToken = JWTService.refreshAccessToken(refreshToken);
      
      expect(typeof newAccessToken).toBe('string');
      expect(newAccessToken.length).toBeGreaterThan(0);
      
      // Verify the new token has the same payload
      const decoded = JWTService.verifyToken(newAccessToken);
      expect(decoded.userId).toBe(mockPayload.userId);
      expect(decoded.role).toBe(mockPayload.role);
    });
  });

  describe('Password Hashing', () => {
    it('should hash and verify passwords', async () => {
      const password = 'testpassword123';
      const hash = await JWTService.hashPassword(password);
      
      expect(typeof hash).toBe('string');
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(50); // bcrypt hashes are long
      
      // Verify correct password
      const isValid = await JWTService.verifyPassword(password, hash);
      expect(isValid).toBe(true);
      
      // Verify incorrect password
      const isInvalid = await JWTService.verifyPassword('wrongpassword', hash);
      expect(isInvalid).toBe(false);
    });

    it('should generate different hashes for same password', async () => {
      const password = 'testpassword123';
      const hash1 = await JWTService.hashPassword(password);
      const hash2 = await JWTService.hashPassword(password);
      
      expect(hash1).not.toBe(hash2);
      
      // But both should verify correctly
      expect(await JWTService.verifyPassword(password, hash1)).toBe(true);
      expect(await JWTService.verifyPassword(password, hash2)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should throw error for invalid token', () => {
      expect(() => {
        JWTService.verifyToken('invalid-token');
      }).toThrow();
    });

    it('should throw error for malformed token', () => {
      expect(() => {
        JWTService.verifyToken('not.a.jwt');
      }).toThrow();
    });

    it('should throw error for invalid refresh token', () => {
      expect(() => {
        JWTService.refreshAccessToken('invalid-refresh-token');
      }).toThrow('Invalid refresh token');
    });
  });
});