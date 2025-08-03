import { ConsultationModel } from '../../models/Consultation'

describe('ConsultationModel', () => {
  describe('isValidStatusTransition', () => {
    it('should allow valid status transitions', () => {
      expect(ConsultationModel.isValidStatusTransition('pending', 'in-progress')).toBe(true)
      expect(ConsultationModel.isValidStatusTransition('pending', 'cancelled')).toBe(true)
      expect(ConsultationModel.isValidStatusTransition('in-progress', 'completed')).toBe(true)
      expect(ConsultationModel.isValidStatusTransition('in-progress', 'cancelled')).toBe(true)
    })

    it('should reject invalid status transitions', () => {
      expect(ConsultationModel.isValidStatusTransition('completed', 'pending')).toBe(false)
      expect(ConsultationModel.isValidStatusTransition('cancelled', 'in-progress')).toBe(false)
      expect(ConsultationModel.isValidStatusTransition('pending', 'completed')).toBe(false)
    })
  })

  describe('getStatusPriority', () => {
    it('should return correct priority values', () => {
      expect(ConsultationModel.getStatusPriority('in-progress')).toBe(4)
      expect(ConsultationModel.getStatusPriority('pending')).toBe(3)
      expect(ConsultationModel.getStatusPriority('completed')).toBe(1)
      expect(ConsultationModel.getStatusPriority('cancelled')).toBe(0)
    })
  })

  describe('requiresImmediateAttention', () => {
    it('should flag in-progress consultations older than 24 hours', () => {
      const oldConsultation = {
        id: '123',
        patientId: '456',
        anamnesisId: '789',
        status: 'in-progress' as const,
        createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000) // 25 hours ago
      }

      expect(ConsultationModel.requiresImmediateAttention(oldConsultation)).toBe(true)
    })

    it('should flag consultations with urgent symptoms', () => {
      const consultation = {
        id: '123',
        patientId: '456',
        anamnesisId: '789',
        status: 'pending' as const,
        createdAt: new Date()
      }

      expect(ConsultationModel.requiresImmediateAttention(consultation, 'severe chest pain')).toBe(true)
      expect(ConsultationModel.requiresImmediateAttention(consultation, 'difficulty breathing')).toBe(true)
      expect(ConsultationModel.requiresImmediateAttention(consultation, 'mild headache')).toBe(false)
    })
  })

  describe('calculateDuration', () => {
    it('should calculate duration in minutes', () => {
      const consultation = {
        id: '123',
        patientId: '456',
        anamnesisId: '789',
        status: 'completed' as const,
        createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        reviewedAt: new Date()
      }

      const duration = ConsultationModel.calculateDuration(consultation)
      expect(duration).toBe(30)
    })

    it('should return null for consultations without createdAt', () => {
      const consultation = {
        id: '123',
        patientId: '456',
        anamnesisId: '789',
        status: 'pending' as const
      }

      const duration = ConsultationModel.calculateDuration(consultation)
      expect(duration).toBeNull()
    })
  })

  describe('validateDoctorNotes', () => {
    it('should accept valid doctor notes', () => {
      const validNotes = 'Patient presents with classic migraine symptoms. Recommend rest and hydration.'
      expect(ConsultationModel.validateDoctorNotes(validNotes)).toBe(true)
    })

    it('should reject empty or too short notes', () => {
      expect(ConsultationModel.validateDoctorNotes('')).toBe(false)
      expect(ConsultationModel.validateDoctorNotes('   ')).toBe(false)
      expect(ConsultationModel.validateDoctorNotes('OK')).toBe(false) // Too short
    })

    it('should require minimum word count', () => {
      const shortNotes = 'Patient is fine' // 3 words
      const longEnoughNotes = 'Patient presents with symptoms requiring further evaluation' // 8 words
      
      expect(ConsultationModel.validateDoctorNotes(shortNotes)).toBe(false)
      expect(ConsultationModel.validateDoctorNotes(longEnoughNotes)).toBe(true)
    })
  })

  describe('fromDatabaseRow', () => {
    it('should convert database row to Consultation object', () => {
      const dbRow = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        patient_id: '456e7890-e89b-12d3-a456-426614174000',
        anamnesis_id: '789e0123-e89b-12d3-a456-426614174000',
        status: 'pending',
        doctor_notes: 'Initial assessment needed',
        reviewed_at: null,
        created_at: new Date('2024-01-01')
      }

      const consultation = ConsultationModel.fromDatabaseRow(dbRow)
      
      expect(consultation.id).toBe(dbRow.id)
      expect(consultation.patientId).toBe(dbRow.patient_id)
      expect(consultation.anamnesisId).toBe(dbRow.anamnesis_id)
      expect(consultation.status).toBe(dbRow.status)
      expect(consultation.doctorNotes).toBe(dbRow.doctor_notes)
      expect(consultation.reviewedAt).toBe(dbRow.reviewed_at)
      expect(consultation.createdAt).toBe(dbRow.created_at)
    })
  })
})