const { PrismaClient } = require("@prisma/client");

// Create a single instance of Prisma Client with error handling
let prisma;

try {
  prisma = new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });
} catch (error) {
  console.error("❌ Failed to initialize Prisma Client:", error.message);
  console.log("💡 Please run 'npx prisma generate' to generate the client");

  // Create a mock prisma client that throws helpful errors
  prisma = new Proxy(
    {},
    {
      get: function (target, property) {
        throw new Error(
          `Prisma client not initialized. Please run 'npx prisma generate' first.`
        );
      },
    }
  );
}

// Handle graceful shutdown
process.on("beforeExit", async () => {
  await prisma.$disconnect();
});

// Legacy compatibility - export the old pool-like interface
// This allows existing code to continue working while transitioning to Prisma
const legacyPool = {
  getConnection: async () => {
    // Return a mock connection object that can be used for raw queries if needed
    return {
      query: async (sql, params) => {
        return await prisma.$queryRawUnsafe(sql, ...(params || []));
      },
      release: () => {
        // No-op for Prisma
      },
      end: async () => {
        await prisma.$disconnect();
      },
    };
  },
  query: async (sql, params) => {
    return await prisma.$queryRawUnsafe(sql, ...(params || []));
  },
  end: async () => {
    await prisma.$disconnect();
  },
};

// Test connection
async function testConnection() {
  try {
    await prisma.$connect();
    console.log("✅ Database connected successfully via Prisma");
    return true;
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
    return false;
  }
}

// Execute query with error handling
async function query(sql, params = []) {
  try {
    const result = await prisma.$queryRawUnsafe(sql, ...(params || []));
    return result;
  } catch (error) {
    console.error("Database query error:", error);
    throw error;
  }
}

// Execute transaction
async function transaction(queries) {
  return await prisma.$transaction(async (tx) => {
    const results = [];
    for (const { sql, params } of queries) {
      const result = await tx.$queryRawUnsafe(sql, ...(params || []));
      results.push(result);
    }
    return results;
  });
}

module.exports = {
  // Main Prisma client
  prisma,

  // Legacy pool interface for compatibility
  pool: legacyPool,

  // Utility functions
  query,
  transaction,
  testConnection,

  // Default export is the Prisma client
  default: prisma,
};
