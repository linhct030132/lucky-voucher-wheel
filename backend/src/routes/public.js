const express = require("express");
const { body } = require("express-validator");
const { v4: uuidv4 } = require("uuid");
const { prisma } = require("../config/database");
const { handleValidationErrors } = require("../middleware/errorHandler");
const { spinLimiter } = require("../middleware/rateLimiter");
const { DeviceFingerprint, SecurityUtils } = require("../utils/security");
const SpinEngine = require("../services/spinEngine");
const NotificationService = require("../services/notificationService");

const router = express.Router();
const notificationService = new NotificationService();

// Spin validation rules
const spinValidation = [
  body("fullName")
    .isLength({ min: 2, max: 100 })
    .trim()
    .withMessage("Họ và tên phải từ 2 đến 100 ký tự"),
  body("email")
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage("Email không đúng định dạng"),
  body("phone")
    .optional()
    .isMobilePhone()
    .withMessage("Số điện thoại không đúng định dạng"),
  body("consent")
    .isBoolean()
    .custom((value) => value === true)
    .withMessage("Bạn cần đồng ý với điều khoản để tham gia"),
  body("deviceId")
    .isLength({ min: 10 })
    .withMessage("Mã thiết bị không hợp lệ"),
];

/**
 * POST /api/spins
 * Create a spin attempt
 */
router.post(
  "/spins",
  spinLimiter,
  spinValidation,
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { fullName, email, phone, consent, deviceId } = req.body;

      // Validate at least one contact method
      if (!email && !phone) {
        return res.status(400).json({
          error:
            "Vui lòng cung cấp ít nhất một phương thức liên hệ (email hoặc số điện thoại)",
        });
      }

      // Sanitize inputs
      const sanitizedProfile = {
        fullName: SecurityUtils.sanitizeInput(fullName),
        email: email ? SecurityUtils.sanitizeInput(email) : null,
        phone: phone ? SecurityUtils.sanitizeInput(phone) : null,
      };

      // Additional validation
      if (
        sanitizedProfile.email &&
        !SecurityUtils.isValidEmail(sanitizedProfile.email)
      ) {
        return res.status(400).json({ error: "Định dạng email không hợp lệ" });
      }

      if (
        sanitizedProfile.phone &&
        !SecurityUtils.isValidPhone(sanitizedProfile.phone)
      ) {
        return res
          .status(400)
          .json({ error: "Định dạng số điện thoại không hợp lệ" });
      }

      // Generate device fingerprint hash
      const serverDeviceId = DeviceFingerprint.generateServerFingerprint(req);
      const combinedDeviceId = DeviceFingerprint.generateHMAC(
        `${deviceId}:${serverDeviceId}`
      );

      // Create or get user profile
      const userHash = SecurityUtils.hashUserIdentity(
        sanitizedProfile.email,
        sanitizedProfile.phone
      );
      let userId;

      // Check if user already exists
      const existingUser = await prisma.userProfile.findFirst({
        where: {
          OR: [
            { email: sanitizedProfile.email, email: { not: null } },
            { phone: sanitizedProfile.phone, phone: { not: null } },
          ],
        },
        select: { id: true },
      });

      if (existingUser) {
        userId = existingUser.id;
      } else {
        // Create new user profile
        userId = uuidv4();
        await prisma.userProfile.create({
          data: {
            id: userId,
            fullName: sanitizedProfile.fullName,
            email: sanitizedProfile.email,
            phone: sanitizedProfile.phone,
            consentAt: new Date(),
          },
        });
      }

      // Create or get device record
      let deviceRecordId;
      const existingDevice = await prisma.device.findUnique({
        where: { deviceFpHash: combinedDeviceId },
        select: { id: true },
      });

      if (existingDevice) {
        deviceRecordId = existingDevice.id;
        // Update last seen
        await prisma.device.update({
          where: { id: deviceRecordId },
          data: { lastSeenAt: new Date() },
        });
      } else {
        // Create new device record
        deviceRecordId = uuidv4();
        await prisma.device.create({
          data: {
            id: deviceRecordId,
            deviceFpHash: combinedDeviceId,
            firstSeenAt: new Date(),
            lastSeenAt: new Date(),
          },
        });
      }

      // Check for suspicious activity
      const warnings = SecurityUtils.detectSuspiciousActivity(
        req,
        sanitizedProfile
      );
      if (warnings.length > 0) {
        console.warn("Suspicious activity detected:", warnings, {
          ip: req.ip,
          userAgent: req.get("User-Agent"),
          profile: sanitizedProfile,
        });
      }

      // Enhanced fraud detection - check for recent attempts from same IP/User-Agent
      const recentAttemptsCount = await prisma.spinAttempt.count({
        where: {
          ipAddress: req.ip,
          createdAt: {
            gt: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
          },
        },
      });

      if (recentAttemptsCount >= 10) {
        return res.status(429).json({
          error: "Quá nhiều lần thử",
          message: "Vui lòng thử lại sau",
        });
      }

      // Perform the spin
      try {
        const spinResult = await SpinEngine.spin(
          { id: userId, ...sanitizedProfile },
          deviceRecordId,
          req
        );

        // Send notifications for wins
        if (spinResult.outcome === "win") {
          try {
            await notificationService.sendWinNotification(
              { id: userId, ...sanitizedProfile },
              spinResult.voucher,
              spinResult.voucher.code
            );
          } catch (notificationError) {
            console.error(
              "Failed to send win notification:",
              notificationError
            );
            // Don't fail the spin if notification fails
          }
        } else {
          // Send participation confirmation
          try {
            await notificationService.sendParticipationConfirmation({
              id: userId,
              ...sanitizedProfile,
            });
          } catch (notificationError) {
            console.error(
              "Failed to send participation confirmation:",
              notificationError
            );
          }
        }

        // Return result
        if (spinResult.outcome === "win") {
          res.json({
            outcome: "win",
            voucher: {
              id: spinResult.voucher.id,
              name: spinResult.voucher.name,
              code: spinResult.voucher.code,
              faceValue: spinResult.voucher.faceValue,
              validTo: null, // Will be set from voucher data
            },
            message: "Chúc mừng! Bạn đã trúng thưởng!",
          });
        } else {
          res.json({
            outcome: "lose",
            message: "Cảm ơn bạn đã tham gia! Chúc bạn may mắn lần sau.",
          });
        }
      } catch (spinError) {
        if (spinError.message === "ALREADY_SPUN") {
          return res.status(409).json({
            error: "Đã tham gia trước đó",
            message: "Bạn đã tham gia quay số may mắn này rồi",
          });
        }

        throw spinError;
      }
    } catch (error) {
      console.error("Spin error:", error);
      next(error);
    }
  }
);

