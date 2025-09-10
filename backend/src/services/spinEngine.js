const { v4: uuidv4 } = require("uuid");
const { query, transaction } = require("../config/database");
const AuditLogger = require("../utils/auditLogger");

class SpinEngine {
  /**
   * Main spin method that handles the weighted random selection
   */
  static async spin(userProfile, deviceId, req) {
    // Step 1: Validate one-time eligibility
    const hasSpun = await this.checkSpinEligibility(userProfile.id, deviceId);
    if (hasSpun) {
      throw new Error("ALREADY_SPUN");
    }

    // Step 2: Get eligible vouchers
    const eligibleVouchers = await this.getEligibleVouchers();

    // Step 3: If no vouchers available, return lose
    if (eligibleVouchers.length === 0) {
      return await this.processLose(
        userProfile,
        deviceId,
        eligibleVouchers,
        req
      );
    }

    // Step 4: Guaranteed win - select voucher based on baseProbability
    const outcome = this.weightedRandomSelection(eligibleVouchers);

    // Step 5: Process the win result atomically
    return await this.processWin(userProfile, deviceId, outcome.voucher, req);
  }

  /**
   * Check if user/device combination has already spun
   */
  static async checkSpinEligibility(userId, deviceId) {
    const [existingAttempt] = await query(
      `
      SELECT id FROM spin_attempts 
      WHERE user_id = ? AND device_id = ?
    `,
      [userId, deviceId]
    );

    return !!existingAttempt;
  }

  /**
   * Get vouchers that are eligible for the draw
   */
  static async getEligibleVouchers() {
    const vouchers = await query(
      `
      SELECT 
        v.id, 
        v.name, 
        v.face_value, 
        CAST(v.base_probability AS DOUBLE) as base_probability, 
        v.remaining_stock
      FROM vouchers v
      WHERE v.status = 'active'
        AND v.remaining_stock > 0
        AND (v.valid_from IS NULL OR v.valid_from <= NOW())
        AND (v.valid_to IS NULL OR v.valid_to >= NOW())
      ORDER BY v.base_probability DESC
    `
    );

    return vouchers;
  }

  /**
   * Weighted random selection algorithm - always returns a win when vouchers available
   */
  static weightedRandomSelection(vouchers) {
    if (vouchers.length === 0) {
      return { type: "lose" };
    }

    // Calculate total weight from voucher probabilities
    const voucherWeights = vouchers.map((v) => parseFloat(v.base_probability));
    const totalWeight = voucherWeights.reduce((sum, weight) => sum + weight, 0);

    // If total weight is 0, distribute equally
    if (totalWeight === 0) {
      const randomIndex = Math.floor(Math.random() * vouchers.length);
      return {
        type: "win",
        voucher: vouchers[randomIndex],
      };
    }

    // Generate random number within total weight
    const random = Math.random() * totalWeight;

    // Find which voucher was selected based on probability
    let cumulativeWeight = 0;
    for (let i = 0; i < vouchers.length; i++) {
      cumulativeWeight += voucherWeights[i];
      if (random < cumulativeWeight) {
        return {
          type: "win",
          voucher: vouchers[i],
        };
      }
    }

    // Fallback to last voucher (should not happen with proper implementation)
    return {
      type: "win",
      voucher: vouchers[vouchers.length - 1],
    };
  }

