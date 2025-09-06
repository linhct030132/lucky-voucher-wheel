const { v4: uuidv4 } = require("uuid");
const { query } = require("../config/database");

class AuditLogger {
  static async log({
    actorId = null,
    actorRole = "SYSTEM",
    action,
    entityType,
    entityId = null,
    beforeData = null,
    afterData = null,
    ipAddress = null,
    userAgent = null,
  }) {
    try {
      await query(
        `
        INSERT INTO audit_logs (
          id, actor_id, actor_role, action, entity_type, entity_id,
          before_data, after_data, ip_address, user_agent
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
        [
          uuidv4(),
          actorId,
          actorRole,
          action,
          entityType,
          entityId,
          beforeData ? JSON.stringify(beforeData) : null,
          afterData ? JSON.stringify(afterData) : null,
          ipAddress,
          userAgent,
        ]
      );
    } catch (error) {
      console.error("Failed to write audit log:", error);
      // Don't throw - audit logging should not break the main operation
    }
  }

  // Helper methods for common audit actions
  static async logVoucherCreate(voucher, actorId, actorRole, req) {
    return this.log({
      actorId,
      actorRole,
      action: "CREATE",
      entityType: "voucher",
      entityId: voucher.id,
      afterData: voucher,
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
    });
  }

  static async logVoucherUpdate(
    voucherId,
    beforeData,
    afterData,
    actorId,
    actorRole,
    req
  ) {
    return this.log({
      actorId,
      actorRole,
      action: "UPDATE",
      entityType: "voucher",
      entityId: voucherId,
      beforeData,
      afterData,
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
    });
  }

  static async logVoucherDelete(
    voucherId,
    voucherData,
    actorId,
    actorRole,
    req
  ) {
    return this.log({
      actorId,
      actorRole,
      action: "DELETE",
      entityType: "voucher",
      entityId: voucherId,
      beforeData: voucherData,
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
    });
  }

  static async logStockAdjustment(adjustment, actorId, actorRole, req) {
    return this.log({
      actorId,
      actorRole,
      action: "STOCK_ADJUSTMENT",
      entityType: "voucher",
      entityId: adjustment.voucher_id,
      afterData: adjustment,
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
    });
  }

  static async logSpinAttempt(spinData, req) {
    return this.log({
      action: "SPIN_ATTEMPT",
      entityType: "spin_attempt",
      entityId: spinData.id,
      afterData: {
        outcome: spinData.outcome,
        voucherId: spinData.voucher_id,
        userId: spinData.user_id,
        deviceId: spinData.device_id,
      },
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
    });
  }

  static async logAuth(action, userId, email, req) {
    return this.log({
      actorId: userId,
      actorRole: "STAFF",
      action,
      entityType: "staff",
      entityId: userId,
      afterData: { email },
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
    });
  }
}

module.exports = AuditLogger;
