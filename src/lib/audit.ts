import { SupabaseClient } from '@supabase/supabase-js';

export interface AuditLogEntry {
  tableName: string;
  recordId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  oldValues?: any;
  newValues?: any;
  userId?: string;
}

export class AuditLogger {
  static async log(supabase: SupabaseClient, entry: AuditLogEntry): Promise<void> {
    const { error } = await supabase.from('audit_log').insert({
      table_name: entry.tableName,
      record_id: entry.recordId,
      action: entry.action,
      old_values: entry.oldValues,
      new_values: entry.newValues,
      user_id: entry.userId || 'system',
    });

    if (error) {
      console.error('Failed to write to audit log:', error);
      // Depending on requirements, you might want to throw an error
      // or handle it silently. For now, we log it.
    }
  }

  static async getAuditTrail(supabase: SupabaseClient, tableName: string, recordId: string): Promise<AuditLogEntry[]> {
    const { data, error } = await supabase
      .from('audit_log')
      .select('*')
      .eq('table_name', tableName)
      .eq('record_id', recordId)
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('Failed to fetch audit trail:', error);
      return [];
    }

    return data.map(item => ({
        tableName: item.table_name,
        recordId: item.record_id,
        action: item.action,
        oldValues: item.old_values,
        newValues: item.new_values,
        userId: item.user_id,
    }));
  }
}