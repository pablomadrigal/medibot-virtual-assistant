import { SupabaseClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '../lib/supabase/server';
import { Consultation, CreateConsultationData, ConsultationModel, ConsultationStatus } from '../models/Consultation';
import { AuditLogger } from '../lib/audit';

export interface ConsultationWithDetails extends Consultation {
  patientName: string;
  patientDateOfBirth: string;
  reasonForVisit: string;
  symptoms: string;
  duration: string;
  aiSummary?: string;
  aiRecommendations?: any;
}

export class ConsultationRepository {
  private static getSupabase(): SupabaseClient {
    return createServerSupabaseClient();
  }

  static async create(consultationData: CreateConsultationData, userId: string): Promise<Consultation> {
    const supabase = this.getSupabase();
    const validatedData = ConsultationModel.validateCreate(consultationData);
    const dbRow = ConsultationModel.toDatabaseRow(validatedData);

    const { data, error } = await supabase
      .from('consultations')
      .insert(dbRow)
      .select()
      .single();

    if (error) {
      console.error('Error creating consultation:', error);
      throw new Error('Failed to create consultation.');
    }

    const consultation = ConsultationModel.fromDatabaseRow(data);

    await AuditLogger.log(supabase, {
      tableName: 'consultations',
      recordId: consultation.id!,
      action: 'CREATE',
      newValues: { patientId: consultation.patientId, status: consultation.status },
      userId,
    });

    return consultation;
  }

  static async findById(id: string): Promise<Consultation | null> {
    const supabase = this.getSupabase();
    const { data, error } = await supabase
      .from('consultations')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error finding consultation by ID:', error);
      throw new Error('Failed to find consultation.');
    }

    return data ? ConsultationModel.fromDatabaseRow(data) : null;
  }

  static async findByIdWithDetails(id: string): Promise<ConsultationWithDetails | null> {
    const supabase = this.getSupabase();
    const { data, error } = await supabase
      .from('consultations')
      .select(`
        *,
        patient:patients (name, date_of_birth),
        anamnesis:anamnesis (*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error finding consultation with details:', error);
      if (error.code === 'PGRST116') return null;
      throw new Error('Failed to fetch consultation details.');
    }

    if (!data) return null;

    return this.mapToWithDetails(data);
  }

  static async updateStatus(id: string, newStatus: ConsultationStatus, userId: string, doctorNotes?: string): Promise<Consultation | null> {
    const supabase = this.getSupabase();
    const currentConsultation = await this.findById(id);
    if (!currentConsultation) {
      return null;
    }

    if (!ConsultationModel.isValidStatusTransition(currentConsultation.status, newStatus)) {
      throw new Error(`Invalid status transition from ${currentConsultation.status} to ${newStatus}`);
    }

    const updatePayload: any = { status: newStatus };
    if (doctorNotes !== undefined) {
      updatePayload.doctor_notes = doctorNotes;
    }
    if (newStatus === 'completed') {
      updatePayload.reviewed_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('consultations')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating consultation status:', error);
      throw new Error('Failed to update consultation status.');
    }

    const updatedConsultation = ConsultationModel.fromDatabaseRow(data);

    await AuditLogger.log(supabase, {
      tableName: 'consultations',
      recordId: id,
      action: 'UPDATE',
      oldValues: { status: currentConsultation.status },
      newValues: { status: updatedConsultation.status },
      userId,
    });

    return updatedConsultation;
  }

  static async delete(id: string, userId: string): Promise<boolean> {
    const supabase = this.getSupabase();
    const consultation = await this.findById(id);
    if (!consultation) {
      return false;
    }

    const { error } = await supabase.from('consultations').delete().eq('id', id);

    if (error) {
      console.error('Error deleting consultation:', error);
      return false;
    }

    await AuditLogger.log(supabase, {
      tableName: 'consultations',
      recordId: id,
      action: 'DELETE',
      oldValues: { status: consultation.status },
      userId,
    });

    return true;
  }
  
  private static mapToWithDetails(row: any): ConsultationWithDetails {
    const consultation = ConsultationModel.fromDatabaseRow(row);
    return {
      ...consultation,
      patientName: (row.patient as any)?.name || 'N/A',
      patientDateOfBirth: (row.patient as any)?.date_of_birth || 'N/A',
      reasonForVisit: (row.anamnesis as any)?.reason_for_visit || 'N/A',
      symptoms: (row.anamnesis as any)?.symptoms || 'N/A',
      duration: (row.anamnesis as any)?.duration || 'N/A',
      aiSummary: (row.anamnesis as any)?.ai_summary,
      aiRecommendations: (row.anamnesis as any)?.ai_recommendations || [],
    };
  }
}