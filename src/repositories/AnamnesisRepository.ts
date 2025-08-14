import { SupabaseClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '../lib/supabase/server';
import { Anamnesis, CreateAnamnesisData, AnamnesisModel } from '../models/Anamnesis';
import { AuditLogger } from '../lib/audit';

export class AnamnesisRepository {
  private static getSupabase(): SupabaseClient {
    return createServerSupabaseClient();
  }

  static async create(anamnesisData: CreateAnamnesisData, userId: string): Promise<Anamnesis> {
    const supabase = this.getSupabase();
    const validatedData = AnamnesisModel.validateCreate(anamnesisData);
    const dbRow = AnamnesisModel.toDatabaseRow(validatedData);

    const { data, error } = await supabase
      .from('anamnesis')
      .insert(dbRow)
      .select()
      .single();

    if (error) {
      console.error('Error creating anamnesis:', error);
      throw new Error('Failed to create anamnesis record.');
    }

    const anamnesis = AnamnesisModel.fromDatabaseRow(data);

    await AuditLogger.log(supabase, {
      tableName: 'anamnesis',
      recordId: anamnesis.id!,
      action: 'CREATE',
      newValues: {
        patientId: anamnesis.patientId,
        reasonForVisit: anamnesis.reasonForVisit,
      },
      userId,
    });

    return anamnesis;
  }

  static async findById(id: string): Promise<Anamnesis | null> {
    const supabase = this.getSupabase();
    const { data, error } = await supabase
      .from('anamnesis')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
        console.error('Error finding anamnesis by ID:', error);
        throw new Error('Failed to find anamnesis record.');
    }

    return data ? AnamnesisModel.fromDatabaseRow(data) : null;
  }

  static async findByPatientId(patientId: string): Promise<Anamnesis[]> {
    const supabase = this.getSupabase();
    const { data, error } = await supabase
      .from('anamnesis')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });

    if (error) {
        console.error('Error finding anamnesis by patient ID:', error);
        throw new Error('Failed to find anamnesis records for patient.');
    }

    return data.map(row => AnamnesisModel.fromDatabaseRow(row));
  }
  
  static async update(id: string, updateData: Partial<CreateAnamnesisData>, userId: string): Promise<Anamnesis | null> {
    const supabase = this.getSupabase();
    const currentAnamnesis = await this.findById(id);
    if (!currentAnamnesis) {
        return null;
    }

    const dbRow = AnamnesisModel.toDatabaseRow(updateData as CreateAnamnesisData);

    const { data, error } = await supabase
      .from('anamnesis')
      .update(dbRow)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating anamnesis:', error);
      throw new Error('Failed to update anamnesis record.');
    }

    const updatedAnamnesis = AnamnesisModel.fromDatabaseRow(data);

    await AuditLogger.log(supabase, {
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
        userId,
    });

    return updatedAnamnesis;
  }

  static async delete(id: string, userId: string): Promise<boolean> {
    const supabase = this.getSupabase();
    const anamnesis = await this.findById(id);
    if (!anamnesis) {
        return false;
    }

    const { error } = await supabase.from('anamnesis').delete().eq('id', id);

    if (error) {
      console.error('Error deleting anamnesis:', error);
      return false;
    }

    await AuditLogger.log(supabase, {
        tableName: 'anamnesis',
        recordId: id,
        action: 'DELETE',
        oldValues: {
            patientId: anamnesis.patientId,
            reasonForVisit: anamnesis.reasonForVisit,
        },
        userId,
    });

    return true;
  }

  static async findWithPatientInfo(id: string): Promise<(Anamnesis & { patientName: string; patientDateOfBirth: string }) | null> {
    const supabase = this.getSupabase();
    const { data, error } = await supabase
      .from('anamnesis')
      .select(`
        *,
        patient:patients (
          name,
          date_of_birth
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error finding anamnesis with patient info:', error);
      if (error.code === 'PGRST116') return null; // Not found
      throw new Error('Failed to fetch anamnesis with patient details.');
    }

    if (!data) return null;

    const { patient, ...anamnesisData } = data;
    const anamnesis = AnamnesisModel.fromDatabaseRow(anamnesisData);

    return {
      ...anamnesis,
      patientName: (patient as any)?.name || 'N/A',
      patientDateOfBirth: (patient as any)?.date_of_birth || 'N/A',
    };
  }
}