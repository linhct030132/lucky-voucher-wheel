#!/usr/bin/env node

/**
 * Database Connection Test Script
 * Run this to test your database connection configuration
 */

const mysql = require("mysql2/promise");
const dotenv = require("dotenv");

dotenv.config();

// Parse DATABASE_URL for Railway deployment
function parseConnectionConfig() {
  if (process.env.DATABASE_URL) {
    try {
      const url = new URL(process.env.DATABASE_URL);
      return {
        host: url.hostname,
        port: parseInt(url.port) || 3306,
        user: url.username,
        password: url.password,
        database: url.pathname.slice(1),
        ssl: {
          rejectUnauthorized: false,
        },
      };
    } catch (error) {
      console.error("❌ Failed to parse DATABASE_URL:", error.message);
      return null;
    }
  }

  return {
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "password",
    database: process.env.DB_NAME || "lucky_voucher",
  };
}

async function testDatabaseConnection() {
  console.log("🔍 Testing database connection...\n");

  const config = parseConnectionConfig();

  if (!config) {
    console.error("❌ Invalid database configuration");
    process.exit(1);
  }

  console.log("📋 Connection Configuration:");
  console.log(`   Host: ${config.host}`);
  console.log(`   Port: ${config.port}`);
  console.log(`   User: ${config.user}`);
  console.log(`   Database: ${config.database}`);
  console.log(`   SSL: ${config.ssl ? "enabled" : "disabled"}`);
  console.log("");

  try {
    console.log("⏳ Attempting to connect...");

    const connection = await mysql.createConnection(config);

    console.log("✅ Connection successful!");

    // Test a simple query
    console.log("⏳ Testing query execution...");
    const [rows] = await connection.execute(
      "SELECT 1 as test_value, NOW() as timestamp_now"
    );
    console.log("✅ Query successful!");
    console.log("📊 Result:", rows[0]);

    // Check if our tables exist
    console.log("⏳ Checking database schema...");
    const [tables] = await connection.execute("SHOW TABLES");
    console.log(`📋 Found ${tables.length} tables in database`);

    if (tables.length > 0) {
      console.log("📋 Tables:");
      tables.forEach((table) => {
        console.log(`   - ${Object.values(table)[0]}`);
      });
    } else {
      console.log("⚠️  No tables found. You may need to run migrations.");
    }

    await connection.end();
    console.log("\n🎉 Database connection test completed successfully!");
  } catch (error) {
    console.error("\n❌ Database connection failed:");
    console.error(`   Error: ${error.message}`);
    console.error(`   Code: ${error.code || "N/A"}`);
    console.error(`   SQL State: ${error.sqlState || "N/A"}`);

    if (error.code === "ENOTFOUND") {
      console.error("\n💡 Possible causes:");
      console.error("   - Incorrect hostname");
      console.error("   - Network connectivity issues");
      console.error("   - Database service not running");
    } else if (error.code === "ER_ACCESS_DENIED_ERROR") {
      console.error("\n💡 Possible causes:");
      console.error("   - Incorrect username or password");
      console.error("   - User doesn't have access to the database");
    } else if (error.code === "ER_BAD_DB_ERROR") {
      console.error("\n💡 Possible causes:");
      console.error("   - Database name doesn't exist");
      console.error("   - Typo in database name");
    }

    process.exit(1);
  }
}

// Run the test
testDatabaseConnection();
