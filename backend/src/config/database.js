const mysql = require("mysql2/promise");
const dotenv = require("dotenv");

// Load environment variables from multiple possible locations
dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.production" });
dotenv.config({ path: "../.env" });
dotenv.config({ path: "../.env.production" });

// Parse DATABASE_URL for Railway deployment
function parseConnectionConfig() {
  console.log("🔍 Checking for DATABASE_URL...");
  console.log("DATABASE_URL exists:", !!process.env.DATABASE_URL);

  // If DATABASE_URL is provided (Railway), parse it
  if (process.env.DATABASE_URL) {
    console.log("✅ Using DATABASE_URL for connection");
    try {
      const url = new URL(process.env.DATABASE_URL);
      const config = {
        host: url.hostname,
        port: parseInt(url.port) || 3306,
        user: url.username,
        password: url.password,
        database: url.pathname.slice(1), // Remove leading slash
        ssl: {
          rejectUnauthorized: false, // Railway requires SSL
        },
      };
      console.log("✅ DATABASE_URL parsed successfully");
      return config;
    } catch (error) {
      console.error("❌ Failed to parse DATABASE_URL:", error.message);
      console.log(
        "DATABASE_URL format should be: mysql://user:password@host:port/database"
      );
      console.log("Falling back to individual environment variables...");
    }
  } else {
    console.log(
      "⚠️  DATABASE_URL not found, using individual environment variables"
    );
  }

  // Fallback to individual environment variables
  const config = {
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "password",
    database: process.env.DB_NAME || "lucky_voucher",
  };

  console.log("📋 Using individual environment variables:");
  console.log(
    `   DB_HOST: ${process.env.DB_HOST || "not set (using localhost)"}`
  );
  console.log(`   DB_PORT: ${process.env.DB_PORT || "not set (using 3306)"}`);
  console.log(`   DB_USER: ${process.env.DB_USER || "not set (using root)"}`);
  console.log(
    `   DB_NAME: ${process.env.DB_NAME || "not set (using lucky_voucher)"}`
  );

  return config;
}

const dbConfig = parseConnectionConfig();

const config = {
  ...dbConfig,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: "utf8mb4",
  // Remove deprecated options that cause warnings in MySQL2:
  // acquireTimeout, timeout, reconnect are not valid for connection pools
};

console.log("Database configuration:", {
  host: config.host,
  port: config.port,
  user: config.user,
  database: config.database,
  ssl: config.ssl ? "enabled" : "disabled",
});

// Create connection pool
const pool = mysql.createPool(config);

// Test connection
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log("✅ Database connected successfully");
    console.log(
      `Connected to: ${config.host}:${config.port}/${config.database}`
    );
    connection.release();
    return true;
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
    console.error("Connection config:", {
      host: config.host,
      port: config.port,
      user: config.user,
      database: config.database,
    });
    return false;
  }
}

// Execute query with error handling
async function query(sql, params = []) {
  try {
    const [rows] = await pool.execute(sql, params);
    return rows;
  } catch (error) {
    console.error("Database query error:", error);
    throw error;
  }
}

// Execute transaction
async function transaction(queries) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const results = [];
    for (const { sql, params } of queries) {
      const [result] = await connection.execute(sql, params);
      results.push(result);
    }

    await connection.commit();
    return results;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = {
  pool,
  query,
  transaction,
  testConnection,
};
