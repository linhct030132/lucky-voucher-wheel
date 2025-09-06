const rateLimit = require("express-rate-limit");

// General API rate limiting
const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000, // 1 minute
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    error: "Too many requests from this IP, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter rate limiting for spin endpoint
const spinLimiter = rateLimit({
  windowMs: 60000, // 1 minute
  max: parseInt(process.env.SPIN_RATE_LIMIT_MAX) || 5,
  message: {
    error: "Too many spin attempts from this IP, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Include IP and User-Agent for better fingerprinting
    return `${req.ip}-${req.get("User-Agent") || "unknown"}`;
  },
});

// Auth endpoint rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per 15 minutes
  message: {
    error: "Too many authentication attempts, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  apiLimiter,
  spinLimiter,
  authLimiter,
};
