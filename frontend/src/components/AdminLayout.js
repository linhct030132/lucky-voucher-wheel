import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Gift,
  RotateCcw,
  Users,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import LogoIcon from "./LogoIcon";
import toast from "react-hot-toast";

const AdminLayout = ({ children, title = "Dashboard" }) => {
  const { logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menuItems = [
    {
      label: "Dashboard",
      path: "/admin/dashboard",
      icon: LayoutDashboard,
      description: "Tổng quan hệ thống",
    },
    {
      label: "Quản Lý Voucher",
      path: "/admin/vouchers",
      icon: Gift,
      description: "Tạo và quản lý voucher",
    },
    {
      label: "Quản Lý Lượt Bốc Thăm",
      path: "/admin/spins",
      icon: RotateCcw,
      description: "Theo dõi hoạt động quay số",
    },
    {
      label: "Quản Lý Khách Hàng",
      path: "/admin/customers",
      icon: Users,
      description: "Thông tin khách hàng",
    },
    {
      label: "Nhật Ký",
      path: "/admin/audit-logs",
      icon: FileText,
      description: "Lịch sử hoạt động",
    },
  ];

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Đăng xuất thành công");
      navigate("/admin/login");
    } catch (error) {
      toast.error("Lỗi đăng xuất");
    }
  };

  const isCurrentPath = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0 sticky top-0 h-screen">
        <div className="flex flex-col w-60 xl:w-64">
          <div className="flex flex-col flex-grow bg-white border-r border-gray-200 pt-4 overflow-y-auto">
            {/* Logo */}
            <div className="flex items-center flex-shrink-0 px-4 lg:px-6">
              <LogoIcon />
            </div>

            {/* Navigation */}
            <nav className="mt-4 flex-1 px-3 space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isCurrent = isCurrentPath(item.path);

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                      isCurrent
                        ? "bg-indigo-50 text-indigo-900 border-l-4 border-indigo-500"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    <Icon
                      className={`mr-3 flex-shrink-0 h-5 w-5 ${
                        isCurrent
                          ? "text-indigo-500"
                          : "text-gray-400 group-hover:text-gray-500"
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {item.label}
                      </div>
                      <div className="text-xs text-gray-500 truncate hidden xl:block mt-0.5">
                        {item.description}
                      </div>
                    </div>
                    {isCurrent && (
                      <ChevronRight className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Bottom Actions */}
            <div className="flex-shrink-0 border-t border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center min-w-0 flex-1">
                  <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <Settings className="w-4 h-4 text-white" />
                  </div>
                  <div className="ml-3 min-w-0">
                    <p className="text-sm font-medium text-gray-700 truncate">
                      Admin
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      Quản trị viên
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0 p-1"
                  title="Đăng xuất"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40">
        <div className="flex items-center justify-between bg-white px-3 sm:px-4 py-2 sm:py-3 border-b border-gray-200 shadow-sm">
          <div className="flex items-center min-w-0 flex-1">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-gray-500 hover:text-gray-900 p-1 mr-2 flex-shrink-0"
            >
              <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <div className="flex items-center min-w-0">
              <div className="scale-75 sm:scale-75 origin-left flex-shrink-0">
                <LogoIcon />
              </div>
              <div className="ml-2 sm:ml-3 min-w-0">
                <h1 className="text-sm sm:text-base font-medium text-gray-900 truncate">
                  {title}
                </h1>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
            <div className="text-xs sm:text-sm text-gray-500 hidden sm:block">
              {new Date().toLocaleDateString("vi-VN", {
                day: "numeric",
                month: "short",
              })}
            </div>
            <button
              onClick={handleLogout}
              className="text-gray-400 hover:text-red-500 transition-colors p-1"
              title="Đăng xuất"
            >
              <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 flex z-40 lg:hidden"
            >
              <div
                className="fixed inset-0 bg-gray-600 bg-opacity-75"
                onClick={() => setSidebarOpen(false)}
              />
              <motion.div
                initial={{ x: -300 }}
                animate={{ x: 0 }}
                exit={{ x: -300 }}
                className="relative flex-1 flex flex-col max-w-xs w-full bg-white shadow-xl"
              >
                <div className="absolute top-0 right-0 -mr-12 pt-2">
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                  >
                    <X className="h-6 w-6 text-white" />
                  </button>
                </div>
                <div className="flex-1 h-0 pt-4 pb-4 overflow-y-auto">
                  <div className="flex-shrink-0 flex items-center px-4 mb-6">
                    <LogoIcon />
                  </div>
                  <nav className="mt-4 px-3 space-y-2">
                    {menuItems.map((item) => {
                      const Icon = item.icon;
                      const isCurrent = isCurrentPath(item.path);

                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={() => setSidebarOpen(false)}
                          className={`group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                            isCurrent
                              ? "bg-indigo-50 text-indigo-900 border-l-4 border-indigo-500"
                              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                          }`}
                        >
                          <Icon
                            className={`mr-3 flex-shrink-0 h-5 w-5 ${
                              isCurrent ? "text-indigo-500" : "text-gray-400"
                            }`}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="truncate font-medium">
                              {item.label}
                            </div>
                            <div className="text-xs text-gray-500 truncate mt-0.5">
                              {item.description}
                            </div>
                          </div>
                          {isCurrent && (
                            <ChevronRight className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                          )}
                        </Link>
                      );
                    })}
                  </nav>
                </div>

                {/* Mobile bottom section */}
                <div className="flex-shrink-0 border-t border-gray-200 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center min-w-0">
                      <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <Settings className="w-4 h-4 text-white" />
                      </div>
                      <div className="ml-3 min-w-0">
                        <p className="text-sm font-medium text-gray-700 truncate">
                          Admin
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          Quản trị viên
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0 p-1"
                      title="Đăng xuất"
                    >
                      <LogOut className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0 lg:overflow-hidden">
        {/* Top bar - only show on desktop */}
        <div className="hidden lg:flex relative z-10 flex-shrink-0 h-14 xl:h-16 bg-white shadow border-b border-gray-200 items-center">
          <div className="flex-1 px-6 lg:px-8 flex justify-between items-center">
            <div className="min-w-0 flex-1">
              <h1 className="text-lg xl:text-xl font-semibold text-gray-900 truncate">
                {title}
              </h1>
            </div>
            <div className="ml-4 flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                {new Date().toLocaleDateString("vi-VN", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none pt-24 lg:pt-0">
          <div className="py-3 sm:py-4 lg:py-6">
            <div className="max-w-full mx-auto px-3 sm:px-4 lg:px-6 xl:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
