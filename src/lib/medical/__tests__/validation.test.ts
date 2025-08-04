import {
  validateSymptoms,
  validateDuration,
  validateReasonForVisit,
  validateAnamnesisData
} from '../validation'

describe('Medical Validation Utilities', () => {
  describe('validateSymptoms', () => {
    it('should validate normal symptoms', () => {
      const result = validateSymptoms('Mild headache and fatigue for the past few days')
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should return error for empty symptoms', () => {
      const result = validateSymptoms('')
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Symptoms description is required')
    })

    it('should warn about brief symptoms', () => {
      const result = validateSymptoms('Headache')
      
      expect(result.isValid).toBe(true)
      expect(result.warnings).toContain('Symptoms description is very brief, consider adding more details')
    })

    it('should return error for too long symptoms', () => {
      const longSymptoms = 'a'.repeat(2001)
      const result = validateSymptoms(longSymptoms)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Symptoms description is too long (max 2000 characters)')
    })

    it('should warn about urgent symptoms', () => {
      const result = validateSymptoms('Severe chest pain and difficulty breathing')
      
      expect(result.isValid).toBe(true)
      expect(result.warnings).toContain('Symptoms may indicate urgent medical attention needed')
    })
  })

  describe('validateDuration', () => {
    it('should validate normal duration formats', () => {
      const validDurations = ['2 days', '3 hours', '1 week', '5 minutes', '2 months']
      
      validDurations.forEach(duration => {
        const result = validateDuration(duration)
        expect(result.isValid).toBe(true)
      })
    })

    it('should return error for empty duration', () => {
      const result = validateDuration('')
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Duration is required')
    })

    it('should warn about unclear duration format', () => {
      const result = validateDuration('some time ago')
      
      expect(result.isValid).toBe(true)
      expect(result.warnings).toContain('Duration format may be unclear, consider using standard time units')
    })

    it('should warn about chronic conditions', () => {
      const result = validateDuration('2 years')
      
      expect(result.isValid).toBe(true)
      expect(result.warnings).toContain('Long-term symptoms may require specialized care')
    })

    it('should accept immediate/sudden durations', () => {
      const result = validateDuration('sudden onset')
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
  })

  describe('validateReasonForVisit', () => {
    it('should validate normal reason', () => {
      const result = validateReasonForVisit('Regular checkup and health screening')
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should return error for empty reason', () => {
      const result = validateReasonForVisit('')
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Reason for visit is required')
    })

    it('should warn about brief reason', () => {
      const result = validateReasonForVisit('Pain')
      
      expect(result.isValid).toBe(true)
      expect(result.warnings).toContain('Reason for visit is very brief, consider adding more context')
    })

    it('should return error for too long reason', () => {
      const longReason = 'a'.repeat(1001)
      const result = validateReasonForVisit(longReason)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Reason for visit is too long (max 1000 characters)')
    })
  })

  describe('validateAnamnesisData', () => {
    it('should validate complete anamnesis data', () => {
      const data = {
        reasonForVisit: 'Regular checkup and health screening',
        symptoms: 'Mild headache and occasional fatigue',
        duration: '3 days'
      }
      
      const result = validateAnamnesisData(data)
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should collect all errors from individual validations', () => {
      const data = {
        reasonForVisit: '',
        symptoms: '',
        duration: ''
      }
      
      const result = validateAnamnesisData(data)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Reason for visit is required')
      expect(result.errors).toContain('Symptoms description is required')
      expect(result.errors).toContain('Duration is required')
    })

    it('should collect all warnings from individual validations', () => {
      const data = {
        reasonForVisit: 'Pain',
        symptoms: 'Severe chest pain',
        duration: '2 years'
      }
      
      const result = validateAnamnesisData(data)
      
      expect(result.isValid).toBe(true)
      expect(result.warnings).toContain('Reason for visit is very brief, consider adding more context')
      expect(result.warnings).toContain('Symptoms may indicate urgent medical attention needed')
      expect(result.warnings).toContain('Long-term symptoms may require specialized care')
    })
  })
})