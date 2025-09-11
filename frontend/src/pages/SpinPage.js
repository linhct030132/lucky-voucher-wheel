import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Confetti from "react-confetti";
import toast from "react-hot-toast";
import {
  Gift,
  ChevronRight,
  Copy,
  Check,
  Heart,
  Crown,
  ArrowLeft,
  RefreshCw,
  Clock,
} from "lucide-react";
import { useSpin } from "../context/SpinContext";
import UserInfoForm from "../components/UserInfoForm";
import LoadingSpinner from "../components/LoadingSpinner";

const SpinPage = () => {
  const navigate = useNavigate();
  const {
    getAvailableVouchers,
    checkEligibility,
    storeUserInfo,
    getStoredUserInfo,
    performSpin,
    isSpinning,
    spinResult,
    // eligibilityStatus,
    availableVouchers,
  } = useSpin();

  const [currentStep, setCurrentStep] = useState("loading"); // loading, form, stored_info, spinning, result, participated, out_of_stock
  const [userProfile, setUserProfile] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [storedUserInfo, setStoredUserInfo] = useState(null);
  const [previousResult, setPreviousResult] = useState(null);
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  // Handle window resize for confetti
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Check device eligibility via API
  const checkDeviceEligibility = useCallback(async () => {
    try {
      const eligibility = await checkEligibility();
      console.log("Device eligibility:", eligibility);

      return eligibility;
    } catch (error) {
      console.error("Error checking device eligibility:", error);
      return { eligible: true }; // Default to allowing if check fails
    }
  }, [checkEligibility]);

  // Initialize vouchers and check eligibility
  useEffect(() => {
    const initializeSystem = async () => {
      try {
        // Check device eligibility first
        const eligibility = await checkDeviceEligibility();
        console.log("Device eligibility:", eligibility);

        if (!eligibility.eligible) {
          // Differentiate between "already participated" and "no stock"
          if (eligibility.reason === "ALREADY_PARTICIPATED") {
            // If we have the previous result, show it instead of just "participated"
            if (eligibility.spinResult) {
              setPreviousResult(eligibility.spinResult);
              setUserProfile(eligibility.spinResult.userProfile);
              setCurrentStep("result");
              // Show confetti if it was a win
              if (eligibility.spinResult.outcome === "win") {
                setShowConfetti(true);
                setTimeout(() => setShowConfetti(false), 5000);
              }
            } else {
              setCurrentStep("participated");
            }
          } else if (eligibility.reason === "NO_STOCK") {
            setCurrentStep("out_of_stock");
          } else {
            setCurrentStep("participated"); // Default fallback
          }
          return;
        }

        // Check if user info is already stored
        const storedInfo = await getStoredUserInfo();
        console.log("Stored user info:", storedInfo);

        if (storedInfo.hasStoredInfo && storedInfo.userProfile) {
          setStoredUserInfo(storedInfo.userProfile);
          setUserProfile(storedInfo.userProfile);
          setCurrentStep("stored_info");
        } else {
          await getAvailableVouchers();
          setCurrentStep("form");
        }
      } catch (error) {
        console.error("Failed to initialize system:", error);
        toast.error("Không thể tải hệ thống. Vui lòng thử lại.");
        navigate("/");
      }
    };

    initializeSystem();
  }, [
    getAvailableVouchers,
    navigate,
    checkDeviceEligibility,
    getStoredUserInfo,
  ]);

  // Handle form submission
  const handleFormSubmit = async (formData) => {
    try {
      // Store user information first
      await storeUserInfo(formData);
      setUserProfile(formData);
      setStoredUserInfo(formData);

      // Check eligibility with the submitted data
      const eligibility = await checkEligibility(formData);

      if (!eligibility.eligible) {
        toast.error(eligibility.message || "Bạn không đủ điều kiện tham gia");
        return;
      }

      // Move to stored info step to show spin button
      setCurrentStep("stored_info");
    } catch (error) {
      console.error("Error storing user info:", error.response.data.error);
      toast.error(
        error?.response?.data?.error || "Có lỗi xảy ra. Vui lòng thử lại."
      );
    }
  };

  // Handle spin action
  const handleSpin = async () => {
    if (!userProfile) return;

    setCurrentStep("spinning");

    try {
      // Perform the spin
      const result = await performSpin(userProfile);

      if (result && result.outcome !== "error") {
        setCurrentStep("result");
        if (result.outcome === "win") {
          setShowConfetti(true);
          // Hide confetti after 5 seconds
          setTimeout(() => setShowConfetti(false), 5000);
        }
      } else {
        setCurrentStep("stored_info"); // Go back to stored info instead of form
        toast.error(result?.error || "Bốc Thăm thất bại. Vui lòng thử lại.");
      }
    } catch (error) {
      console.error("Spin error:", error);
      setCurrentStep("stored_info");
      toast.error("Có lỗi xảy ra khi quay. Vui lòng thử lại.");
    }
  };

  // Copy voucher code
  const copyVoucherCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    toast.success("Đã sao chép mã voucher!");
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Go back to landing page
  const goHome = () => {
    navigate("/");
  };

  // Handle editing user info
  const handleEditUserInfo = () => {
    setCurrentStep("form");
    // Keep storedUserInfo so form can be pre-filled
  };

  // Loading state
  if (currentStep === "loading" || !availableVouchers) {
    return (
      <div className="min-h-screen bg-gray-200 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner />
          <motion.p
            className="mt-6 text-lg text-gray-600"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            Đang tải các ưu đãi thời trang từ Dezus...
          </motion.p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-200">
      {/* Confetti */}
      {showConfetti && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={200}
          gravity={0.3}
        />
      )}

      {/* Navigation Header */}
      <nav className="bg-white/80 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <motion.button
              onClick={goHome}
              className="flex items-center space-x-2 sm:space-x-3 text-gray-700 transition-colors"
              style={{ "--hover-color": "#74070E" }}
              whileHover={{ x: -5 }}
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              <div className="flex items-center space-x-1 sm:space-x-2">
                <Crown
                  className="w-5 h-5 sm:w-6 sm:h-6"
                  style={{ color: "#74070E" }}
                />
                <span
                  className="font-bold text-base sm:text-lg"
                  style={{ color: "#74070E" }}
                >
                  Secret Bill
                </span>
              </div>
            </motion.button>

            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Progress Indicator */}
              <div className="hidden md:flex items-center space-x-2">
                {currentStep === "participated" ? (
                  // Show completed participation status
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium bg-amber-600 text-white">
                      ✓
                    </div>
                    <span className="text-sm text-amber-600 font-medium">
                      Đã hoàn thành tham gia
                    </span>
                  </div>
                ) : currentStep === "out_of_stock" ? (
                  // Show out of stock status
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium text-white"
                      style={{ background: "#74070E" }}
                    >
                      📦
                    </div>
                    <span
                      className="text-sm font-medium"
                      style={{ color: "#74070E" }}
                    >
                      Hết giải thưởng
                    </span>
                  </div>
                ) : (
                  // Show regular progress steps
                  [
                    {
                      step: 1,
                      label: "Thông tin",
                      labelFull: "Thông tin của bạn",
                      active:
                        currentStep === "form" || currentStep === "stored_info",
                    },
                    {
                      step: 2,
                      label: "Bốc thăm",
                      labelFull: "Bốc Thăm thưởng",
                      active: currentStep === "spinning",
                    },
                    {
                      step: 3,
                      label: "Kết quả",
                      labelFull: "Kết quả",
                      active: currentStep === "result",
                    },
                  ].map((item, index) => (
                    <div key={index} className="flex items-center">
                      <div
                        className={`w-6 h-6 lg:w-8 lg:h-8 rounded-full flex items-center justify-center text-xs lg:text-sm font-medium ${
                          item.active
                            ? "text-white"
                            : "bg-gray-200 text-gray-600"
                        }`}
                        style={item.active ? { background: "#74070E" } : {}}
                      >
                        {item.step}
                      </div>
                      <span className="ml-1 lg:ml-2 text-xs lg:text-sm text-gray-600 hidden lg:inline">
                        {item.labelFull}
                      </span>
                      <span className="ml-1 text-xs text-gray-600 lg:hidden">
                        {item.label}
                      </span>
                      {index < 2 && (
                        <div className="w-4 lg:w-8 h-0.5 bg-gray-200 mx-2 lg:mx-3"></div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8 sm:mb-10 lg:mb-12"
        >
          {currentStep === "participated" ? (
            <>
              <motion.div
                className="inline-flex items-center space-x-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-full text-xs sm:text-sm font-medium mb-4 sm:mb-6"
                whileHover={{ scale: 1.05 }}
              >
                <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>✅ Đã Tham Gia</span>
              </motion.div>

              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 mb-3 sm:mb-4 px-2">
                <span className="bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                  Cảm Ơn Bạn Đã Tham Gia
                </span>
              </h1>

              <p className="text-base sm:text-lg lg:text-xl text-gray-600 mb-6 sm:mb-8 max-w-2xl mx-auto px-4">
                Thiết bị này đã hoàn thành việc tham gia chương trình quay số
                may mắn.
              </p>
            </>
          ) : currentStep === "out_of_stock" ? (
            <>
              <motion.div
                className="inline-flex items-center space-x-2 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-full text-xs sm:text-sm font-medium mb-4 sm:mb-6"
                style={{
                  background: "linear-gradient(to right, #74070E, #EC4899)",
                }}
                whileHover={{ scale: 1.05 }}
              >
                <Gift className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>📦 Hết Giải Thưởng</span>
              </motion.div>

              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 mb-3 sm:mb-4 px-2">
                <span
                  className="bg-clip-text text-transparent"
                  style={{
                    background: "linear-gradient(to right, #74070E, #EC4899)",
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                  }}
                >
                  Chương Trình Đã Kết Thúc
                </span>
              </h1>

              <p className="text-base sm:text-lg lg:text-xl text-gray-600 mb-6 sm:mb-8 max-w-2xl mx-auto px-4">
                Rất tiếc, tất cả giải thưởng đã được phát hết. Cảm ơn bạn đã
                quan tâm đến chương trình của chúng tôi!
              </p>
            </>
          ) : (
            <></>
          )}

          {/* Prize Preview */}
          {currentStep !== "participated" &&
            currentStep !== "out_of_stock" &&
            availableVouchers &&
            availableVouchers.length > 0 && (
              <motion.div
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4 max-w-6xl mx-auto mb-6 sm:mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                {availableVouchers.slice(0, 6).map((voucher, index) => (
                  <motion.div
                    key={voucher.id}
                    className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300"
                    whileHover={{ scale: 1.05, y: -5 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <div
                      className="mb-2 sm:mb-3 flex justify-center"
                      style={{ color: "#74070E" }}
                    >
                      <Gift className="w-6 h-6 sm:w-8 sm:h-8" />
                    </div>
                    <div className="text-gray-900 text-xs sm:text-sm font-bold mb-1 sm:mb-2 line-clamp-2 min-h-[2rem] sm:min-h-[2.5rem] leading-tight">
                      {voucher.name}
                    </div>
                    <div
                      className="text-xs font-medium truncate"
                      style={{ color: "#74070E" }}
                    >
                      {voucher.face_value}
                      {voucher.voucher_type === "discount_percentage"
                        ? "% OFF"
                        : ""}
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
        </motion.div>

        {/* Step Content */}
        <div className="max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            {currentStep === "form" && (
              <motion.div
                key="form"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.5 }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 items-start lg:items-center"
              >
                {/* Left Side - Info */}
                <div className="order-2 lg:order-1 space-y-4 sm:space-y-6">
                  <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-lg border border-gray-100">
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">
                      🎊 Sẵn Sàng Nhận Ưu Đãi?
                    </h3>

                    <div className="space-y-3 sm:space-y-4">
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: "#FEF2F2" }}
                        >
                          <Check
                            className="w-4 h-4 sm:w-5 sm:h-5"
                            style={{ color: "#74070E" }}
                          />
                        </div>
                        <span className="text-sm sm:text-base text-gray-700">
                          100% miễn phí tham gia
                        </span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: "#FEF2F2" }}
                        >
                          <Check
                            className="w-4 h-4 sm:w-5 sm:h-5"
                            style={{ color: "#74070E" }}
                          />
                        </div>
                        <span className="text-sm sm:text-base text-gray-700">
                          Nhận voucher ngay lập tức
                        </span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: "#FEF2F2" }}
                        >
                          <Check
                            className="w-4 h-4 sm:w-5 sm:h-5"
                            style={{ color: "#74070E" }}
                          />
                        </div>
                        <span className="text-sm sm:text-base text-gray-700">
                          Áp dụng cho tất cả sản phẩm
                        </span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: "#FEF2F2" }}
                        >
                          <Check
                            className="w-4 h-4 sm:w-5 sm:h-5"
                            style={{ color: "#74070E" }}
                          />
                        </div>
                        <span className="text-sm sm:text-base text-gray-700">
                          Bảo mật thông tin khách hàng
                        </span>
                      </div>
                    </div>

                    <div
                      className="mt-6 sm:mt-8 p-3 sm:p-4 rounded-xl sm:rounded-2xl"
                      style={{ backgroundColor: "#F3F4F6" }}
                    >
                      <p className="text-xs sm:text-sm text-gray-700">
                        <strong>Cách thức hoạt động:</strong> Nhập thông tin của
                        bạn, quay vòng thời trang và nhận ngay mã giảm giá cho
                        các sản phẩm thời trang tại Dezus!
                      </p>
                    </div>
                  </div>
                </div>

                {/* Right Side - Form */}
                <div className="order-1 lg:order-2">
                  <UserInfoForm
                    onSubmit={handleFormSubmit}
                    loading={isSpinning}
                    initialData={storedUserInfo || userProfile}
                  />
                </div>
              </motion.div>
            )}

            {currentStep === "stored_info" && storedUserInfo && (
              <motion.div
                key="stored_info"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -50 }}
                transition={{ duration: 0.5 }}
                className="text-center"
              >
                <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 xl:p-12 shadow-2xl border border-gray-100 max-w-sm sm:max-w-md md:max-w-lg lg:max-w-2xl xl:max-w-3xl mx-auto">
                  <h2 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-gray-900 mb-3 sm:mb-4 px-2">
                    Bốc thăm voucher đã sẵn sàng!
                  </h2>

                  <p className="text-sm sm:text-base lg:text-lg xl:text-xl text-gray-600 mb-4 sm:mb-6 lg:mb-8 px-2">
                    Thông tin của bạn đã được lưu. Hãy bắt đầu quay để nhận được
                    voucher hấp dẫn!
                  </p>

                  {/* User Info Display */}
                  <div
                    className="rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 mb-4 sm:mb-6 lg:mb-8 overflow-hidden"
                    style={{
                      backgroundColor: "#FEF2F2",
                      borderColor: "#FCA5A5",
                      borderWidth: "1px",
                    }}
                  >
                    <h3
                      className="text-sm sm:text-base lg:text-lg font-semibold mb-3 sm:mb-4"
                      style={{ color: "#991B1B" }}
                    >
                      Thông tin của bạn:
                    </h3>
                    <div className="space-y-3 sm:space-y-4">
                      <div className="grid grid-cols-1 gap-1 text-center">
                        <span
                          className="font-medium text-xs sm:text-sm lg:text-base"
                          style={{ color: "#B91C1C" }}
                        >
                          Họ và tên:
                        </span>
                        <span
                          className="text-xs sm:text-sm lg:text-base break-words"
                          style={{ color: "#7F1D1D" }}
                        >
                          {storedUserInfo.fullName}
                        </span>
                      </div>
                      {storedUserInfo.phone && (
                        <div className="grid grid-cols-1 gap-1 text-center">
                          <span
                            className="font-medium text-xs sm:text-sm lg:text-base"
                            style={{ color: "#B91C1C" }}
                          >
                            Số điện thoại:
                          </span>
                          <span
                            className="text-xs sm:text-sm lg:text-base break-words"
                            style={{ color: "#7F1D1D" }}
                          >
                            {storedUserInfo.phone}
                          </span>
                        </div>
                      )}
                      {storedUserInfo.age && (
                        <div className="grid grid-cols-1 gap-1 text-center">
                          <span
                            className="font-medium text-xs sm:text-sm lg:text-base"
                            style={{ color: "#B91C1C" }}
                          >
                            Tuổi:
                          </span>
                          <span
                            className="text-xs sm:text-sm lg:text-base"
                            style={{ color: "#7F1D1D" }}
                          >
                            {storedUserInfo.age}
                          </span>
                        </div>
                      )}
                      {storedUserInfo.address && (
                        <div className="grid grid-cols-1 gap-1 text-center">
                          <span
                            className="font-medium text-xs sm:text-sm lg:text-base"
                            style={{ color: "#B91C1C" }}
                          >
                            Địa chỉ:
                          </span>
                          <span
                            className="text-xs sm:text-sm lg:text-base break-words"
                            style={{ color: "#7F1D1D" }}
                          >
                            {storedUserInfo.address}
                          </span>
                        </div>
                      )}
                      {storedUserInfo.referralSource && (
                        <div className="grid grid-cols-1 gap-1 text-center">
                          <span
                            className="font-medium text-xs sm:text-sm lg:text-base"
                            style={{ color: "#B91C1C" }}
                          >
                            Kênh biết đến:
                          </span>
                          <span
                            className="text-xs sm:text-sm lg:text-base break-words"
                            style={{ color: "#7F1D1D" }}
                          >
                            {storedUserInfo.referralSource}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-stretch sm:items-center">
                    <motion.button
                      onClick={handleSpin}
                      disabled={isSpinning}
                      className="disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 sm:py-4 px-6 sm:px-8 rounded-xl transition-all duration-300 transform hover:scale-105 flex-1 sm:flex-none"
                      style={{
                        background: "#74070E",
                      }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <div className="flex items-center justify-center space-x-2 sm:space-x-3">
                        <Gift className="w-5 h-5 sm:w-6 sm:h-6" />
                        <span className="text-base sm:text-lg">
                          {isSpinning ? "Đang quay..." : "Bốc Thăm Ngay!"}
                        </span>
                      </div>
                    </motion.button>

                    <motion.button
                      onClick={handleEditUserInfo}
                      className="text-white font-medium py-3 px-6 rounded-xl transition-colors flex-1 sm:flex-none"
                      style={{
                        background: "#6B7280",
                      }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-center justify-center space-x-2">
                        <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span className="text-sm sm:text-base">
                          Sửa thông tin
                        </span>
                      </div>
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}

            {currentStep === "spinning" && (
              <motion.div
                key="spinning"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1 }}
                transition={{ duration: 0.5 }}
                className="text-center"
              >
                <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-12 shadow-2xl border border-gray-100 max-w-2xl mx-auto">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center mx-auto mb-6 sm:mb-8"
                    style={{ background: "#74070E" }}
                  >
                    <Gift className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
                  </motion.div>

                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">
                    Đang Bốc Thăm...
                  </h2>

                  <motion.p
                    className="text-base sm:text-xl text-gray-600 mb-6 sm:mb-8"
                    animate={{ opacity: [1, 0.5, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    🎯 Chúc may mắn, {userProfile?.fullName}!
                  </motion.p>

                  <div className="space-y-4">
                    <motion.div
                      className="h-2 bg-gray-200 rounded-full overflow-hidden"
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                    >
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: "#74070E" }}
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 3 }}
                      />
                    </motion.div>
                    <p className="text-sm text-gray-500">
                      Đang xác định ưu đãi thời trang cho bạn...
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {currentStep === "participated" && (
              <motion.div
                key="participated"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -50 }}
                transition={{ duration: 0.5 }}
                className="text-center"
              >
                <div className="bg-white rounded-3xl p-12 shadow-2xl border border-gray-100 max-w-2xl mx-auto">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring" }}
                    className="w-24 h-24 bg-gradient-to-r from-amber-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-8"
                  >
                    <Clock className="w-12 h-12 text-white" />
                  </motion.div>

                  <h2 className="text-3xl font-bold text-gray-900 mb-4">
                    🎯 Bạn Đã Nhận Ưu Đãi Rồi!
                  </h2>

                  <p className="text-xl text-gray-600 mb-8">
                    Thiết bị này đã nhận ưu đãi Dezus rồi. Mỗi thiết bị chỉ được
                    nhận ưu đãi một lần duy nhất!
                  </p>

                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-200 mb-8">
                    <div className="flex items-center justify-center space-x-3 mb-4">
                      <Clock className="w-6 h-6 text-amber-600" />
                      <span className="text-amber-800 font-medium">
                        Một lần tham gia duy nhất
                      </span>
                    </div>
                    <p className="text-amber-700 text-sm">
                      Để đảm bảo công bằng, mỗi thiết bị chỉ được phép nhận ưu
                      đãi một lần trong chương trình khuyến mãi thời trang này.
                    </p>
                  </div>

                  <motion.button
                    onClick={goHome}
                    className="text-white font-medium py-3 px-8 rounded-xl transition-colors"
                    style={{
                      background: "linear-gradient(to right, #74070E, #8A080F)",
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <span>Về Trang Chủ</span>
                      <ChevronRight className="w-5 h-5" />
                    </div>
                  </motion.button>
                </div>
              </motion.div>
            )}

            {currentStep === "out_of_stock" && (
              <motion.div
                key="out_of_stock"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -50 }}
                transition={{ duration: 0.5 }}
                className="text-center"
              >
                <div className="bg-white rounded-3xl p-12 shadow-2xl border border-gray-100 max-w-2xl mx-auto">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring" }}
                    className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8"
                    style={{
                      background: "linear-gradient(to right, #74070E, #EC4899)",
                    }}
                  >
                    <Gift className="w-12 h-12 text-white" />
                  </motion.div>

                  <h2 className="text-3xl font-bold text-gray-900 mb-4">
                    📦 Hết Giải Thưởng Rồi!
                  </h2>

                  <p className="text-xl text-gray-600 mb-8">
                    Rất tiếc, tất cả giải thưởng đã được phát hết. Cảm ơn bạn đã
                    quan tâm đến chương trình của chúng tôi!
                  </p>

                  <div
                    className="rounded-2xl p-6 mb-8"
                    style={{
                      background: "linear-gradient(to right, #FEF2F2, #FDF2F8)",
                      borderColor: "#FCA5A5",
                      borderWidth: "1px",
                    }}
                  >
                    <div className="flex items-center justify-center space-x-3 mb-4">
                      <Gift className="w-6 h-6" style={{ color: "#74070E" }} />
                      <span
                        className="font-medium"
                        style={{ color: "#991B1B" }}
                      >
                        Chương trình đã kết thúc
                      </span>
                    </div>
                    <p className="text-sm" style={{ color: "#B91C1C" }}>
                      Tất cả giải thưởng trong chương trình quay số may mắn này
                      đã được phát hết. Hãy theo dõi để cập nhật các chương
                      trình khuyến mãi mới nhé!
                    </p>
                  </div>

                  <motion.button
                    onClick={goHome}
                    className="text-white font-medium py-3 px-8 rounded-xl transition-colors"
                    style={{
                      background: "linear-gradient(to right, #74070E, #8A080F)",
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <span>Về Trang Chủ</span>
                      <ChevronRight className="w-5 h-5" />
                    </div>
                  </motion.button>
                </div>
              </motion.div>
            )}

            {currentStep === "result" && (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -50 }}
                transition={{ duration: 0.5 }}
                className="max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl mx-auto"
              >
                <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
                  {/* Use previousResult if available (for returning users), otherwise use spinResult */}
                  {(previousResult && previousResult.outcome === "win") ||
                  spinResult?.outcome === "win" ? (
                    <>
                      {/* Winner Header */}
                      <div
                        className="p-4 sm:p-6 lg:p-8 text-center text-white"
                        style={{
                          background:
                            "linear-gradient(to right, #74070E, #8A080F)",
                        }}
                      >
                        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 px-2">
                          🎉 Chúc Mừng!
                        </h2>
                      </div>

                      {/* Prize Details */}
                      <div className="p-4 sm:p-6 lg:p-8">
                        {/* Previous Result Indicator */}
                        {previousResult && (
                          <div className="text-center mb-4 sm:mb-6">
                            <div
                              className="inline-flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium"
                              style={{
                                backgroundColor: "#FEF2F2",
                                color: "#991B1B",
                              }}
                            >
                              <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                              <span>
                                Tham gia ngày:{" "}
                                {new Date(
                                  previousResult.participatedAt
                                ).toLocaleDateString("vi-VN")}
                              </span>
                            </div>
                          </div>
                        )}

                        <div className="text-center mb-6 sm:mb-8">
                          <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 px-2">
                            {previousResult
                              ? "Giải Thưởng Bạn Đã Nhận"
                              : "Giải Thưởng Của Bạn"}
                          </h3>

                          {/* Enhanced Voucher Card */}
                          <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 border-2 border-red-100 shadow-lg">
                            {/* Voucher Name */}
                            <h4 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-2 sm:mb-3 break-words">
                              {
                                (previousResult?.voucher || spinResult.voucher)
                                  ?.name
                              }
                            </h4>

                            {/* Voucher Value Display */}
                            <div className="mb-3 sm:mb-4">
                              <div
                                className="text-2xl sm:text-3xl lg:text-4xl font-black mb-1 sm:mb-2 break-words"
                                style={{ color: "#74070E" }}
                              >
                                {(() => {
                                  const voucher =
                                    previousResult?.voucher ||
                                    spinResult.voucher;
                                  const voucherType =
                                    voucher?.voucherType ||
                                    voucher?.voucher_type;
                                  const faceValue =
                                    voucher?.faceValue || voucher?.face_value;

                                  switch (voucherType) {
                                    case "discount_percentage":
                                      return `${faceValue}% GIẢM GIÁ`;
                                    case "discount_amount":
                                      return `${parseInt(
                                        faceValue
                                      ).toLocaleString("vi-VN")}₫ GIẢM GIÁ`;
                                    case "free_product":
                                      return "MIỄN PHÍ";
                                    default:
                                      return faceValue;
                                  }
                                })()}
                              </div>
                              <div className="text-xs sm:text-sm text-gray-600 font-medium">
                                {(() => {
                                  const voucher =
                                    previousResult?.voucher ||
                                    spinResult.voucher;
                                  const voucherType =
                                    voucher?.voucherType ||
                                    voucher?.voucher_type;

                                  switch (voucherType) {
                                    case "discount_percentage":
                                      return "Giảm giá theo phần trăm";
                                    case "discount_amount":
                                      return "Giảm giá cố định";
                                    case "free_product":
                                      return "Sản phẩm miễn phí";
                                    default:
                                      return "Voucher đặc biệt";
                                  }
                                })()}
                              </div>
                            </div>

                            {/* Description */}
                            {(previousResult?.voucher || spinResult.voucher)
                              ?.description && (
                              <p className="text-gray-700 mb-4 sm:mb-6 text-sm sm:text-base lg:text-lg font-medium break-words">
                                {
                                  (
                                    previousResult?.voucher ||
                                    spinResult.voucher
                                  )?.description
                                }
                              </p>
                            )}

                            {/* Voucher Code Section */}
                            <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 border-2 border-dashed border-red-300 shadow-inner">
                              <p className="text-xs sm:text-sm font-semibold text-gray-600 mb-2 sm:mb-3">
                                Mã Voucher của bạn:
                              </p>
                              <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3">
                                <code
                                  className="px-3 sm:px-4 lg:px-6 py-2 sm:py-2.5 lg:py-3 rounded-lg sm:rounded-xl font-mono text-sm sm:text-lg lg:text-xl font-bold text-white tracking-wider shadow-lg break-all"
                                  style={{
                                    background:
                                      "linear-gradient(135deg, #74070E 0%, #A91D3A 100%)",
                                  }}
                                >
                                  {
                                    (
                                      previousResult?.voucher ||
                                      spinResult.voucher
                                    )?.code
                                  }
                                </code>
                                <motion.button
                                  onClick={() =>
                                    copyVoucherCode(
                                      (
                                        previousResult?.voucher ||
                                        spinResult.voucher
                                      )?.code
                                    )
                                  }
                                  className="text-white p-2 rounded-lg transition-colors flex-shrink-0"
                                  style={{ background: "#74070E" }}
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  {copiedCode ? (
                                    <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                                  ) : (
                                    <Copy className="w-4 h-4 sm:w-5 sm:h-5" />
                                  )}
                                </motion.button>
                              </div>
                              {copiedCode && (
                                <motion.p
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="text-xs sm:text-sm mt-2"
                                  style={{ color: "#74070E" }}
                                >
                                  ✅ Đã sao chép!
                                </motion.p>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="grid gap-3 sm:gap-4 grid-cols-1">
                          <motion.button
                            onClick={goHome}
                            className="text-white font-medium py-3 sm:py-4 px-4 sm:px-6 rounded-xl transition-colors w-full"
                            style={{
                              background:
                                "linear-gradient(to right, #74070E, #8A080F)",
                            }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <div className="flex items-center justify-center space-x-2">
                              <span className="text-sm sm:text-base">
                                Về Trang Chủ
                              </span>
                              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                            </div>
                          </motion.button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* No Win Header */}
                      <div
                        className="p-8 text-center text-white"
                        style={{
                          background:
                            "linear-gradient(to right, #6B7280, #4B5563)",
                        }}
                      >
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.2, type: "spring" }}
                          className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4"
                        >
                          <Heart className="w-10 h-10" />
                        </motion.div>
                        <h2 className="text-3xl font-bold mb-2">
                          {previousResult
                            ? "Cảm Ơn Bạn Đã Tham Gia!"
                            : "Chúc May Mắn Lần Sau!"}
                        </h2>
                        <p className="text-xl" style={{ color: "#F9FAFB" }}>
                          {previousResult
                            ? "Bạn đã hoàn thành tham gia!"
                            : "Đừng bỏ cuộc!"}
                        </p>
                      </div>

                      {/* Encouragement */}
                      <div className="p-8 text-center">
                        {/* Previous Result Indicator for No Win */}
                        {previousResult && (
                          <div className="text-center mb-6">
                            <div
                              className="inline-flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium"
                              style={{
                                backgroundColor: "#FEF2F2",
                                color: "#991B1B",
                              }}
                            >
                              <Clock className="w-4 h-4" />
                              <span>
                                Tham gia ngày:{" "}
                                {new Date(
                                  previousResult.participatedAt
                                ).toLocaleDateString("vi-VN")}
                              </span>
                            </div>
                          </div>
                        )}

                        <p className="text-gray-600 mb-8 text-lg">
                          {previousResult
                            ? "Bạn đã tham gia quay số may mắn. Mặc dù lần này chưa may mắn, nhưng cảm ơn bạn đã tham gia chương trình của chúng tôi!"
                            : "Lần này bạn chưa thắng, nhưng luôn có nhiều cơ hội để giành được những giải thưởng tuyệt vời!"}
                        </p>

                        <div
                          className={`grid gap-4 ${
                            previousResult
                              ? "grid-cols-1 sm:grid-cols-1"
                              : "grid-cols-1 sm:grid-cols-1"
                          }`}
                        >
                          <motion.button
                            onClick={goHome}
                            className="font-medium py-3 px-6 rounded-xl transition-colors"
                            style={{
                              backgroundColor: "#F3F4F6",
                              color: "#374151",
                            }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <div className="flex items-center justify-center space-x-2">
                              <span>Về Trang Chủ</span>
                              <ChevronRight className="w-5 h-5" />
                            </div>
                          </motion.button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default SpinPage;
