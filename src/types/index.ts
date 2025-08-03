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
