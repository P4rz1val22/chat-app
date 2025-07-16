import { Pool } from "@neondatabase/serverless";

export function createPool() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  // For Neon, create a new pool per request (as recommended)
  return new Pool({
    connectionString: process.env.DATABASE_URL,
  });
}

// Test function (keep this for debugging)
export async function testConnection() {
  const pool = createPool();
  try {
    const result = await pool.query("SELECT NOW()");
    console.log("Database connected successfully:", result.rows[0]);
    return true;
  } catch (error) {
    console.error("Database connection failed:", error);
    return false;
  } finally {
    await pool.end();
  }
}
