import { AnamnesisModel } from '../../models/Anamnesis'

describe('AnamnesisModel', () => {
  describe('validateMedicalData', () => {
    it('should validate correct medical data', () => {
      const validData = {
        reasonForVisit: 'Persistent headaches',
        symptoms: 'Severe headaches, sensitivity to light',
        duration: '1 week'
      }

      expect(AnamnesisModel.validateMedicalData(validData)).toBe(true)
    })

    it('should reject incomplete medical data', () => {
      const incompleteData = {
        reasonForVisit: '',
        symptoms: 'Some symptoms',
        duration: '1 week'
      }

      expect(AnamnesisModel.validateMedicalData(incompleteData)).toBe(false)
    })

    it('should reject invalid duration format', () => {
      const invalidDuration = {
        reasonForVisit: 'Headaches',
        symptoms: 'Pain',
        duration: 'sometime' // No time indicator
      }

      expect(AnamnesisModel.validateMedicalData(invalidDuration)).toBe(false)
    })
  })

  describe('extractMedicalTerms', () => {
    it('should extract known medical terms', () => {
      const symptoms = 'I have severe headache and nausea with some dizziness'
      const terms = AnamnesisModel.extractMedicalTerms(symptoms)
      
      expect(terms).toContain('headache')
      expect(terms).toContain('nausea')
      expect(terms).toContain('dizziness')
    })

    it('should handle case insensitive matching', () => {
      const symptoms = 'HEADACHE and Fever'
      const terms = AnamnesisModel.extractMedicalTerms(symptoms)
      
      expect(terms).toContain('headache')
      expect(terms).toContain('fever')
    })

    it('should return empty array for no matches', () => {
      const symptoms = 'I feel fine today'
      const terms = AnamnesisModel.extractMedicalTerms(symptoms)
      
      expect(terms).toEqual([])
    })
  })

  describe('assessSeverity', () => {
    it('should assess high severity for severe symptoms', () => {
      const symptoms = 'severe chest pain and difficulty breathing'
      const severity = AnamnesisModel.assessSeverity(symptoms)
      
      expect(severity).toBe('high')
    })

    it('should assess medium severity for moderate symptoms', () => {
      const symptoms = 'persistent headache that is worsening'
      const severity = AnamnesisModel.assessSeverity(symptoms)
      
      expect(severity).toBe('medium')
    })

    it('should assess low severity for mild symptoms', () => {
      const symptoms = 'mild headache occasionally'
      const severity = AnamnesisModel.assessSeverity(symptoms)
      
      expect(severity).toBe('low')
    })
  })

  describe('fromDatabaseRow', () => {
    it('should convert database row to Anamnesis object', () => {
      const dbRow = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        patient_id: '456e7890-e89b-12d3-a456-426614174000',
        reason_for_visit: 'Headaches',
        symptoms: 'Severe pain',
        duration: '1 week',
        ai_summary: 'Patient has migraine symptoms',
        ai_recommendations: ['Rest', 'Hydration'],
        created_at: new Date('2024-01-01')
      }

      const anamnesis = AnamnesisModel.fromDatabaseRow(dbRow)
      
      expect(anamnesis.id).toBe(dbRow.id)
      expect(anamnesis.patientId).toBe(dbRow.patient_id)
      expect(anamnesis.reasonForVisit).toBe(dbRow.reason_for_visit)
      expect(anamnesis.symptoms).toBe(dbRow.symptoms)
      expect(anamnesis.duration).toBe(dbRow.duration)
      expect(anamnesis.aiSummary).toBe(dbRow.ai_summary)
      expect(anamnesis.aiRecommendations).toEqual(dbRow.ai_recommendations)
    })
  })

  describe('toDatabaseRow', () => {
    it('should convert Anamnesis object to database format', () => {
      const anamnesis = {
        patientId: '456e7890-e89b-12d3-a456-426614174000',
        reasonForVisit: 'Headaches',
        symptoms: 'Severe pain',
        duration: '1 week',
        aiSummary: 'Migraine symptoms',
        aiRecommendations: ['Rest', 'Medication']
      }

      const dbRow = AnamnesisModel.toDatabaseRow(anamnesis)
      
      expect(dbRow.patient_id).toBe(anamnesis.patientId)
      expect(dbRow.reason_for_visit).toBe(anamnesis.reasonForVisit)
      expect(dbRow.symptoms).toBe(anamnesis.symptoms)
      expect(dbRow.duration).toBe(anamnesis.duration)
      expect(dbRow.ai_summary).toBe(anamnesis.aiSummary)
      expect(dbRow.ai_recommendations).toBe(JSON.stringify(anamnesis.aiRecommendations))
    })
  })
})