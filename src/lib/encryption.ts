import crypto from 'crypto'

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-32-character-secret-key-here'
const ALGORITHM = 'aes-256-cbc'

export interface EncryptedData {
  encryptedData: string
  iv: string
  authTag: string
}

export function encrypt(text: string): EncryptedData {
  const iv = crypto.randomBytes(16)
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32)
  const cipher = crypto.createCipher(ALGORITHM, key)
  
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  
  return {
    encryptedData: encrypted,
    iv: iv.toString('hex'),
    authTag: '' // Not used in CBC mode
  }
}

export function decrypt(encryptedData: EncryptedData): string {
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32)
  const decipher = crypto.createDecipher(ALGORITHM, key)
  
  let decrypted = decipher.update(encryptedData.encryptedData, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  
  return decrypted
}

// Utility functions for encrypting sensitive patient data
export function encryptPatientData(data: any): string {
  const jsonString = JSON.stringify(data)
  const encrypted = encrypt(jsonString)
  return JSON.stringify(encrypted)
}

export function decryptPatientData(encryptedString: string): any {
  const encryptedData = JSON.parse(encryptedString) as EncryptedData
  const decryptedString = decrypt(encryptedData)
  return JSON.parse(decryptedString)
}