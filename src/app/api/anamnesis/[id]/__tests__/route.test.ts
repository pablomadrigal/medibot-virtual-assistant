import { NextRequest } from 'next/server'
import { GET, PUT, DELETE } from '../route'

const validUUID = '123e4567-e89b-12d3-a456-426614174000'
const invalidUUID = 'invalid-uuid'

describe('/api/anamnesis/[id]', () => {
  describe('GET', () => {
    it('should return 404 for non-existent anamnesis record', async () => {
      const request = new NextRequest(`http://localhost:3000/api/anamnesis/${validUUID}`)
      const response = await GET(request, { params: { id: validUUID } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error.code).toBe('NOT_FOUND')
      expect(data.error.message).toBe('Anamnesis record not found')
    })

    it('should return 400 for invalid UUID format', async () => {
      const request = new NextRequest(`http://localhost:3000/api/anamnesis/${invalidUUID}`)
      const response = await GET(request, { params: { id: invalidUUID } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error.code).toBe('INVALID_ID')
      expect(data.error.message).toBe('Invalid anamnesis ID format')
    })
  })

  describe('PUT', () => {
    it('should update anamnesis record with valid data', async () => {
      const updateData = {
        reasonForVisit: 'Follow-up appointment',
        symptoms: 'Improved symptoms, less pain',
        duration: '1 week',
        aiSummary: 'Patient showing improvement',
        aiRecommendations: ['Continue current treatment', 'Schedule follow-up in 2 weeks']
      }

      const request = new NextRequest(`http://localhost:3000/api/anamnesis/${validUUID}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      })

      const response = await PUT(request, { params: { id: validUUID } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe('Anamnesis record updated successfully')
      expect(data.data).toMatchObject({
        id: validUUID,
        reasonForVisit: 'Follow-up appointment',
        symptoms: 'Improved symptoms, less pain',
        duration: '1 week',
        aiSummary: 'Patient showing improvement',
        aiRecommendations: ['Continue current treatment', 'Schedule follow-up in 2 weeks']
      })
    })

    it('should update anamnesis record with partial data', async () => {
      const updateData = {
        reasonForVisit: 'Emergency visit'
      }

      const request = new NextRequest(`http://localhost:3000/api/anamnesis/${validUUID}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      })

      const response = await PUT(request, { params: { id: validUUID } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.reasonForVisit).toBe('Emergency visit')
    })

    it('should return 400 for invalid UUID format', async () => {
      const updateData = { reasonForVisit: 'Updated reason' }

      const request = new NextRequest(`http://localhost:3000/api/anamnesis/${invalidUUID}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      })

      const response = await PUT(request, { params: { id: invalidUUID } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error.code).toBe('INVALID_ID')
    })

    it('should return validation error for invalid update data', async () => {
      const invalidUpdateData = {
        reasonForVisit: '', // Empty reason should fail validation
        symptoms: 'a'.repeat(2001) // Too long symptoms
      }

      const request = new NextRequest(`http://localhost:3000/api/anamnesis/${validUUID}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(invalidUpdateData)
      })

      const response = await PUT(request, { params: { id: validUUID } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error.code).toBe('VALIDATION_ERROR')
    })
  })

  describe('DELETE', () => {
    it('should delete anamnesis record successfully', async () => {
      const request = new NextRequest(`http://localhost:3000/api/anamnesis/${validUUID}`, {
        method: 'DELETE'
      })

      const response = await DELETE(request, { params: { id: validUUID } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe('Anamnesis record deleted successfully')
      expect(data.data).toBe(null)
    })

    it('should return 400 for invalid UUID format', async () => {
      const request = new NextRequest(`http://localhost:3000/api/anamnesis/${invalidUUID}`, {
        method: 'DELETE'
      })

      const response = await DELETE(request, { params: { id: invalidUUID } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error.code).toBe('INVALID_ID')
    })
  })
})