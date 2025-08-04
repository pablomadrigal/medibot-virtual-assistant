import { PoolClient } from 'pg'
import { withDatabase, withTransaction } from '../lib/database'
import { Consultation, CreateConsultationData, ConsultationModel, ConsultationStatus } from '../models/Consultation'
import { AuditLogger } from '../lib/audit'

export interface ConsultationWithDetails extends Consultation {
  patientName: string
  patientDateOfBirth: string
  reasonForVisit: string
  symptoms: string
  duration: string
  aiSummary?: string
  aiRecommendations?: string[]
}

export class ConsultationRepository {
  // Create a new consultation
  static async create(consultationData: CreateConsultationData): Promise<Consultation> {
    // Validate input data
    const validatedData = ConsultationModel.validateCreate(consultationData)
    
    return withTransaction(async (client: PoolClient) => {
      const dbRow = ConsultationModel.toDatabaseRow(validatedData)
      
      const query = `
        INSERT INTO consultations (patient_id, anamnesis_id, status, doctor_notes)
        VALUES ($1, $2, $3, $4)
        RETURNING id, patient_id, anamnesis_id, status, doctor_notes, reviewed_at, created_at
      `
      
      const result = await client.query(query, [
        dbRow.patient_id,
        dbRow.anamnesis_id,
        dbRow.status,
        dbRow.doctor_notes
      ])
      
      const consultation = ConsultationModel.fromDatabaseRow(result.rows[0])
      
      // Log the creation
      await AuditLogger.log(client, {
        tableName: 'consultations',
        recordId: consultation.id!,
        action: 'CREATE',
        newValues: {
          patientId: consultation.patientId,
          anamnesisId: consultation.anamnesisId,
          status: consultation.status
        },
        userId: 'system' // TODO: Get from auth context
      })
      
      return consultation
    })
  }

  // Find consultation by ID
  static async findById(id: string): Promise<Consultation | null> {
    return withDatabase(async (client: PoolClient) => {
      const query = `
        SELECT id, patient_id, anamnesis_id, status, doctor_notes, reviewed_at, created_at
        FROM consultations
        WHERE id = $1
      `
      
      const result = await client.query(query, [id])
      
      if (result.rows.length === 0) {
        return null
      }
      
      return ConsultationModel.fromDatabaseRow(result.rows[0])
    })
  }

  // Find consultation with full details (patient and anamnesis info)
  static async findByIdWithDetails(id: string): Promise<ConsultationWithDetails | null> {
    return withDatabase(async (client: PoolClient) => {
      const query = `
        SELECT 
          c.id, c.patient_id, c.anamnesis_id, c.status, c.doctor_notes, c.reviewed_at, c.created_at,
          p.name as patient_name, p.date_of_birth as patient_date_of_birth,
          a.reason_for_visit, a.symptoms, a.duration, a.ai_summary, a.ai_recommendations
        FROM consultations c
        JOIN patients p ON c.patient_id = p.id
        JOIN anamnesis a ON c.anamnesis_id = a.id
        WHERE c.id = $1
      `
      
      const result = await client.query(query, [id])
      
      if (result.rows.length === 0) {
        return null
      }
      
      const row = result.rows[0]
      const consultation = ConsultationModel.fromDatabaseRow(row)
      
      return {
        ...consultation,
        patientName: row.patient_name,
        patientDateOfBirth: row.patient_date_of_birth,
        reasonForVisit: row.reason_for_visit,
        symptoms: row.symptoms,
        duration: row.duration,
        aiSummary: row.ai_summary,
        aiRecommendations: row.ai_recommendations ? JSON.parse(row.ai_recommendations) : []
      }
    })
  }