  /**
   * Process a winning spin atomically
   */
  static async processWin(userProfile, deviceId, selectedVoucher, req) {
    const spinAttemptId = uuidv4();

    try {
      const results = await transaction([
        // Lock and check voucher stock
        {
          sql: `SELECT remaining_stock FROM vouchers WHERE id = ? FOR UPDATE`,
          params: [selectedVoucher.id],
        },
        // Get available voucher code
        {
          sql: `SELECT id, code FROM voucher_codes 
                WHERE voucher_id = ? AND status = 'available' 
                ORDER BY created_at ASC LIMIT 1 FOR UPDATE`,
          params: [selectedVoucher.id],
        },
      ]);

      const [voucherStock] = results[0];
      const [availableCode] = results[1];

      // Verify stock is still available
      if (!voucherStock || voucherStock.remaining_stock <= 0) {
        // Stock depleted, retry once or fall back to lose
        console.warn(
          `Voucher ${selectedVoucher.id} stock depleted during transaction`
        );
        return await this.processLose(userProfile, deviceId, [], req);
      }

      if (!availableCode) {
        console.warn(`No available codes for voucher ${selectedVoucher.id}`);
        return await this.processLose(userProfile, deviceId, [], req);
      }

      // Execute winning transaction
      await transaction([
        // Decrement voucher stock
        {
          sql: `UPDATE vouchers SET remaining_stock = remaining_stock - 1 WHERE id = ?`,
          params: [selectedVoucher.id],
        },
        // Mark code as issued
        {
          sql: `UPDATE voucher_codes 
                SET status = 'issued', issued_to_user_id = ?, issued_at = NOW() 
                WHERE id = ?`,
          params: [userProfile.id, availableCode.id],
        },
        // Record spin attempt
        {
          sql: `INSERT INTO spin_attempts 
                (id, user_id, device_id, outcome, voucher_id, voucher_code_id, ip_address, user_agent)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          params: [
            spinAttemptId,
            userProfile.id,
            deviceId,
            "win",
            selectedVoucher.id,
            availableCode.id,
            req.ip,
            req.get("User-Agent"),
          ],
        },
      ]);

      // Log the spin attempt
      await AuditLogger.logSpinAttempt(
        {
          id: spinAttemptId,
          outcome: "win",
          voucher_id: selectedVoucher.id,
          user_id: userProfile.id,
          device_id: deviceId,
        },
        req
      );

      return {
        outcome: "win",
        voucher: {
          id: selectedVoucher.id,
          name: selectedVoucher.name,
          code: availableCode.code,
          faceValue: selectedVoucher.face_value,
          validTo: null, // Will be populated from voucher data
        },
        spinAttemptId,
      };
    } catch (error) {
      console.error("Error processing win:", error);
      // Fall back to lose on any error
      return await this.processLose(userProfile, deviceId, [], req);
    }
  }

  /**
   * Process a losing spin
   */
  static async processLose(
    userProfile,
    deviceId,
    eligibleVouchersOrReq,
    req = null
  ) {
    // Handle both old and new calling patterns
    let eligibleVouchers = [];
    let actualReq = req;

    if (req === null) {
      // Old calling pattern: processLose(userProfile, deviceId, req)
      actualReq = eligibleVouchersOrReq;
      eligibleVouchers = [];
    } else {
      // New calling pattern: processLose(userProfile, deviceId, eligibleVouchers, req)
      eligibleVouchers = eligibleVouchersOrReq || [];
    }

    const spinAttemptId = uuidv4();

    try {
      // If there are eligible vouchers, we can pick one to reference
      // If there are no eligible vouchers, voucher_id will be NULL
      const referenceVoucherId =
        eligibleVouchers.length > 0 ? eligibleVouchers[0].id : null;

      await query(
        `
        INSERT INTO spin_attempts 
        (id, user_id, device_id, outcome, voucher_id, ip_address, user_agent)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
        [
          spinAttemptId,
          userProfile.id,
          deviceId,
          "lose",
          referenceVoucherId,
          actualReq.ip,
          actualReq.get("User-Agent"),
        ]
      );

      // Log the spin attempt
      await AuditLogger.logSpinAttempt(
        {
          id: spinAttemptId,
          outcome: "lose",
          user_id: userProfile.id,
          device_id: deviceId,
        },
        actualReq
      );

      return {
        outcome: "lose",
        spinAttemptId,
      };
    } catch (error) {
      console.error("Error processing lose:", error);
      throw error;
    }
  }

  /**
   * Get spin statistics for admin dashboard
   */
  static async getSpinStatistics(
    campaignId = null,
    dateFrom = null,
    dateTo = null
  ) {
    let dateFilter = "";
    let params = [];

    if (dateFrom && dateTo) {
      dateFilter = "WHERE sa.created_at BETWEEN ? AND ?";
      params.push(dateFrom, dateTo);
    }

    const stats = await query(
      `
      SELECT 
        COUNT(*) as total_spins,
        COUNT(DISTINCT sa.user_id) as unique_users,
        COUNT(DISTINCT sa.device_id) as unique_devices,
        SUM(CASE WHEN sa.outcome = 'win' THEN 1 ELSE 0 END) as total_wins,
        ROUND(
          (SUM(CASE WHEN sa.outcome = 'win' THEN 1 ELSE 0 END) * 100.0 / COUNT(*)), 2
        ) as win_rate_percent
      FROM spin_attempts sa
      ${dateFilter}
    `,
      params
    );

    const voucherStats = await query(
      `
      SELECT 
        v.id,
        v.name,
        v.face_value,
        v.initial_stock,
        v.remaining_stock,
        COUNT(sa.id) as times_won,
        ROUND(v.base_probability * 100, 2) as probability_percent
      FROM vouchers v
      LEFT JOIN spin_attempts sa ON v.id = sa.voucher_id AND sa.outcome = 'win'
      ${dateFilter.replace("sa.created_at", "sa.created_at")}
      GROUP BY v.id, v.name, v.face_value, v.initial_stock, v.remaining_stock, v.base_probability
      ORDER BY times_won DESC
    `,
      params
    );

    return {
      overview: stats[0] || {
        total_spins: 0,
        unique_users: 0,
        unique_devices: 0,
        total_wins: 0,
        win_rate_percent: 0,
      },
      voucherBreakdown: voucherStats,
    };
  }
}

module.exports = SpinEngine;
