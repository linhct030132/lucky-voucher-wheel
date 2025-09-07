const mysql = require("mysql2/promise");
const dotenv = require("dotenv");
const path = require("path");

// Load environment variables from multiple locations
dotenv.config();
dotenv.config({ path: path.join(__dirname, "../../../.env") });

console.log("🔧 Migration Configuration:");
console.log(`DB_HOST: ${process.env.DB_HOST || "localhost"}`);
console.log(`DB_PORT: ${process.env.DB_PORT || 3306}`);
console.log(`DB_USER: ${process.env.DB_USER || "root"}`);
console.log(`DB_NAME: ${process.env.DB_NAME || "lucky_voucher"}`);
console.log("");

const migrations = [
  {
    version: 1,
    name: "create_initial_tables",
    up: `
      -- Create UserProfile table
      CREATE TABLE IF NOT EXISTS user_profiles (
        id VARCHAR(36) PRIMARY KEY,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        consent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_email (email),
        INDEX idx_phone (phone)
      );

      -- Create Device table
      CREATE TABLE IF NOT EXISTS devices (
        id VARCHAR(36) PRIMARY KEY,
        device_fp_hash VARCHAR(255) NOT NULL UNIQUE,
        first_seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_device_fp (device_fp_hash)
      );

      -- Create Voucher table (without campaign dependencies)
      CREATE TABLE IF NOT EXISTS vouchers (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        face_value VARCHAR(255) NOT NULL,
        voucher_type ENUM('discount_percentage', 'discount_amount', 'free_product') DEFAULT 'discount_percentage',
        base_probability DECIMAL(10,4) NOT NULL DEFAULT 0.1000,
        initial_stock INT NOT NULL DEFAULT 0,
        remaining_stock INT NOT NULL DEFAULT 0,
        max_per_user INT DEFAULT 1,
        valid_from TIMESTAMP NULL,
        valid_to TIMESTAMP NULL,
        status ENUM('draft', 'active', 'inactive') DEFAULT 'draft',
        code_generation ENUM('auto', 'pre_seeded') DEFAULT 'auto',
        code_prefix VARCHAR(10) DEFAULT 'LV',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_status (status),
        INDEX idx_valid_period (valid_from, valid_to),
        INDEX idx_voucher_type (voucher_type)
      );

      -- Create VoucherCode table
      CREATE TABLE IF NOT EXISTS voucher_codes (
        id VARCHAR(36) PRIMARY KEY,
        voucher_id VARCHAR(36) NOT NULL,
        code VARCHAR(50) NOT NULL UNIQUE,
        status ENUM('available', 'issued', 'redeemed', 'expired') DEFAULT 'available',
        issued_to_user_id VARCHAR(36) NULL,
        issued_at TIMESTAMP NULL,
        redeemed_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (voucher_id) REFERENCES vouchers(id) ON DELETE CASCADE,
        FOREIGN KEY (issued_to_user_id) REFERENCES user_profiles(id) ON DELETE SET NULL,
        INDEX idx_voucher (voucher_id),
        INDEX idx_status (status),
        INDEX idx_code (code)
      );

      -- Create SpinAttempt table
      CREATE TABLE IF NOT EXISTS spin_attempts (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        device_id VARCHAR(36) NOT NULL,
        outcome ENUM('win', 'lose') NOT NULL,
        voucher_id VARCHAR(36) NOT NULL,
        voucher_code_id VARCHAR(36) NULL,
        ip_address VARCHAR(45),
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE,
        FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE,
        FOREIGN KEY (voucher_id) REFERENCES vouchers(id) ON DELETE CASCADE,
        FOREIGN KEY (voucher_code_id) REFERENCES voucher_codes(id) ON DELETE SET NULL,
        UNIQUE KEY unique_user_device_voucher (user_id, device_id, voucher_id),
        INDEX idx_outcome (outcome),
        INDEX idx_created_at (created_at)
      );

      -- Create Staff table for admin access
      CREATE TABLE IF NOT EXISTS staff (
        id VARCHAR(36) PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        role ENUM('STAFF', 'ADMIN') DEFAULT 'STAFF',
        is_active BOOLEAN DEFAULT TRUE,
        mfa_secret VARCHAR(255) NULL,
        mfa_enabled BOOLEAN DEFAULT FALSE,
        last_login_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_email (email),
        INDEX idx_role (role)
      );

      -- Create AuditLog table
      CREATE TABLE IF NOT EXISTS audit_logs (
        id VARCHAR(36) PRIMARY KEY,
        actor_id VARCHAR(36),
        actor_role ENUM('STAFF', 'ADMIN', 'SYSTEM') NOT NULL,
        action VARCHAR(100) NOT NULL,
        entity_type VARCHAR(50) NOT NULL,
        entity_id VARCHAR(36),
        before_data JSON NULL,
        after_data JSON NULL,
        ip_address VARCHAR(45),
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (actor_id) REFERENCES staff(id) ON DELETE SET NULL,
        INDEX idx_actor (actor_id),
        INDEX idx_entity (entity_type, entity_id),
        INDEX idx_created_at (created_at)
      );

      -- Create StockAdjustment table
      CREATE TABLE IF NOT EXISTS stock_adjustments (
        id VARCHAR(36) PRIMARY KEY,
        voucher_id VARCHAR(36) NOT NULL,
        staff_id VARCHAR(36) NOT NULL,
        delta_amount INT NOT NULL,
        reason TEXT,
        previous_stock INT NOT NULL,
        new_stock INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (voucher_id) REFERENCES vouchers(id) ON DELETE CASCADE,
        FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE,
        INDEX idx_voucher (voucher_id),
        INDEX idx_created_at (created_at)
      );
    `,
    down: `
      DROP TABLE IF EXISTS stock_adjustments;
      DROP TABLE IF EXISTS audit_logs;
      DROP TABLE IF EXISTS spin_attempts;
      DROP TABLE IF EXISTS voucher_codes;
      DROP TABLE IF EXISTS vouchers;
      DROP TABLE IF EXISTS devices;
      DROP TABLE IF EXISTS user_profiles;
      DROP TABLE IF EXISTS staff;
    `,
  },
  {
    version: 2,
    name: "make_voucher_id_nullable_in_spin_attempts",
    up: `
      -- Remove foreign key constraint first
      ALTER TABLE spin_attempts DROP FOREIGN KEY spin_attempts_ibfk_3;
      
      -- Remove unique constraint that includes voucher_id
      ALTER TABLE spin_attempts DROP INDEX unique_user_device_voucher;
      
      -- Modify voucher_id to be nullable
      ALTER TABLE spin_attempts MODIFY COLUMN voucher_id VARCHAR(36) NULL;
      
      -- Re-add foreign key constraint
      ALTER TABLE spin_attempts ADD CONSTRAINT spin_attempts_ibfk_3 
      FOREIGN KEY (voucher_id) REFERENCES vouchers(id) ON DELETE CASCADE;
      
      -- Add new unique constraint for user and device only (allowing multiple attempts per voucher)
      ALTER TABLE spin_attempts ADD UNIQUE KEY unique_user_device (user_id, device_id);
    `,
    down: `
      -- Remove new unique constraint
      ALTER TABLE spin_attempts DROP INDEX unique_user_device;
      
      -- Remove foreign key constraint
      ALTER TABLE spin_attempts DROP FOREIGN KEY spin_attempts_ibfk_3;
      
      -- Make voucher_id NOT NULL again (this might fail if there are NULL values)
      ALTER TABLE spin_attempts MODIFY COLUMN voucher_id VARCHAR(36) NOT NULL;
      
      -- Re-add original foreign key constraint
      ALTER TABLE spin_attempts ADD CONSTRAINT spin_attempts_ibfk_3 
      FOREIGN KEY (voucher_id) REFERENCES vouchers(id) ON DELETE CASCADE;
      
      -- Re-add original unique constraint
      ALTER TABLE spin_attempts ADD UNIQUE KEY unique_user_device_voucher (user_id, device_id, voucher_id);
    `,
  },
];

