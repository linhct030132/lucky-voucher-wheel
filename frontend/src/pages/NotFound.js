import React from "react";
import { motion } from "framer-motion";
import { Home, Search, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 max-w-lg w-full text-center"
      >
        {/* 404 Animation */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="mb-8"
        >
          <motion.div
            animate={{
              rotate: [0, 5, -5, 0],
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="text-8xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-4"
          >
            404
          </motion.div>

          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.4 }}
            className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto"
          >
            <AlertCircle className="w-10 h-10 text-red-600" />
          </motion.div>
        </motion.div>

        {/* Content */}
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-3xl font-bold text-gray-900 mb-4"
        >
          Oops! Page Not Found
        </motion.h1>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-gray-600 mb-8"
        >
          The page you're looking for seems to have vanished into the digital
          void. Don't worry, it happens to the best of us!
        </motion.p>

        {/* Suggestions */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="space-y-4 mb-8"
        >
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">
              What you can do:
            </h3>
            <ul className="text-sm text-gray-600 space-y-1 text-left">
              <li>• Check the URL for any typos</li>
              <li>• Go back to the homepage</li>
              <li>• Try the lucky spin game instead!</li>
            </ul>
          </div>
        </motion.div>

        {/* Action buttons */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="space-y-3"
        >
          <Link
            to="/"
            className="inline-flex items-center justify-center w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 transform hover:scale-105"
          >
            <Home className="w-5 h-5 mr-2" />
            Back to Home
          </Link>

          <Link
            to="/spin"
            className="inline-flex items-center justify-center w-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold py-3 px-6 rounded-lg hover:from-orange-600 hover:to-red-600 transition-all duration-200 transform hover:scale-105"
          >
            <Search className="w-5 h-5 mr-2" />
            Try Lucky Spin
          </Link>
        </motion.div>

        {/* Floating elements */}
        <motion.div
          animate={{
            y: [0, -10, 0],
            rotate: [0, 5, -5, 0],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-4 right-4 w-8 h-8 bg-yellow-400 rounded-full opacity-20"
        />

        <motion.div
          animate={{
            y: [0, 15, 0],
            rotate: [0, -5, 5, 0],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
          className="absolute bottom-4 left-4 w-6 h-6 bg-pink-400 rounded-full opacity-20"
        />
      </motion.div>
    </div>
  );
};

export default NotFound;
