import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  Phone,
  Check,
  AlertTriangle,
  Shield,
  Info,
} from "lucide-react";
import toast from "react-hot-toast";

const UserInfoForm = ({ onSubmit, loading = false }) => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    consent: false,
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  const validateForm = () => {
    const newErrors = {};

    // Full name validation
    if (!formData.fullName.trim()) {
      newErrors.fullName = "Họ và tên là bắt buộc";
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = "Họ và tên phải có ít nhất 2 ký tự";
    }

    // Contact method validation (at least one required)
    if (!formData.email.trim() && !formData.phone.trim()) {
      newErrors.contact = "Vui lòng cung cấp email hoặc số điện thoại";
    }

    // Email validation
    if (formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = "Vui lòng nhập địa chỉ email hợp lệ";
      }
    }

    // Phone validation
    if (formData.phone.trim()) {
      const phoneRegex = /^[+]?[\d\s\-()]{10,}$/;
      if (!phoneRegex.test(formData.phone)) {
        newErrors.phone = "Vui lòng nhập số điện thoại hợp lệ";
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

    // Clear contact error if user provides contact info
    if (
      (field === "email" || field === "phone") &&
      value.trim() &&
      errors.contact
    ) {
      setErrors((prev) => ({ ...prev, contact: "" }));
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
        <div className="bg-gradient-to-r from-red-600 to-red-700 p-4 sm:p-6 text-white text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <User className="w-8 h-8" />
          </motion.div>
          <h2 className="text-xl sm:text-2xl font-bold mb-2">
            Nhận Ưu Đãi Thời Trang Dezus!
          </h2>
          <p className="text-red-100">
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
              Họ và Tên <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User
                  className={`w-5 h-5 ${
                    focusedField === "fullName"
                      ? "text-red-500"
                      : "text-gray-400"
                  } transition-colors`}
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
                    ? "border-red-300 focus:border-red-500 bg-red-50"
                    : focusedField === "fullName"
                    ? "border-red-500 bg-red-50"
                    : "border-gray-200 hover:border-gray-300 focus:border-red-500"
                }`}
                placeholder="Nhập họ và tên của bạn"
                disabled={isSubmitting || loading}
              />
            </div>
            {errors.fullName && (
              <motion.p
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="mt-2 text-sm text-red-600 flex items-center"
              >
                <AlertTriangle className="w-4 h-4 mr-1" />
                {errors.fullName}
              </motion.p>
            )}
          </motion.div>

          {/* Contact Information Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-center space-x-2 text-blue-700">
              <Info className="w-5 h-5" />
              <p className="text-sm font-medium">Thông Tin Liên Lạc</p>
            </div>
            <p className="text-sm text-blue-600 mt-1">
              Cung cấp ít nhất một phương thức liên lạc (email hoặc điện thoại)
            </p>
          </div>

          {/* Email Field */}
          <motion.div
            variants={inputVariants}
            animate={focusedField === "email" ? "focused" : "unfocused"}
          >
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Địa Chỉ Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail
                  className={`w-5 h-5 ${
                    focusedField === "email" ? "text-red-500" : "text-gray-400"
                  } transition-colors`}
                />
              </div>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                onFocus={() => setFocusedField("email")}
                onBlur={() => setFocusedField(null)}
                className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:outline-none transition-all duration-200 ${
                  errors.email
                    ? "border-red-300 focus:border-red-500 bg-red-50"
                    : focusedField === "email"
                    ? "border-red-500 bg-red-50"
                    : "border-gray-200 hover:border-gray-300 focus:border-red-500"
                }`}
                placeholder="email@example.com"
                disabled={isSubmitting || loading}
              />
            </div>
            {errors.email && (
              <motion.p
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="mt-2 text-sm text-red-600 flex items-center"
              >
                <AlertTriangle className="w-4 h-4 mr-1" />
                {errors.email}
              </motion.p>
            )}
          </motion.div>

          {/* Phone Field */}
          <motion.div
            variants={inputVariants}
            animate={focusedField === "phone" ? "focused" : "unfocused"}
          >
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Số Điện Thoại
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Phone
                  className={`w-5 h-5 ${
                    focusedField === "phone" ? "text-red-500" : "text-gray-400"
                  } transition-colors`}
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
                    ? "border-red-300 focus:border-red-500 bg-red-50"
                    : focusedField === "phone"
                    ? "border-red-500 bg-red-50"
                    : "border-gray-200 hover:border-gray-300 focus:border-red-500"
                }`}
                placeholder="0123 456 789"
                disabled={isSubmitting || loading}
              />
            </div>
            {errors.phone && (
              <motion.p
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="mt-2 text-sm text-red-600 flex items-center"
              >
                <AlertTriangle className="w-4 h-4 mr-1" />
                {errors.phone}
              </motion.p>
            )}
          </motion.div>

          {/* Contact Error */}
          {errors.contact && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 border border-red-200 rounded-xl p-4"
            >
              <p className="text-sm text-red-700 flex items-center">
                <AlertTriangle className="w-4 h-4 mr-2" />
                {errors.contact}
              </p>
            </motion.div>
          )}

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
                  ? "border-red-300 bg-red-50"
                  : formData.consent
                  ? "border-green-300 bg-green-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
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
                      ? "border-red-300"
                      : "border-gray-300"
                  }`}
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
                className="text-sm text-red-600 flex items-center"
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
                : "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg hover:shadow-xl"
            }`}
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
                <span>🎯 Bắt Đầu Quay!</span>
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
