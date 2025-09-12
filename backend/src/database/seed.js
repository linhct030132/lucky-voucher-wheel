const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");

const prisma = new PrismaClient();

/**
 * Seed data definitions
 */
const seedData = {
  staff: [
    {
      id: "550e8400-e29b-41d4-a716-446655440000",
      email: "admin@vouchersystem.com",
      password: "admin123",
      fullName: "System Administrator",
      role: "ADMIN",
      isActive: true,
    },
    {
      id: "550e8400-e29b-41d4-a716-446655440999",
      email: "staff@vouchersystem.com",
      password: "staff123",
      fullName: "Staff Member",
      role: "STAFF",
      isActive: true,
    },
  ],

  vouchers: [
    {
      id: "550e8400-e29b-41d4-a716-446655440001",
      name: "GIẢI ĐẶC BIỆT",
      description: "Giảm giá 500.000 VND",
      faceValue: "500000 VND",
      voucherType: "discount_amount",
      baseProbability: 0.0036, // 0.36%
      initialStock: 5,
      remainingStock: 5,
      maxPerUser: 1,
      validFrom: new Date(),
      validTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      status: "active",
      codeGeneration: "pre_seeded",
      codePrefix: "SPECIAL",
      voucherCode: "SPECIAL500K",
    },
    {
      id: "550e8400-e29b-41d4-a716-446655440002",
      name: "GIẢI NHẤT",
      description: "Giảm giá 200.000 VND",
      faceValue: "200000 VND",
      voucherType: "discount_amount",
      baseProbability: 0.0369, // 3.69%
      initialStock: 50,
      remainingStock: 50,
      maxPerUser: 1,
      validFrom: new Date(),
      validTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      status: "active",
      codeGeneration: "pre_seeded",
      codePrefix: "FIRST",
      voucherCode: "FIRST200K",
    },
    {
      id: "550e8400-e29b-41d4-a716-446655440003",
      name: "GIẢI NHÌ",
      description: "Giảm giá 100.000 VND",
      faceValue: "100000 VND",
      voucherType: "discount_amount",
      baseProbability: 0.295, // 29.5%
      initialStock: 400,
      remainingStock: 400,
      maxPerUser: 1,
      validFrom: new Date(),
      validTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      status: "active",
      codeGeneration: "pre_seeded",
      codePrefix: "SECOND",
      voucherCode: "SECOND100K",
    },
    {
      id: "550e8400-e29b-41d4-a716-446655440004",
      name: "GIẢI BA",
      description: "Giảm giá 5%",
      faceValue: "5%",
      voucherType: "discount_percentage",
      baseProbability: 0.4428, // 44.28%
      initialStock: 600,
      remainingStock: 600,
      maxPerUser: 1,
      validFrom: new Date(),
      validTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      status: "active",
      codeGeneration: "pre_seeded",
      codePrefix: "THIRD",
      voucherCode: "THIRD5PERCENT",
    },
    {
      id: "550e8400-e29b-41d4-a716-446655440005",
      name: "GIẢI MAY MẮN",
      description: "Một đôi tất Dezus ( Đen/ Trắng)",
      faceValue: "Free Product",
      voucherType: "free_product",
      baseProbability: 0.2214, // 22.14%
      initialStock: 300,
      remainingStock: 300,
      maxPerUser: 1,
      validFrom: new Date(),
      validTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      status: "active",
      codeGeneration: "pre_seeded",
      codePrefix: "LUCKY",
      voucherCode: "LUCKYSOCKS",
    },
  ],
};

/**
 * Seed the database with initial data
 */
