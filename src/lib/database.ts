import { Pool, PoolClient } from 'pg'

// Database connection configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'medibot',
  user: process.env.DB_USER || 'medibot_user',
  password: process.env.DB_PASSWORD || 'medibot_password',
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
}

// Create connection pool
let pool: Pool | null = null

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool(dbConfig)
    
    // Handle pool errors
    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err)
      process.exit(-1)
    })
  }
  
  return pool
}

// Database connection utility
export async function withDatabase<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await getPool().connect()
  
  try {
    return await callback(client)
  } finally {
    client.release()
  }
}

// Transaction utility
export async function withTransaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await getPool().connect()
  
  try {
    await client.query('BEGIN')
    const result = await callback(client)
    await client.query('COMMIT')
    return result
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

// Health check function
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await withDatabase(async (client) => {
      await client.query('SELECT 1')
    })
    return true
  } catch (error) {
    console.error('Database health check failed:', error)
    return false
  }
}