import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Gift, Trophy, Users, ArrowRight } from "lucide-react";
import LogoIcon from "../components/LogoIcon";

const LandingPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Component initialization effect
  }, []);

  const handleStartSpin = () => {
    navigate("/spin");
  };

  return (
    <div className="min-h-screen bg-gray-200">
      {/* Navigation Header */}
      <nav className="z-50 bg-white/95 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 shadow-lg shadow-gray-200/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center h-12 sm:h-14 py-2">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-3 group"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <LogoIcon className="h-6 sm:h-8 ml-0 filter drop-shadow-md group-hover:drop-shadow-lg transition-all duration-300" />
            </motion.div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 sm:py-24 lg:py-28 bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200">
        {/* Enhanced Background Elements */}
        <div className="absolute inset-0">
          {/* Floating orbs with improved gradients - balanced for hero */}
          <div
            className="absolute top-8 left-5 w-40 h-40 sm:w-72 sm:h-72 sm:top-16 sm:left-10 rounded-full mix-blend-multiply filter blur-3xl opacity-20 sm:opacity-30 animate-blob"
            style={{
              background:
                "radial-gradient(circle, #74070E 0%, #FF6B6B 50%, transparent 70%)",
            }}
          ></div>
          <div
            className="absolute top-16 right-5 w-36 h-36 sm:w-64 sm:h-64 sm:top-32 sm:right-10 rounded-full mix-blend-multiply filter blur-3xl opacity-15 sm:opacity-25 animate-blob animation-delay-2000"
            style={{
              background:
                "radial-gradient(circle, #9CA3AF 0%, #E5E7EB 50%, transparent 70%)",
            }}
          ></div>
          <div
            className="absolute -bottom-12 left-10 w-40 h-40 sm:w-72 sm:h-72 sm:-bottom-24 sm:left-20 rounded-full mix-blend-multiply filter blur-3xl opacity-20 sm:opacity-30 animate-blob animation-delay-4000"
            style={{
              background:
                "radial-gradient(circle, #74070E 0%, #8A080F 30%, #9CA3AF 60%, transparent 80%)",
            }}
          ></div>

          {/* Floating particles - adjusted for balanced hero */}
          <div className="absolute top-20 left-1/4 w-4 h-4 bg-red-400 rounded-full opacity-35 animate-ping"></div>
          <div className="absolute top-32 right-1/3 w-3 h-3 bg-gray-400 rounded-full opacity-30 animate-pulse animation-delay-1000"></div>
          <div className="absolute bottom-20 left-1/3 w-5 h-5 bg-red-300 rounded-full opacity-45 animate-bounce animation-delay-3000"></div>

          {/* Subtle grid pattern */}
          <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, #74070E 1px, transparent 0)`,
              backgroundSize: "50px 50px",
            }}
          ></div>
        </div>

        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
            >
              <h1 className="text-5xl xs:text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-extrabold mb-8 sm:mb-10 lg:mb-12">
                <span className="block bg-gradient-to-r from-gray-900 via-red-800 to-gray-900 bg-clip-text text-transparent drop-shadow-lg leading-tight tracking-tight">
                  SECRET BILL
                </span>
              </h1>

              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center">
                <motion.button
                  onClick={handleStartSpin}
                  className="group relative text-white font-bold text-base sm:text-lg lg:text-xl px-8 sm:px-10 lg:px-12 py-4 sm:py-5 lg:py-6 rounded-full sm:rounded-full shadow-2xl hover:shadow-red-500/50 transform transition-all duration-500 border border-red-700/20 w-full sm:w-auto max-w-xs sm:max-w-none whitespace-nowrap"
                  style={{
                    background:
                      "linear-gradient(135deg, #74070E 0%, #8A080F 50%, #74070E 100%)",
                    backgroundSize: "200% 200%",
                  }}
                  whileHover={{
                    scale: 1.05,
                    backgroundPosition: "right center",
                  }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="flex items-center justify-center space-x-2 sm:space-x-3 relative z-10">
                    <Gift className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
                    <div className="text-center">
                      <div className="font-bold text-base sm:text-lg leading-tight tracking-wide">
                        BỐC THĂM NGAY
                      </div>
                      <div className="text-xs sm:text-sm opacity-90 leading-tight">
                        NHẬN ƯU ĐÃI
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 group-hover:translate-x-1 transition-transform duration-300 flex-shrink-0" />
                  </div>

                  {/* Enhanced glow effect */}
                  <div
                    className="absolute inset-0 rounded-full blur-2xl opacity-40 group-hover:opacity-80 -z-10 transition-opacity duration-500"
                    style={{
                      background:
                        "linear-gradient(135deg, #74070E, #FF6B6B, #74070E)",
                    }}
                  ></div>

                  {/* Shimmer effect */}
                  <div className="absolute inset-0 rounded-full overflow-hidden -z-5">
                    <div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"
                      style={{ width: "100%" }}
                    ></div>
                  </div>
                </motion.button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 sm:py-20 lg:py-24 xl:py-28 bg-gradient-to-b from-gray-200 via-white to-gray-100 relative">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-10 right-20 w-32 h-32 bg-red-100 rounded-full opacity-30 animate-pulse"></div>
          <div className="absolute bottom-20 left-10 w-24 h-24 bg-gray-200 rounded-full opacity-40 animate-bounce animation-delay-2000"></div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10 sm:mb-12 lg:mb-16"
          >
            <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold mb-3 sm:mb-4 lg:mb-6 bg-gradient-to-r from-gray-800 via-red-700 to-gray-800 bg-clip-text text-transparent">
              Cách Nhận Ưu Đãi
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 font-medium px-2 sm:px-4">
              3 bước đơn giản để nhận voucher thời trang SECRET BILL!
            </p>
          </motion.div>

          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10 xl:gap-12">
              {[
                {
                  step: "1",
                  title: "Nhập Thông Tin",
                  description:
                    "Điền tên và số điện thoại để tham gia chương trình",
                  icon: <Users className="w-8 h-8" />,
                },
                {
                  step: "2",
                  title: "Bốc Thăm",
                  description:
                    "Nhấn nút bốc thăm và khám phá ưu đãi thời trang dành cho bạn",
                  icon: <Gift className="w-8 h-8" />,
                },
                {
                  step: "3",
                  title: "Nhận Voucher",
                  description:
                    "Sử dụng mã giảm giá ngay cho đơn hàng tiếp theo!",
                  icon: <Trophy className="w-8 h-8" />,
                },
              ].map((step, index) => (
                <motion.div
                  key={index}
                  className="relative text-center"
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.2 }}
                >
                  {/* Connection Line */}
                  {index < 2 && (
                    <div
                      className="hidden md:block absolute top-8 left-full w-full h-0.5 z-0"
                      style={{
                        background:
                          "linear-gradient(to right, #B91C1C, #9CA3AF)",
                      }}
                    ></div>
                  )}

                  <div className="relative z-10 group">
                    <div
                      className="w-20 h-20 sm:w-16 sm:h-16 lg:w-20 lg:h-20 rounded-full flex items-center justify-center text-white text-2xl sm:text-xl lg:text-2xl font-bold mx-auto mb-4 sm:mb-5 lg:mb-6 shadow-2xl transform group-hover:scale-110 transition-all duration-300 border-2 sm:border-4 border-white"
                      style={{
                        background:
                          "linear-gradient(135deg, #74070E 0%, #8A080F 50%, #74070E 100%)",
                        boxShadow: "0 10px 30px rgba(116, 7, 14, 0.3)",
                      }}
                    >
                      {step.step}
                    </div>
                    <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-2xl border border-gray-100 transform group-hover:-translate-y-2 group-hover:shadow-3xl transition-all duration-500 backdrop-blur-sm bg-white/95">
                      <div
                        className="mb-3 sm:mb-4 lg:mb-6 flex justify-center transform group-hover:scale-110 transition-transform duration-300"
                        style={{ color: "#74070E" }}
                      >
                        <div className="scale-110 sm:scale-100">
                          {step.icon}
                        </div>
                      </div>
                      <h3 className="text-lg sm:text-xl lg:text-xl font-bold text-gray-900 mb-2 sm:mb-3 lg:mb-4 group-hover:text-red-800 transition-colors duration-300">
                        {step.title}
                      </h3>
                      <p className="text-sm sm:text-base lg:text-base text-gray-600 leading-relaxed">
                        {step.description}
                      </p>

                      {/* Subtle glow effect on hover */}
                      <div
                        className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-500 -z-10"
                        style={{
                          background:
                            "linear-gradient(135deg, #74070E, #FF6B6B, #74070E)",
                          filter: "blur(20px)",
                        }}
                      ></div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white py-8 sm:py-12 lg:py-16 relative overflow-hidden">
        {/* Footer background effects */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-64 h-64 bg-red-900/20 rounded-full filter blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-gray-700/30 rounded-full filter blur-2xl"></div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <div className="flex items-center justify-center space-x-3 mb-4 sm:mb-6">
              <LogoIcon
                className="h-6 sm:h-8 ml-0 text-white filter drop-shadow-lg"
                fill="#FFFFFF"
              />
            </div>
            <p className="text-gray-300 mb-2 sm:mb-3 text-base sm:text-lg font-medium px-2">
              © {new Date().getFullYear()} SECRET BILL - Thương Hiệu Thời Trang
              Hàng Đầu.
            </p>
            <p className="text-gray-400 max-w-md mx-auto leading-relaxed text-sm sm:text-base px-4">
              Mang đến phong cách thời trang độc đáo với giá cả hấp dẫn nhất
            </p>

            {/* Decorative line */}
            <div className="mt-6 sm:mt-8 flex items-center justify-center">
              <div className="w-16 sm:w-24 h-px bg-gradient-to-r from-transparent via-red-500 to-transparent"></div>
              <div className="mx-3 sm:mx-4 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-red-500 rounded-full"></div>
              <div className="w-16 sm:w-24 h-px bg-gradient-to-r from-transparent via-red-500 to-transparent"></div>
            </div>
          </motion.div>
        </div>
      </footer>

      {/* Custom CSS */}
      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1) rotate(0deg);
          }
          25% {
            transform: translate(30px, -50px) scale(1.1) rotate(90deg);
          }
          50% {
            transform: translate(-20px, 20px) scale(0.9) rotate(180deg);
          }
          75% {
            transform: translate(20px, 30px) scale(1.05) rotate(270deg);
          }
          100% {
            transform: translate(0px, 0px) scale(1) rotate(360deg);
          }
        }

        @keyframes float {
          0%,
          100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-10px) rotate(180deg);
          }
        }

        @keyframes pulse-glow {
          0%,
          100% {
            box-shadow: 0 0 20px rgba(116, 7, 14, 0.3);
          }
          50% {
            box-shadow: 0 0 40px rgba(116, 7, 14, 0.6);
          }
        }

        .animate-blob {
          animation: blob 8s infinite ease-in-out;
        }
        .animation-delay-1000 {
          animation-delay: 1s;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-3000 {
          animation-delay: 3s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }

        /* Enhanced shadow utility */
        .shadow-3xl {
          box-shadow: 0 35px 60px -12px rgba(0, 0, 0, 0.25);
        }

        /* Floating animation for particles */
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }

        /* Glow effect */
        .animate-glow {
          animation: pulse-glow 2s ease-in-out infinite alternate;
        }

        /* Mobile optimization */
        @media (max-width: 320px) {
          .text-5xl {
            font-size: 2.25rem;
          }
          .text-lg {
            font-size: 1rem;
          }
        }

        /* Very small screens optimization */
        @media (max-width: 375px) {
          .py-20 {
            padding-top: 4rem;
            padding-bottom: 4rem;
          }
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
