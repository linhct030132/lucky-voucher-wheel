import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Gift,
  RotateCcw,
  Users,
  BarChart3,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  Crown,
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
      label: "Quản Lý Lượt Quay",
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
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex flex-col flex-grow bg-white border-r border-gray-200  pb-4 overflow-y-auto">
            {/* Logo */}
            <div className="flex items-center flex-shrink-0 px-10">
              <LogoIcon />
            </div>

            {/* Navigation */}
            <nav className="mt-5 flex-1 px-2 space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isCurrent = isCurrentPath(item.path);

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                      isCurrent
                        ? "bg-indigo-100 text-indigo-900"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    <Icon
                      className={`mr-3 flex-shrink-0 h-6 w-6 ${
                        isCurrent
                          ? "text-indigo-500"
                          : "text-gray-400 group-hover:text-gray-500"
                      }`}
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium">{item.label}</div>
                      <div className="text-xs text-gray-500">
                        {item.description}
                      </div>
                    </div>
                    {isCurrent && (
                      <ChevronRight className="w-4 h-4 text-indigo-500" />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Bottom Actions */}
            <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
              <div className="flex-shrink-0 w-full group block">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-9 h-9 bg-indigo-500 rounded-full flex items-center justify-center">
                      <Settings className="w-5 h-5 text-white" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-700">Admin</p>
                      <p className="text-xs text-gray-500">Quản trị viên</p>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                    title="Đăng xuất"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className="lg:hidden">
        <div className="flex items-center justify-between bg-white px-4 py-2 border-b border-gray-200">
          <div className="flex items-center">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-gray-500 hover:text-gray-900"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="ml-2 flex items-center">
              <div className="scale-50 origin-left">
                <LogoIcon />
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="text-gray-400 hover:text-red-500 transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
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
                className="relative flex-1 flex flex-col max-w-xs w-full bg-white"
              >
                <div className="absolute top-0 right-0 -mr-12 pt-2">
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                  >
                    <X className="h-6 w-6 text-white" />
                  </button>
                </div>
                <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
                  <div className="flex-shrink-0 flex items-center px-4 mb-8">
                    <LogoIcon />
                  </div>
                  <nav className="mt-5 px-2 space-y-1">
                    {menuItems.map((item) => {
                      const Icon = item.icon;
                      const isCurrent = isCurrentPath(item.path);

                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={() => setSidebarOpen(false)}
                          className={`group flex items-center px-2 py-2 text-base font-medium rounded-md ${
                            isCurrent
                              ? "bg-indigo-100 text-indigo-900"
                              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                          }`}
                        >
                          <Icon
                            className={`mr-4 flex-shrink-0 h-6 w-6 ${
                              isCurrent ? "text-indigo-500" : "text-gray-400"
                            }`}
                          />
                          <div>
                            <div>{item.label}</div>
                            <div className="text-sm text-gray-500">
                              {item.description}
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </nav>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Top bar */}
        <div className="relative z-10 flex-shrink-0 flex h-16 bg-white shadow lg:border-b lg:border-gray-200">
          <div className="flex-1 px-4 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
            </div>
            <div className="ml-4 flex items-center md:ml-6">
              <div className="text-sm text-gray-500">
                {new Date().toLocaleDateString("vi-VN", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
