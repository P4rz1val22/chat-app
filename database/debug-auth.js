import { createPool } from "../src/lib/db.js";

async function checkAuthTables() {
  const pool = createPool();

  try {
    console.log("🔍 Checking auth tables...");

    // Check if tables exist
    const tables = await pool.query(`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename IN ('users', 'accounts', 'sessions', 'verification_tokens')
      ORDER BY tablename;
    `);

    console.log(
      "📋 Auth tables found:",
      tables.rows.map((r) => r.tablename)
    );

    // Check users table
    const users = await pool.query("SELECT * FROM users");
    console.log("👤 Users in database:", users.rows.length);

    // Check accounts table
    const accounts = await pool.query("SELECT * FROM accounts");
    console.log("🔗 Accounts in database:", accounts.rows.length);

    if (users.rows.length > 0) {
      console.log("👤 User data:", users.rows[0]);
    }

    if (accounts.rows.length > 0) {
      console.log("🔗 Account data:", accounts.rows[0]);
    }
  } catch (error) {
    console.error("❌ Database error:", error.message);
  } finally {
    await pool.end();
  }
}

checkAuthTables();
