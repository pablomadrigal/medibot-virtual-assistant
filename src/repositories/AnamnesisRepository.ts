import { PoolClient } from 'pg'
import { withDatabase, withTransaction } from '../lib/database'
import { Anamnesis, CreateAnamnesisData, AnamnesisModel } from '../models/Anamnesis'
import { AuditLogger } from '../lib/audit'

export class AnamnesisRepository {
  // Create a new anamnesis record
  static async create(anamnesisData: CreateAnamnesisData): Promise<Anamnesis> {
    // Validate input data
    const validatedData = AnamnesisModel.validateCreate(anamnesisData)
    
    return withTransaction(async (client: PoolClient) => {
      const dbRow = AnamnesisModel.toDatabaseRow(validatedData)
      
      const query = `
        INSERT INTO anamnesis (patient_id, reason_for_visit, symptoms, duration, ai_summary, ai_recommendations)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, patient_id, reason_for_visit, symptoms, duration, ai_summary, ai_recommendations, created_at
      `
      
      const result = await client.query(query, [
        dbRow.patient_id,
        dbRow.reason_for_visit,
        dbRow.symptoms,
        dbRow.duration,
        dbRow.ai_summary,
        dbRow.ai_recommendations
      ])
      
      const anamnesis = AnamnesisModel.fromDatabaseRow(result.rows[0])
      
      // Log the creation
      await AuditLogger.log(client, {
        tableName: 'anamnesis',
        recordId: anamnesis.id!,
        action: 'CREATE',
        newValues: {
          patientId: anamnesis.patientId,
          reasonForVisit: anamnesis.reasonForVisit,
          symptoms: anamnesis.symptoms
        },
        userId: 'system' // TODO: Get from auth context
      })
      
      return anamnesis
    })
  }

  // Find anamnesis by ID
  static async findById(id: string): Promise<Anamnesis | null> {
    return withDatabase(async (client: PoolClient) => {
      const query = `
        SELECT id, patient_id, reason_for_visit, symptoms, duration, ai_summary, ai_recommendations, created_at
        FROM anamnesis
        WHERE id = $1
      `
      
      const result = await client.query(query, [id])
      
      if (result.rows.length === 0) {
        return null
      }
      
      return AnamnesisModel.fromDatabaseRow(result.rows[0])
    })
  }

  // Find all anamnesis records for a patient
  static async findByPatientId(patientId: string): Promise<Anamnesis[]> {
    return withDatabase(async (client: PoolClient) => {
      const query = `
        SELECT id, patient_id, reason_for_visit, symptoms, duration, ai_summary, ai_recommendations, created_at
        FROM anamnesis
        WHERE patient_id = $1
        ORDER BY created_at DESC
      `
      
      const result = await client.query(query, [patientId])
      
      return result.rows.map(row => AnamnesisModel.fromDatabaseRow(row))
    })
  }

  // Find recent anamnesis records
  static async findRecent(limit: number = 10): Promise<Anamnesis[]> {
    return withDatabase(async (client: PoolClient) => {
      const query = `
        SELECT id, patient_id, reason_for_visit, symptoms, duration, ai_summary, ai_recommendations, created_at
        FROM anamnesis
        ORDER BY created_at DESC
        LIMIT $1
      `
      
      const result = await client.query(query, [limit])
      
      return result.rows.map(row => AnamnesisModel.fromDatabaseRow(row))
    })
  }

  // Search anamnesis by symptoms or reason
  static async search(searchTerm: string, limit: number = 20): Promise<Anamnesis[]> {
    return withDatabase(async (client: PoolClient) => {
      const query = `
        SELECT id, patient_id, reason_for_visit, symptoms, duration, ai_summary, ai_recommendations, created_at
        FROM anamnesis
        WHERE reason_for_visit ILIKE $1 OR symptoms ILIKE $1
        ORDER BY created_at DESC
        LIMIT $2
      `
      
      const result = await client.query(query, [`%${searchTerm}%`, limit])
      
      return result.rows.map(row => AnamnesisModel.fromDatabaseRow(row))
    })
  }

