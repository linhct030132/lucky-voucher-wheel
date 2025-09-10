const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { body } = require("express-validator");
const { v4: uuidv4 } = require("uuid");
const { prisma } = require("../config/database");
const { handleValidationErrors } = require("../middleware/errorHandler");
const { authLimiter } = require("../middleware/rateLimiter");
const AuditLogger = require("../utils/auditLogger");

const router = express.Router();

// Login validation rules
const loginValidation = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Email không đúng định dạng"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Mật khẩu phải có ít nhất 6 ký tự"),
];

// Register validation rules
const registerValidation = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Email không đúng định dạng"),
  body("password")
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "Mật khẩu phải có ít nhất 8 ký tự bao gồm chữ hoa, chữ thường và số"
    ),
  body("fullName")
    .isLength({ min: 2, max: 100 })
    .trim()
    .withMessage("Họ và tên phải từ 2 đến 100 ký tự"),
  body("role")
    .optional()
    .isIn(["STAFF", "ADMIN"])
    .withMessage("Vai trò phải là STAFF hoặc ADMIN"),
];

/**
 * POST /api/auth/login
 * Staff login
 */
router.post(
  "/login",
  authLimiter,
  loginValidation,
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { email, password } = req.body;

      // Find staff member
      const staff = await prisma.staff.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          passwordHash: true,
          fullName: true,
          role: true,
          isActive: true,
          mfaEnabled: true,
        },
      });

      if (!staff) {
        return res
          .status(401)
          .json({ error: "Thông tin đăng nhập không đúng" });
      }

      if (!staff.isActive) {
        return res.status(401).json({ error: "Tài khoản đã bị vô hiệu hóa" });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(
        password,
        staff.passwordHash
      );
      if (!isValidPassword) {
        return res
          .status(401)
          .json({ error: "Thông tin đăng nhập không đúng" });
      } // Generate JWT tokens
      const tokenPayload = {
        userId: staff.id,
        email: staff.email,
        role: staff.role,
      };

      const accessToken = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || "24h",
      });

      const refreshToken = jwt.sign(
        tokenPayload,
        process.env.JWT_REFRESH_SECRET,
        {
          expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
        }
      );

      // Update last login
      await prisma.staff.update({
        where: { id: staff.id },
        data: { lastLoginAt: new Date() },
      });

      // Log authentication
      await AuditLogger.logAuth("LOGIN", staff.id, staff.email, req);

      // Set secure HTTP-only cookies for tokens
      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days for refresh token
      };

      res.cookie("refreshToken", refreshToken, cookieOptions);

      res.json({
        success: true,
        accessToken,
        user: {
          id: staff.id,
          email: staff.email,
          fullName: staff.fullName,
          role: staff.role,
          mfaEnabled: staff.mfaEnabled,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/auth/register
 * Register new staff member (Admin only, but allowing direct registration for initial setup)
 */
router.post(
  "/register",
  registerValidation,
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { email, password, fullName, role = "STAFF" } = req.body;

      // Check if staff member already exists
      const existingStaff = await prisma.staff.findUnique({
        where: { email },
        select: { id: true },
      });

      if (existingStaff) {
        return res.status(409).json({ error: "Email đã được đăng ký" });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(
        password,
        parseInt(process.env.BCRYPT_ROUNDS) || 12
      );

      // Create staff member
      const staffId = uuidv4();
      await prisma.staff.create({
        data: {
          id: staffId,
          email,
          passwordHash: passwordHash,
          fullName: fullName,
          role,
          isActive: true,
        },
      });

      // Log registration
      await AuditLogger.logAuth("REGISTER", staffId, email, req);

      res.status(201).json({
        success: true,
        message: "Nhân viên đã được đăng ký thành công",
        user: {
          id: staffId,
          email,
          fullName,
          role,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/auth/refresh
 * Refresh access token
 */
router.post("/refresh", async (req, res, next) => {
  try {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
      return res.status(401).json({ error: "Yêu cầu refresh token" });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // Verify user still exists and is active
    const staff = await prisma.staff.findFirst({
      where: {
        id: decoded.userId,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
      },
    });

    if (!staff) {
      return res.status(401).json({ error: "Refresh token không hợp lệ" });
    }

    // Generate new access token
    const tokenPayload = {
      userId: staff.id,
      email: staff.email,
      role: staff.role,
    };

    const accessToken = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || "24h",
    });

    res.json({
      success: true,
      accessToken,
      user: {
        id: staff.id,
        email: staff.email,
        fullName: staff.fullName,
        role: staff.role,
      },
    });
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Refresh token đã hết hạn" });
    }
    next(error);
  }
});

/**
 * POST /api/auth/logout
 * Logout and clear cookies
 */
router.post("/logout", async (req, res, next) => {
  try {
    // Clear refresh token cookie
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    res.json({ success: true, message: "Đăng xuất thành công" });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/auth/me
 * Get current user info
 */
router.get("/me", async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "Yêu cầu access token" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const staff = await prisma.staff.findFirst({
      where: {
        id: decoded.userId,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        mfaEnabled: true,
        lastLoginAt: true,
      },
    });

    if (!staff) {
      return res.status(401).json({ error: "Token không hợp lệ" });
    }

    res.json({
      success: true,
      user: {
        id: staff.id,
        email: staff.email,
        fullName: staff.fullName,
        role: staff.role,
        mfaEnabled: staff.mfaEnabled,
        lastLoginAt: staff.lastLoginAt,
      },
    });
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token đã hết hạn" });
    }
    next(error);
  }
});

module.exports = router;
