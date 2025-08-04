// Authentication configuration for Docker environment

export interface AuthConfig {
  jwt: {
    secret: string;
    expiresIn: string;
    refreshExpiresIn: string;
    issuer: string;
    audience: string;
  };
  bcrypt: {
    saltRounds: number;
  };
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
  session: {
    maxAge: number;
    secure: boolean;
    httpOnly: boolean;
    sameSite: 'strict' | 'lax' | 'none';
  };
}

// Default configuration with Docker-compatible environment variables
export const authConfig: AuthConfig = {
  jwt: {
    secret: process.env.JWT_SECRET || 'medibot-dev-secret-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    issuer: process.env.JWT_ISSUER || 'medibot-api',
    audience: process.env.JWT_AUDIENCE || 'medibot-client'
  },
  bcrypt: {
    saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10)
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10), // 1 minute
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10)
  },
  session: {
    maxAge: parseInt(process.env.SESSION_MAX_AGE || '86400000', 10), // 24 hours
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax'
  }
};

// Validation function for environment configuration
export function validateAuthConfig(): void {
  const requiredEnvVars = ['JWT_SECRET'];
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0 && process.env.NODE_ENV === 'production') {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }

  // Warn about using default values in production
  if (process.env.NODE_ENV === 'production') {
    if (authConfig.jwt.secret === 'medibot-dev-secret-key-change-in-production') {
      console.warn('WARNING: Using default JWT secret in production. Please set JWT_SECRET environment variable.');
    }
  }
}

// Docker-specific configuration helpers
export const dockerConfig = {
  // Database connection for Docker containers
  database: {
    host: process.env.DB_HOST || 'postgres',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'medibot',
    username: process.env.DB_USER || 'medibot_user',
    password: process.env.DB_PASSWORD || 'medibot_password'
  },
  
  // Redis connection for Docker containers
  redis: {
    host: process.env.REDIS_HOST || 'redis',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB || '0', 10)
  },

  // Service discovery for Docker containers
  services: {
    authService: process.env.AUTH_SERVICE_URL || 'http://auth-service:3001',
    patientService: process.env.PATIENT_SERVICE_URL || 'http://patient-service:3002',
    conversationService: process.env.CONVERSATION_SERVICE_URL || 'http://conversation-service:3003'
  }
};

// Initialize configuration validation
if (process.env.NODE_ENV !== 'test') {
  validateAuthConfig();
}