const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");
const { query } = require("../config/database");

async function seedDatabase() {
  try {
    console.log("🌱 Starting database seeding...");

    // Create default admin user
    const adminId = uuidv4();
    const hashedPassword = await bcrypt.hash("admin123", 12);

    await query(
      `
      INSERT IGNORE INTO staff (id, email, password_hash, full_name, role, is_active)
      VALUES (?, ?, ?, ?, ?, ?)
    `,
      [
        adminId,
        "admin@luckyvoucher.com",
        hashedPassword,
        "System Administrator",
        "ADMIN",
        true,
      ]
    );

    // Create default campaign
    const campaignId = uuidv4();
    await query(
      `
      INSERT IGNORE INTO campaigns (id, name, status, start_at, end_at, no_win_weight)
      VALUES (?, ?, ?, ?, ?, ?)
    `,
      [
        campaignId,
        "Default Lucky Draw Campaign",
        "active",
        new Date(),
        new Date("2025-12-31"),
        0.3,
      ]
    );

    // Create sample vouchers
    const vouchers = [
      {
        id: uuidv4(),
        name: "10% OFF Discount",
        description: "Get 10% off your next purchase. Valid for all items.",
        face_value: "10% OFF",
        base_probability: 0.25,
        initial_stock: 100,
        remaining_stock: 100,
      },
      {
        id: uuidv4(),
        name: "$5 OFF Coupon",
        description:
          "Save $5 on purchases over $25. Cannot be combined with other offers.",
        face_value: "$5 OFF",
        base_probability: 0.2,
        initial_stock: 50,
        remaining_stock: 50,
      },
      {
        id: uuidv4(),
        name: "Free Shipping",
        description:
          "Free shipping on your next order. No minimum purchase required.",
        face_value: "FREE SHIPPING",
        base_probability: 0.3,
        initial_stock: 200,
        remaining_stock: 200,
      },
      {
        id: uuidv4(),
        name: "20% OFF Premium",
        description: "Exclusive 20% discount for premium items only.",
        face_value: "20% OFF",
        base_probability: 0.1,
        initial_stock: 25,
        remaining_stock: 25,
      },
      {
        id: uuidv4(),
        name: "Buy 1 Get 1 Free",
        description:
          "Buy one item and get another of equal or lesser value free.",
        face_value: "BOGO",
        base_probability: 0.15,
        initial_stock: 30,
        remaining_stock: 30,
      },
    ];

    for (const voucher of vouchers) {
      await query(
        `
        INSERT IGNORE INTO vouchers (
          id, campaign_id, name, description, face_value, base_probability,
          initial_stock, remaining_stock, max_per_user, valid_from, valid_to,
          status, code_generation, code_prefix
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
        [
          voucher.id,
          campaignId,
          voucher.name,
          voucher.description,
          voucher.face_value,
          voucher.base_probability,
          voucher.initial_stock,
          voucher.remaining_stock,
          1,
          new Date(),
          new Date("2025-12-31"),
          "active",
          "auto",
          "LV",
        ]
      );

      // Generate voucher codes for each voucher
      const codes = [];
      for (let i = 1; i <= voucher.initial_stock; i++) {
        const code = `${voucher.face_value.replace(/[^A-Z0-9]/g, "")}${String(
          i
        ).padStart(4, "0")}`;
        codes.push([uuidv4(), voucher.id, code, "available"]);
      }

      // Batch insert codes
      if (codes.length > 0) {
        const placeholders = codes.map(() => "(?, ?, ?, ?)").join(", ");
        const flatValues = codes.flat();
        await query(
          `
          INSERT IGNORE INTO voucher_codes (id, voucher_id, code, status)
          VALUES ${placeholders}
        `,
          flatValues
        );
      }
    }

    console.log("✅ Database seeded successfully!");
    console.log("📧 Admin login: admin@luckyvoucher.com");
    console.log("🔑 Admin password: admin123");
    console.log("🎯 Default campaign created with 5 sample vouchers");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    throw error;
  }
}

if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { seedDatabase };
