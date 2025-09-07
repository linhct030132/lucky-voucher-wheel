import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  RotateCcw,
  Sparkles,
  Gift,
  Trophy,
  Star,
  Zap,
  Crown,
} from "lucide-react";

const SpinWheel_improved = ({
  vouchers = [],
  onSpin,
  spinning = false,
  result = null,
  disabled = false,
}) => {
  const [rotation, setRotation] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const wheelRef = useRef(null);

  // Ensure we have at least some segments
  const segments =
    vouchers.length > 0
      ? vouchers
      : [
          {
            id: 1,
            name: "Try Again",
            face_value: 0,
            voucher_type: "try_again",
          },
        ];

  const segmentAngle = 360 / segments.length;

  useEffect(() => {
    if (spinning && !isAnimating) {
      handleWheelSpin();
    }
  }, [spinning, isAnimating, handleWheelSpin]);

  const handleWheelSpin = useCallback(() => {
    if (isAnimating || disabled) return;

    setIsAnimating(true);

    // Generate random spin (multiple full rotations + random angle)
    const minSpins = 3;
    const maxSpins = 6;
    const spins = minSpins + Math.random() * (maxSpins - minSpins);
    const finalAngle = Math.random() * 360;
    const totalRotation = rotation + spins * 360 + finalAngle;

    setRotation(totalRotation);

    // Trigger the onSpin callback
    if (onSpin) {
      onSpin();
    }

    // Reset animation state after spin completes
    setTimeout(() => {
      setIsAnimating(false);
    }, 4000);
  }, [isAnimating, disabled, rotation, onSpin]);

  const getSegmentIcon = (voucherType) => {
    switch (voucherType) {
      case "discount_percentage":
        return <Star className="w-4 h-4" />;
      case "discount_amount":
        return <Gift className="w-4 h-4" />;
      case "free_product":
        return <Crown className="w-4 h-4" />;
      case "try_again":
        return <RotateCcw className="w-4 h-4" />;
      default:
        return <Sparkles className="w-4 h-4" />;
    }
  };

  const formatVoucherValue = (voucher) => {
    if (voucher.voucher_type === "try_again") return "Try Again";
    if (voucher.voucher_type === "discount_percentage")
      return `${voucher.face_value}% OFF`;
    if (voucher.voucher_type === "discount_amount")
      return `$${voucher.face_value}`;
    if (voucher.voucher_type === "free_product") return "FREE";
    return voucher.name;
  };

  return (
    <div className="flex flex-col items-center space-y-8">
      {/* Wheel Container */}
      <div className="relative">
        {/* Outer Glow */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-400 to-purple-600 opacity-20 blur-xl animate-pulse"></div>

        {/* Wheel Background */}
        <div className="relative w-80 h-80 sm:w-96 sm:h-96">
          {/* Decorative Ring */}
          <div className="absolute inset-0 rounded-full border-8 border-gradient-to-r from-indigo-400 to-purple-600 opacity-30"></div>
          <div className="absolute inset-2 rounded-full border-4 border-white shadow-2xl"></div>

          {/* Spinning Wheel */}
          <motion.div
            ref={wheelRef}
            className="absolute inset-4 rounded-full overflow-hidden shadow-inner"
            animate={{
              rotate: rotation,
              scale: isAnimating ? [1, 1.05, 1] : 1,
            }}
            transition={{
              rotate: {
                duration: isAnimating ? 4 : 0,
                ease: [0.23, 1, 0.32, 1],
              },
              scale: {
                duration: 0.3,
                repeat: isAnimating ? Infinity : 0,
                repeatType: "reverse",
              },
            }}
          >
            <svg className="w-full h-full" viewBox="0 0 200 200">
              {segments.map((segment, index) => {
                const startAngle = index * segmentAngle - 90;
                const endAngle = (index + 1) * segmentAngle - 90;
                const largeArcFlag = segmentAngle > 180 ? 1 : 0;

                const startX =
                  100 + 95 * Math.cos((startAngle * Math.PI) / 180);
                const startY =
                  100 + 95 * Math.sin((startAngle * Math.PI) / 180);
                const endX = 100 + 95 * Math.cos((endAngle * Math.PI) / 180);
                const endY = 100 + 95 * Math.sin((endAngle * Math.PI) / 180);

                const textAngle = startAngle + segmentAngle / 2;
                const textX = 100 + 65 * Math.cos((textAngle * Math.PI) / 180);
                const textY = 100 + 65 * Math.sin((textAngle * Math.PI) / 180);

                return (
                  <g key={segment.id || index}>
                    {/* Gradient Definition */}
                    <defs>
                      <linearGradient
                        id={`gradient-${index}`}
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="100%"
                      >
                        <stop
                          offset="0%"
                          stopColor={index % 2 === 0 ? "#3b82f6" : "#8b5cf6"}
                        />
                        <stop
                          offset="100%"
                          stopColor={index % 2 === 0 ? "#1d4ed8" : "#7c3aed"}
                        />
                      </linearGradient>
                    </defs>

                    <path
                      d={`M 100 100 L ${startX} ${startY} A 95 95 0 ${largeArcFlag} 1 ${endX} ${endY} Z`}
                      fill={`url(#gradient-${index})`}
                      stroke="white"
                      strokeWidth="2"
                      className="drop-shadow-sm"
                    />

                    {/* Segment Border */}
                    <path
                      d={`M 100 100 L ${startX} ${startY}`}
                      stroke="white"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />

                    {/* Text Container */}
                    <g
                      transform={`translate(${textX}, ${textY}) rotate(${
                        textAngle + 90
                      })`}
                    >
                      {/* Background for better text readability */}
                      <rect
                        x="-25"
                        y="-12"
                        width="50"
                        height="24"
                        rx="12"
                        fill="rgba(255,255,255,0.9)"
                        className="drop-shadow-sm"
                      />

                      {/* Icon */}
                      <foreignObject x="-20" y="-8" width="16" height="16">
                        <div className="flex items-center justify-center text-gray-700">
                          {getSegmentIcon(segment.voucher_type)}
                        </div>
                      </foreignObject>

                      {/* Text */}
                      <text
                        x="6"
                        y="4"
                        textAnchor="start"
                        className="text-xs font-bold fill-gray-800"
                        dominantBaseline="middle"
                      >
                        {formatVoucherValue(segment)}
                      </text>
                    </g>
                  </g>
                );
              })}

              {/* Center Circle */}
              <circle
                cx="100"
                cy="100"
                r="25"
                fill="url(#center-gradient)"
                stroke="white"
                strokeWidth="4"
                className="drop-shadow-lg"
              />

              <defs>
                <radialGradient id="center-gradient">
                  <stop offset="0%" stopColor="#818cf8" />
                  <stop offset="100%" stopColor="#4f46e5" />
                </radialGradient>
              </defs>

              {/* Center Icon */}
              <foreignObject x="85" y="85" width="30" height="30">
                <div className="flex items-center justify-center text-white w-full h-full">
                  {isAnimating ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 0.5,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                    >
                      <Zap className="w-6 h-6" />
                    </motion.div>
                  ) : (
                    <Trophy className="w-6 h-6" />
                  )}
                </div>
              </foreignObject>
            </svg>
          </motion.div>

          {/* Pointer */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2 z-10">
            <motion.div
              animate={
                isAnimating
                  ? {
                      y: [0, -5, 0],
                      rotate: [0, -10, 10, 0],
                    }
                  : {}
              }
              transition={
                isAnimating
                  ? {
                      duration: 0.2,
                      repeat: Infinity,
                      repeatType: "reverse",
                    }
                  : {}
              }
              className="w-0 h-0 border-l-4 border-r-4 border-b-8 border-l-transparent border-r-transparent border-b-yellow-500 drop-shadow-lg"
              style={{
                filter: "drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))",
              }}
            />
          </div>

          {/* Floating Particles */}
          <AnimatePresence>
            {isAnimating && (
              <>
                {[...Array(8)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-2 h-2 bg-yellow-400 rounded-full"
                    initial={{
                      x: "50%",
                      y: "50%",
                      scale: 0,
                    }}
                    animate={{
                      x: `${50 + Math.cos((i * 45 * Math.PI) / 180) * 150}%`,
                      y: `${50 + Math.sin((i * 45 * Math.PI) / 180) * 150}%`,
                      scale: [0, 1, 0],
                      opacity: [0, 1, 0],
                    }}
                    transition={{
                      duration: 2,
                      delay: i * 0.1,
                      repeat: Infinity,
                      repeatDelay: 1,
                    }}
                  />
                ))}
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Spin Button */}
      <motion.button
        onClick={handleWheelSpin}
        disabled={disabled || isAnimating}
        className={`relative px-8 py-4 rounded-2xl font-bold text-lg shadow-xl transition-all duration-300 ${
          disabled || isAnimating
            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
            : "bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 hover:shadow-2xl active:scale-95"
        }`}
        whileHover={!disabled && !isAnimating ? { scale: 1.05, y: -2 } : {}}
        whileTap={!disabled && !isAnimating ? { scale: 0.95 } : {}}
      >
        {/* Button Glow */}
        {!disabled && !isAnimating && (
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 opacity-50 blur-lg animate-pulse"></div>
        )}

        <div className="relative flex items-center space-x-3">
          {isAnimating ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles className="w-6 h-6" />
              </motion.div>
              <span>Spinning...</span>
            </>
          ) : (
            <>
              <Play className="w-6 h-6" />
              <span>SPIN TO WIN!</span>
            </>
          )}
        </div>
      </motion.button>

      {/* Status Text */}
      <AnimatePresence>
        {isAnimating && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center"
          >
            <motion.p
              animate={{
                color: ["#6366f1", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b"],
                scale: [1, 1.1, 1],
              }}
              transition={{
                color: { duration: 0.5, repeat: Infinity },
                scale: {
                  duration: 0.5,
                  repeat: Infinity,
                  repeatType: "reverse",
                },
              }}
              className="text-xl font-bold"
            >
              🍀 Good Luck! 🍀
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Voucher Info */}
      {vouchers.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center bg-white rounded-2xl p-6 shadow-lg border border-gray-100 max-w-md"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center justify-center">
            <Gift className="w-5 h-5 mr-2 text-indigo-600" />
            Available Prizes
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {vouchers.slice(0, 4).map((voucher, index) => (
              <div
                key={voucher.id}
                className="text-center p-3 bg-gray-50 rounded-xl"
              >
                <div className="text-lg font-bold text-indigo-600">
                  {formatVoucherValue(voucher)}
                </div>
                <div className="text-xs text-gray-600 mt-1">{voucher.name}</div>
              </div>
            ))}
          </div>
          {vouchers.length > 4 && (
            <p className="text-sm text-gray-500 mt-3">
              +{vouchers.length - 4} more prizes available
            </p>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default SpinWheel_improved;
