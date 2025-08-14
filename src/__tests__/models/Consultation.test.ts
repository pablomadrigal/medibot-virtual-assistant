import { ConsultationModel, ConsultationStatus } from '../../models/Consultation';

describe('ConsultationModel', () => {
  describe('validation', () => {
    it('should validate correct consultation data', () => {
      const validData = {
        patientId: '123e4567-e89b-12d3-a456-426614174000',
        anamnesisId: '123e4567-e89b-12d3-a456-426614174001',
        status: 'pending' as ConsultationStatus,
      };
      expect(() => ConsultationModel.validateCreate(validData)).not.toThrow();
    });

    it('should throw for invalid status', () => {
      const invalidData = {
        patientId: '123e4567-e89b-12d3-a456-426614174000',
        anamnesisId: '123e4567-e89b-12d3-a456-426614174001',
        status: 'invalid-status',
      };
      expect(() => ConsultationModel.validateCreate(invalidData as any)).toThrow();
    });
  });

  describe('fromDatabaseRow', () => {
    it('should correctly map a database row to a Consultation object', () => {
      const dbRow = {
        id: 'a-uuid',
        patient_id: 'patient-uuid',
        anamnesis_id: 'anamnesis-uuid',
        status: 'completed',
        doctor_notes: 'Patient is healthy',
        reviewed_at: new Date(),
        created_at: new Date(),
      };
      const consultation = ConsultationModel.fromDatabaseRow(dbRow);
      expect(consultation.id).toBe(dbRow.id);
      expect(consultation.patientId).toBe(dbRow.patient_id);
      expect(consultation.status).toBe(dbRow.status);
      expect(consultation.doctorNotes).toBe(dbRow.doctor_notes);
      expect(consultation.reviewedAt).toBeInstanceOf(Date);
      expect(consultation.createdAt).toBeInstanceOf(Date);
    });
  });

  describe('toDatabaseRow', () => {
    it('should correctly map a Consultation object to a database row', () => {
      const consultationData = {
        patientId: 'patient-uuid',
        anamnesisId: 'anamnesis-uuid',
        status: 'pending' as ConsultationStatus,
        doctorNotes: 'Needs review',
      };
      const dbRow = ConsultationModel.toDatabaseRow(consultationData);
      expect(dbRow.patient_id).toBe(consultationData.patientId);
      expect(dbRow.anamnesis_id).toBe(consultationData.anamnesisId);
      expect(dbRow.status).toBe(consultationData.status);
      expect(dbRow.doctor_notes).toBe(consultationData.doctorNotes);
    });
  });

  describe('isValidStatusTransition', () => {
    it('should allow valid status transitions', () => {
      expect(ConsultationModel.isValidStatusTransition('pending', 'in-progress')).toBe(true);
      expect(ConsultationModel.isValidStatusTransition('in-progress', 'completed')).toBe(true);
      expect(ConsultationModel.isValidStatusTransition('pending', 'cancelled')).toBe(true);
    });

    it('should reject invalid status transitions', () => {
      expect(ConsultationModel.isValidStatusTransition('completed', 'pending')).toBe(false);
      expect(ConsultationModel.isValidStatusTransition('pending', 'completed')).toBe(false);
    });
  });
});