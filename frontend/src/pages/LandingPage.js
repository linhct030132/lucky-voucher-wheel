import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Gift,
  Sparkles,
  Crown,
  Zap,
  Heart,
  Trophy,
  Target,
  Users,
  ArrowRight,
  CheckCircle,
  Play,
} from "lucide-react";
import LogoIcon from "../components/LogoIcon";

const LandingPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Component initialization effect
  }, []);

  const handleStartSpin = () => {
    navigate("/spin");
  };

  const features = [
    {
      icon: <Gift className="w-8 h-8" />,
      title: "Ưu Đãi Thời Trang Độc Quyền",
      description:
        "Giảm giá sâu cho bộ sưu tập mới, phụ kiện thời trang và miễn phí vận chuyển",
      color: "from-red-500 to-red-600",
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Mã Giảm Giá Ngay Lập Tức",
      description:
        "Nhận mã voucher thời trang ngay sau khi quay và áp dụng luôn",
      color: "from-gray-500 to-gray-600",
    },
    {
      icon: <Heart className="w-8 h-8" />,
      title: "An Toàn & Minh Bạch",
      description:
        "Hệ thống bảo mật thông tin khách hàng và đảm bảo tính công bằng tuyệt đối",
      color: "from-red-400 to-red-500",
    },
    {
      icon: <Crown className="w-8 h-8" />,
      title: "Khách Hàng VIP",
      description:
        "Ưu đãi đặc biệt chỉ dành riêng cho khách hàng thân thiết của Dezus",
      color: "from-gray-600 to-gray-700",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Navigation Header */}
      <nav className="z-50 bg-white/90 backdrop-blur-lg border-b border-gray-200 sticky top-0">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center h-16">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-3"
            >
              <LogoIcon className="h-8 ml-0" />
            </motion.div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-24">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-red-300 to-red-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-gradient-to-r from-gray-300 to-gray-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-32 left-20 w-72 h-72 bg-gradient-to-r from-red-400 to-gray-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <motion.div
                className="inline-flex items-center space-x-2 bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-full text-sm font-medium mb-8"
                whileHover={{ scale: 1.05 }}
              >
                <Sparkles className="w-4 h-4" />
                <span>🎉 Ưu Đãi Thời Trang Mới!</span>
              </motion.div>

              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-gray-900 mb-6">
                <span className="block">Quay Số</span>
                <span className="block bg-gradient-to-r from-red-600 via-gray-700 to-red-700 bg-clip-text text-transparent">
                  Thời Trang Dezus
                </span>
              </h1>

              <p className="text-xl sm:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
                Tham gia vòng quay may mắn Dezus và nhận ngay ưu đãi thời trang
                hấp dẫn! Từ giảm giá lên đến 70% cho bộ sưu tập mới đến miễn phí
                vận chuyển - phong cách mơ ước chỉ cách bạn một lần quay!
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12 sm:mb-16">
                <motion.button
                  onClick={handleStartSpin}
                  className="group relative bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold text-lg px-8 py-4 rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center space-x-3">
                    <Play className="w-6 h-6 group-hover:animate-pulse" />
                    <span>🎯 QUAY NGAY NHẬN ƯU ĐÃI</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-red-700 rounded-2xl blur-xl opacity-50 group-hover:opacity-75 -z-10 animate-pulse"></div>
                </motion.button>

                <motion.div
                  className="text-center sm:text-left"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <div className="flex items-center justify-center sm:justify-start space-x-2 text-green-600 font-medium">
                    <CheckCircle className="w-5 h-5" />
                    <span>100% Miễn Phí Tham Gia</span>
                  </div>
                  <div className="flex items-center justify-center sm:justify-start space-x-2 text-green-600 font-medium">
                    <CheckCircle className="w-5 h-5" />
                    <span>Không Cần Tài Khoản</span>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white/80">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Tại Sao Chọn Dezus Fashion?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Thương hiệu thời trang hàng đầu với những ưu đãi độc quyền và chất
              lượng sản phẩm được khách hàng tin tưởng
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="group relative"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -10 }}
              >
                <div className="bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 group-hover:border-red-200">
                  <div
                    className={`w-16 h-16 bg-gradient-to-r ${feature.color} rounded-2xl flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform duration-300`}
                  >
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Cách Nhận Ưu Đãi
            </h2>
            <p className="text-xl text-gray-600">
              3 bước đơn giản để nhận voucher thời trang Dezus!
            </p>
          </motion.div>

          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
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
                  title: "Quay Số Thần Tài",
                  description:
                    "Nhấn nút quay và khám phá ưu đãi thời trang dành cho bạn",
                  icon: <Target className="w-8 h-8" />,
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
                    <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-gradient-to-r from-red-300 to-gray-400 z-0"></div>
                  )}

                  <div className="relative z-10">
                    <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6 shadow-lg">
                      {step.step}
                    </div>
                    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                      <div className="text-red-600 mb-4 flex justify-center">
                        {step.icon}
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-3">
                        {step.title}
                      </h3>
                      <p className="text-gray-600">{step.description}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-24 bg-gradient-to-r from-red-600 to-gray-800 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto"
          >
            <h2 className="text-4xl lg:text-5xl font-bold mb-6">
              Sẵn Sàng Làm Mới Phong Cách?
            </h2>
            <p className="text-xl mb-12 text-red-100 max-w-2xl mx-auto">
              Không bỏ lỡ cơ hội sở hữu những item thời trang hot trend với giá
              ưu đãi. Mỗi lần quay là một cơ hội để nâng cấp tủ đồ của bạn!
            </p>

            <motion.button
              onClick={handleStartSpin}
              className="bg-white text-red-600 hover:bg-gray-50 font-bold text-xl px-12 py-6 rounded-2xl shadow-2xl transform hover:scale-105 transition-all duration-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="flex items-center space-x-3">
                <Trophy className="w-6 h-6" />
                <span>Khám Phá Bộ Sưu Tập Mới</span>
                <Sparkles className="w-6 h-6" />
              </span>
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <div className="flex items-center justify-center space-x-3 mb-4">
              <LogoIcon className="h-6 ml-0" />
            </div>
            <p className="text-gray-400 mb-2">
              © {new Date().getFullYear()} Dezus Fashion - Thương Hiệu Thời
              Trang Hàng Đầu. Tất cả quyền được bảo lưu.
            </p>
            <p className="text-sm text-gray-500">
              Mang đến phong cách thời trang độc đáo với giá cả hấp dẫn nhất
            </p>
          </motion.div>
        </div>
      </footer>

      {/* Custom CSS */}
      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
