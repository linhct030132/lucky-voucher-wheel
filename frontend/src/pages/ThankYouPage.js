import React from "react";
import { motion } from "framer-motion";
import { CheckCircle, Gift, Sparkles, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const ThankYouPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 max-w-lg w-full text-center relative overflow-hidden"
      >
        {/* Background decorations */}
        <motion.div
          initial={{ rotate: 0 }}
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-16 -right-16 w-32 h-32 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full opacity-10"
        />
        <motion.div
          initial={{ rotate: 360 }}
          animate={{ rotate: 0 }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-16 -left-16 w-40 h-40 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full opacity-10"
        />

        {/* Main content */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 relative"
        >
          <CheckCircle className="w-14 h-14 text-green-600" />
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.2, 1] }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="absolute inset-0 rounded-full border-4 border-green-200"
          />
        </motion.div>

        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-4xl font-bold text-gray-900 mb-4"
        >
          Thank You! 🎉
        </motion.h1>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-xl text-gray-600 mb-8"
        >
          Your participation has been recorded successfully!
        </motion.p>

        {/* Features section */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="space-y-4 mb-8"
        >
          <div className="flex items-center justify-center space-x-3 text-gray-700">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <Gift className="w-5 h-5 text-blue-600" />
            </div>
            <span>Your voucher details have been sent to your email</span>
          </div>

          <div className="flex items-center justify-center space-x-3 text-gray-700">
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-purple-600" />
            </div>
            <span>Keep an eye out for more exciting promotions</span>
          </div>
        </motion.div>

        {/* Call to action */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="space-y-4"
        >
          <Link
            to="/"
            className="inline-flex items-center justify-center w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold py-4 px-6 rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            Back to Home
            <ArrowRight className="w-5 h-5 ml-2" />
          </Link>

          <p className="text-sm text-gray-500">
            Share this experience with your friends and family!
          </p>
        </motion.div>

        {/* Floating particles */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{
              opacity: [0, 1, 0],
              y: [20, -100],
              x: [0, Math.random() * 100 - 50],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: i * 0.5,
              repeatDelay: 2,
            }}
            className="absolute w-2 h-2 bg-yellow-400 rounded-full"
            style={{
              left: `${20 + i * 12}%`,
              bottom: "20%",
            }}
          />
        ))}
      </motion.div>
    </div>
  );
};

export default ThankYouPage;
