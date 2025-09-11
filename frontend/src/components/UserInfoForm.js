import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  User,
  Phone,
  MapPin,
  Users,
  Check,
  AlertTriangle,
  Shield,
  Calendar,
} from "lucide-react";
import toast from "react-hot-toast";

const UserInfoForm = ({ onSubmit, loading = false, initialData = null }) => {
  const [formData, setFormData] = useState({
    fullName: initialData?.fullName || "",
    phone: initialData?.phone || "",
    address: initialData?.address || "",
    age: initialData?.age || "",
    referralSource: initialData?.referralSource || "",
    consent: initialData?.consent || false,
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  // Update form data when initialData changes
  useEffect(() => {
    if (initialData) {
      setFormData({
        fullName: initialData.fullName || "",
        phone: initialData.phone || "",
        address: initialData.address || "",
        age: initialData.age || "",
        referralSource: initialData.referralSource || "",
        consent: initialData.consent || false,
      });
    }
  }, [initialData]);

  const validateForm = () => {
    const newErrors = {};

    // Full name validation
    if (!formData.fullName.trim()) {
      newErrors.fullName = "Họ và tên là bắt buộc";
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = "Họ và tên phải có ít nhất 2 ký tự";
    }

    // Phone validation (required)
    if (!formData.phone.trim()) {
      newErrors.phone = "Vui lòng nhập số điện thoại";
    } else {
      const phoneRegex = /^[+]?[\d\s\-()]{10,}$/;
      if (!phoneRegex.test(formData.phone)) {
        newErrors.phone = "Vui lòng nhập số điện thoại hợp lệ";
      }
    }

    // Age validation (required)
    if (!formData.age.trim()) {
      newErrors.age = "Vui lòng nhập tuổi";
    } else {
      const age = parseInt(formData.age);
      if (isNaN(age) || age < 13 || age > 100) {
        newErrors.age = "Tuổi phải từ 13 đến 100";
      }
    }

    // Consent validation
    if (!formData.consent) {
      newErrors.consent = "Bạn phải đồng ý tham gia";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Vui lòng sửa lỗi trước khi gửi");
      return;
    }

    setIsSubmitting(true);

    try {
      console.log("Form data being submitted:", formData);
      await onSubmit(formData);
    } catch (error) {
      console.error("Form submission error:", error);
      toast.error("Không thể gửi biểu mẫu. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear specific error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }

    // Clear phone error if user starts typing
    if (field === "phone" && value.trim() && errors.phone) {
      setErrors((prev) => ({ ...prev, phone: "" }));
    }
  };

  const inputVariants = {
    focused: { scale: 1.02, transition: { duration: 0.2 } },
    unfocused: { scale: 1, transition: { duration: 0.2 } },
  };

  return (
    <div className="max-w-md mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden max-w-lg mx-auto"
      >
        {/* Header */}
        <div
          className="p-4 sm:p-6 text-white text-center"
          style={{ background: "linear-gradient(to right, #74070E, #8A080F)" }}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <User className="w-8 h-8" />
          </motion.div>
          <h2 className="text-xl sm:text-2xl font-bold mb-2">
            Thông tin liên hệ
          </h2>
          <p style={{ color: "#FEE2E2" }}>
            Điền thông tin để nhận voucher thời trang
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="p-4 sm:p-6 space-y-4 sm:space-y-6"
        >
          {/* Full Name Field */}
          <motion.div
            variants={inputVariants}
            animate={focusedField === "fullName" ? "focused" : "unfocused"}
          >
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Họ và Tên <span style={{ color: "#74070E" }}>*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User
                  className={`w-5 h-5 ${
                    focusedField === "fullName" ? "" : "text-gray-400"
                  } transition-colors`}
                  style={
                    focusedField === "fullName" ? { color: "#74070E" } : {}
                  }
                />
              </div>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => handleInputChange("fullName", e.target.value)}
                onFocus={() => setFocusedField("fullName")}
                onBlur={() => setFocusedField(null)}
                className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:outline-none transition-all duration-200 ${
                  errors.fullName
                    ? "bg-red-50"
                    : focusedField === "fullName"
                    ? "bg-red-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
                style={{
                  borderColor:
                    errors.fullName || focusedField === "fullName"
                      ? "#74070E"
                      : undefined,
                }}
                placeholder="Nhập họ và tên của bạn"
                disabled={isSubmitting || loading}
              />
            </div>
            {errors.fullName && (
              <motion.p
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="mt-2 text-sm flex items-center"
                style={{ color: "#B91C1C" }}
              >
                <AlertTriangle className="w-4 h-4 mr-1" />
                {errors.fullName}
              </motion.p>
            )}
          </motion.div>

          {/* Phone Field */}
          <motion.div
            variants={inputVariants}
            animate={focusedField === "phone" ? "focused" : "unfocused"}
          >
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Số Điện Thoại <span style={{ color: "#74070E" }}>*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Phone
                  className={`w-5 h-5 ${
                    focusedField === "phone" ? "" : "text-gray-400"
                  } transition-colors`}
                  style={focusedField === "phone" ? { color: "#74070E" } : {}}
                />
              </div>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                onFocus={() => setFocusedField("phone")}
                onBlur={() => setFocusedField(null)}
                className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:outline-none transition-all duration-200 ${
                  errors.phone
                    ? "bg-red-50"
                    : focusedField === "phone"
                    ? "bg-red-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
                style={{
                  borderColor:
                    errors.phone || focusedField === "phone"
                      ? "#74070E"
                      : undefined,
                }}
                placeholder="0123 456 789"
                disabled={isSubmitting || loading}
              />
            </div>
            {errors.phone && (
              <motion.p
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="mt-2 text-sm flex items-center"
                style={{ color: "#B91C1C" }}
              >
                <AlertTriangle className="w-4 h-4 mr-1" />
                {errors.phone}
              </motion.p>
            )}
          </motion.div>

          {/* Age Field */}
          <motion.div
            variants={inputVariants}
            animate={focusedField === "age" ? "focused" : "unfocused"}
          >
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Tuổi <span style={{ color: "#74070E" }}>*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar
                  className={`w-5 h-5 ${
                    focusedField === "age" ? "" : "text-gray-400"
                  } transition-colors`}
                  style={focusedField === "age" ? { color: "#74070E" } : {}}
                />
              </div>
              <input
                type="number"
                min="13"
                max="100"
                value={formData.age}
                onChange={(e) => handleInputChange("age", e.target.value)}
                onFocus={() => setFocusedField("age")}
                onBlur={() => setFocusedField(null)}
                className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:outline-none transition-all duration-200 ${
                  errors.age
                    ? "bg-red-50"
                    : focusedField === "age"
                    ? "bg-red-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
                style={{
                  borderColor:
                    errors.age || focusedField === "age"
                      ? "#74070E"
                      : undefined,
                }}
                placeholder="Nhập tuổi của bạn"
                disabled={isSubmitting || loading}
              />
            </div>
            {errors.age && (
              <motion.p
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="mt-2 text-sm flex items-center"
                style={{ color: "#B91C1C" }}
              >
                <AlertTriangle className="w-4 h-4 mr-1" />
                {errors.age}
              </motion.p>
            )}
          </motion.div>

          {/* Address Field */}
          <motion.div
            variants={inputVariants}
            animate={focusedField === "address" ? "focused" : "unfocused"}
          >
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Địa Chỉ (Quận/Huyện)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MapPin
                  className={`w-5 h-5 ${
                    focusedField === "address" ? "" : "text-gray-400"
                  } transition-colors`}
                  style={focusedField === "address" ? { color: "#74070E" } : {}}
                />
              </div>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                onFocus={() => setFocusedField("address")}
                onBlur={() => setFocusedField(null)}
                className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:outline-none transition-all duration-200 ${
                  errors.address
                    ? "bg-red-50"
                    : focusedField === "address"
                    ? "bg-red-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
                style={{
                  borderColor:
                    errors.address || focusedField === "address"
                      ? "#74070E"
                      : undefined,
                }}
                placeholder="Ví dụ: Cầu Giấy, Đống Đa,..."
                disabled={isSubmitting || loading}
              />
            </div>
            {errors.address && (
              <motion.p
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="mt-2 text-sm flex items-center"
                style={{ color: "#B91C1C" }}
              >
                <AlertTriangle className="w-4 h-4 mr-1" />
                {errors.address}
              </motion.p>
            )}
          </motion.div>

          {/* Referral Source Field */}
          <motion.div
            variants={inputVariants}
            animate={
              focusedField === "referralSource" ? "focused" : "unfocused"
            }
          >
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Bạn biết DEZUS qua kênh nào?
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Users
                  className={`w-5 h-5 ${
                    focusedField === "referralSource" ? "" : "text-gray-400"
                  } transition-colors`}
                  style={
                    focusedField === "referralSource"
                      ? { color: "#74070E" }
                      : {}
                  }
                />
              </div>
              <select
                value={formData.referralSource}
                onChange={(e) =>
                  handleInputChange("referralSource", e.target.value)
                }
                onFocus={() => setFocusedField("referralSource")}
                onBlur={() => setFocusedField(null)}
                className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:outline-none transition-all duration-200 ${
                  errors.referralSource
                    ? "bg-red-50"
                    : focusedField === "referralSource"
                    ? "bg-red-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
                style={{
                  borderColor:
                    errors.referralSource || focusedField === "referralSource"
                      ? "#74070E"
                      : undefined,
                }}
                disabled={isSubmitting || loading}
              >
                <option value="">Chọn kênh</option>
                <option value="Facebook">Facebook</option>
                <option value="Tiktok">Tiktok</option>
                <option value="Zalo">Zalo</option>
                <option value="Website">Website</option>
                <option value="Instagram">Instagram</option>
                <option value="Bạn bè giới thiệu">Bạn bè giới thiệu</option>
                <option value="Google">Google</option>
                <option value="Khác">Khác</option>
              </select>
            </div>
            {errors.referralSource && (
              <motion.p
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="mt-2 text-sm flex items-center"
                style={{ color: "#B91C1C" }}
              >
                <AlertTriangle className="w-4 h-4 mr-1" />
                {errors.referralSource}
              </motion.p>
            )}
          </motion.div>

          {/* Privacy and Consent */}
          <div className="space-y-4">
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <div className="flex items-center space-x-2 text-gray-700 mb-2">
                <Shield className="w-5 h-5" />
                <p className="text-sm font-medium">Bảo Mật & An Toàn</p>
              </div>
              <p className="text-xs text-gray-600">
                Thông tin của bạn được mã hóa bảo mật và chỉ được sử dụng để
                phân phối giải thưởng. Chúng tôi không bao giờ chia sẻ dữ liệu
                với bên thứ ba.
              </p>
            </div>

            <motion.label
              className={`flex items-start space-x-3 cursor-pointer p-4 rounded-xl border-2 transition-all duration-200 ${
                errors.consent
                  ? "bg-red-50"
                  : formData.consent
                  ? "border-green-300 bg-green-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
              style={{
                borderColor: errors.consent ? "#74070E" : undefined,
              }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <div className="relative">
                <input
                  type="checkbox"
                  checked={formData.consent}
                  onChange={(e) =>
                    handleInputChange("consent", e.target.checked)
                  }
                  className="sr-only"
                  disabled={isSubmitting || loading}
                />
                <div
                  className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-200 ${
                    formData.consent
                      ? "border-green-500 bg-green-500"
                      : errors.consent
                      ? ""
                      : "border-gray-300"
                  }`}
                  style={{
                    borderColor:
                      errors.consent && !formData.consent
                        ? "#74070E"
                        : undefined,
                  }}
                >
                  {formData.consent && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring" }}
                    >
                      <Check className="w-4 h-4 text-white" />
                    </motion.div>
                  )}
                </div>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  Tôi đồng ý tham gia quay số may mắn
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  Bằng cách đánh dấu vào ô này, bạn xác nhận rằng bạn hiểu các
                  quy tắc và đồng ý nhận thông báo giải thưởng.
                </p>
              </div>
            </motion.label>

            {errors.consent && (
              <motion.p
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-sm flex items-center"
                style={{ color: "#B91C1C" }}
              >
                <AlertTriangle className="w-4 h-4 mr-1" />
                {errors.consent}
              </motion.p>
            )}
          </div>

          {/* Submit Button */}
          <motion.button
            type="submit"
            disabled={isSubmitting || loading}
            className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all duration-200 ${
              isSubmitting || loading
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "text-white shadow-lg hover:shadow-xl"
            }`}
            style={
              !(isSubmitting || loading)
                ? { background: "linear-gradient(to right, #74070E, #8A080F)" }
                : {}
            }
            whileHover={!(isSubmitting || loading) ? { scale: 1.02 } : {}}
            whileTap={!(isSubmitting || loading) ? { scale: 0.98 } : {}}
          >
            {isSubmitting || loading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                <span>Đang Xử Lý...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center space-x-2">
                <span>🎯 Bắt Đầu Bốc Thăm!</span>
                <motion.div
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  ✨
                </motion.div>
              </div>
            )}
          </motion.button>

          {/* Additional Info */}
          <div className="text-center">
            <p className="text-xs text-gray-500">
              🔒 Your information is safe and secure
            </p>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default UserInfoForm;