  // Find consultations by status
  static async findByStatus(status: ConsultationStatus, limit: number = 50): Promise<ConsultationWithDetails[]> {
    return withDatabase(async (client: PoolClient) => {
      const query = `
        SELECT 
          c.id, c.patient_id, c.anamnesis_id, c.status, c.doctor_notes, c.reviewed_at, c.created_at,
          p.name as patient_name, p.date_of_birth as patient_date_of_birth,
          a.reason_for_visit, a.symptoms, a.duration, a.ai_summary, a.ai_recommendations
        FROM consultations c
        JOIN patients p ON c.patient_id = p.id
        JOIN anamnesis a ON c.anamnesis_id = a.id
        WHERE c.status = $1
        ORDER BY c.created_at DESC
        LIMIT $2
      `
      
      const result = await client.query(query, [status, limit])
      
      return result.rows.map(row => {
        const consultation = ConsultationModel.fromDatabaseRow(row)
        return {
          ...consultation,
          patientName: row.patient_name,
          patientDateOfBirth: row.patient_date_of_birth,
          reasonForVisit: row.reason_for_visit,
          symptoms: row.symptoms,
          duration: row.duration,
          aiSummary: row.ai_summary,
          aiRecommendations: row.ai_recommendations ? JSON.parse(row.ai_recommendations) : []
        }
      })
    })
  }

  // Find all consultations with pagination and filtering
  static async findAll(options: {
    page?: number
    limit?: number
    status?: ConsultationStatus
    patientId?: string
  } = {}): Promise<{
    consultations: ConsultationWithDetails[]
    total: number
    page: number
    totalPages: number
  }> {
    const { page = 1, limit = 20, status, patientId } = options
    
    return withDatabase(async (client: PoolClient) => {
      const offset = (page - 1) * limit
      const conditions: string[] = []
      const values: any[] = []
      let paramIndex = 1
      
      if (status) {
        conditions.push(`c.status = $${paramIndex}`)
        values.push(status)
        paramIndex++
      }
      
      if (patientId) {
        conditions.push(`c.patient_id = $${paramIndex}`)
        values.push(patientId)
        paramIndex++
      }
      
      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
      
      // Get total count
      const countQuery = `
        SELECT COUNT(*) 
        FROM consultations c
        ${whereClause}
      `
      const countResult = await client.query(countQuery, values)
      const total = parseInt(countResult.rows[0].count)
      
      // Get consultations
      const query = `
        SELECT 
          c.id, c.patient_id, c.anamnesis_id, c.status, c.doctor_notes, c.reviewed_at, c.created_at,
          p.name as patient_name, p.date_of_birth as patient_date_of_birth,
          a.reason_for_visit, a.symptoms, a.duration, a.ai_summary, a.ai_recommendations
        FROM consultations c
        JOIN patients p ON c.patient_id = p.id
        JOIN anamnesis a ON c.anamnesis_id = a.id
        ${whereClause}
        ORDER BY c.created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `
      
      values.push(limit, offset)
      const result = await client.query(query, values)
      
      const consultations = result.rows.map(row => {
        const consultation = ConsultationModel.fromDatabaseRow(row)
        return {
          ...consultation,
          patientName: row.patient_name,
          patientDateOfBirth: row.patient_date_of_birth,
          reasonForVisit: row.reason_for_visit,
          symptoms: row.symptoms,
          duration: row.duration,
          aiSummary: row.ai_summary,
          aiRecommendations: row.ai_recommendations ? JSON.parse(row.ai_recommendations) : []
        }
      })
      
      return {
        consultations,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      }
    })
  }

