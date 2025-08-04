import { NextRequest } from 'next/server'
import { GET, PUT, DELETE } from '../route'

const validUUID = '123e4567-e89b-12d3-a456-426614174000'
const invalidUUID = 'invalid-uuid'

describe('/api/patients/[id]', () => {
  describe('GET', () => {
    it('should return 404 for non-existent patient', async () => {
      const request = new NextRequest(`http://localhost:3000/api/patients/${validUUID}`)
      const response = await GET(request, { params: { id: validUUID } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error.code).toBe('NOT_FOUND')
      expect(data.error.message).toBe('Patient not found')
    })

    it('should return 400 for invalid UUID format', async () => {
      const request = new NextRequest(`http://localhost:3000/api/patients/${invalidUUID}`)
      const response = await GET(request, { params: { id: invalidUUID } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error.code).toBe('INVALID_ID')
      expect(data.error.message).toBe('Invalid patient ID format')
    })
  })

  describe('PUT', () => {
    it('should update patient with valid data', async () => {
      const updateData = {
        name: 'Jane Doe',
        dateOfBirth: '1985-05-15'
      }

      const request = new NextRequest(`http://localhost:3000/api/patients/${validUUID}`, {
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
      expect(data.message).toBe('Patient updated successfully')
      expect(data.data).toMatchObject({
        id: validUUID,
        name: 'Jane Doe',
        dateOfBirth: '1985-05-15',
        updatedAt: expect.any(String)
      })
    })

    it('should return 400 for invalid UUID format', async () => {
      const updateData = { name: 'Jane Doe' }

      const request = new NextRequest(`http://localhost:3000/api/patients/${invalidUUID}`, {
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
        name: '', // Empty name should fail validation
        dateOfBirth: 'invalid-date'
      }

      const request = new NextRequest(`http://localhost:3000/api/patients/${validUUID}`, {
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
    it('should delete patient successfully', async () => {
      const request = new NextRequest(`http://localhost:3000/api/patients/${validUUID}`, {
        method: 'DELETE'
      })

      const response = await DELETE(request, { params: { id: validUUID } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe('Patient deleted successfully')
      expect(data.data).toBe(null)
    })

    it('should return 400 for invalid UUID format', async () => {
      const request = new NextRequest(`http://localhost:3000/api/patients/${invalidUUID}`, {
        method: 'DELETE'
      })

      const response = await DELETE(request, { params: { id: invalidUUID } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error.code).toBe('INVALID_ID')
    })
  })
})