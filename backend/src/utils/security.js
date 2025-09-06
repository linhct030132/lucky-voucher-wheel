const crypto = require("crypto");

class DeviceFingerprint {
  static generateHMAC(fingerprint) {
    const secret = process.env.DEVICE_HMAC_SECRET || "default-secret";
    return crypto
      .createHmac("sha256", secret)
      .update(fingerprint)
      .digest("hex");
  }

  static validateFingerprint(clientFingerprint, serverHMAC) {
    const expectedHMAC = this.generateHMAC(clientFingerprint);
    return crypto.timingSafeEqual(
      Buffer.from(expectedHMAC, "hex"),
      Buffer.from(serverHMAC, "hex")
    );
  }

  static generateServerFingerprint(req) {
    const userAgent = req.get("User-Agent") || "";
    const acceptLanguage = req.get("Accept-Language") || "";
    const acceptEncoding = req.get("Accept-Encoding") || "";
    const ip = req.ip || "";

    const fingerprint = [userAgent, acceptLanguage, acceptEncoding, ip].join(
      "|"
    );
    return this.generateHMAC(fingerprint);
  }
}

class SecurityUtils {
  static isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static isValidPhone(phone) {
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
    return phoneRegex.test(phone);
  }

  static sanitizeInput(input) {
    if (typeof input !== "string") return input;
    return input.trim().replace(/[<>]/g, "");
  }

  static generateVoucherCode(prefix = "LV", length = 8) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = prefix;
    for (let i = 0; i < length - prefix.length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  static hashUserIdentity(email, phone) {
    const identity = `${email || ""}:${phone || ""}`;
    return crypto.createHash("sha256").update(identity).digest("hex");
  }

  static detectSuspiciousActivity(req, userProfile) {
    const warnings = [];

    // Check for common fraud patterns
    if (userProfile.full_name.length < 2) {
      warnings.push("Suspiciously short name");
    }

    if (userProfile.email && !this.isValidEmail(userProfile.email)) {
      warnings.push("Invalid email format");
    }

    if (userProfile.phone && !this.isValidPhone(userProfile.phone)) {
      warnings.push("Invalid phone format");
    }

    // Check for automation patterns
    const userAgent = req.get("User-Agent") || "";
    if (userAgent.includes("bot") || userAgent.includes("crawler")) {
      warnings.push("Bot-like user agent");
    }

    return warnings;
  }
}

module.exports = {
  DeviceFingerprint,
  SecurityUtils,
};