  // Update consultation status
  static async updateStatus(id: string, newStatus: ConsultationStatus, doctorNotes?: string): Promise<Consultation | null> {
    return withTransaction(async (client: PoolClient) => {
      // Get current consultation for validation and audit logging
      const currentConsultation = await this.findById(id)
      if (!currentConsultation) {
        return null
      }
      
      // Validate status transition
      if (!ConsultationModel.isValidStatusTransition(currentConsultation.status, newStatus)) {
        throw new Error(`Invalid status transition from ${currentConsultation.status} to ${newStatus}`)
      }
      
      const updateFields = ['status = $2']
      const values = [id, newStatus]
      let paramIndex = 3
      
      if (doctorNotes !== undefined) {
        updateFields.push(`doctor_notes = $${paramIndex}`)
        values.push(doctorNotes)
        paramIndex++
      }
      
      // Set reviewed_at timestamp when marking as completed
      if (newStatus === 'completed') {
        updateFields.push('reviewed_at = CURRENT_TIMESTAMP')
      }
      
      const query = `
        UPDATE consultations
        SET ${updateFields.join(', ')}
        WHERE id = $1
        RETURNING id, patient_id, anamnesis_id, status, doctor_notes, reviewed_at, created_at
      `
      
      const result = await client.query(query, values)
      
      if (result.rows.length === 0) {
        return null
      }
      
      const updatedConsultation = ConsultationModel.fromDatabaseRow(result.rows[0])
      
      // Log the update
      await AuditLogger.log(client, {
        tableName: 'consultations',
        recordId: id,
        action: 'UPDATE',
        oldValues: {
          status: currentConsultation.status,
          doctorNotes: currentConsultation.doctorNotes
        },
        newValues: {
          status: updatedConsultation.status,
          doctorNotes: updatedConsultation.doctorNotes
        },
        userId: 'system' // TODO: Get from auth context
      })
      
      return updatedConsultation
    })
  }

  // Add or update doctor notes
  static async updateDoctorNotes(id: string, notes: string): Promise<Consultation | null> {
    return withTransaction(async (client: PoolClient) => {
      const currentConsultation = await this.findById(id)
      if (!currentConsultation) {
        return null
      }
      
      const query = `
        UPDATE consultations
        SET doctor_notes = $2
        WHERE id = $1
        RETURNING id, patient_id, anamnesis_id, status, doctor_notes, reviewed_at, created_at
      `
      
      const result = await client.query(query, [id, notes])
      
      if (result.rows.length === 0) {
        return null
      }
      
      const updatedConsultation = ConsultationModel.fromDatabaseRow(result.rows[0])
      
      // Log the update
      await AuditLogger.log(client, {
        tableName: 'consultations',
        recordId: id,
        action: 'UPDATE',
        oldValues: { doctorNotes: currentConsultation.doctorNotes },
        newValues: { doctorNotes: updatedConsultation.doctorNotes },
        userId: 'system' // TODO: Get from auth context
      })
      
      return updatedConsultation
    })
  }

  // Delete consultation
  static async delete(id: string): Promise<boolean> {
    return withTransaction(async (client: PoolClient) => {
      // Get consultation data for audit logging
      const consultation = await this.findById(id)
      if (!consultation) {
        return false
      }
      
      const query = 'DELETE FROM consultations WHERE id = $1'
      const result = await client.query(query, [id])
      
      if (result.rowCount === 0) {
        return false
      }
      
      // Log the deletion
      await AuditLogger.log(client, {
        tableName: 'consultations',
        recordId: id,
        action: 'DELETE',
        oldValues: {
          patientId: consultation.patientId,
          anamnesisId: consultation.anamnesisId,
          status: consultation.status
        },
        userId: 'system' // TODO: Get from auth context
      })
      
      return true
    })
  }

  // Get consultation statistics
  static async getStatistics(): Promise<{
    total: number
    pending: number
    inProgress: number
    completed: number
    cancelled: number
  }> {
    return withDatabase(async (client: PoolClient) => {
      const query = `
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
          COUNT(CASE WHEN status = 'in-progress' THEN 1 END) as in_progress,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
          COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled
        FROM consultations
      `
      
      const result = await client.query(query)
      const row = result.rows[0]
      
      return {
        total: parseInt(row.total),
        pending: parseInt(row.pending),
        inProgress: parseInt(row.in_progress),
        completed: parseInt(row.completed),
        cancelled: parseInt(row.cancelled)
      }
    })
  }
}