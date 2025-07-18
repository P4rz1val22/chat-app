// lib/db.ts - FIXED VERSION
import { Pool, PoolClient } from "pg";

// Global connection pool - created once, reused forever
let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,

      // Connection pool settings
      max: 20, // Maximum connections in pool
      idleTimeoutMillis: 30000, // Close idle connections after 30s
      connectionTimeoutMillis: 2000, // Wait 2s for connection

      // Required for Neon
      ssl: {
        rejectUnauthorized: false,
      },
    });

    // Log pool events (helpful for debugging)
    pool.on("connect", () => {
      console.log("🔗 Database connected");
    });

    pool.on("error", (err) => {
      console.error("❌ Database pool error:", err);
    });

    console.log("🏊 Database pool initialized");
  }

  return pool;
}

// Helper function for simple queries
export async function query(text: string, params?: any[]) {
  const pool = getPool();
  try {
    const result = await pool.query(text, params);
    return result;
  } catch (error) {
    console.error("❌ Database query error:", error);
    throw error;
  }
}

// Helper function for transactions
export async function withTransaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release(); // Return connection to pool
  }
}

// Clean shutdown (optional - for graceful shutdowns)
export async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
    console.log("🔌 Database pool closed");
  }
}

// Legacy function for backward compatibility (but now uses pool)
export function createPool() {
  return getPool();
}
