const express = require("express");
const { body, query: queryValidator, param } = require("express-validator");
const { v4: uuidv4 } = require("uuid");
const { prisma, query } = require("../config/database");
const { authenticateToken, requireRole } = require("../middleware/auth");
const { handleValidationErrors } = require("../middleware/errorHandler");
const AuditLogger = require("../utils/auditLogger");
const { SecurityUtils } = require("../utils/security");
const SpinEngine = require("../services/spinEngine");

const router = express.Router();

// Apply authentication and role check to all admin routes
router.use(authenticateToken);
router.use(requireRole(["STAFF", "ADMIN"]));

// Voucher validation rules
const voucherValidation = [
  body("name")
    .isLength({ min: 2, max: 255 })
    .trim()
    .withMessage("Tên voucher phải từ 2 đến 255 ký tự"),
  body("description")
    .optional()
    .isLength({ max: 1000 })
    .trim()
    .withMessage("Mô tả không được vượt quá 1000 ký tự"),
  body("faceValue")
    .isLength({ min: 1, max: 255 })
    .trim()
    .withMessage("Giá trị voucher là bắt buộc"),
  body("voucherType")
    .optional()
    .isIn(["discount_percentage", "discount_amount", "free_product"])
    .withMessage(
      "Loại voucher phải là discount_percentage, discount_amount hoặc free_product"
    ),
  body("baseProbability")
    .isFloat({ min: 0, max: 1 })
    .withMessage("Xác suất cơ bản phải từ 0 đến 1"),
  body("initialStock")
    .isInt({ min: 0 })
    .withMessage("Số lượng ban đầu phải là số nguyên không âm"),
  body("maxPerUser")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Số lượng tối đa mỗi người phải là số nguyên dương"),
  body("validFrom")
    .optional()
    .isISO8601()
    .withMessage("Ngày bắt đầu hiệu lực phải là ngày hợp lệ"),
  body("validTo")
    .optional()
    .isISO8601()
    .withMessage("Ngày hết hiệu lực phải là ngày hợp lệ"),
  body("status")
    .optional()
    .isIn(["draft", "active", "inactive"])
    .withMessage("Trạng thái phải là draft, active hoặc inactive"),
  body("codeGeneration")
    .optional()
    .isIn(["auto", "pre_seeded"])
    .withMessage("Cách tạo mã phải là auto hoặc pre_seeded"),
  body("codePrefix")
    .optional()
    .isLength({ min: 1, max: 10 })
    .withMessage("Tiền tố mã phải từ 1 đến 10 ký tự"),
];

/**
 * GET /api/admin/vouchers
 * List all vouchers with filtering
 */
