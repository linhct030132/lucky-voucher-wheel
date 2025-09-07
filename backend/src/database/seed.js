const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");

async function seedDatabase(pool) {
  console.log("🌱 Starting database seeding...");

  const connection = await pool.getConnection();

  try {
    // Create admin staff user
    console.log("Creating admin staff user...");
    const hashedPassword = await bcrypt.hash("admin123", 10);
    const adminId = uuidv4();

    await connection.execute(
      `
            INSERT IGNORE INTO staff (id, email, password_hash, full_name, role, is_active, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
        `,
      [
        adminId,
        "admin@company.com",
        hashedPassword,
        "System Administrator",
        "ADMIN",
        true,
      ]
    );

    // Create sample vouchers
    console.log("Creating sample vouchers...");
    const vouchers = [
      {
        id: uuidv4(),
        name: "10% Discount Voucher",
        description: "Get 10% discount on your purchase",
        face_value: "10% OFF",
        voucher_type: "discount_percentage",
        base_probability: 0.3,
        initial_stock: 100,
        remaining_stock: 100,
        max_per_user: 1,
        valid_from: new Date(),
        valid_to: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        status: "active",
        code_generation: "auto",
        code_prefix: "DISC10",
      },
      {
        id: uuidv4(),
        name: "$20 Off Voucher",
        description: "Save $20 on orders over $100",
        face_value: "$20 OFF",
        voucher_type: "discount_amount",
        base_probability: 0.2,
        initial_stock: 50,
        remaining_stock: 50,
        max_per_user: 1,
        valid_from: new Date(),
        valid_to: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
        status: "active",
        code_generation: "auto",
        code_prefix: "SAVE20",
      },
      {
        id: uuidv4(),
        name: "Free Product Voucher",
        description: "Get a free product with your order",
        face_value: "FREE ITEM",
        voucher_type: "free_product",
        base_probability: 0.1,
        initial_stock: 25,
        remaining_stock: 25,
        max_per_user: 1,
        valid_from: new Date(),
        valid_to: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days from now
        status: "active",
        code_generation: "auto",
        code_prefix: "FREE",
      },
      {
        id: uuidv4(),
        name: "25% Welcome Discount",
        description: "Special welcome offer for new customers",
        face_value: "25% OFF",
        voucher_type: "discount_percentage",
        base_probability: 0.15,
        initial_stock: 75,
        remaining_stock: 75,
        max_per_user: 1,
        valid_from: new Date(),
        valid_to: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        status: "active",
        code_generation: "auto",
        code_prefix: "WELCOME",
      },
      {
        id: uuidv4(),
        name: "$50 Lucky Winner",
        description: "You are a lucky winner! $50 off",
        face_value: "$50 OFF",
        voucher_type: "discount_amount",
        base_probability: 0.05,
        initial_stock: 10,
        remaining_stock: 10,
        max_per_user: 1,
        valid_from: new Date(),
        valid_to: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
        status: "active",
        code_generation: "auto",
        code_prefix: "LUCKY50",
      },
    ];

    for (const voucher of vouchers) {
      await connection.execute(
        `
                INSERT IGNORE INTO vouchers (
                    id, name, description, face_value, voucher_type, base_probability,
                    initial_stock, remaining_stock, max_per_user, valid_from, valid_to,
                    status, code_generation, code_prefix, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
            `,
        [
          voucher.id,
          voucher.name,
          voucher.description,
          voucher.face_value,
          voucher.voucher_type,
          voucher.base_probability,
          voucher.initial_stock,
          voucher.remaining_stock,
          voucher.max_per_user,
          voucher.valid_from,
          voucher.valid_to,
          voucher.status,
          voucher.code_generation,
          voucher.code_prefix,
        ]
      );

      // Generate voucher codes for each voucher
      console.log(`Generating codes for voucher: ${voucher.name}`);
      for (let i = 1; i <= voucher.initial_stock; i++) {
        const codeId = uuidv4();
        const code = `${voucher.code_prefix}${String(i).padStart(4, "0")}`;

        await connection.execute(
          `INSERT IGNORE INTO voucher_codes (id, voucher_id, code, status, created_at)
           VALUES (?, ?, ?, 'available', NOW())`,
          [codeId, voucher.id, code]
        );
      }
    }

    console.log("✅ Database seeding completed successfully!");
    console.log(`Created ${vouchers.length} vouchers with their codes`);
    console.log("Admin credentials: admin@company.com / admin123");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = { seedDatabase };
