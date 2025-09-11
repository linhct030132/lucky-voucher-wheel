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
  body("phone")
    .isMobilePhone()
    .withMessage("Vui lòng nhập số điện thoại hợp lệ"),
  body("age")
    .isInt({ min: 13, max: 100 })
    .withMessage("Tuổi phải từ 13 đến 100"),
  body("address")
    .optional()
    .isLength({ max: 500 })
    .trim()
    .withMessage("Địa chỉ không được quá 500 ký tự"),
  body("referralSource")
    .optional()
    .isLength({ max: 100 })
    .trim()
    .withMessage("Kênh biết đến không được quá 100 ký tự"),
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
      const {
        fullName,
        phone,
        age,
        address,
        referralSource,
        consent,
        deviceId,
      } = req.body;

      // Phone and age are required (validated by express-validator)

      // Sanitize inputs
      const sanitizedProfile = {
        fullName: SecurityUtils.sanitizeInput(fullName),
        phone: SecurityUtils.sanitizeInput(phone),
        age: parseInt(age),
        address: address ? SecurityUtils.sanitizeInput(address) : null,
        referralSource: referralSource
          ? SecurityUtils.sanitizeInput(referralSource)
          : null,
      };

      // Additional validation
      if (!SecurityUtils.isValidPhone(sanitizedProfile.phone)) {
        return res
          .status(400)
          .json({ error: "Định dạng số điện thoại không hợp lệ" });
      }

      // Generate IP-only fingerprint for cross-browser detection
      const ipOnlyFingerprint =
        DeviceFingerprint.generateIPOnlyFingerprint(req);

      // Check for existing IP-based device first
      const ipBasedDevice = await prisma.device.findFirst({
        where: { deviceFpHash: ipOnlyFingerprint },
        select: { id: true },
      });

      // Create or get IP-based device record first
      let deviceRecordId;

      if (ipBasedDevice) {
        deviceRecordId = ipBasedDevice.id;
        // Update last seen
        await prisma.device.update({
          where: { id: deviceRecordId },
          data: { lastSeenAt: new Date() },
        });
      } else {
        // Create new IP-based device record
        deviceRecordId = uuidv4();
        await prisma.device.create({
          data: {
            id: deviceRecordId,
            deviceFpHash: ipOnlyFingerprint,
            firstSeenAt: new Date(),
            lastSeenAt: new Date(),
          },
        });
      }

      // Check if user info is already stored for this device
      const deviceSession = await prisma.deviceSession.findUnique({
        where: { deviceId: deviceRecordId },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true,
            },
          },
        },
      });

      let userId;

      if (deviceSession && deviceSession.user) {
        // Use existing stored user info
        userId = deviceSession.user.id;
        // Update user profile with any new info provided
        await prisma.userProfile.update({
          where: { id: userId },
          data: {
            fullName: sanitizedProfile.fullName,
            phone: sanitizedProfile.phone,
            age: sanitizedProfile.age,
            address: sanitizedProfile.address || null,
            referralSource: sanitizedProfile.referralSource || null,
            consentAt: new Date(),
          },
        });
      } else {
        // Create or get user profile
        const userHash = SecurityUtils.hashUserIdentity(
          null,
          sanitizedProfile.phone
        );

        // Check if user already exists
        const existingUser = await prisma.userProfile.findFirst({
          where: {
            phone: sanitizedProfile.phone,
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
              phone: sanitizedProfile.phone,
              age: sanitizedProfile.age,
              address: sanitizedProfile.address,
              referralSource: sanitizedProfile.referralSource,
              consentAt: new Date(),
            },
          });
        }

        // Create device session
        await prisma.deviceSession.create({
          data: {
            id: uuidv4(),
            deviceId: deviceRecordId,
            userId: userId,
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
 * POST /api/store-user-info
 * Store user information for later spinning (pre-spin storage)
 */
router.post(
  "/store-user-info",
  [
    body("fullName")
      .isLength({ min: 2, max: 100 })
      .trim()
      .withMessage("Họ và tên phải từ 2 đến 100 ký tự"),
    body("phone")
      .isMobilePhone()
      .withMessage("Vui lòng nhập số điện thoại hợp lệ"),
    body("age")
      .isInt({ min: 13, max: 100 })
      .withMessage("Tuổi phải từ 13 đến 100"),
    body("address")
      .optional()
      .isLength({ max: 500 })
      .trim()
      .withMessage("Địa chỉ không được quá 500 ký tự"),
    body("referralSource")
      .optional()
      .isLength({ max: 100 })
      .trim()
      .withMessage("Kênh biết đến không được quá 100 ký tự"),
    body("consent")
      .isBoolean()
      .custom((value) => value === true)
      .withMessage("Bạn cần đồng ý với điều khoản để tham gia"),
    body("deviceId")
      .isLength({ min: 10 })
      .withMessage("Mã thiết bị không hợp lệ"),
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const {
        fullName,
        phone,
        age,
        address,
        referralSource,
        consent,
        deviceId,
      } = req.body;

      // Phone and age are required (validated by express-validator)

      // Sanitize inputs
      const sanitizedProfile = {
        fullName: SecurityUtils.sanitizeInput(fullName),
        phone: SecurityUtils.sanitizeInput(phone),
        age: parseInt(age),
        address: address ? SecurityUtils.sanitizeInput(address) : null,
        referralSource: referralSource
          ? SecurityUtils.sanitizeInput(referralSource)
          : null,
      };

      // Additional validation
      if (!SecurityUtils.isValidPhone(sanitizedProfile.phone)) {
        return res
          .status(400)
          .json({ error: "Định dạng số điện thoại không hợp lệ" });
      }

      // Generate IP-only fingerprint for cross-browser detection
      const ipOnlyFingerprint =
        DeviceFingerprint.generateIPOnlyFingerprint(req);

      // Check for existing IP-based device first
      const ipBasedDevice = await prisma.device.findFirst({
        where: { deviceFpHash: ipOnlyFingerprint },
        select: { id: true },
      });

      // Create or get IP-based device record
      let deviceRecordId;
      const existingDevice = ipBasedDevice;

      if (existingDevice) {
        deviceRecordId = existingDevice.id;
        // Update last seen
        await prisma.device.update({
          where: { id: deviceRecordId },
          data: { lastSeenAt: new Date() },
        });
      } else {
        // Create new IP-based device record
        deviceRecordId = uuidv4();
        await prisma.device.create({
          data: {
            id: deviceRecordId,
            deviceFpHash: ipOnlyFingerprint,
            firstSeenAt: new Date(),
            lastSeenAt: new Date(),
          },
        });
      }

      // Create or update user profile
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
        // Update user profile
        await prisma.userProfile.update({
          where: { id: userId },
          data: {
            fullName: sanitizedProfile.fullName,
            phone: sanitizedProfile.phone,
            age: sanitizedProfile.age,
            address: sanitizedProfile.address,
            referralSource: sanitizedProfile.referralSource,
            consentAt: new Date(),
          },
        });
      } else {
        // Create new user profile
        userId = uuidv4();
        await prisma.userProfile.create({
          data: {
            id: userId,
            fullName: sanitizedProfile.fullName,
            email: sanitizedProfile.email,
            phone: sanitizedProfile.phone,
            age: sanitizedProfile.age,
            address: sanitizedProfile.address,
            referralSource: sanitizedProfile.referralSource,
            consentAt: new Date(),
          },
        });
      }

      // Create or update device session
      await prisma.deviceSession.upsert({
        where: { deviceId: deviceRecordId },
        update: {
          userId: userId,
          updatedAt: new Date(),
        },
        create: {
          id: uuidv4(),
          deviceId: deviceRecordId,
          userId: userId,
        },
      });

      res.json({
        success: true,
        message: "Thông tin người dùng đã được lưu thành công",
        data: {
          userId,
          deviceId: deviceRecordId,
          userProfile: sanitizedProfile,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/get-stored-user-info
 * Get stored user information for device
 */
router.post(
  "/get-stored-user-info",
  [
    body("deviceId")
      .isLength({ min: 10 })
      .withMessage("Mã thiết bị là bắt buộc"),
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { deviceId } = req.body;

      // Generate IP-only fingerprint for cross-browser detection
      const ipOnlyFingerprint =
        DeviceFingerprint.generateIPOnlyFingerprint(req);

      // Check for existing IP-based device first
      const device = await prisma.device.findFirst({
        where: { deviceFpHash: ipOnlyFingerprint },
        select: { id: true },
      });

      if (!device) {
        return res.json({
          hasStoredInfo: false,
          message: "Không tìm thấy thiết bị",
        });
      }

      // Check if already spun and get result details
      const existingAttempt = await prisma.spinAttempt.findFirst({
        where: { deviceId: device.id },
        include: {
          user: {
            select: {
              fullName: true,
              email: true,
              phone: true,
              age: true,
              address: true,
              referralSource: true,
            },
          },
          voucherCode: {
            include: {
              voucher: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                  faceValue: true,
                  voucherType: true,
                },
              },
            },
          },
        },
      });

      if (existingAttempt) {
        const spinResult = {
          outcome: existingAttempt.outcome,
          participatedAt: existingAttempt.createdAt,
          userProfile: existingAttempt.user,
          voucher:
            existingAttempt.outcome === "win"
              ? {
                  ...existingAttempt.voucherCode?.voucher,
                  code: existingAttempt.voucherCode?.code,
                }
              : null,
        };

        return res.json({
          hasStoredInfo: false,
          alreadyParticipated: true,
          spinResult: spinResult,
          message: "Thiết bị đã tham gia trước đó",
        });
      }

      // Get stored user information from device session
      const deviceSession = await prisma.deviceSession.findUnique({
        where: { deviceId: device.id },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true,
              address: true,
              referralSource: true,
            },
          },
        },
      });

      if (deviceSession && deviceSession.user) {
        return res.json({
          hasStoredInfo: true,
          alreadyParticipated: false,
          userProfile: {
            fullName: deviceSession.user.fullName,
            email: deviceSession.user.email,
            phone: deviceSession.user.phone,
            age: deviceSession.user.age,
            address: deviceSession.user.address,
            referralSource: deviceSession.user.referralSource,
          },
        });
      }

      res.json({
        hasStoredInfo: false,
        alreadyParticipated: false,
        message: "Không tìm thấy thông tin người dùng đã lưu",
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/verify-eligibility
 * Check if user/device can participate (without consuming the spin)
 */
router.post(
  "/verify-eligibility",
  [
    body("deviceId")
      .isLength({ min: 10 })
      .withMessage("Mã thiết bị là bắt buộc"),
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { deviceId } = req.body;

      // Generate IP-only fingerprint for cross-browser detection
      const ipOnlyFingerprint =
        DeviceFingerprint.generateIPOnlyFingerprint(req);

      // Check for existing participation by IP first (cross-browser)
      const ipBasedDevice = await prisma.device.findFirst({
        where: { deviceFpHash: ipOnlyFingerprint },
        select: { id: true },
      });

      if (ipBasedDevice) {
        // Check if this IP has already participated
        const existingAttempt = await prisma.spinAttempt.findFirst({
          where: { deviceId: ipBasedDevice.id },
          include: {
            user: {
              select: {
                fullName: true,
                email: true,
                phone: true,
                address: true,
                referralSource: true,
              },
            },
          },
        });

        // Get voucher details separately if there was a win
        let voucherDetails = null;
        if (
          existingAttempt &&
          existingAttempt.outcome === "win" &&
          existingAttempt.voucherId
        ) {
          voucherDetails = await prisma.voucher.findUnique({
            where: { id: existingAttempt.voucherId },
            select: {
              id: true,
              name: true,
              description: true,
              faceValue: true,
              voucherType: true,
              voucherCode: true,
              validTo: true,
              validFrom: true,
              maxPerUser: true,
            },
          });
        }

        if (existingAttempt) {
          const spinResult = {
            outcome: existingAttempt.outcome,
            participatedAt: existingAttempt.createdAt,
            userProfile: existingAttempt.user,
            voucher: voucherDetails
              ? {
                  id: voucherDetails.id,
                  name: voucherDetails.name,
                  description: voucherDetails.description,
                  faceValue: voucherDetails.faceValue,
                  voucherType: voucherDetails.voucherType,
                  code: voucherDetails.voucherCode,
                  validTo: voucherDetails.validTo,
                  validFrom: voucherDetails.validFrom,
                  maxPerUser: voucherDetails.maxPerUser,
                }
              : null,
          };

          return res.json({
            eligible: false,
            reason: "ALREADY_PARTICIPATED",
            spinResult: spinResult,
            message: "Địa chỉ IP này đã tham gia trước đó",
          });
        }
      }

      // Also check the exact client+server combination for fallback
      const serverDeviceId = DeviceFingerprint.generateServerFingerprint(req);
      const combinedDeviceId = DeviceFingerprint.generateHMAC(
        `${deviceId}:${serverDeviceId}`
      );

      const exactDevice = await prisma.device.findUnique({
        where: { deviceFpHash: combinedDeviceId },
        select: { id: true },
      });

      // Use IP-based device if found, otherwise use exact device
      const device = ipBasedDevice || exactDevice;

      if (device) {
        // Check if already spun and get result details
        const existingAttempt = await prisma.spinAttempt.findFirst({
          where: { deviceId: device.id },
          include: {
            user: {
              select: {
                fullName: true,
                email: true,
                phone: true,
              },
            },
          },
        });

        // Get voucher details separately if there was a win
        let voucherDetails = null;
        if (
          existingAttempt &&
          existingAttempt.outcome === "win" &&
          existingAttempt.voucherId
        ) {
          voucherDetails = await prisma.voucher.findUnique({
            where: { id: existingAttempt.voucherId },
            select: {
              id: true,
              name: true,
              description: true,
              faceValue: true,
              voucherType: true,
              voucherCode: true,
              validTo: true,
              validFrom: true,
              maxPerUser: true,
            },
          });
        }

        if (existingAttempt) {
          const spinResult = {
            outcome: existingAttempt.outcome,
            participatedAt: existingAttempt.createdAt,
            userProfile: existingAttempt.user,
            voucher: voucherDetails
              ? {
                  id: voucherDetails.id,
                  name: voucherDetails.name,
                  description: voucherDetails.description,
                  faceValue: voucherDetails.faceValue,
                  voucherType: voucherDetails.voucherType,
                  code: voucherDetails.voucherCode,
                  validTo: voucherDetails.validTo,
                  validFrom: voucherDetails.validFrom,
                  maxPerUser: voucherDetails.maxPerUser,
                }
              : null,
          };

          return res.json({
            eligible: false,
            reason: "ALREADY_PARTICIPATED",
            spinResult: spinResult,
            message: "Thiết bị này đã tham gia trước đó",
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
          message: "Không còn voucher nào khả dụng",
        });
      }

      res.json({
        eligible: true,
        message: "Bạn đủ điều kiện tham gia",
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
