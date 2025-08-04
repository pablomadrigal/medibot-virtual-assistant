import { PatientModel } from '../../models/Patient'

describe('PatientModel', () => {
  describe('validate', () => {
    it('should validate correct patient data', () => {
      const validData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'John Doe',
        dateOfBirth: '1985-06-15',
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const result = PatientModel.validate(validData)
      expect(result).toEqual(validData)
    })

    it('should reject invalid patient data', () => {
      const invalidData = {
        name: '', // Empty name
        dateOfBirth: 'invalid-date'
      }

      expect(() => PatientModel.validate(invalidData)).toThrow()
    })
  })

  describe('validateDateOfBirth', () => {
    it('should accept valid past dates', () => {
      expect(PatientModel.validateDateOfBirth('1985-06-15')).toBe(true)
      expect(PatientModel.validateDateOfBirth('2000-01-01')).toBe(true)
    })

    it('should reject future dates', () => {
      const futureDate = new Date()
      futureDate.setFullYear(futureDate.getFullYear() + 1)
      const futureDateString = futureDate.toISOString().split('T')[0]
      
      expect(PatientModel.validateDateOfBirth(futureDateString)).toBe(false)
    })

    it('should reject invalid date formats', () => {
      expect(PatientModel.validateDateOfBirth('invalid-date')).toBe(false)
      expect(PatientModel.validateDateOfBirth('85-06-15')).toBe(false)
    })
  })

  describe('calculateAge', () => {
    it('should calculate correct age', () => {
      const birthDate = '1985-06-15'
      const age = PatientModel.calculateAge(birthDate)
      
      // Age should be reasonable (between 0 and 150)
      expect(age).toBeGreaterThanOrEqual(0)
      expect(age).toBeLessThan(150)
    })

    it('should handle birthday edge cases', () => {
      const today = new Date()
      const thisYear = today.getFullYear()
      const thisMonth = String(today.getMonth() + 1).padStart(2, '0')
      const thisDay = String(today.getDate()).padStart(2, '0')
      
      // Birthday today - should be exact age
      const birthdayToday = `${thisYear - 30}-${thisMonth}-${thisDay}`
      expect(PatientModel.calculateAge(birthdayToday)).toBe(30)
    })
  })

  describe('fromDatabaseRow', () => {
    it('should convert database row to Patient object', () => {
      const dbRow = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'John Doe',
        date_of_birth: '1985-06-15',
        created_at: new Date('2024-01-01'),
        updated_at: new Date('2024-01-01'),
        encrypted_data: null
      }

      const patient = PatientModel.fromDatabaseRow(dbRow)
      
      expect(patient.id).toBe(dbRow.id)
      expect(patient.name).toBe(dbRow.name)
      expect(patient.dateOfBirth).toBe(dbRow.date_of_birth)
      expect(patient.createdAt).toBe(dbRow.created_at)
      expect(patient.updatedAt).toBe(dbRow.updated_at)
    })
  })

  describe('toDatabaseRow', () => {
    it('should convert Patient object to database format', () => {
      const patient = {
        name: 'John Doe',
        dateOfBirth: '1985-06-15'
      }

      const dbRow = PatientModel.toDatabaseRow(patient)
      
      expect(dbRow.name).toBe(patient.name)
      expect(dbRow.date_of_birth).toBe(patient.dateOfBirth)
      expect(dbRow.encrypted_data).toBeNull()
    })
  })
})