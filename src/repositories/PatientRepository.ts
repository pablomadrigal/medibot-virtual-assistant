import { PoolClient } from 'pg'
import { withDatabase, withTransaction } from '../lib/database'
import { Patient, CreatePatientData, PatientModel } from '../models/Patient'
import { AuditLogger } from '../lib/audit'

export class PatientRepository {
  // Create a new patient
  static async create(patientData: CreatePatientData): Promise<Patient> {
    // Validate input data
    const validatedData = PatientModel.validateCreate(patientData)
    
    return withTransaction(async (client: PoolClient) => {
      const dbRow = PatientModel.toDatabaseRow(validatedData)
      
      const query = `
        INSERT INTO patients (name, date_of_birth, encrypted_data)
        VALUES ($1, $2, $3)
        RETURNING id, name, date_of_birth, created_at, updated_at, encrypted_data
      `
      
      const result = await client.query(query, [
        dbRow.name,
        dbRow.date_of_birth,
        dbRow.encrypted_data
      ])
      
      const patient = PatientModel.fromDatabaseRow(result.rows[0])
      
      // Log the creation
      await AuditLogger.log(client, {
        tableName: 'patients',
        recordId: patient.id!,
        action: 'CREATE',
        newValues: { name: patient.name, dateOfBirth: patient.dateOfBirth },
        userId: 'system' // TODO: Get from auth context
      })
      
      return patient
    })
  }

  // Find patient by ID
  static async findById(id: string): Promise<Patient | null> {
    return withDatabase(async (client: PoolClient) => {
      const query = `
        SELECT id, name, date_of_birth, created_at, updated_at, encrypted_data
        FROM patients
        WHERE id = $1
      `
      
      const result = await client.query(query, [id])
      
      if (result.rows.length === 0) {
        return null
      }
      
      return PatientModel.fromDatabaseRow(result.rows[0])
    })
  }

  // Find patients by name (partial match)
  static async findByName(name: string, limit: number = 10): Promise<Patient[]> {
    return withDatabase(async (client: PoolClient) => {
      const query = `
        SELECT id, name, date_of_birth, created_at, updated_at, encrypted_data
        FROM patients
        WHERE name ILIKE $1
        ORDER BY name
        LIMIT $2
      `
      
      const result = await client.query(query, [`%${name}%`, limit])
      
      return result.rows.map(row => PatientModel.fromDatabaseRow(row))
    })
  }

  // Get all patients with pagination
  static async findAll(page: number = 1, limit: number = 20): Promise<{
    patients: Patient[]
    total: number
    page: number
    totalPages: number
  }> {
    return withDatabase(async (client: PoolClient) => {
      const offset = (page - 1) * limit
      
      // Get total count
      const countQuery = 'SELECT COUNT(*) FROM patients'
      const countResult = await client.query(countQuery)
      const total = parseInt(countResult.rows[0].count)
      
      // Get patients
      const query = `
        SELECT id, name, date_of_birth, created_at, updated_at, encrypted_data
        FROM patients
        ORDER BY created_at DESC
        LIMIT $1 OFFSET $2
      `
      
      const result = await client.query(query, [limit, offset])
      const patients = result.rows.map(row => PatientModel.fromDatabaseRow(row))
      
      return {
        patients,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      }
    })
  }

  // Update patient
  static async update(id: string, updateData: Partial<CreatePatientData>): Promise<Patient | null> {
    return withTransaction(async (client: PoolClient) => {
      // First, get the current patient data for audit logging
      const currentPatient = await this.findById(id)
      if (!currentPatient) {
        return null
      }
      
      const dbRow = PatientModel.toDatabaseRow(updateData as CreatePatientData)
      const updateFields: string[] = []
      const values: any[] = []
      let paramIndex = 1
      
      if (updateData.name !== undefined) {
        updateFields.push(`name = $${paramIndex}`)
        values.push(dbRow.name)
        paramIndex++
      }
      
      if (updateData.dateOfBirth !== undefined) {
        updateFields.push(`date_of_birth = $${paramIndex}`)
        values.push(dbRow.date_of_birth)
        paramIndex++
      }
      
      if (updateFields.length === 0) {
        return currentPatient // No updates needed
      }
      
      updateFields.push(`updated_at = CURRENT_TIMESTAMP`)
      values.push(id)
      
      const query = `
        UPDATE patients
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING id, name, date_of_birth, created_at, updated_at, encrypted_data
      `
      
      const result = await client.query(query, values)
      
      if (result.rows.length === 0) {
        return null
      }
      
      const updatedPatient = PatientModel.fromDatabaseRow(result.rows[0])
      
      // Log the update
      await AuditLogger.log(client, {
        tableName: 'patients',
        recordId: id,
        action: 'UPDATE',
        oldValues: { name: currentPatient.name, dateOfBirth: currentPatient.dateOfBirth },
        newValues: { name: updatedPatient.name, dateOfBirth: updatedPatient.dateOfBirth },
        userId: 'system' // TODO: Get from auth context
      })
      
      return updatedPatient
    })
  }

  // Delete patient (soft delete by setting a deleted_at timestamp)
  static async delete(id: string): Promise<boolean> {
    return withTransaction(async (client: PoolClient) => {
      // Get patient data for audit logging
      const patient = await this.findById(id)
      if (!patient) {
        return false
      }
      
      const query = 'DELETE FROM patients WHERE id = $1'
      const result = await client.query(query, [id])
      
      if (result.rowCount === 0) {
        return false
      }
      
      // Log the deletion
      await AuditLogger.log(client, {
        tableName: 'patients',
        recordId: id,
        action: 'DELETE',
        oldValues: { name: patient.name, dateOfBirth: patient.dateOfBirth },
        userId: 'system' // TODO: Get from auth context
      })
      
      return true
    })
  }

  // Check if patient exists
  static async exists(id: string): Promise<boolean> {
    return withDatabase(async (client: PoolClient) => {
      const query = 'SELECT 1 FROM patients WHERE id = $1'
      const result = await client.query(query, [id])
      return result.rows.length > 0
    })
  }
}