router.get(
  "/vouchers",
  [
    queryValidator("status").optional().isIn(["draft", "active", "inactive"]),
    queryValidator("page").optional().isInt({ min: 1 }),
    queryValidator("limit").optional().isInt({ min: 1, max: 100 }),
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { status, page = 1, limit = 20 } = req.query;
      const pageNum = Math.max(1, parseInt(page) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
      const offset = (pageNum - 1) * limitNum;

      // Build where clause for Prisma
      const where = {};
      if (status) {
        where.status = status;
      }

      console.log("Prisma where clause:", where);
      console.log("Pagination params:", { pageNum, limitNum, offset });

      // Get vouchers with aggregated counts using Prisma
      const [vouchers, total] = await Promise.all([
        prisma.voucher.findMany({
          where,
          include: {
            _count: {
              select: {
                voucherCodes: {
                  where: { status: "issued" },
                },
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          skip: offset,
          take: limitNum,
        }),
        prisma.voucher.count({ where }),
      ]);

      // Transform the data to match expected format
      const transformedVouchers = await Promise.all(
        vouchers.map(async (voucher) => {
          const codes_issued = await prisma.voucherCode.count({
            where: { voucherId: voucher.id, status: "issued" },
          });

          const codes_redeemed = await prisma.voucherCode.count({
            where: { voucherId: voucher.id, status: "redeemed" },
          });

          return {
            ...voucher,
            codes_issued: Number(codes_issued),
            codes_redeemed: Number(codes_redeemed),
          };
        })
      );

      res.json({
        success: true,
        data: transformedVouchers,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: Number(total), // Convert BigInt to number
          pages: Math.ceil(Number(total) / limitNum),
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/admin/vouchers/:id
 * Get single voucher details
 */
router.get(
  "/vouchers/:id",
  [param("id").isUUID().withMessage("Invalid voucher ID")],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { id } = req.params;

      const voucher = await prisma.voucher.findUnique({
        where: { id },
      });

      if (!voucher) {
        return res.status(404).json({ error: "Voucher not found" });
      }

      // Get voucher code counts
      const [codes_issued, codes_redeemed, codes_available] = await Promise.all(
        [
          prisma.voucherCode.count({
            where: { voucherId: id, status: "issued" },
          }),
          prisma.voucherCode.count({
            where: { voucherId: id, status: "redeemed" },
          }),
          prisma.voucherCode.count({
            where: { voucherId: id, status: "available" },
          }),
        ]
      );

      const voucherWithCounts = {
        ...voucher,
        codes_issued: Number(codes_issued),
        codes_redeemed: Number(codes_redeemed),
        codes_available: Number(codes_available),
      };

      res.json({ success: true, data: voucherWithCounts });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/admin/vouchers
 * Create new voucher
 */
router.post(
  "/vouchers",
  voucherValidation,
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const {
        name,
        description,
        faceValue,
        voucherType = "discount_percentage",
        baseProbability,
        initialStock,
        maxPerUser = 1,
        validFrom,
        validTo,
        status = "draft",
        codeGeneration = "auto",
        codePrefix = "LV",
      } = req.body;

      // Validate date range
      if (validFrom && validTo && new Date(validFrom) >= new Date(validTo)) {
        return res
          .status(400)
          .json({ error: "Valid from date must be before valid to date" });
      }

      const voucherId = uuidv4();

      // Convert string values to proper types
      const initialStockNum = parseInt(initialStock);
      const remainingStockNum = initialStockNum;
      const maxPerUserNum = parseInt(maxPerUser) || 1;
      const baseProbabilityNum = parseFloat(baseProbability);

      // Create voucher using Prisma transaction
      const createdVoucher = await prisma.$transaction(async (tx) => {
        // Create voucher
        const voucher = await tx.voucher.create({
          data: {
            id: voucherId,
            name,
            description,
            faceValue: faceValue,
            voucherType: voucherType,
            baseProbability: baseProbabilityNum,
            initialStock: initialStockNum,
            remainingStock: remainingStockNum,
            maxPerUser: maxPerUserNum,
            validFrom: validFrom ? new Date(validFrom) : null,
            validTo: validTo ? new Date(validTo) : null,
            status,
            codeGeneration: codeGeneration,
            codePrefix: codePrefix,
          },
        });

        // Generate voucher codes if auto generation
        if (codeGeneration === "auto" && initialStockNum > 0) {
          const codes = [];
          for (let i = 1; i <= initialStockNum; i++) {
            const code = SecurityUtils.generateVoucherCode(codePrefix, 8);
            codes.push({
              id: uuidv4(),
              voucherId: voucherId,
              code,
              status: "available",
            });
          }

          if (codes.length > 0) {
            await tx.voucherCode.createMany({
              data: codes,
            });
          }
        }

        return voucher;
      });

      // Log creation
      await AuditLogger.logVoucherCreate(
        createdVoucher,
        req.user.id,
        req.user.role,
        req
      );

      res.status(201).json({
        success: true,
        data: createdVoucher,
        message: "Voucher created successfully",
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/admin/vouchers/:id
 * Update voucher
 */
router.put(
  "/vouchers/:id",
  [
    param("id").isUUID().withMessage("Invalid voucher ID"),
    ...voucherValidation,
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const {
        name,
        description,
        faceValue,
        baseProbability,
        maxPerUser,
        validFrom,
        validTo,
        status,
        codeGeneration,
        codePrefix,
      } = req.body;

      // Get current voucher for audit log
      const currentVoucher = await prisma.voucher.findUnique({
        where: { id },
      });

      if (!currentVoucher) {
        return res.status(404).json({ error: "Voucher not found" });
      }

      // Validate date range
      if (validFrom && validTo && new Date(validFrom) >= new Date(validTo)) {
        return res
          .status(400)
          .json({ error: "Valid from date must be before valid to date" });
      }

      // Convert string values to proper types
      const maxPerUserNum = maxPerUser
        ? parseInt(maxPerUser)
        : currentVoucher.maxPerUser;
      const baseProbabilityNum = baseProbability
        ? parseFloat(baseProbability)
        : currentVoucher.baseProbability;

      // Update voucher
      const updatedVoucher = await prisma.voucher.update({
        where: { id },
        data: {
          name,
          description,
          faceValue: faceValue,
          baseProbability: baseProbabilityNum,
          maxPerUser: maxPerUserNum,
          validFrom: validFrom ? new Date(validFrom) : null,
          validTo: validTo ? new Date(validTo) : null,
          status,
          codeGeneration: codeGeneration,
          codePrefix: codePrefix,
          updatedAt: new Date(),
        },
      });

      // Log update
      await AuditLogger.logVoucherUpdate(
        id,
        currentVoucher,
        updatedVoucher,
        req.user.id,
        req.user.role,
        req
      );

      res.json({
        success: true,
        data: updatedVoucher,
        message: "Voucher updated successfully",
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/admin/vouchers/:id
 * Soft delete voucher
 */
router.delete(
  "/vouchers/:id",
  [param("id").isUUID().withMessage("Invalid voucher ID")],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { id } = req.params;

      // Get current voucher
      const voucher = await prisma.voucher.findUnique({
        where: { id },
      });

      if (!voucher) {
        return res.status(404).json({ error: "Voucher not found" });
      }

      // Check if voucher has issued codes
      const issuedCount = await prisma.voucherCode.count({
        where: {
          voucherId: id,
          status: { in: ["issued", "redeemed"] },
        },
      });

      if (Number(issuedCount) > 0) {
        // Cannot delete if codes are issued, just set to inactive
        await prisma.voucher.update({
          where: { id },
          data: {
            status: "inactive",
            updatedAt: new Date(),
          },
        });

        res.json({
          success: true,
          message:
            "Voucher deactivated (cannot delete vouchers with issued codes)",
        });
      } else {
        // Safe to delete - no issued codes
        await prisma.voucher.update({
          where: { id },
          data: {
            status: "inactive",
            updatedAt: new Date(),
          },
        });

        res.json({
          success: true,
          message: "Voucher deleted successfully",
        });
      }

      // Log deletion/deactivation
      await AuditLogger.logVoucherDelete(
        id,
        voucher,
        req.user.id,
        req.user.role,
        req
      );
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/admin/vouchers/:id/stock-adjustments
 * Adjust voucher stock
 */
router.post(
  "/vouchers/:id/stock-adjustments",
  [
    param("id").isUUID().withMessage("Invalid voucher ID"),
    body("delta").isInt().withMessage("Delta must be an integer"),
    body("reason")
      .isLength({ min: 1, max: 500 })
      .trim()
      .withMessage("Reason is required and must not exceed 500 characters"),
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { delta, reason } = req.body;

      // Convert delta to integer
      const deltaNum = parseInt(delta);

      // Get current voucher
      const voucher = await prisma.voucher.findUnique({
        where: { id },
      });

      if (!voucher) {
        return res.status(404).json({ error: "Voucher not found" });
      }

      const previousStock = voucher.remainingStock;
      const newStock = previousStock + deltaNum;

      if (newStock < 0) {
        return res.status(400).json({ error: "Stock cannot be negative" });
      }

      // Update stock and create adjustment record in transaction
      const adjustmentId = uuidv4();
      const adjustment = await prisma.$transaction(async (tx) => {
        // Update voucher stock
        await tx.voucher.update({
          where: { id },
          data: {
            remainingStock: newStock,
            updatedAt: new Date(),
          },
        });

        // Create adjustment record
        const adjustment = await tx.stockAdjustment.create({
          data: {
            id: adjustmentId,
            voucherId: id,
            staffId: req.user.id,
            deltaAmount: deltaNum,
            reason,
            previousStock: previousStock,
            newStock: newStock,
          },
        });

        // If adding stock and code generation is auto, generate new codes
        if (deltaNum > 0 && voucher.codeGeneration === "auto") {
          const codes = [];

          for (let i = 0; i < deltaNum; i++) {
            const code = SecurityUtils.generateVoucherCode(
              voucher.codePrefix,
              8
            );
            codes.push({
              id: uuidv4(),
              voucherId: id,
              code,
              status: "available",
            });
          }

          if (codes.length > 0) {
            await tx.voucherCode.createMany({
              data: codes,
            });
          }
        }

        return adjustment;
      });

      // Log adjustment
      await AuditLogger.logStockAdjustment(
        adjustment,
        req.user.id,
        req.user.role,
        req
      );

      res.json({
        success: true,
        data: {
          previousStock,
          newStock,
          delta: deltaNum,
          reason,
        },
        message: "Stock adjusted successfully",
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/admin/reports/spins
 * Get spin statistics and reports
 */
router.get(
  "/reports/spins",
  [
    queryValidator("dateFrom").optional().isISO8601(),
    queryValidator("dateTo").optional().isISO8601(),
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { dateFrom, dateTo } = req.query;

      const stats = await SpinEngine.getSpinStatistics(null, dateFrom, dateTo);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/admin/logs
 * Get audit logs
 */
router.get(
  "/logs",
  [
    queryValidator("entityType")
      .optional()
      .isIn(["voucher", "staff", "spin_attempt"]),
    queryValidator("action")
      .optional()
      .custom((value) => {
        // Allow empty string or alphabetic values
        if (value === "" || value === undefined || value === null) {
          return true;
        }
        return /^[a-zA-Z_]+$/.test(value);
      })
      .withMessage("Action must be alphabetic or empty"),
    queryValidator("dateFrom").optional().isISO8601(),
    queryValidator("dateTo").optional().isISO8601(),
    queryValidator("page").optional().isInt({ min: 1 }),
    queryValidator("limit").optional().isInt({ min: 1, max: 100 }),
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const {
        entityType,
        action,
        dateFrom,
        dateTo,
        page = 1,
        limit = 50,
      } = req.query;
      const pageNum = Math.max(1, parseInt(page) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 50));
      const offset = (pageNum - 1) * limitNum;

      // Ensure limitNum and offset are valid integers
      const safeLimitNum = Number.isInteger(limitNum) ? limitNum : 50;
      const safeOffset = Number.isInteger(offset) ? offset : 0;

      let whereClause = "WHERE 1=1";
      const params = [];

      if (entityType) {
        whereClause += " AND entity_type = ?";
        params.push(entityType);
      }

      if (action) {
        whereClause += " AND action = ?";
        params.push(action);
      }

      if (dateFrom) {
        whereClause += " AND created_at >= ?";
        params.push(dateFrom);
      }

      if (dateTo) {
        whereClause += " AND created_at <= ?";
        params.push(dateTo);
      }

      const logs = await query(
        `
      SELECT 
        al.*,
        s.email as actor_email,
        s.full_name as actor_name
      FROM audit_logs al
      LEFT JOIN staff s ON al.actor_id = s.id
      ${whereClause}
      ORDER BY al.created_at DESC
      LIMIT ${safeLimitNum} OFFSET ${safeOffset}
    `,
        params
      );

      // Get total count
      const [{ total }] = await query(
        `
      SELECT COUNT(*) as total FROM audit_logs al ${whereClause}
    `,
        params
      );

      res.json({
        success: true,
        data: logs,
        pagination: {
          page: pageNum,
          limit: safeLimitNum,
          total: parseInt(total),
          pages: Math.ceil(parseInt(total) / safeLimitNum),
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/admin/spins
 * Get all spin attempts with user and outcome details
 */
router.get("/spins", async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      outcome,
      dateFrom,
      dateTo,
      userId,
    } = req.query;
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
    const offset = (pageNum - 1) * limitNum;

    const safeLimitNum = Number.isInteger(limitNum) ? limitNum : 20;
    const safeOffset = Number.isInteger(offset) ? offset : 0;

    let whereClause = "WHERE 1=1";
    const params = [];

    if (outcome) {
      whereClause += " AND sa.outcome = ?";
      params.push(outcome);
    }

    if (dateFrom) {
      whereClause += " AND sa.created_at >= ?";
      params.push(dateFrom);
    }

    if (dateTo) {
      whereClause += " AND sa.created_at <= ?";
      params.push(dateTo);
    }

    if (userId) {
      whereClause += " AND sa.user_id = ?";
      params.push(userId);
    }

    const spins = await query(
      `SELECT 
        sa.id,
        sa.outcome,
        sa.created_at,
        sa.ip_address,
        up.full_name,
        up.email,
        up.phone,
        v.name as voucher_name,
        vc.code as voucher_code,
        v.face_value as voucher_value
       FROM spin_attempts sa
       LEFT JOIN user_profiles up ON sa.user_id = up.id
       LEFT JOIN vouchers v ON sa.voucher_id = v.id
       LEFT JOIN voucher_codes vc ON sa.voucher_code_id = vc.id
       ${whereClause}
       ORDER BY sa.created_at DESC
       LIMIT ${safeLimitNum} OFFSET ${safeOffset}`,
      params
    );

    const [{ total }] = await query(
      `SELECT COUNT(*) as total FROM spin_attempts sa ${whereClause}`,
      params
    );

    const [stats] = await query(`
      SELECT 
        COUNT(*) as total_spins,
        COUNT(CASE WHEN outcome = 'win' THEN 1 END) as total_wins,
        COUNT(CASE WHEN outcome = 'lose' THEN 1 END) as total_losses,
        COUNT(CASE WHEN DATE(created_at) = CURDATE() THEN 1 END) as today_spins
      FROM spin_attempts
    `);

    // Convert BigInt values to numbers
    const numericStats = {
      total_spins: Number(stats.total_spins),
      total_wins: Number(stats.total_wins),
      total_losses: Number(stats.total_losses),
      today_spins: Number(stats.today_spins),
    };

    res.json({
      success: true,
      data: spins,
      pagination: {
        page: pageNum,
        limit: safeLimitNum,
        total: parseInt(total) || 0,
        pages: Math.ceil((parseInt(total) || 0) / safeLimitNum),
      },
      stats: {
        totalSpins: numericStats.total_spins || 0,
        totalWins: numericStats.total_wins || 0,
        totalLosses: numericStats.total_losses || 0,
        todaySpins: numericStats.today_spins || 0,
        winRate:
          numericStats.total_spins > 0
            ? (
                (numericStats.total_wins / numericStats.total_spins) *
                100
              ).toFixed(1)
            : 0,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/stats
 * Get dashboard statistics
 */
router.get("/stats", async (req, res, next) => {
  try {
    // Get total vouchers
    const [{ total_vouchers }] = await query(
      "SELECT COUNT(*) as total_vouchers FROM vouchers"
    );

    // Get active vouchers
    const [{ active_vouchers }] = await query(
      "SELECT COUNT(*) as active_vouchers FROM vouchers WHERE status = 'active'"
    );

    // Get total spins (from spin_attempts or audit_logs)
    const [{ total_spins }] = await query(
      "SELECT COUNT(*) as total_spins FROM audit_logs WHERE entity_type = 'spin_attempt'"
    );

    // Get today's spins
    const [{ today_spins }] = await query(
      `SELECT COUNT(*) as today_spins FROM audit_logs 
       WHERE entity_type = 'spin_attempt' AND DATE(created_at) = CURDATE()`
    );

    // Get total users (from audit_logs user activities)
    const [{ total_users }] = await query(
      "SELECT COUNT(DISTINCT actor_id) as total_users FROM audit_logs WHERE actor_id IS NOT NULL"
    );

    // Get total voucher codes issued
    const [{ codes_issued }] = await query(
      "SELECT COUNT(*) as codes_issued FROM voucher_codes WHERE status = 'issued'"
    );

    // Get total voucher codes redeemed
    const [{ codes_redeemed }] = await query(
      "SELECT COUNT(*) as codes_redeemed FROM voucher_codes WHERE status = 'redeemed'"
    );

    res.json({
      success: true,
      data: {
        totalVouchers: parseInt(total_vouchers) || 0,
        activeVouchers: parseInt(active_vouchers) || 0,
        totalSpins: parseInt(total_spins) || 0,
        todaySpins: parseInt(today_spins) || 0,
        totalUsers: parseInt(total_users) || 0,
        codesIssued: parseInt(codes_issued) || 0,
        codesRedeemed: parseInt(codes_redeemed) || 0,
        redemptionRate:
          parseInt(codes_issued) > 0
            ? (
                (parseInt(codes_redeemed) / parseInt(codes_issued)) *
                100
              ).toFixed(1)
            : 0,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/users
 * Get users list from audit logs
 */
router.get("/users", async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, dateFrom, dateTo } = req.query;
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
    const offset = (pageNum - 1) * limitNum;

    let whereClause = "WHERE 1=1";
    const params = [];

    if (search) {
      whereClause +=
        " AND (up.full_name LIKE ? OR up.email LIKE ? OR up.phone LIKE ?)";
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (dateFrom) {
      whereClause += " AND up.created_at >= ?";
      params.push(dateFrom);
    }

    if (dateTo) {
      whereClause += " AND up.created_at <= ?";
      params.push(dateTo);
    }

    const users = await query(
      `SELECT 
        up.id,
        up.full_name,
        up.email,
        up.phone,
        up.created_at as first_activity,
        COALESCE(sa.activity_count, 0) as activity_count,
        sa.last_activity
       FROM user_profiles up
       LEFT JOIN (
         SELECT 
           user_id,
           COUNT(*) as activity_count,
           MAX(created_at) as last_activity
         FROM spin_attempts 
         GROUP BY user_id
       ) sa ON up.id = sa.user_id
       ${whereClause}
       ORDER BY COALESCE(sa.last_activity, up.created_at) DESC
       LIMIT ${limitNum} OFFSET ${offset}`,
      params
    );

    // Convert BigInt values to numbers
    const processedUsers = users.map((user) => ({
      ...user,
      activity_count: Number(user.activity_count),
    }));

    // Get total count
    const [{ total }] = await query(
      `SELECT COUNT(*) as total FROM user_profiles up ${whereClause}`,
      params
    );

    res.json({
      success: true,
      data: processedUsers,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: parseInt(total) || 0,
        pages: Math.ceil((parseInt(total) || 0) / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
});

// ======================
// DATABASE MANAGEMENT
// ======================

/**
 * @route POST /api/admin/migrate
 * @desc Run database migrations manually
 * @access Admin only
 */
router.post("/migrate", requireRole(["ADMIN"]), async (req, res, next) => {
  try {
    console.log("🗃️  Manual migration triggered by admin...");

    // Import migration function and database pool
    const { runMigrations } = require("../database/migrate");
    const { pool } = require("../config/database");

    // Run migrations with existing database pool
    await runMigrations(pool);

    // Log audit trail
    await AuditLogger.log({
      actorId: req.user.id,
      actorRole: req.user.role,
      action: "MANUAL_MIGRATION",
      entityType: "DATABASE",
      entityId: null,
      afterData: { success: true, timestamp: new Date() },
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
    });

    res.json({
      success: true,
      message: "Database migrations completed successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Manual migration failed:", error);

    // Log failed migration attempt
    await AuditLogger.log({
      actorId: req.user.id,
      actorRole: req.user.role,
      action: "MANUAL_MIGRATION_FAILED",
      entityType: "DATABASE",
      entityId: null,
      afterData: { error: error.message, timestamp: new Date() },
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
    });

    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * @route POST /api/admin/seed
 * @desc Run database seeding manually
 * @access Admin only
 */
router.post("/seed", requireRole(["ADMIN"]), async (req, res, next) => {
  try {
    console.log("🌱 Manual seeding triggered by admin...");

    // Import seeding function and database pool
    const { seedDatabase } = require("../database/seed");
    const { pool } = require("../config/database");

    // Run seeding with existing database pool
    await seedDatabase(pool);

    // Log audit trail
    await AuditLogger.log({
      actorId: req.user.id,
      actorRole: req.user.role,
      action: "MANUAL_SEEDING",
      entityType: "DATABASE",
      entityId: null,
      afterData: { success: true, timestamp: new Date() },
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
    });

    res.json({
      success: true,
      message: "Database seeding completed successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Manual seeding failed:", error);

    // Log failed seeding attempt
    await AuditLogger.log({
      actorId: req.user.id,
      actorRole: req.user.role,
      action: "MANUAL_SEEDING_FAILED",
      entityType: "DATABASE",
      entityId: null,
      afterData: { error: error.message, timestamp: new Date() },
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
    });

    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

module.exports = router;
