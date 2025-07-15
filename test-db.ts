// test-db.js
import { testConnection } from "./src/lib/db.js";

async function runTest() {
  console.log("Testing database connection...");
  const success = await testConnection();

  if (success) {
    console.log("✅ Database connection successful!");
  } else {
    console.log("❌ Database connection failed!");
  }

  process.exit(0);
}

runTest();
