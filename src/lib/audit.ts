import { PoolClient } from 'pg'

export interface AuditLogEntry {
  tableName: string
  recordId: string
  action: 'CREATE' | 'UPDATE' | 'DELETE'
  oldValues?: any
  newValues?: any
  userId?: string
}

export class AuditLogger {
  // Log an audit entry
  static async log(client: PoolClient, entry: AuditLogEntry): Promise<void> {
    const query = `
      INSERT INTO audit_log (table_name, record_id, action, old_values, new_values, user_id)
      VALUES ($1, $2, $3, $4, $5, $6)
    `
    
    await client.query(query, [
      entry.tableName,
      entry.recordId,
      entry.action,
      entry.oldValues ? JSON.stringify(entry.oldValues) : null,
      entry.newValues ? JSON.stringify(entry.newValues) : null,
      entry.userId || 'system'
    ])
  }

  // Get audit trail for a specific record
  static async getAuditTrail(tableName: string, recordId: string): Promise<AuditLogEntry[]> {
    const query = `
      SELECT table_name, record_id, action, old_values, new_values, user_id, timestamp
      FROM audit_log
      WHERE table_name = $1 AND record_id = $2
      ORDER BY timestamp DESC
    `
    
    // This would need to be called within a database context
    // For now, returning empty array as placeholder
    return []
  }
}