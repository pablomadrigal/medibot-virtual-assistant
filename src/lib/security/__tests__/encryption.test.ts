import { EncryptionService } from '../encryption';

// Mock environment variables
process.env.ENCRYPTION_KEY = 'test-encryption-key-for-testing';

describe('EncryptionService', () => {
  beforeAll(() => {
    EncryptionService.initialize();
  });

  describe('encrypt and decrypt', () => {
    it('should encrypt and decrypt text correctly', () => {
      const plaintext = 'This is sensitive patient data';
      const encrypted = EncryptionService.encrypt(plaintext);
      const decrypted = EncryptionService.decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
      expect(encrypted.encryptedData).not.toBe(plaintext);
      expect(encrypted.iv).toBeDefined();
      expect(encrypted.tag).toBeDefined();
      expect(encrypted.algorithm).toBe('aes-256-gcm');
    });

    it('should produce different encrypted data for same input', () => {
      const plaintext = 'Same input text';
      const encrypted1 = EncryptionService.encrypt(plaintext);
      const encrypted2 = EncryptionService.encrypt(plaintext);

      expect(encrypted1.encryptedData).not.toBe(encrypted2.encryptedData);
      expect(encrypted1.iv).not.toBe(encrypted2.iv);
      
      // But both should decrypt to the same plaintext
      expect(EncryptionService.decrypt(encrypted1)).toBe(plaintext);
      expect(EncryptionService.decrypt(encrypted2)).toBe(plaintext);
    });

    it('should handle empty strings', () => {
      const plaintext = '';
      const encrypted = EncryptionService.encrypt(plaintext);
      const decrypted = EncryptionService.decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should handle special characters and unicode', () => {
      const plaintext = 'Special chars: àáâãäå ñ 中文 🏥💊';
      const encrypted = EncryptionService.encrypt(plaintext);
      const decrypted = EncryptionService.decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });
  });

  describe('encryptObject and decryptObject', () => {
    it('should encrypt and decrypt objects correctly', () => {
      const data = {
        name: 'John Doe',
        age: 30,
        symptoms: ['headache', 'fever'],
        metadata: { urgent: true }
      };

      const encrypted = EncryptionService.encryptObject(data);
      const decrypted = EncryptionService.decryptObject(encrypted);

      expect(decrypted).toEqual(data);
    });

    it('should handle nested objects', () => {
      const data = {
        patient: {
          id: '123',
          name: 'Jane Doe',
          medical: {
            conditions: ['diabetes', 'hypertension'],
            medications: [
              { name: 'metformin', dosage: '500mg' },
              { name: 'lisinopril', dosage: '10mg' }
            ]
          }
        }
      };

      const encrypted = EncryptionService.encryptObject(data);
      const decrypted = EncryptionService.decryptObject(encrypted);

      expect(decrypted).toEqual(data);
    });
  });

  describe('generateSecureToken', () => {
    it('should generate tokens of correct length', () => {
      const token16 = EncryptionService.generateSecureToken(16);
      const token32 = EncryptionService.generateSecureToken(32);

      expect(token16).toHaveLength(32); // 16 bytes = 32 hex chars
      expect(token32).toHaveLength(64); // 32 bytes = 64 hex chars
    });

    it('should generate different tokens each time', () => {
      const token1 = EncryptionService.generateSecureToken();
      const token2 = EncryptionService.generateSecureToken();

      expect(token1).not.toBe(token2);
    });

    it('should generate tokens with only hex characters', () => {
      const token = EncryptionService.generateSecureToken();
      expect(token).toMatch(/^[a-f0-9]+$/);
    });
  });

  describe('hash', () => {
    it('should generate consistent hashes', () => {
      const data = 'test data to hash';
      const hash1 = EncryptionService.hash(data);
      const hash2 = EncryptionService.hash(data);

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64); // SHA-256 produces 64 hex chars
    });

    it('should generate different hashes for different data', () => {
      const hash1 = EncryptionService.hash('data1');
      const hash2 = EncryptionService.hash('data2');

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('HMAC operations', () => {
    it('should generate and verify HMAC signatures', () => {
      const data = 'important medical data';
      const signature = EncryptionService.generateHMAC(data);
      const isValid = EncryptionService.verifyHMAC(data, signature);

      expect(isValid).toBe(true);
      expect(signature).toHaveLength(64); // SHA-256 HMAC produces 64 hex chars
    });

    it('should reject invalid signatures', () => {
      const data = 'important medical data';
      const signature = EncryptionService.generateHMAC(data);
      const tamperedData = 'tampered medical data';
      const isValid = EncryptionService.verifyHMAC(tamperedData, signature);

      expect(isValid).toBe(false);
    });

    it('should work with custom secrets', () => {
      const data = 'test data';
      const secret = 'custom-secret-key';
      const signature = EncryptionService.generateHMAC(data, secret);
      const isValid = EncryptionService.verifyHMAC(data, signature, secret);

      expect(isValid).toBe(true);
    });
  });

  describe('encryptPatientData and decryptPatientData', () => {
    it('should encrypt patient data with timestamp', () => {
      const patientData = {
        name: 'John Doe',
        dateOfBirth: '1990-01-01',
        symptoms: 'headache, fever'
      };

      const encrypted = EncryptionService.encryptPatientData(patientData);
      expect(encrypted.timestamp).toBeDefined();
      expect(new Date(encrypted.timestamp)).toBeInstanceOf(Date);
    });

    it('should decrypt patient data and remove encryption metadata', () => {
      const patientData = {
        name: 'John Doe',
        dateOfBirth: '1990-01-01',
        symptoms: 'headache, fever'
      };

      const encrypted = EncryptionService.encryptPatientData(patientData);
      const decrypted = EncryptionService.decryptPatientData(encrypted);

      expect(decrypted).toEqual(patientData);
      expect(decrypted).not.toHaveProperty('encryptedAt');
    });
  });
});