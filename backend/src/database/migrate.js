const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

/**
 * Migration definitions using Prisma
 * Each migration has a version, name, and migration function
 */
const migrations = [
  {
    version: 1,
    name: "ensure_voucher_id_nullable_in_spin_attempts",
    description:
      "Make voucher_id nullable in spin_attempts table and update constraints",
    migrate: async (tx = prisma) => {
      console.log("  🔧 Checking voucher_id column in spin_attempts...");

      // Check current schema
      const result = await tx.$queryRaw`
        SELECT COLUMN_NAME, IS_NULLABLE, DATA_TYPE, COLUMN_DEFAULT
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
          AND TABLE_NAME = 'spin_attempts' 
          AND COLUMN_NAME = 'voucher_id'
      `;

      if (result.length === 0) {
        throw new Error("spin_attempts table or voucher_id column not found");
      }

      const column = result[0];
      console.log(
        `  ℹ️  Current voucher_id: nullable=${column.IS_NULLABLE}, type=${column.DATA_TYPE}`
      );

      if (column.IS_NULLABLE === "NO") {
        console.log("  🔧 Making voucher_id nullable...");

        // Step 1: Drop the old unique constraint if it exists
        try {
          await tx.$executeRaw`
            ALTER TABLE spin_attempts DROP INDEX unique_user_device_voucher
          `;
          console.log(
            "  ✅ Dropped old unique constraint (unique_user_device_voucher)"
          );
        } catch (error) {
          console.log("  ℹ️  Old constraint already removed or doesn't exist");
        }

        // Step 2: Drop foreign key constraint temporarily
        const fkConstraints = await tx.$queryRaw`
          SELECT CONSTRAINT_NAME 
          FROM information_schema.KEY_COLUMN_USAGE 
          WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'spin_attempts' 
            AND COLUMN_NAME = 'voucher_id' 
            AND REFERENCED_TABLE_NAME = 'vouchers'
        `;

        let constraintName = null;
        if (fkConstraints.length > 0) {
          constraintName = fkConstraints[0].CONSTRAINT_NAME;
          await tx.$executeRawUnsafe(
            `ALTER TABLE spin_attempts DROP FOREIGN KEY \`${constraintName}\``
          );
          console.log(`  ✅ Dropped foreign key constraint: ${constraintName}`);
        }

        // Step 3: Make voucher_id nullable
        await tx.$executeRaw`
          ALTER TABLE spin_attempts MODIFY COLUMN voucher_id VARCHAR(36) NULL
        `;
        console.log("  ✅ Made voucher_id nullable");

        // Step 4: Re-add foreign key constraint
        await tx.$executeRaw`
          ALTER TABLE spin_attempts 
          ADD CONSTRAINT fk_spin_attempts_voucher 
          FOREIGN KEY (voucher_id) REFERENCES vouchers(id) ON DELETE CASCADE
        `;
        console.log("  ✅ Re-added foreign key constraint");

        // Step 5: Add new unique constraint for user and device only
        try {
          await tx.$executeRaw`
            ALTER TABLE spin_attempts 
            ADD UNIQUE KEY unique_user_device (user_id, device_id)
          `;
          console.log("  ✅ Added new unique constraint (user_id, device_id)");
        } catch (error) {
          console.log("  ℹ️  Unique constraint already exists");
        }
      } else {
        console.log("  ✅ voucher_id is already nullable");

        // Ensure we have the correct unique constraint
        const uniqueConstraints = await tx.$queryRaw`
          SELECT INDEX_NAME, GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) as columns
          FROM information_schema.STATISTICS 
          WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'spin_attempts' 
            AND INDEX_NAME LIKE 'unique_user_device%'
          GROUP BY INDEX_NAME
        `;

        console.log("  ℹ️  Current unique constraints:", uniqueConstraints);

        // Check if we have the right unique constraint
        const hasCorrectConstraint = uniqueConstraints.some(
          (constraint) => constraint.columns === "user_id,device_id"
        );

        if (!hasCorrectConstraint) {
          try {
            await tx.$executeRaw`
              ALTER TABLE spin_attempts 
              ADD UNIQUE KEY unique_user_device (user_id, device_id)
            `;
            console.log("  ✅ Added unique constraint (user_id, device_id)");
          } catch (error) {
            console.log(
              "  ℹ️  Unique constraint already exists or error:",
              error.message
            );
          }
        }
      }
    },
  },
  {
    version: 2,
    name: "add_device_sessions",
    description:
      "Add device_sessions table to track user information for devices",
    migrate: async (tx = prisma) => {
      console.log("  🔧 Creating device_sessions table...");

      // Check if table already exists
      const tableExists = await tx.$queryRaw`
        SELECT COUNT(*) as count
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_SCHEMA = DATABASE() 
          AND TABLE_NAME = 'device_sessions'
      `;

      if (tableExists[0].count > 0) {
        console.log("  ℹ️  device_sessions table already exists");
        return;
      }

      // Create device_sessions table
      await tx.$executeRaw`
        CREATE TABLE device_sessions (
          id VARCHAR(36) PRIMARY KEY,
          device_id VARCHAR(36) NOT NULL,
          user_id VARCHAR(36) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          
          CONSTRAINT fk_device_sessions_device_id 
            FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE,
          CONSTRAINT fk_device_sessions_user_id 
            FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE,
          
          UNIQUE KEY unique_device_session (device_id),
          INDEX idx_device_id (device_id),
          INDEX idx_user_id (user_id)
        )
      `;

      console.log("  ✅ Created device_sessions table successfully");
    },
  },
  {
    version: 3,
    name: "add_campaign_support",
    description: "Add campaign support for vouchers (future migration)",
    migrate: async (tx = prisma) => {
      console.log(
        "  ℹ️  Campaign support migration - placeholder for future enhancement"
      );
      // This is a placeholder for future campaign-related migrations
    },
  },
  {
    version: 4,
    name: "add_address_and_referral_source_to_user_profiles",
    description:
      "Add address and referral_source columns to user_profiles table",
    migrate: async (tx = prisma) => {
      console.log(
        "  🔧 Adding address and referral_source columns to user_profiles..."
      );

      // Check if address column exists
      const addressColumnExists = await tx.$queryRaw`
        SELECT COUNT(*) as count
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
          AND TABLE_NAME = 'user_profiles' 
          AND COLUMN_NAME = 'address'
      `;

      if (addressColumnExists[0].count === 0) {
        await tx.$executeRaw`
          ALTER TABLE user_profiles ADD COLUMN address VARCHAR(500) NULL
        `;
        console.log("  ✅ Added address column to user_profiles");
      } else {
        console.log("  ℹ️  address column already exists in user_profiles");
      }

      // Check if referral_source column exists
      const referralColumnExists = await tx.$queryRaw`
        SELECT COUNT(*) as count
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
          AND TABLE_NAME = 'user_profiles' 
          AND COLUMN_NAME = 'referral_source'
      `;

      if (referralColumnExists[0].count === 0) {
        await tx.$executeRaw`
          ALTER TABLE user_profiles ADD COLUMN referral_source VARCHAR(100) NULL
        `;
        console.log("  ✅ Added referral_source column to user_profiles");
      } else {
        console.log(
          "  ℹ️  referral_source column already exists in user_profiles"
        );
      }

      console.log(
        "  ✅ Address and referral_source migration completed successfully"
      );
    },
  },
];

