const mysql = require("mysql2/promise");
const dotenv = require("dotenv");

dotenv.config();

// Parse DATABASE_URL for Railway deployment
function parseConnectionConfig() {
  // If DATABASE_URL is provided (Railway), parse it
  if (process.env.DATABASE_URL) {
    try {
      const url = new URL(process.env.DATABASE_URL);
      return {
        host: url.hostname,
        port: parseInt(url.port) || 3306,
        user: url.username,
        password: url.password,
        database: url.pathname.slice(1), // Remove leading slash
        ssl: {
          rejectUnauthorized: false, // Railway requires SSL
        },
      };
    } catch (error) {
      console.error("Failed to parse DATABASE_URL:", error.message);
      console.log(
        "DATABASE_URL format should be: mysql://user:password@host:port/database"
      );
    }
  }

  // Fallback to individual environment variables
  return {
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "password",
    database: process.env.DB_NAME || "lucky_voucher",
  };
}

const dbConfig = parseConnectionConfig();

const config = {
  ...dbConfig,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true,
  charset: "utf8mb4",
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
