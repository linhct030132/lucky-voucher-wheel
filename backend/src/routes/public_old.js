const express = require("express");
const { body, query: queryValidator } = require("express-validator");
const { v4: uuidv4 } = require("uuid");
const { query } = require("../config/database");
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
      const { fullName, email, phone, consent, deviceId, campaignId } =
        req.body;

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

      // Verify campaign exists and is active
      const [campaign] = await query(
        `
      SELECT * FROM campaigns 
      WHERE id = ? AND status = 'active'
      AND (start_at IS NULL OR start_at <= NOW())
      AND (end_at IS NULL OR end_at >= NOW())
    `,
        [campaignId]
      );

      if (!campaign) {
        return res.status(410).json({
          error: "Chiến dịch không khả dụng",
          message: "Chiến dịch quay số may mắn này hiện không hoạt động",
        });
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
      const [existingUser] = await query(
        `
      SELECT id FROM user_profiles 
      WHERE (email = ? AND email IS NOT NULL) OR (phone = ? AND phone IS NOT NULL)
    `,
        [sanitizedProfile.email, sanitizedProfile.phone]
      );

      if (existingUser) {
        userId = existingUser.id;
      } else {
        // Create new user profile
        userId = uuidv4();
        await query(
          `
        INSERT INTO user_profiles (id, full_name, email, phone, consent_at)
        VALUES (?, ?, ?, ?, NOW())
      `,
          [
            userId,
            sanitizedProfile.fullName,
            sanitizedProfile.email,
            sanitizedProfile.phone,
          ]
        );
      }

      // Create or get device record
      let deviceRecordId;
      const [existingDevice] = await query(
        "SELECT id FROM devices WHERE device_fp_hash = ?",
        [combinedDeviceId]
      );

      if (existingDevice) {
        deviceRecordId = existingDevice.id;
        // Update last seen
        await query("UPDATE devices SET last_seen_at = NOW() WHERE id = ?", [
          deviceRecordId,
        ]);
      } else {
        // Create new device record
        deviceRecordId = uuidv4();
        await query(
          `
        INSERT INTO devices (id, device_fp_hash, first_seen_at, last_seen_at)
        VALUES (?, ?, NOW(), NOW())
      `,
          [deviceRecordId, combinedDeviceId]
        );
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
      const recentAttempts = await query(
        `
      SELECT COUNT(*) as count
      FROM spin_attempts sa
      WHERE sa.ip_address = ? 
      AND sa.created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)
    `,
        [req.ip]
      );

      if (recentAttempts[0].count >= 10) {
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
          campaignId,
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

        if (spinError.message === "CAMPAIGN_NOT_FOUND") {
          return res.status(410).json({
            error: "Chiến dịch không khả dụng",
            message: "Chiến dịch quay số may mắn này hiện không hoạt động",
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
 * GET /api/campaigns/:id
 * Get campaign details for public display
 */
router.get("/campaigns/:id", async (req, res, next) => {
  try {
    const { id } = req.params;

    // Get campaign with basic voucher info (without probabilities)
    const [campaign] = await query(
      `
      SELECT id, name, status, start_at, end_at
      FROM campaigns 
      WHERE id = ? AND status = 'active'
    `,
      [id]
    );

    if (!campaign) {
      return res.status(404).json({ error: "Không tìm thấy chiến dịch" });
    }

    // Get available voucher categories (without exact probabilities)
    const vouchers = await query(
      `
      SELECT name, face_value, description
      FROM vouchers 
      WHERE campaign_id = ? 
      AND status = 'active' 
      AND remaining_stock > 0
      AND (valid_from IS NULL OR valid_from <= NOW())
      AND (valid_to IS NULL OR valid_to >= NOW())
      ORDER BY base_probability DESC
    `,
      [id]
    );

    res.json({
      success: true,
      data: {
        campaign,
        availablePrizes: vouchers,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/campaigns/:id/status
 * Get campaign availability status
 */
router.get("/campaigns/:id/status", async (req, res, next) => {
  try {
    const { id } = req.params;

    const [campaign] = await query(
      `
      SELECT 
        c.*,
        COUNT(v.id) as active_vouchers,
        SUM(v.remaining_stock) as total_remaining_stock
      FROM campaigns c
      LEFT JOIN vouchers v ON c.id = v.campaign_id 
        AND v.status = 'active' 
        AND v.remaining_stock > 0
        AND (v.valid_from IS NULL OR v.valid_from <= NOW())
        AND (v.valid_to IS NULL OR v.valid_to >= NOW())
      WHERE c.id = ?
      GROUP BY c.id
    `,
      [id]
    );

    if (!campaign) {
      return res.status(404).json({ error: "Campaign not found" });
    }

    const isActive =
      campaign.status === "active" &&
      (campaign.start_at === null ||
        new Date(campaign.start_at) <= new Date()) &&
      (campaign.end_at === null || new Date(campaign.end_at) >= new Date());

    const hasStock = campaign.total_remaining_stock > 0;

    res.json({
      success: true,
      data: {
        isActive,
        hasStock,
        status: campaign.status,
        startAt: campaign.start_at,
        endAt: campaign.end_at,
        totalRemainingStock: campaign.total_remaining_stock || 0,
        activeVouchers: campaign.active_vouchers || 0,
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
  [
    body("deviceId").isLength({ min: 10 }).withMessage("Device ID is required"),
    body("campaignId").isUUID().withMessage("Valid campaign ID is required"),
    body("email").optional().isEmail().normalizeEmail(),
    body("phone").optional().isMobilePhone(),
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { deviceId, campaignId, email, phone } = req.body;

      // Generate device fingerprint
      const serverDeviceId = DeviceFingerprint.generateServerFingerprint(req);
      const combinedDeviceId = DeviceFingerprint.generateHMAC(
        `${deviceId}:${serverDeviceId}`
      );

      // Check campaign status
      const [campaign] = await query(
        `
      SELECT * FROM campaigns 
      WHERE id = ? AND status = 'active'
      AND (start_at IS NULL OR start_at <= NOW())
      AND (end_at IS NULL OR end_at >= NOW())
    `,
        [campaignId]
      );

      if (!campaign) {
        return res.json({
          eligible: false,
          reason: "CAMPAIGN_INACTIVE",
          message: "Campaign is not currently active",
        });
      }

      // Get device record
      const [device] = await query(
        "SELECT id FROM devices WHERE device_fp_hash = ?",
        [combinedDeviceId]
      );

      if (device) {
        // Check if already spun
        const [existingAttempt] = await query(
          `
        SELECT id FROM spin_attempts 
        WHERE device_id = ? AND campaign_id = ?
      `,
          [device.id, campaignId]
        );

        if (existingAttempt) {
          return res.json({
            eligible: false,
            reason: "ALREADY_PARTICIPATED",
            message: "You have already participated in this campaign",
          });
        }
      }

      // Check if user (by email/phone) already participated
      if (email || phone) {
        const [userAttempt] = await query(
          `
        SELECT sa.id 
        FROM spin_attempts sa
        JOIN user_profiles up ON sa.user_id = up.id
        WHERE sa.campaign_id = ? 
        AND (up.email = ? OR up.phone = ?)
      `,
          [campaignId, email, phone]
        );

        if (userAttempt) {
          return res.json({
            eligible: false,
            reason: "USER_ALREADY_PARTICIPATED",
            message: "This email/phone has already participated",
          });
        }
      }

      // Check if there are available vouchers
      const [{ availableStock }] = await query(
        `
      SELECT SUM(remaining_stock) as availableStock
      FROM vouchers 
      WHERE campaign_id = ? 
      AND status = 'active'
      AND remaining_stock > 0
      AND (valid_from IS NULL OR valid_from <= NOW())
      AND (valid_to IS NULL OR valid_to >= NOW())
    `,
        [campaignId]
      );

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