async function seedDatabase() {
  console.log("🌱 Starting database seeding with Prisma...");

  try {
    await prisma.$connect();
    console.log("✅ Connected to database successfully");

    // Seed staff members
    console.log("\n👥 Seeding staff members...");
    for (const staffData of seedData.staff) {
      const hashedPassword = await bcrypt.hash(staffData.password, 12);

      const staff = await prisma.staff.upsert({
        where: { email: staffData.email },
        update: {
          fullName: staffData.fullName,
          role: staffData.role,
          isActive: staffData.isActive,
        },
        create: {
          id: staffData.id,
          email: staffData.email,
          passwordHash: hashedPassword,
          fullName: staffData.fullName,
          role: staffData.role,
          isActive: staffData.isActive,
        },
      });

      console.log(`  ✅ Created/updated staff: ${staff.email} (${staff.role})`);
    }

    // Seed vouchers
    console.log("\n🎫 Seeding vouchers...");
    for (const voucherData of seedData.vouchers) {
      const voucher = await prisma.voucher.upsert({
        where: { id: voucherData.id },
        update: {
          name: voucherData.name,
          description: voucherData.description,
          faceValue: voucherData.faceValue,
          voucherType: voucherData.voucherType,
          baseProbability: voucherData.baseProbability,
          remainingStock: voucherData.remainingStock,
          maxPerUser: voucherData.maxPerUser,
          validFrom: voucherData.validFrom,
          validTo: voucherData.validTo,
          status: voucherData.status,
        },
        create: voucherData,
      });

      console.log(
        `  ✅ Created/updated voucher: ${voucher.name} (${voucher.status})`
      );
    }

    // Voucher codes are now stored directly on the voucher (voucherCode field)
    console.log("  ℹ️  Voucher codes are set directly on vouchers");

    // Create sample user profiles
    console.log("\n👤 Creating sample user profiles...");
    const sampleUsers = [
      {
        id: "550e8400-e29b-41d4-a716-446655440100",
        fullName: "John Doe",
        email: "john.doe@example.com",
        phone: "+1234567890",
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440101",
        fullName: "Jane Smith",
        email: "jane.smith@example.com",
        phone: "+1234567891",
      },
    ];

    for (const userData of sampleUsers) {
      const user = await prisma.userProfile.upsert({
        where: { id: userData.id },
        update: userData,
        create: userData,
      });

      console.log(`  ✅ Created/updated user: ${user.fullName}`);
    }

    // Create sample devices
    console.log("\n📱 Creating sample devices...");
    const sampleDevices = [
      {
        id: "550e8400-e29b-41d4-a716-446655440200",
        deviceFpHash: "device_hash_sample_1_" + Date.now(),
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440201",
        deviceFpHash: "device_hash_sample_2_" + Date.now(),
      },
    ];

    for (const deviceData of sampleDevices) {
      const device = await prisma.device.upsert({
        where: { id: deviceData.id },
        update: deviceData,
        create: deviceData,
      });

      console.log(`  ✅ Created/updated device: ${device.deviceFpHash}`);
    }

    console.log("\n📊 Seed Summary:");
    console.log("================");

    const counts = await Promise.all([
      prisma.staff.count(),
      prisma.voucher.count(),
      prisma.voucherCode.count(),
      prisma.userProfile.count(),
      prisma.device.count(),
    ]);

    console.log(`👥 Staff members: ${counts[0]}`);
    console.log(`🎫 Vouchers: ${counts[1]}`);
    console.log(`🔢 Voucher codes: ${counts[2]}`);
    console.log(`👤 User profiles: ${counts[3]}`);
    console.log(`📱 Devices: ${counts[4]}`);

    console.log("\n🎉 Database seeding completed successfully!");
  } catch (error) {
    console.error("\n❌ Seeding failed:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Clear all data (for testing purposes)
 */
async function clearDatabase() {
  console.log("🧹 Clearing database...");

  try {
    await prisma.$connect();

    // Delete in correct order to avoid foreign key constraints
    await prisma.stockAdjustment.deleteMany();
    await prisma.auditLog.deleteMany();
    await prisma.spinAttempt.deleteMany();
    await prisma.voucherCode.deleteMany();
    await prisma.voucher.deleteMany();
    await prisma.device.deleteMany();
    await prisma.userProfile.deleteMany();
    await prisma.staff.deleteMany();

    console.log("✅ Database cleared successfully");
  } catch (error) {
    console.error("❌ Failed to clear database:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Reset database (clear + seed)
 */
async function resetDatabase() {
  console.log("🔄 Resetting database...");
  await clearDatabase();
  await seedDatabase();
  console.log("✅ Database reset completed");
}

// CLI interface
if (require.main === module) {
  const command = process.argv[2];

  switch (command) {
    case "clear":
      clearDatabase()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
      break;

    case "reset":
      resetDatabase()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
      break;

    default:
      seedDatabase()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
  }
}

module.exports = {
  seedDatabase,
  clearDatabase,
  resetDatabase,
  seedData,
};