  // Update anamnesis record (typically for AI summary and recommendations)
  static async update(id: string, updateData: Partial<CreateAnamnesisData>): Promise<Anamnesis | null> {
    return withTransaction(async (client: PoolClient) => {
      // First, get the current anamnesis data for audit logging
      const currentAnamnesis = await this.findById(id)
      if (!currentAnamnesis) {
        return null
      }
      
      const dbRow = AnamnesisModel.toDatabaseRow(updateData as CreateAnamnesisData)
      const updateFields: string[] = []
      const values: any[] = []
      let paramIndex = 1
      
      if (updateData.reasonForVisit !== undefined) {
        updateFields.push(`reason_for_visit = $${paramIndex}`)
        values.push(dbRow.reason_for_visit)
        paramIndex++
      }
      
      if (updateData.symptoms !== undefined) {
        updateFields.push(`symptoms = $${paramIndex}`)
        values.push(dbRow.symptoms)
        paramIndex++
      }
      
      if (updateData.duration !== undefined) {
        updateFields.push(`duration = $${paramIndex}`)
        values.push(dbRow.duration)
        paramIndex++
      }
      
      if (updateData.aiSummary !== undefined) {
        updateFields.push(`ai_summary = $${paramIndex}`)
        values.push(dbRow.ai_summary)
        paramIndex++
      }
      
      if (updateData.aiRecommendations !== undefined) {
        updateFields.push(`ai_recommendations = $${paramIndex}`)
        values.push(dbRow.ai_recommendations)
        paramIndex++
      }
      
      if (updateFields.length === 0) {
        return currentAnamnesis // No updates needed
      }
      
      values.push(id)
      
      const query = `
        UPDATE anamnesis
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING id, patient_id, reason_for_visit, symptoms, duration, ai_summary, ai_recommendations, created_at
      `
      
      const result = await client.query(query, values)
      
      if (result.rows.length === 0) {
        return null
      }
      
      const updatedAnamnesis = AnamnesisModel.fromDatabaseRow(result.rows[0])
      
      // Log the update
      await AuditLogger.log(client, {
        tableName: 'anamnesis',
        recordId: id,
        action: 'UPDATE',
        oldValues: {
          reasonForVisit: currentAnamnesis.reasonForVisit,
          symptoms: currentAnamnesis.symptoms,
          aiSummary: currentAnamnesis.aiSummary
        },
        newValues: {
          reasonForVisit: updatedAnamnesis.reasonForVisit,
          symptoms: updatedAnamnesis.symptoms,
          aiSummary: updatedAnamnesis.aiSummary
        },
        userId: 'system' // TODO: Get from auth context
      })
      
      return updatedAnamnesis
    })
  }

  // Delete anamnesis record
  static async delete(id: string): Promise<boolean> {
    return withTransaction(async (client: PoolClient) => {
      // Get anamnesis data for audit logging
      const anamnesis = await this.findById(id)
      if (!anamnesis) {
        return false
      }
      
      const query = 'DELETE FROM anamnesis WHERE id = $1'
      const result = await client.query(query, [id])
      
      if (result.rowCount === 0) {
        return false
      }
      
      // Log the deletion
      await AuditLogger.log(client, {
        tableName: 'anamnesis',
        recordId: id,
        action: 'DELETE',
        oldValues: {
          patientId: anamnesis.patientId,
          reasonForVisit: anamnesis.reasonForVisit,
          symptoms: anamnesis.symptoms
        },
        userId: 'system' // TODO: Get from auth context
      })
      
      return true
    })
  }

  // Get anamnesis with patient information (JOIN query)
  static async findWithPatientInfo(id: string): Promise<(Anamnesis & { patientName: string; patientDateOfBirth: string }) | null> {
    return withDatabase(async (client: PoolClient) => {
      const query = `
        SELECT 
          a.id, a.patient_id, a.reason_for_visit, a.symptoms, a.duration, 
          a.ai_summary, a.ai_recommendations, a.created_at,
          p.name as patient_name, p.date_of_birth as patient_date_of_birth
        FROM anamnesis a
        JOIN patients p ON a.patient_id = p.id
        WHERE a.id = $1
      `
      
      const result = await client.query(query, [id])
      
      if (result.rows.length === 0) {
        return null
      }
      
      const row = result.rows[0]
      const anamnesis = AnamnesisModel.fromDatabaseRow(row)
      
      return {
        ...anamnesis,
        patientName: row.patient_name,
        patientDateOfBirth: row.patient_date_of_birth
      }
    })
  }
}