/**
 * Run pending migrations
 */
async function runMigrations() {
  console.log("🔧 Prisma Migration Manager");
  console.log("Connecting to database...");

  try {
    await prisma.$connect();
    console.log("✅ Connected to database successfully");

    // Create migrations table if it doesn't exist
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS migrations (
        version INT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Check if description column exists, if not add it
    const columnExists = await prisma.$queryRaw`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'migrations' 
        AND COLUMN_NAME = 'description'
    `;

    if (columnExists.length === 0) {
      await prisma.$executeRaw`
        ALTER TABLE migrations ADD COLUMN description TEXT NULL
      `;
      console.log("✅ Added description column to migrations table");
    }

    // Get executed migrations
    const executedMigrations = await prisma.$queryRaw`
      SELECT version FROM migrations ORDER BY version
    `;
    const executedVersions = executedMigrations.map((m) => m.version);

    console.log(
      `📋 Found ${executedVersions.length} executed migrations:`,
      executedVersions
    );

    // Run pending migrations
    let appliedCount = 0;
    for (const migration of migrations) {
      if (!executedVersions.includes(migration.version)) {
        console.log(
          `\n🚀 Running migration ${migration.version}: ${migration.name}`
        );
        console.log(`   ${migration.description}`);

        await prisma.$transaction(async (tx) => {
          // Run the migration
          await migration.migrate(tx);

          // Record migration
          await tx.$executeRaw`
            INSERT INTO migrations (version, name, description) 
            VALUES (${migration.version}, ${migration.name}, ${migration.description})
          `;
        });

        console.log(`✅ Migration ${migration.version} completed successfully`);
        appliedCount++;
      } else {
        console.log(`⏭️  Migration ${migration.version} already applied`);
      }
    }

    if (appliedCount === 0) {
      console.log("\n✅ All migrations are up to date");
    } else {
      console.log(`\n🎉 Applied ${appliedCount} new migration(s) successfully`);
    }
  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Rollback a specific migration (if possible)
 */
async function rollbackMigration(version) {
  console.log(`🔄 Rolling back migration ${version}...`);

  try {
    await prisma.$connect();

    // Remove from migrations table
    await prisma.$executeRaw`
      DELETE FROM migrations WHERE version = ${version}
    `;

    console.log(`✅ Rolled back migration ${version}`);
  } catch (error) {
    console.error("❌ Rollback failed:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Get migration status
 */
async function getMigrationStatus() {
  try {
    await prisma.$connect();

    // Check if migrations table exists and what columns it has
    const tableExists = await prisma.$queryRaw`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'migrations'
    `;

    if (tableExists.length === 0) {
      console.log("📋 Migration Status:");
      console.log("===================");
      console.log(
        "⚠️  No migrations table found. Run migrations to create it."
      );
      return {
        total: migrations.length,
        executed: 0,
        pending: migrations.length,
      };
    }

    // Check if description column exists
    const hasDescription = await prisma.$queryRaw`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'migrations' 
        AND COLUMN_NAME = 'description'
    `;

    let executedMigrations;
    if (hasDescription.length > 0) {
      executedMigrations = await prisma.$queryRaw`
        SELECT version, name, description, executed_at FROM migrations ORDER BY version
      `;
    } else {
      executedMigrations = await prisma.$queryRaw`
        SELECT version, name, executed_at FROM migrations ORDER BY version
      `;
    }

    console.log("📋 Migration Status:");
    console.log("===================");

    for (const migration of migrations) {
      const executed = executedMigrations.find(
        (m) => m.version === migration.version
      );
      if (executed) {
        console.log(
          `✅ v${migration.version}: ${migration.name} (executed: ${executed.executed_at})`
        );
      } else {
        console.log(`⏳ v${migration.version}: ${migration.name} (pending)`);
      }
    }

    return {
      total: migrations.length,
      executed: executedMigrations.length,
      pending: migrations.length - executedMigrations.length,
    };
  } catch (error) {
    console.error("❌ Failed to get migration status:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// CLI interface
if (require.main === module) {
  const command = process.argv[2];
  const version = process.argv[3];

  switch (command) {
    case "status":
      getMigrationStatus()
        .then((status) => {
          console.log(
            `\n📊 Summary: ${status.executed}/${status.total} migrations executed, ${status.pending} pending`
          );
          process.exit(0);
        })
        .catch(() => process.exit(1));
      break;

    case "rollback":
      if (!version) {
        console.error("❌ Please specify migration version to rollback");
        process.exit(1);
      }
      rollbackMigration(parseInt(version))
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
      break;

    default:
      runMigrations()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
  }
}

module.exports = {
  runMigrations,
  rollbackMigration,
  getMigrationStatus,
  migrations,
};
