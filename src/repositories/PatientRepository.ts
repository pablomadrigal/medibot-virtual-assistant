import { SupabaseClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '../lib/supabase/server';
import { Patient, CreatePatientData, PatientModel } from '../models/Patient';
import { AuditLogger } from '../lib/audit';

export class PatientRepository {
  private static getSupabase(): SupabaseClient {
    return createServerSupabaseClient();
  }

  static async create(patientData: CreatePatientData, userId: string): Promise<Patient> {
    const supabase = this.getSupabase();
    const validatedData = PatientModel.validateCreate(patientData);
    const dbRow = PatientModel.toDatabaseRow(validatedData);

    const { data, error } = await supabase
      .from('patients')
      .insert({
        id: userId, // Align with auth user
        name: dbRow.name,
        date_of_birth: dbRow.date_of_birth,
        encrypted_data: dbRow.encrypted_data,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating patient:', error);
      throw new Error('Failed to create patient.');
    }

    const patient = PatientModel.fromDatabaseRow(data);

    await AuditLogger.log(supabase, {
      tableName: 'patients',
      recordId: patient.id!,
      action: 'CREATE',
      newValues: { name: patient.name, dateOfBirth: patient.dateOfBirth },
      userId: userId,
    });

    return patient;
  }

  static async findById(id: string): Promise<Patient | null> {
    const supabase = this.getSupabase();
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error finding patient by ID:', error);
      throw new Error('Failed to find patient.');
    }

    return data ? PatientModel.fromDatabaseRow(data) : null;
  }

  static async findByName(name: string, limit: number = 10): Promise<Patient[]> {
    const supabase = this.getSupabase();
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .ilike('name', `%${name}%`)
      .limit(limit);

    if (error) {
      console.error('Error finding patients by name:', error);
      throw new Error('Failed to find patients.');
    }

    return data.map(row => PatientModel.fromDatabaseRow(row));
  }

  static async findAll(page: number = 1, limit: number = 20): Promise<{
    patients: Patient[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const supabase = this.getSupabase();
    const offset = (page - 1) * limit;

    const { data, error, count } = await supabase
      .from('patients')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error finding all patients:', error);
      throw new Error('Failed to find all patients.');
    }

    const total = count ?? 0;
    const patients = data.map(row => PatientModel.fromDatabaseRow(row));

    return {
      patients,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  static async update(id: string, updateData: Partial<CreatePatientData>, userId: string): Promise<Patient | null> {
    const supabase = this.getSupabase();
    const currentPatient = await this.findById(id);
    if (!currentPatient) {
      return null;
    }

    const dbRow = PatientModel.toDatabaseRow(updateData as CreatePatientData);

    const { data, error } = await supabase
      .from('patients')
      .update({
        name: dbRow.name,
        date_of_birth: dbRow.date_of_birth,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating patient:', error);
      throw new Error('Failed to update patient.');
    }

    const updatedPatient = PatientModel.fromDatabaseRow(data);

    await AuditLogger.log(supabase, {
      tableName: 'patients',
      recordId: id,
      action: 'UPDATE',
      oldValues: { name: currentPatient.name, dateOfBirth: currentPatient.dateOfBirth },
      newValues: { name: updatedPatient.name, dateOfBirth: updatedPatient.dateOfBirth },
      userId: userId,
    });

    return updatedPatient;
  }

  static async delete(id: string, userId: string): Promise<boolean> {
    const supabase = this.getSupabase();
    const patient = await this.findById(id);
    if (!patient) {
      return false;
    }

    const { error } = await supabase.from('patients').delete().eq('id', id);

    if (error) {
      console.error('Error deleting patient:', error);
      return false;
    }
    
    await AuditLogger.log(supabase, {
        tableName: 'patients',
        recordId: id,
        action: 'DELETE',
        oldValues: { name: patient.name, dateOfBirth: patient.dateOfBirth },
        userId: userId,
    });

    return true;
  }

  static async exists(id: string): Promise<boolean> {
    const supabase = this.getSupabase();
    const { data, error } = await supabase
      .from('patients')
      .select('id')
      .eq('id', id)
      .limit(1);

    if (error) {
        console.error('Error checking if patient exists:', error);
    }

    return data ? data.length > 0 : false;
  }
}