import CryptoJS from 'crypto-js';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-key';

export interface EncryptedData {
  ciphertext: string;
  iv?: string;
}

export class EncryptionService {
  private key: string;

  constructor(key?: string) {
    this.key = key || ENCRYPTION_KEY;
  }

  encrypt(text: string): EncryptedData {
    const ciphertext = CryptoJS.AES.encrypt(text, this.key).toString();
    return { ciphertext };
  }

  decrypt(encryptedData: EncryptedData): string {
    const bytes = CryptoJS.AES.decrypt(encryptedData.ciphertext, this.key);
    return bytes.toString(CryptoJS.enc.Utf8);
  }
}

export function encrypt(text: string): string {
  return CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
}

export function decrypt(ciphertext: string): string {
  const bytes = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
}