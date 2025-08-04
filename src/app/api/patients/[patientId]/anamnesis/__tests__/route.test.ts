import { NextRequest } from 'next/server'
import { GET } from '../route'

const validUUID = '123e4567-e89b-12d3-a456-426614174000'
const invalidUUID = 'invalid-uuid'

describe('/api/patients/[patientId]/anamnesis', () => {
  describe('GET', () => {
    it('should return empty array of anamnesis records for valid patient ID', async () => {
      const request = new NextRequest(`http://localhost:3000/api/patients/${validUUID}/anamnesis`)
      const response = await GET(request, { params: { patientId: validUUID } })
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

    it('should return 400 for invalid patient ID format', async () => {
      const request = new NextRequest(`http://localhost:3000/api/patients/${invalidUUID}/anamnesis`)
      const response = await GET(request, { params: { patientId: invalidUUID } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error.code).toBe('INVALID_PATIENT_ID')
      expect(data.error.message).toBe('Invalid patient ID format')
    })

    it('should handle pagination parameters', async () => {
      const request = new NextRequest(`http://localhost:3000/api/patients/${validUUID}/anamnesis?page=2&limit=5`)
      const response = await GET(request, { params: { patientId: validUUID } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.pagination.page).toBe(2)
      expect(data.pagination.limit).toBe(5)
    })
  })
})