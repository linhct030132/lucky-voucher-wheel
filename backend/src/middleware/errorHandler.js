const { validationResult } = require("express-validator");

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: "Xác thực thất bại",
      details: errors.array(),
    });
  }
  next();
};

const errorHandler = (err, req, res, next) => {
  console.error("Error:", err);

  // Database errors
  if (err.code === "ER_DUP_ENTRY") {
    return res.status(409).json({
      error: "Bản ghi trùng lặp",
      message: "Bản ghi này đã tồn tại",
    });
  }

  if (err.code === "ER_NO_REFERENCED_ROW_2") {
    return res.status(400).json({
      error: "Tham chiếu không hợp lệ",
      message: "Bản ghi được tham chiếu không tồn tại",
    });
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      error: "Token không hợp lệ",
    });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      error: "Token đã hết hạn",
    });
  }

  // Validation errors
  if (err.name === "ValidationError") {
    return res.status(400).json({
      error: "Lỗi xác thực",
      details: err.details,
    });
  }

  // Default error
  res.status(err.status || 500).json({
    error: "Lỗi máy chủ nội bộ",
    message:
      process.env.NODE_ENV === "development" ? err.message : "Đã có lỗi xảy ra",
  });
};

const notFound = (req, res) => {
  res.status(404).json({
    error: "Không tìm thấy",
    message: `Đường dẫn ${req.originalUrl} không tồn tại`,
  });
};

module.exports = {
  handleValidationErrors,
  errorHandler,
  notFound,
};
