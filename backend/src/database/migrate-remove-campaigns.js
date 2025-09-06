const { query } = require("../config/database");

async function migrateDatabaseForCampaignRemoval() {
  try {
    console.log(
      "Starting database migration to remove campaign dependencies..."
    );

    // Add voucher_type column if it doesn't exist
    try {
      await query(`
        ALTER TABLE vouchers 
        ADD COLUMN voucher_type 
        ENUM('discount_percentage', 'discount_amount', 'free_product') 
        DEFAULT 'discount_percentage' 
        AFTER face_value
      `);
      console.log("✓ Added voucher_type column");
    } catch (error) {
      if (error.code === "ER_DUP_FIELDNAME") {
        console.log("✓ voucher_type column already exists");
      } else {
        throw error;
      }
    }

    // Set default voucher_type for existing records
    await query(`
      UPDATE vouchers 
      SET voucher_type = 'discount_percentage' 
      WHERE voucher_type IS NULL
    `);
    console.log("✓ Set default voucher_type for existing records");

    // Remove foreign key constraint for campaign_id if it exists
    try {
      await query(`
        ALTER TABLE vouchers 
        DROP FOREIGN KEY vouchers_ibfk_1
      `);
      console.log("✓ Removed campaign foreign key constraint");
    } catch (error) {
      console.log("Note: Campaign foreign key constraint may not exist");
    }

    // Drop campaign_id column if it exists
    try {
      await query(`
        ALTER TABLE vouchers 
        DROP COLUMN campaign_id
      `);
      console.log("✓ Removed campaign_id column from vouchers");
    } catch (error) {
      console.log("Note: campaign_id column may not exist");
    }

    // Remove campaign_id from spin_attempts and make voucher_id required
    try {
      await query(`
        ALTER TABLE spin_attempts 
        DROP FOREIGN KEY spin_attempts_ibfk_3
      `);
      console.log("✓ Removed campaign foreign key from spin_attempts");
    } catch (error) {
      console.log("Note: Campaign foreign key in spin_attempts may not exist");
    }

    try {
      await query(`
        ALTER TABLE spin_attempts 
        DROP COLUMN campaign_id
      `);
      console.log("✓ Removed campaign_id column from spin_attempts");
    } catch (error) {
      console.log("Note: campaign_id column in spin_attempts may not exist");
    }

    // Make voucher_id NOT NULL in spin_attempts
    try {
      await query(`
        ALTER TABLE spin_attempts 
        MODIFY COLUMN voucher_id VARCHAR(36) NOT NULL
      `);
      console.log("✓ Made voucher_id required in spin_attempts");
    } catch (error) {
      console.log("Note: voucher_id column modification may have failed");
    }

    console.log("Database migration completed successfully!");
    return true;
  } catch (error) {
    console.error("Database migration failed:", error);
    throw error;
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateDatabaseForCampaignRemoval()
    .then(() => {
      console.log("Migration script completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Migration script failed:", error);
      process.exit(1);
    });
}

module.exports = { migrateDatabaseForCampaignRemoval };
