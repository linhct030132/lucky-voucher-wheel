const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
const path = require("path");

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Debug environment variables
console.log("🔧 Environment Debug:");
console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`PORT (raw): ${process.env.PORT}`);
console.log(`BACKEND_PORT (raw): ${process.env.BACKEND_PORT}`);

// For Railway/production: Always use Railway's PORT if available
// For development: use BACKEND_PORT to avoid conflicts with frontend dev server
const PORT =
  process.env.PORT ||
  (process.env.NODE_ENV === "production"
    ? 8080
    : process.env.BACKEND_PORT || 3001);

console.log(`Final resolved PORT: ${PORT}`);

// Import database and utilities
const { testConnection } = require("./config/database");
const { errorHandler, notFound } = require("./middleware/errorHandler");
const { apiLimiter } = require("./middleware/rateLimiter");

// Import routes
const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin");
const publicRoutes = require("./routes/public");

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
    version: "1.0.0",
  });
});

// Trust proxy for accurate IP addresses
app.set("trust proxy", 1);

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:"],
        scriptSrc: ["'self'"],
        connectSrc: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // In production, allow same origin (since frontend is served by the same server)
    if (process.env.NODE_ENV === "production") {
      // Allow same origin and the Railway URL
      const allowedOrigins = [
        process.env.RAILWAY_STATIC_URL,
        process.env.FRONTEND_URL,
        // Allow same origin (null when serving static files)
        null,
      ].filter(Boolean);

      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true); // Be permissive in production for now
      }
    } else {
      // In development, allow all origins
      callback(null, true);
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
  maxAge: 86400, // 24 hours
};

app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser(process.env.COOKIE_SECRET));

// Rate limiting
app.use("/api", apiLimiter);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    version: "1.0.0",
  });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api", publicRoutes);

// Serve static files from the React app in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../../frontend/build")));

  // Catch all handler: send back React's index.html file for client-side routing
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../../frontend/build/index.html"));
  });
}

// 404 handler
app.use(notFound);

// Error handling middleware
app.use(errorHandler);

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  server.close(() => {
    console.log("Process terminated");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("SIGINT received, shutting down gracefully");
  server.close(() => {
    console.log("Process terminated");
    process.exit(0);
  });
});

// Start server
async function startServer() {
  try {
    // Debug port configuration
    console.log("🔧 Port Configuration Debug:");
    console.log(`PORT: ${process.env.PORT}`);
    console.log(`Resolved PORT: ${PORT}`);
    console.log(
      `Serving static files from: ${path.join(
        __dirname,
        "../../frontend/build"
      )}`
    );
    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.error("Failed to connect to database. Exiting...");
      process.exit(1);
    }

    const server = app.listen(PORT, "0.0.0.0", () => {
      console.log("🚀 Lucky Voucher System Backend Started");
      console.log(`📍 Server running on 0.0.0.0:${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(
        `🔗 Frontend URL: ${
          process.env.FRONTEND_URL || "http://localhost:3000"
        }`
      );
      console.log("📡 API Endpoints:");
      console.log("   - Health: GET /health");
      console.log("   - Auth: POST /api/auth/login, /api/auth/register");
      console.log(
        "   - Public: POST /api/spins, GET /api/vouchers, GET /api/status"
      );
      console.log("   - Admin: /api/admin/* (requires authentication)");
      console.log("");
      console.log("🎯 Ready to serve lucky draw requests!");
    });

    // Make server available for graceful shutdown
    global.server = server;
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();

module.exports = app;
