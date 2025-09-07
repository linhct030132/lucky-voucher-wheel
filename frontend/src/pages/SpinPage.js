import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Confetti from "react-confetti";
import toast from "react-hot-toast";
import {
  Gift,
  Trophy,
  ChevronRight,
  Copy,
  Check,
  Heart,
  Crown,
  ArrowLeft,
  Target,
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
    performSpin,
    isSpinning,
    spinResult,
    // eligibilityStatus,
    availableVouchers,
  } = useSpin();

  const [currentStep, setCurrentStep] = useState("loading"); // loading, form, spinning, result, participated, out_of_stock
  const [userProfile, setUserProfile] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
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
            setCurrentStep("participated");
          } else if (eligibility.reason === "NO_STOCK") {
            setCurrentStep("out_of_stock");
          } else {
            setCurrentStep("participated"); // Default fallback
          }
          return;
        }

        await getAvailableVouchers();
        setCurrentStep("form");
      } catch (error) {
        console.error("Failed to initialize system:", error);
        toast.error("Không thể tải hệ thống. Vui lòng thử lại.");
        navigate("/");
      }
    };

    initializeSystem();
  }, [getAvailableVouchers, navigate, checkDeviceEligibility]);

  // Handle form submission
  const handleFormSubmit = async (formData) => {
    setUserProfile(formData);

    // Check eligibility first
    const eligibility = await checkEligibility(formData.email, formData.phone);

    if (!eligibility.eligible) {
      toast.error(eligibility.message || "Bạn không đủ điều kiện tham gia");
      return;
    }

    setCurrentStep("spinning");

    // Perform the spin
    const result = await performSpin(formData);

    if (result && result.outcome !== "error") {
      setCurrentStep("result");
      if (result.outcome === "win") {
        setShowConfetti(true);
        // Hide confetti after 5 seconds
        setTimeout(() => setShowConfetti(false), 5000);
      }
    } else {
      setCurrentStep("form");
      toast.error(result?.error || "Quay thất bại. Vui lòng thử lại.");
    }
  };

  // Handle spin action
  // const handleSpin = () => {
  //   if (userProfile) {
  //     performSpin(userProfile);
  //   }
  // };

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

  // Try again
  const handleTryAgain = () => {
    setCurrentStep("form");
    setUserProfile(null);
    setShowConfetti(false);
  };

  // Loading state
  if (currentStep === "loading" || !availableVouchers) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner />
          <motion.p
            className="mt-6 text-lg text-gray-600"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            Đang tải những giải thưởng tuyệt vời...
          </motion.p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
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
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <motion.button
              onClick={goHome}
              className="flex items-center space-x-3 text-gray-700 hover:text-indigo-600 transition-colors"
              whileHover={{ x: -5 }}
            >
              <ArrowLeft className="w-5 h-5" />
              <div className="flex items-center space-x-2">
                <Crown className="w-6 h-6 text-indigo-600" />
                <span className="font-bold text-lg">Vòng quay may mắn</span>
              </div>
            </motion.button>

            <div className="flex items-center space-x-4">
              {/* Progress Indicator */}
              <div className="hidden sm:flex items-center space-x-2">
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
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium bg-red-600 text-white">
                      📦
                    </div>
                    <span className="text-sm text-red-600 font-medium">
                      Hết giải thưởng
                    </span>
                  </div>
                ) : (
                  // Show regular progress steps
                  [
                    {
                      step: 1,
                      label: "Thông tin của bạn",
                      active: currentStep === "form",
                    },
                    {
                      step: 2,
                      label: "Quay thưởng",
                      active: currentStep === "spinning",
                    },
                    {
                      step: 3,
                      label: "Kết quả",
                      active: currentStep === "result",
                    },
                  ].map((item, index) => (
                    <div key={index} className="flex items-center">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                          item.active
                            ? "bg-indigo-600 text-white"
                            : "bg-gray-200 text-gray-600"
                        }`}
                      >
                        {item.step}
                      </div>
                      <span className="ml-2 text-sm text-gray-600">
                        {item.label}
                      </span>
                      {index < 2 && (
                        <div className="w-8 h-0.5 bg-gray-200 mx-3"></div>
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
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          {currentStep === "participated" ? (
            <>
              <motion.div
                className="inline-flex items-center space-x-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white px-6 py-3 rounded-full text-sm font-medium mb-6"
                whileHover={{ scale: 1.05 }}
              >
                <Clock className="w-5 h-5" />
                <span>✅ Đã Tham Gia</span>
              </motion.div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-4">
                <span className="bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                  Cảm Ơn Bạn Đã Tham Gia
                </span>
              </h1>

              <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                Thiết bị này đã hoàn thành việc tham gia chương trình quay số
                may mắn.
              </p>
            </>
          ) : currentStep === "out_of_stock" ? (
            <>
              <motion.div
                className="inline-flex items-center space-x-2 bg-gradient-to-r from-red-500 to-pink-600 text-white px-6 py-3 rounded-full text-sm font-medium mb-6"
                whileHover={{ scale: 1.05 }}
              >
                <Gift className="w-5 h-5" />
                <span>📦 Hết Giải Thưởng</span>
              </motion.div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-4">
                <span className="bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">
                  Chương Trình Đã Kết Thúc
                </span>
              </h1>

              <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                Rất tiếc, tất cả giải thưởng đã được phát hết. Cảm ơn bạn đã quan tâm đến chương trình của chúng tôi!
              </p>
            </>
          ) : (
            <>
              <motion.div
                className="inline-flex items-center space-x-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-3 rounded-full text-sm font-medium mb-6"
                whileHover={{ scale: 1.05 }}
              >
                <Target className="w-5 h-5" />
                <span>🎯 Lucky Draw In Progress</span>
              </motion.div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-4">
                <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Khoảnh Khắc May Mắn Của Bạn
                </span>
              </h1>

              <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                {availableVouchers.length} giải thưởng tuyệt vời đang chờ bạn!
              </p>
            </>
          )}

          {/* Prize Preview */}
          {currentStep !== "participated" && currentStep !== "out_of_stock" && availableVouchers.length > 0 && (
            <motion.div
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 max-w-4xl mx-auto mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              {availableVouchers.slice(0, 6).map((voucher, index) => (
                <motion.div
                  key={voucher.id}
                  className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300"
                  whileHover={{ scale: 1.05, y: -5 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <div className="text-indigo-600 mb-3 flex justify-center">
                    <Gift className="w-8 h-8" />
                  </div>
                  <div className="text-gray-900 text-sm font-bold mb-2 line-clamp-2">
                    {voucher.name}
                  </div>
                  <div className="text-indigo-600 text-xs font-medium">
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
        <div className="max-w-4xl mx-auto">
          <AnimatePresence mode="wait">
            {currentStep === "form" && (
              <motion.div
                key="form"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.5 }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
              >
                {/* Left Side - Info */}
                <div className="space-y-6">
                  <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100">
                    <h3 className="text-2xl font-bold text-gray-900 mb-6">
                      🎊 Sẵn Sàng Chiến Thắng?
                    </h3>

                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <Check className="w-5 h-5 text-green-600" />
                        </div>
                        <span className="text-gray-700">Miễn phí tham gia</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <Check className="w-5 h-5 text-green-600" />
                        </div>
                        <span className="text-gray-700">
                          Kết quả ngay lập tức
                        </span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <Check className="w-5 h-5 text-green-600" />
                        </div>
                        <span className="text-gray-700">
                          Công bằng & minh bạch
                        </span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <Check className="w-5 h-5 text-green-600" />
                        </div>
                        <span className="text-gray-700">An toàn & bảo mật</span>
                      </div>
                    </div>

                    <div className="mt-8 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl">
                      <p className="text-sm text-gray-700">
                        <strong>Cách thức hoạt động:</strong> Nhập thông tin của
                        bạn, quay bánh xe và nếu thắng, bạn sẽ nhận được voucher
                        ngay lập tức!
                      </p>
                    </div>
                  </div>
                </div>

                {/* Right Side - Form */}
                <div>
                  <UserInfoForm
                    onSubmit={handleFormSubmit}
                    loading={isSpinning}
                  />
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
                <div className="bg-white rounded-3xl p-12 shadow-2xl border border-gray-100 max-w-2xl mx-auto">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="w-24 h-24 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-8"
                  >
                    <Target className="w-12 h-12 text-white" />
                  </motion.div>

                  <h2 className="text-3xl font-bold text-gray-900 mb-4">
                    Đang Quay Bánh Xe...
                  </h2>

                  <motion.p
                    className="text-xl text-gray-600 mb-8"
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
                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full"
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 3 }}
                      />
                    </motion.div>
                    <p className="text-sm text-gray-500">
                      Đang xác định giải thưởng của bạn...
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
                    🎯 Bạn Đã Tham Gia Rồi!
                  </h2>

                  <p className="text-xl text-gray-600 mb-8">
                    Thiết bị này đã tham gia vòng quay rồi. Mỗi thiết bị chỉ
                    được tham gia một lần duy nhất!
                  </p>

                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-200 mb-8">
                    <div className="flex items-center justify-center space-x-3 mb-4">
                      <Clock className="w-6 h-6 text-amber-600" />
                      <span className="text-amber-800 font-medium">
                        Một lần tham gia duy nhất
                      </span>
                    </div>
                    <p className="text-amber-700 text-sm">
                      Để đảm bảo công bằng, mỗi thiết bị chỉ được phép tham gia
                      một lần trong chương trình quay số may mắn này.
                    </p>
                  </div>

                  <motion.button
                    onClick={goHome}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium py-3 px-8 rounded-xl transition-colors"
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
                    className="w-24 h-24 bg-gradient-to-r from-red-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-8"
                  >
                    <Gift className="w-12 h-12 text-white" />
                  </motion.div>

                  <h2 className="text-3xl font-bold text-gray-900 mb-4">
                    📦 Hết Giải Thưởng Rồi!
                  </h2>

                  <p className="text-xl text-gray-600 mb-8">
                    Rất tiếc, tất cả giải thưởng đã được phát hết. Cảm ơn bạn đã quan tâm đến chương trình của chúng tôi!
                  </p>

                  <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-2xl p-6 border border-red-200 mb-8">
                    <div className="flex items-center justify-center space-x-3 mb-4">
                      <Gift className="w-6 h-6 text-red-600" />
                      <span className="text-red-800 font-medium">
                        Chương trình đã kết thúc
                      </span>
                    </div>
                    <p className="text-red-700 text-sm">
                      Tất cả giải thưởng trong chương trình quay số may mắn này đã được phát hết. 
                      Hãy theo dõi để cập nhật các chương trình khuyến mãi mới nhé!
                    </p>
                  </div>

                  <motion.button
                    onClick={goHome}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium py-3 px-8 rounded-xl transition-colors"
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
                className="max-w-2xl mx-auto"
              >
                <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
                  {spinResult?.outcome === "win" ? (
                    <>
                      {/* Winner Header */}
                      <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-8 text-center text-white">
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.2, type: "spring" }}
                          className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4"
                        >
                          <Trophy className="w-10 h-10" />
                        </motion.div>
                        <h2 className="text-4xl font-bold mb-2">
                          🎉 Chúc Mừng!
                        </h2>
                        <p className="text-xl text-green-100">
                          Bạn đã chiến thắng!
                        </p>
                      </div>

                      {/* Prize Details */}
                      <div className="p-8">
                        <div className="text-center mb-8">
                          <h3 className="text-2xl font-bold text-gray-900 mb-4">
                            Giải Thưởng Của Bạn
                          </h3>
                          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
                            <div className="text-green-600 mb-3">
                              <Gift className="w-12 h-12 mx-auto" />
                            </div>
                            <h4 className="text-xl font-bold text-gray-900 mb-2">
                              {spinResult.voucher?.name}
                            </h4>
                            <p className="text-gray-600 mb-4">
                              {spinResult.voucher?.description}
                            </p>
                            <div className="bg-white rounded-xl p-4 border border-green-200">
                              <p className="text-sm text-gray-600 mb-2">
                                Mã Voucher:
                              </p>
                              <div className="flex items-center justify-center space-x-3">
                                <code className="bg-gray-100 px-4 py-2 rounded-lg font-mono text-lg font-bold text-gray-900">
                                  {spinResult.voucher?.code}
                                </code>
                                <motion.button
                                  onClick={() =>
                                    copyVoucherCode(spinResult.voucher?.code)
                                  }
                                  className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-lg transition-colors"
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  {copiedCode ? (
                                    <Check className="w-5 h-5" />
                                  ) : (
                                    <Copy className="w-5 h-5" />
                                  )}
                                </motion.button>
                              </div>
                              {copiedCode && (
                                <motion.p
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="text-green-600 text-sm mt-2"
                                >
                                  ✅ Đã sao chép!
                                </motion.p>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <motion.button
                            onClick={handleTryAgain}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-6 rounded-xl transition-colors"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <div className="flex items-center justify-center space-x-2">
                              <RefreshCw className="w-5 h-5" />
                              <span>Thử Lại</span>
                            </div>
                          </motion.button>
                          <motion.button
                            onClick={goHome}
                            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium py-3 px-6 rounded-xl transition-colors"
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
                  ) : (
                    <>
                      {/* No Win Header */}
                      <div className="bg-gradient-to-r from-gray-500 to-gray-600 p-8 text-center text-white">
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.2, type: "spring" }}
                          className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4"
                        >
                          <Heart className="w-10 h-10" />
                        </motion.div>
                        <h2 className="text-3xl font-bold mb-2">
                          Chúc May Mắn Lần Sau!
                        </h2>
                        <p className="text-xl text-gray-100">Đừng bỏ cuộc!</p>
                      </div>

                      {/* Encouragement */}
                      <div className="p-8 text-center">
                        <p className="text-gray-600 mb-8 text-lg">
                          Lần này bạn chưa thắng, nhưng luôn có nhiều cơ hội để
                          giành được những giải thưởng tuyệt vời!
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <motion.button
                            onClick={handleTryAgain}
                            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium py-3 px-6 rounded-xl transition-colors"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <div className="flex items-center justify-center space-x-2">
                              <RefreshCw className="w-5 h-5" />
                              <span>Thử Lại</span>
                            </div>
                          </motion.button>
                          <motion.button
                            onClick={goHome}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-6 rounded-xl transition-colors"
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
