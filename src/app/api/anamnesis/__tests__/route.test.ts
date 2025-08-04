import { NextRequest } from 'next/server'
import { GET, POST } from '../route'

// Mock crypto.randomUUID
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => '123e4567-e89b-12d3-a456-426614174000'
  }
})

describe('/api/anamnesis', () => {
  describe('GET', () => {
    it('should return empty array of anamnesis records with pagination', async () => {
      const request = new NextRequest('http://localhost:3000/api/anamnesis')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({
        success: true,
        data: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false
        }
      })
    })

    it('should return 400 for invalid patientId query parameter', async () => {
      const request = new NextRequest('http://localhost:3000/api/anamnesis?patientId=invalid-uuid')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error.code).toBe('INVALID_PATIENT_ID')
      expect(data.error.message).toBe('Invalid patient ID format')
    })

    it('should accept valid patientId query parameter', async () => {
      const validUUID = '123e4567-e89b-12d3-a456-426614174000'
      const request = new NextRequest(`http://localhost:3000/api/anamnesis?patientId=${validUUID}`)
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })
  })

  describe('POST', () => {
    it('should create a new anamnesis record with valid data', async () => {
      const anamnesisData = {
        patientId: '123e4567-e89b-12d3-a456-426614174000',
        reasonForVisit: 'Regular checkup',
        symptoms: 'Mild headache and fatigue',
        duration: '2 days'
      }

      const request = new NextRequest('http://localhost:3000/api/anamnesis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(anamnesisData)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.message).toBe('Anamnesis record created successfully')
      expect(data.data).toMatchObject({
        id: expect.any(String),
        patientId: '123e4567-e89b-12d3-a456-426614174000',
        reasonForVisit: 'Regular checkup',
        symptoms: 'Mild headache and fatigue',
        duration: '2 days',
        createdAt: expect.any(String)
      })
    })

    it('should create anamnesis record with AI summary and recommendations', async () => {
      const anamnesisData = {
        patientId: '123e4567-e89b-12d3-a456-426614174000',
        reasonForVisit: 'Chest pain',
        symptoms: 'Sharp chest pain, shortness of breath',
        duration: '1 hour',
        aiSummary: 'Patient presents with acute chest pain symptoms',
        aiRecommendations: ['ECG recommended', 'Blood pressure check', 'Cardiac enzymes test']
      }

      const request = new NextRequest('http://localhost:3000/api/anamnesis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(anamnesisData)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.data.aiSummary).toBe('Patient presents with acute chest pain symptoms')
      expect(data.data.aiRecommendations).toEqual(['ECG recommended', 'Blood pressure check', 'Cardiac enzymes test'])
    })

    it('should return validation error for invalid patient ID', async () => {
      const invalidData = {
        patientId: 'invalid-uuid',
        reasonForVisit: 'Regular checkup',
        symptoms: 'Mild headache',
        duration: '2 days'
      }

      const request = new NextRequest('http://localhost:3000/api/anamnesis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(invalidData)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error.code).toBe('VALIDATION_ERROR')
      expect(data.error.message).toBe('Invalid anamnesis data')
    })

    it('should return validation error for missing required fields', async () => {
      const incompleteData = {
        patientId: '123e4567-e89b-12d3-a456-426614174000',
        reasonForVisit: 'Regular checkup'
        // Missing symptoms and duration
      }

      const request = new NextRequest('http://localhost:3000/api/anamnesis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(incompleteData)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error.code).toBe('VALIDATION_ERROR')
    })

    it('should return validation error for empty required fields', async () => {
      const invalidData = {
        patientId: '123e4567-e89b-12d3-a456-426614174000',
        reasonForVisit: '',
        symptoms: '',
        duration: ''
      }

      const request = new NextRequest('http://localhost:3000/api/anamnesis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(invalidData)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error.code).toBe('VALIDATION_ERROR')
    })

    it('should handle malformed JSON', async () => {
      const request = new NextRequest('http://localhost:3000/api/anamnesis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: 'invalid json'
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error.code).toBe('INTERNAL_ERROR')
      expect(data.error.message).toBe('Failed to create anamnesis record')
    })
  })
})