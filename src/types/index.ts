// Shared TypeScript interfaces for MediBot application

export interface Patient {
  id: string;
  name: string;
  dateOfBirth: string;
  createdAt: Date;
  updatedAt: Date;
  encryptedData?: any;
}

export interface Anamnesis {
  id: string;
  patientId: string;
  reasonForVisit: string;
  symptoms: string;
  duration: string;
  aiSummary?: string;
  aiRecommendations?: string[];
  createdAt: Date;
}

export interface Consultation {
  id: string;
  patientId: string;
  anamnesisId: string;
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  doctorNotes?: string;
  reviewedAt?: Date;
  createdAt: Date;
}

export interface ConversationState {
  sessionId: string;
  currentPhase: 'greeting' | 'anamnesis' | 'closure';
  collectedData: {
    name?: string;
    dateOfBirth?: string;
    reasonForVisit?: string;
    symptoms?: string;
    duration?: string;
  };
  attemptCount: number;
  lastMessage: string;
  isComplete: boolean;
}

// Authentication types
export interface User {
  id: string;
  email: string;
  role: 'patient' | 'doctor' | 'admin';
  name: string;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface APIError {
  error: {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
  };
}
