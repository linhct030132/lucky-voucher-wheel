const jwt = require("jsonwebtoken");
const { query } = require("../config/database");

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Yêu cầu token truy cập" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Verify user still exists and is active
    const [staff] = await query(
      "SELECT id, email, full_name, role, is_active FROM staff WHERE id = ? AND is_active = TRUE",
      [decoded.userId]
    );

    if (!staff) {
      return res
        .status(401)
        .json({ error: "Token không hợp lệ hoặc đã hết hạn" });
    }

    req.user = {
      id: staff.id,
      email: staff.email,
      fullName: staff.full_name,
      role: staff.role,
    };

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token đã hết hạn" });
    }
    return res.status(403).json({ error: "Token không hợp lệ" });
  }
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Yêu cầu xác thực" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Không đủ quyền truy cập" });
    }

    next();
  };
};

module.exports = {
  authenticateToken,
  requireRole,
};
