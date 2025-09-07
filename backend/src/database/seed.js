const bcrypt = require("bcrypt");

async function seedDatabase(pool) {
  console.log("🌱 Starting database seeding...");

  const connection = await pool.getConnection();

  try {
    // Create admin user
    console.log("Creating admin user...");
    const hashedPassword = await bcrypt.hash("admin123", 10);

    await connection.execute(
      `
            INSERT IGNORE INTO users (username, email, password, role, is_email_verified, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, NOW(), NOW())
        `,
      ["admin", "admin@company.com", hashedPassword, "admin", 1]
    );

    // Create sample vouchers
    console.log("Creating sample vouchers...");
    const vouchers = [
      {
        code: "DISCOUNT10",
        voucher_type: "percentage",
        discount_value: 10.0,
        title: "10% Off Any Purchase",
        description: "Get 10% discount on your purchase",
        terms_conditions:
          "Valid for all products. Cannot be combined with other offers.",
        expiry_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        max_usage: 100,
        current_usage: 0,
        is_active: 1,
      },
      {
        code: "SAVE20",
        voucher_type: "fixed",
        discount_value: 20.0,
        title: "$20 Off Your Order",
        description: "Save $20 on orders over $100",
        terms_conditions:
          "Minimum purchase of $100 required. One per customer.",
        expiry_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
        max_usage: 50,
        current_usage: 0,
        is_active: 1,
      },
      {
        code: "FREESHIP",
        voucher_type: "shipping",
        discount_value: 0.0,
        title: "Free Shipping",
        description: "Free shipping on any order",
        terms_conditions: "Valid for standard shipping only.",
        expiry_date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days from now
        max_usage: 200,
        current_usage: 0,
        is_active: 1,
      },
      {
        code: "WELCOME25",
        voucher_type: "percentage",
        discount_value: 25.0,
        title: "25% Welcome Discount",
        description: "Special welcome offer for new customers",
        terms_conditions: "First-time customers only. Valid for 7 days.",
        expiry_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        max_usage: 25,
        current_usage: 0,
        is_active: 1,
      },
      {
        code: "LUCKY50",
        voucher_type: "fixed",
        discount_value: 50.0,
        title: "$50 Lucky Winner",
        description: "You are a lucky winner! $50 off",
        terms_conditions:
          "Minimum purchase of $200 required. One per customer.",
        expiry_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
        max_usage: 10,
        current_usage: 0,
        is_active: 1,
      },
    ];

    for (const voucher of vouchers) {
      await connection.execute(
        `
                INSERT IGNORE INTO vouchers (
                    code, voucher_type, discount_value, title, description, 
                    terms_conditions, expiry_date, max_usage, current_usage, 
                    is_active, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
            `,
        [
          voucher.code,
          voucher.voucher_type,
          voucher.discount_value,
          voucher.title,
          voucher.description,
          voucher.terms_conditions,
          voucher.expiry_date,
          voucher.max_usage,
          voucher.current_usage,
          voucher.is_active,
        ]
      );
    }

    console.log("✅ Database seeding completed successfully!");
    console.log(`Created ${vouchers.length} vouchers`);
    console.log("Admin credentials: admin@company.com / admin123");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = { seedDatabase };
