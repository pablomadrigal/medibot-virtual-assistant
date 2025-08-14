// Security module exports

import { EncryptionService, type EncryptedData } from './encryption';
import { 
  InputSanitizer, 
  validateRequest,
  validationSchemas,
  commonSchemas,
  patientSchemas,
  anamnesisSchemas,
  authSchemas,
  conversationSchemas,
  consultationSchemas
} from './validation';
import { 
  CORSService, 
  SecurityHeadersService, 
  withSecurity,
  type CORSOptions,
  type SecurityHeadersOptions 
} from './cors';

// Re-export everything
export { EncryptionService, type EncryptedData };
export { 
  InputSanitizer, 
  validateRequest,
  validationSchemas,
  commonSchemas,
  patientSchemas,
  anamnesisSchemas,
  authSchemas,
  conversationSchemas,
  consultationSchemas
};
export { 
  CORSService, 
  SecurityHeadersService, 
  withSecurity,
  type CORSOptions,
  type SecurityHeadersOptions 
};

// Named export for convenience (fixes ESLint warning)
export const SecurityModule = {
  EncryptionService,
  InputSanitizer,
  CORSService,
  SecurityHeadersService,
  validationSchemas
};

// Default export for backward compatibility
export default SecurityModule;