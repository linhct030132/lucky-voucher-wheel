import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Gift,
  Trophy,
  Star,
  Crown,
  Sparkles,
  Download,
  Copy,
  Check,
  X,
  Calendar,
  Tag,
  DollarSign,
  Percent,
  Package,
  Confetti,
} from "lucide-react";
import confetti from "canvas-confetti";

const WinModal = ({
  isOpen,
  onClose,
  voucher,
  voucherCode,
  isWinner = true,
}) => {
  const [copied, setCopied] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    if (isOpen && isWinner) {
      // Trigger confetti animation
      const duration = 3000;
      const animationEnd = Date.now() + duration;
      const defaults = {
        startVelocity: 30,
        spread: 360,
        ticks: 60,
        zIndex: 1000,
      };

      const randomInRange = (min, max) => Math.random() * (max - min) + min;

      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          clearInterval(interval);
          return;
        }

        const particleCount = 50 * (timeLeft / duration);

        // Left side
        confetti(
          Object.assign({}, defaults, {
            particleCount,
            origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
          })
        );

        // Right side
        confetti(
          Object.assign({}, defaults, {
            particleCount,
            origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
          })
        );
      }, 250);

      // Show celebration animation
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 2000);

      return () => clearInterval(interval);
    }
  }, [isOpen, isWinner]);

  const copyToClipboard = async () => {
    if (voucherCode) {
      try {
        await navigator.clipboard.writeText(voucherCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error("Failed to copy:", err);
      }
    }
  };

  const getVoucherIcon = (type) => {
    switch (type) {
      case "discount_percentage":
        return <Percent className="w-8 h-8" />;
      case "discount_amount":
        return <DollarSign className="w-8 h-8" />;
      case "free_product":
        return <Gift className="w-8 h-8" />;
      default:
        return <Package className="w-8 h-8" />;
    }
  };

  const getVoucherValue = (voucher) => {
    if (!voucher) return "";
    if (voucher.voucher_type === "discount_percentage")
      return `${voucher.face_value}% OFF`;
    if (voucher.voucher_type === "discount_amount")
      return `$${voucher.face_value} OFF`;
    if (voucher.voucher_type === "free_product") return "FREE PRODUCT";
    return voucher.name;
  };

  const formatExpiryDate = (dateString) => {
    if (!dateString) return "No expiry";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.5, opacity: 0, rotateY: -180 }}
          animate={{ scale: 1, opacity: 1, rotateY: 0 }}
          exit={{ scale: 0.5, opacity: 0, rotateY: 180 }}
          transition={{
            type: "spring",
            damping: 20,
            stiffness: 300,
            duration: 0.6,
          }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden relative"
        >
          {isWinner ? (
            // Winner Modal
            <>
              {/* Header with animated background */}
              <div className="relative bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 p-8 text-center overflow-hidden">
                {/* Animated particles */}
                <div className="absolute inset-0">
                  {[...Array(20)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-2 h-2 bg-white rounded-full opacity-70"
                      animate={{
                        x: [0, Math.random() * 400 - 200],
                        y: [0, Math.random() * 400 - 200],
                        scale: [0, 1, 0],
                        opacity: [0, 1, 0],
                      }}
                      transition={{
                        duration: 3,
                        delay: i * 0.1,
                        repeat: Infinity,
                        repeatDelay: 2,
                      }}
                      style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                      }}
                    />
                  ))}
                </div>

                {/* Close button */}
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 text-white hover:text-gray-200 p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-all duration-200"
                >
                  <X className="w-6 h-6" />
                </button>

                {/* Trophy animation */}
                <motion.div
                  animate={
                    showCelebration
                      ? {
                          scale: [1, 1.2, 1],
                          rotate: [0, -10, 10, 0],
                        }
                      : {}
                  }
                  transition={{
                    duration: 0.5,
                    repeat: showCelebration ? 3 : 0,
                  }}
                  className="relative z-10"
                >
                  <div className="bg-white bg-opacity-20 rounded-full p-4 inline-block mb-4">
                    <Trophy className="w-16 h-16 text-white" />
                  </div>
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-3xl font-bold text-white mb-2"
                >
                  🎉 Congratulations! 🎉
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-white text-lg font-medium"
                >
                  You've won an amazing prize!
                </motion.p>
              </div>

              {/* Prize Details */}
              <div className="p-8">
                {voucher && (
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="text-center mb-6"
                  >
                    {/* Voucher Icon */}
                    <div className="bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl p-6 mb-6">
                      <div className="flex justify-center mb-4">
                        <div className="bg-gradient-to-br from-indigo-600 to-purple-600 text-white p-4 rounded-2xl">
                          {getVoucherIcon(voucher.voucher_type)}
                        </div>
                      </div>

                      <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        {voucher.name}
                      </h2>

                      <div className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                        {getVoucherValue(voucher)}
                      </div>

                      {voucher.description && (
                        <p className="text-gray-600 text-sm">
                          {voucher.description}
                        </p>
                      )}
                    </div>

                    {/* Voucher Code */}
                    {voucherCode && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.7 }}
                        className="bg-gray-50 rounded-2xl p-4 mb-6"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-600 mb-1">
                              Your Code
                            </p>
                            <div className="bg-white rounded-xl p-3 border-2 border-dashed border-indigo-300">
                              <code className="text-lg font-bold text-indigo-600 tracking-wider">
                                {voucherCode}
                              </code>
                            </div>
                          </div>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={copyToClipboard}
                            className="ml-3 bg-indigo-600 text-white p-3 rounded-xl hover:bg-indigo-700 transition-colors"
                          >
                            {copied ? (
                              <Check className="w-5 h-5" />
                            ) : (
                              <Copy className="w-5 h-5" />
                            )}
                          </motion.button>
                        </div>
                        {copied && (
                          <motion.p
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="text-green-600 text-sm font-medium mt-2"
                          >
                            Code copied to clipboard!
                          </motion.p>
                        )}
                      </motion.div>
                    )}

                    {/* Voucher Details */}
                    <div className="space-y-3 text-sm text-gray-600">
                      {voucher.valid_to && (
                        <div className="flex items-center justify-center space-x-2">
                          <Calendar className="w-4 h-4" />
                          <span>
                            Valid until: {formatExpiryDate(voucher.valid_to)}
                          </span>
                        </div>
                      )}

                      {voucher.max_per_user && (
                        <div className="flex items-center justify-center space-x-2">
                          <Tag className="w-4 h-4" />
                          <span>Max {voucher.max_per_user} per customer</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* Action Buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="space-y-3"
                >
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onClose}
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-2xl font-bold text-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    Awesome! Thanks!
                  </motion.button>

                  {voucherCode && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        // Simulate download or sharing functionality
                        const element = document.createElement("a");
                        const file = new Blob(
                          [
                            `Your voucher code: ${voucherCode}\nVoucher: ${
                              voucher?.name
                            }\nValue: ${getVoucherValue(
                              voucher
                            )}\nValid until: ${formatExpiryDate(
                              voucher?.valid_to
                            )}`,
                          ],
                          { type: "text/plain" }
                        );
                        element.href = URL.createObjectURL(file);
                        element.download = `voucher-${voucherCode}.txt`;
                        document.body.appendChild(element);
                        element.click();
                        document.body.removeChild(element);
                      }}
                      className="w-full bg-white text-indigo-600 py-3 rounded-2xl font-medium border-2 border-indigo-600 hover:bg-indigo-50 transition-colors flex items-center justify-center space-x-2"
                    >
                      <Download className="w-5 h-5" />
                      <span>Download Details</span>
                    </motion.button>
                  )}
                </motion.div>
              </div>
            </>
          ) : (
            // No Win Modal
            <>
              {/* Header */}
              <div className="relative bg-gradient-to-br from-gray-400 to-gray-600 p-8 text-center">
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 text-white hover:text-gray-200 p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-all duration-200"
                >
                  <X className="w-6 h-6" />
                </button>

                <div className="bg-white bg-opacity-20 rounded-full p-4 inline-block mb-4">
                  <Star className="w-16 h-16 text-white" />
                </div>

                <h1 className="text-3xl font-bold text-white mb-2">
                  Almost there!
                </h1>

                <p className="text-white text-lg">Better luck next time!</p>
              </div>

              {/* Content */}
              <div className="p-8 text-center">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6"
                >
                  <p className="text-gray-600 text-lg mb-6">
                    Don't give up! You can try again and win amazing prizes.
                  </p>

                  <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 mb-6">
                    <h3 className="font-bold text-gray-900 mb-3">
                      Available Prizes
                    </h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="bg-white rounded-xl p-3">
                        <div className="text-blue-600 font-bold">10% OFF</div>
                        <div className="text-gray-600">Discount</div>
                      </div>
                      <div className="bg-white rounded-xl p-3">
                        <div className="text-green-600 font-bold">$20 OFF</div>
                        <div className="text-gray-600">Coupon</div>
                      </div>
                      <div className="bg-white rounded-xl p-3">
                        <div className="text-purple-600 font-bold">FREE</div>
                        <div className="text-gray-600">Product</div>
                      </div>
                      <div className="bg-white rounded-xl p-3">
                        <div className="text-orange-600 font-bold">25% OFF</div>
                        <div className="text-gray-600">Premium</div>
                      </div>
                    </div>
                  </div>
                </motion.div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onClose}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-2xl font-bold text-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200"
                >
                  Try Again Later
                </motion.button>
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default WinModal;
