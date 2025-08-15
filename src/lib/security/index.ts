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

// Default export for convenience
const securityModule = {
  EncryptionService,
  InputSanitizer,
  CORSService,
  SecurityHeadersService,
  validationSchemas
};

export default securityModule;