/**
 * GET /api/vouchers
 * Get available vouchers for public display
 */
router.get("/vouchers", async (req, res, next) => {
  try {
    // Get available voucher categories (without exact probabilities)
    const vouchers = await prisma.voucher.findMany({
      where: {
        status: "active",
        remainingStock: { gt: 0 },
        OR: [{ validFrom: null }, { validFrom: { lte: new Date() } }],
        AND: [
          {
            OR: [{ validTo: null }, { validTo: { gte: new Date() } }],
          },
        ],
      },
      select: {
        name: true,
        faceValue: true,
        description: true,
      },
      orderBy: {
        baseProbability: "desc",
      },
    });

    res.json({
      success: true,
      data: {
        availablePrizes: vouchers,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/status
 * Get spin availability status
 */
router.get("/status", async (req, res, next) => {
  try {
    const voucherData = await prisma.voucher.aggregate({
      where: {
        status: "active",
        remainingStock: { gt: 0 },
        OR: [{ validFrom: null }, { validFrom: { lte: new Date() } }],
        AND: [
          {
            OR: [{ validTo: null }, { validTo: { gte: new Date() } }],
          },
        ],
      },
      _count: { id: true },
      _sum: { remainingStock: true },
    });

    const totalRemainingStock = Number(voucherData._sum.remainingStock || 0);
    const activeVouchers = Number(voucherData._count.id || 0);
    const hasStock = totalRemainingStock > 0;

    res.json({
      success: true,
      data: {
        isActive: hasStock,
        hasStock,
        totalRemainingStock,
        activeVouchers,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/verify-eligibility
 * Check if user/device can participate (without consuming the spin)
 */
router.post(
  "/verify-eligibility",
  [body("deviceId").isLength({ min: 10 }).withMessage("Device ID is required")],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { deviceId } = req.body;

      // Generate device fingerprint
      const serverDeviceId = DeviceFingerprint.generateServerFingerprint(req);
      const combinedDeviceId = DeviceFingerprint.generateHMAC(
        `${deviceId}:${serverDeviceId}`
      );

      // Get device record
      const device = await prisma.device.findUnique({
        where: { deviceFpHash: combinedDeviceId },
        select: { id: true },
      });

      if (device) {
        // Check if already spun
        const existingAttempt = await prisma.spinAttempt.findFirst({
          where: { deviceId: device.id },
          select: { id: true },
        });

        if (existingAttempt) {
          return res.json({
            eligible: false,
            reason: "ALREADY_PARTICIPATED",
            message: "You have already participated",
          });
        }
      }

      // Check if there are available vouchers
      const availableStockSum = await prisma.voucher.aggregate({
        where: {
          status: "active",
          remainingStock: { gt: 0 },
          OR: [{ validFrom: null }, { validFrom: { lte: new Date() } }],
          AND: [
            {
              OR: [{ validTo: null }, { validTo: { gte: new Date() } }],
            },
          ],
        },
        _sum: { remainingStock: true },
      });

      const availableStock = Number(availableStockSum._sum.remainingStock || 0);

      if (!availableStock || availableStock === 0) {
        return res.json({
          eligible: false,
          reason: "NO_STOCK",
          message: "No more vouchers available",
        });
      }

      res.json({
        eligible: true,
        message: "You are eligible to participate",
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