async function runMigrations(pool = null) {
  let connection;
  let shouldCloseConnection = false;

  if (pool) {
    // Use provided database pool
    connection = await pool.getConnection();
  } else {
    // Create new connection (for standalone usage)
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "password",
    });
    shouldCloseConnection = true;

    // Create database if it doesn't exist
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${
        process.env.DB_NAME || "lucky_voucher"
      }\``
    );
    await connection.query(`USE \`${process.env.DB_NAME || "lucky_voucher"}\``);
  }

  try {
    // Create migrations table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        version INT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Get executed migrations
    const [executedMigrations] = await connection.query(
      "SELECT version FROM migrations"
    );
    const executedVersions = executedMigrations.map((m) => m.version);

    // Run pending migrations
    for (const migration of migrations) {
      if (!executedVersions.includes(migration.version)) {
        console.log(
          `Running migration ${migration.version}: ${migration.name}`
        );

        // Split and execute each statement separately
        const statements = migration.up
          .split(";")
          .filter((stmt) => stmt.trim());
        for (const statement of statements) {
          if (statement.trim()) {
            await connection.query(statement);
          }
        }

        // Record migration
        await connection.query(
          "INSERT INTO migrations (version, name) VALUES (?, ?)",
          [migration.version, migration.name]
        );

        console.log(`✅ Migration ${migration.version} completed`);
      }
    }

    console.log("✅ All migrations completed successfully");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  } finally {
    if (pool) {
      connection.release();
    } else if (shouldCloseConnection) {
      await connection.end();
    }
  }
}

if (require.main === module) {
  runMigrations()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { runMigrations };
