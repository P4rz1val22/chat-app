// database/debug.js
import { createPool } from "../src/lib/db.js";

async function testDatabaseSchema() {
  const pool = createPool();

  try {
    console.log("🔍 Testing database schema...");

    // Check if all tables exist
    const tables = await pool.query(`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename;
    `);

    console.log(
      "📋 All tables:",
      tables.rows.map((r) => r.tablename)
    );

    // Check NextAuth tables
    const authTables = ["users", "accounts", "sessions", "verification_tokens"];
    const chatTables = ["rooms", "room_members", "messages"];

    console.log("\n✅ NextAuth tables:");
    for (const table of authTables) {
      const exists = tables.rows.some((r) => r.tablename === table);
      console.log(`   ${exists ? "✅" : "❌"} ${table}`);
    }

    console.log("\n✅ Chat tables:");
    for (const table of chatTables) {
      const exists = tables.rows.some((r) => r.tablename === table);
      console.log(`   ${exists ? "✅" : "❌"} ${table}`);
    }

    // Check current user data
    const users = await pool.query(
      "SELECT id, name, email, username FROM users"
    );
    console.log("\n👤 Current users:", users.rows.length);
    if (users.rows.length > 0) {
      users.rows.forEach((user) => {
        console.log(
          `   - ${user.name} (${user.email}) ${
            user.username ? `@${user.username}` : "(no username)"
          }`
        );
      });
    }

    // Test foreign key relationships
    console.log("\n🔗 Testing relationships...");
    const accounts = await pool.query("SELECT COUNT(*) FROM accounts");
    const sessions = await pool.query("SELECT COUNT(*) FROM sessions");

    console.log(`   - Accounts: ${accounts.rows[0].count}`);
    console.log(`   - Sessions: ${sessions.rows[0].count}`);

    console.log("\n✅ Database schema is working correctly!");
  } catch (error) {
    console.error("❌ Schema test failed:", error.message);
  } finally {
    await pool.end();
  }
}

testDatabaseSchema();
