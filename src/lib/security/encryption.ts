import * as crypto from 'crypto';

// Encryption configuration
const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits
const TAG_LENGTH = 16; // 128 bits

export interface EncryptedData {
  encryptedData: string;
  iv: string;
  tag: string;
  algorithm: string;
}

export class EncryptionService {
  private static encryptionKey: Buffer;

  /**
   * Initialize encryption key from environment variable
   */
  static initialize(): void {
    const keyString = process.env.ENCRYPTION_KEY;
    
    if (!keyString) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('ENCRYPTION_KEY environment variable is required in production');
      }
      // Generate a random key for development
      this.encryptionKey = crypto.randomBytes(KEY_LENGTH);
      console.warn('WARNING: Using randomly generated encryption key. Set ENCRYPTION_KEY environment variable.');
    } else {
      // Derive key from environment variable
      this.encryptionKey = crypto.scryptSync(keyString, 'medibot-salt', KEY_LENGTH);
    }
  }

  /**
   * Encrypt sensitive data
   */
  static encrypt(plaintext: string): EncryptedData {
    if (!this.encryptionKey) {
      this.initialize();
    }

    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, this.encryptionKey, iv) as crypto.CipherGCM;
    cipher.setAAD(Buffer.from('medibot-aad')); // Additional authenticated data

    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const tag = cipher.getAuthTag();

    return {
      encryptedData: encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex'),
      algorithm: ALGORITHM
    };
  }

  /**
   * Decrypt sensitive data
   */
  static decrypt(encryptedData: EncryptedData): string {
    if (!this.encryptionKey) {
      this.initialize();
    }

    const iv = Buffer.from(encryptedData.iv, 'hex');
    const decipher = crypto.createDecipheriv(encryptedData.algorithm, this.encryptionKey, iv) as crypto.DecipherGCM;
    decipher.setAAD(Buffer.from('medibot-aad'));
    decipher.setAuthTag(Buffer.from(encryptedData.tag, 'hex'));

    let decrypted = decipher.update(encryptedData.encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * Encrypt object data (converts to JSON first)
   */
  static encryptObject(data: any): EncryptedData {
    const jsonString = JSON.stringify(data);
    return this.encrypt(jsonString);
  }

  /**
   * Decrypt object data (parses JSON after decryption)
   */
  static decryptObject<T = any>(encryptedData: EncryptedData): T {
    const jsonString = this.decrypt(encryptedData);
    return JSON.parse(jsonString);
  }

  /**
   * Generate a secure random token
   */
  static generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Hash data using SHA-256
   */
  static hash(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Generate HMAC signature
   */
  static generateHMAC(data: string, secret?: string): string {
    const hmacSecret = secret || process.env.HMAC_SECRET || 'medibot-hmac-secret';
    return crypto.createHmac('sha256', hmacSecret).update(data).digest('hex');
  }

  /**
   * Verify HMAC signature
   */
  static verifyHMAC(data: string, signature: string, secret?: string): boolean {
    const expectedSignature = this.generateHMAC(data, secret);
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  }

  /**
   * Encrypt patient data specifically (with additional metadata)
   */
  static encryptPatientData(patientData: any): EncryptedData & { timestamp: string } {
    const dataWithTimestamp = {
      ...patientData,
      encryptedAt: new Date().toISOString()
    };

    const encrypted = this.encryptObject(dataWithTimestamp);
    
    return {
      ...encrypted,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Decrypt patient data and validate timestamp
   */
  static decryptPatientData<T = any>(encryptedData: EncryptedData & { timestamp: string }): T {
    const decrypted = this.decryptObject(encryptedData);
    
    // Validate encryption timestamp (optional security check)
    if (decrypted.encryptedAt) {
      const encryptedAt = new Date(decrypted.encryptedAt);
      const now = new Date();
      const daysDiff = (now.getTime() - encryptedAt.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysDiff > 365) { // Data older than 1 year
        console.warn('Decrypting old patient data:', { encryptedAt, daysDiff });
      }
    }

    // Remove encryption metadata before returning
    const { encryptedAt, ...cleanData } = decrypted;
    return cleanData as T;
  }
}

// Initialize encryption service
if (process.env.NODE_ENV !== 'test') {
  EncryptionService.initialize();
}