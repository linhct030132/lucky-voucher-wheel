/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  Users,
  Gift,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Package,
  Target,
  Star,
  Clock,
  Zap,
  Award,
  Activity,
  RefreshCw,
  RotateCcw,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  XCircle,
  Trophy,
} from "lucide-react";
import { Link } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import AdminLayout from "../../components/AdminLayout";

const AdminDashboard = () => {
  const { token } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalVouchers: 0,
    totalSpins: 0,
    totalWins: 0,
    todaySpins: 0,
    todayWins: 0,
    conversionRate: 0,
    stockValue: 0,
    topVouchers: [],
    recentActivity: [],
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState("7d");

  useEffect(() => {
    fetchDashboardData();
  }, [token, timeRange]);

  const fetchDashboardData = useCallback(async () => {
    if (!token) return;

    try {
      setLoading(true);

      // Try to get stats from the dedicated stats endpoint first
      try {
        const statsResponse = await axios.get(`/api/admin/stats`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { timeRange },
        });

        if (statsResponse.data.success) {
          const statsData = statsResponse.data.data;

          // Get additional data for topVouchers and recentActivity
          const [vouchersResponse, auditResponse] = await Promise.all([
            axios.get(`/api/admin/vouchers`, {
              headers: { Authorization: `Bearer ${token}` },
            }),
            axios.get(`/api/admin/logs`, {
              headers: { Authorization: `Bearer ${token}` },
              params: { limit: 10 },
            }),
          ]);

          const vouchers =
            vouchersResponse.data.data || vouchersResponse.data.vouchers || [];
          const auditLogs =
            auditResponse.data.data || auditResponse.data.logs || [];

          // Calculate top vouchers based on remaining stock or other metrics
          const topVouchers = vouchers
            .map((voucher) => ({
              ...voucher,
              wins: 0, // Would need spin data to calculate actual wins
              winRate: 0,
            }))
            .sort((a, b) => (b.remaining_stock || 0) - (a.remaining_stock || 0))
            .slice(0, 5);

          setStats({
            totalUsers: statsData.totalUsers || 0,
            totalVouchers: statsData.totalVouchers || 0,
            totalSpins: statsData.totalSpins || 0,
            totalWins: statsData.totalWins || 0,
            todaySpins: statsData.todaySpins || 0,
            todayWins:
              Math.floor(
                statsData.todaySpins *
                  (parseFloat(statsData.redemptionRate) / 100)
              ) || 0,
            conversionRate: parseFloat(statsData.redemptionRate) || 0,
            stockValue: vouchers.reduce(
              (sum, v) => sum + (v.remaining_stock || v.remainingStock || 0),
              0
            ),
            topVouchers,
            recentActivity: auditLogs.slice(0, 8),
          });
          return;
        }
      } catch (statsError) {
        console.log(
          "Stats endpoint not available, using fallback...",
          statsError.message
        );
      }

      // Fallback to individual API calls
      const [usersResponse, vouchersResponse, spinsResponse, auditResponse] =
        await Promise.all([
          axios.get(`/api/admin/users`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`/api/admin/vouchers`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`/api/admin/spins`, {
            headers: { Authorization: `Bearer ${token}` },
            params: { timeRange },
          }),
          axios.get(`/api/admin/logs`, {
            headers: { Authorization: `Bearer ${token}` },
            params: { limit: 10 },
          }),
        ]);

      const users = usersResponse.data.data || usersResponse.data.users || [];
      const vouchers =
        vouchersResponse.data.data || vouchersResponse.data.vouchers || [];
      const spins = spinsResponse.data.data || spinsResponse.data.spins || [];
      const auditLogs =
        auditResponse.data.data || auditResponse.data.logs || [];

      // Debug logging
      console.log("Dashboard API Data:", {
        users: users.length,
        vouchers: vouchers.length,
        spins: spins.length,
        auditLogs: auditLogs.length,
        sampleVoucher: vouchers[0],
        sampleSpin: spins[0],
        sampleLog: auditLogs[0],
      });

      // Calculate wins from spins
      const wins = spins.filter(
        (spin) => spin.outcome === "win" || spin.result === "win"
      );
      const today = new Date().toISOString().split("T")[0];
      const todaySpins = spins.filter(
        (spin) =>
          spin.created_at?.startsWith(today) ||
          spin.createdAt?.startsWith(today)
      );
      const todayWins = todaySpins.filter(
        (spin) => spin.outcome === "win" || spin.result === "win"
      );

      // Calculate voucher statistics
      const voucherWins = {};
      spins
        .filter(
          (spin) =>
            (spin.outcome === "win" || spin.result === "win") &&
            (spin.voucher_id || spin.voucherId)
        )
        .forEach((spin) => {
          const voucherId = spin.voucher_id || spin.voucherId;
          voucherWins[voucherId] = (voucherWins[voucherId] || 0) + 1;
        });

      const topVouchers = vouchers
        .map((voucher) => ({
          ...voucher,
          wins: voucherWins[voucher.id] || 0,
          winRate:
            (voucher.initial_stock || voucher.initialStock) > 0
              ? ((voucherWins[voucher.id] || 0) /
                  (voucher.initial_stock || voucher.initialStock)) *
                100
              : 0,
        }))
        .sort((a, b) => b.wins - a.wins)
        .slice(0, 5);

      setStats({
        totalUsers: users.length,
        totalVouchers: vouchers.length,
        totalSpins: spins.length,
        totalWins: wins.length,
        todaySpins: todaySpins.length,
        todayWins: todayWins.length,
        conversionRate:
          spins.length > 0 ? (wins.length / spins.length) * 100 : 0,
        stockValue: vouchers.reduce(
          (sum, v) => sum + (v.remaining_stock || v.remainingStock || 0),
          0
        ),
        topVouchers,
        recentActivity: auditLogs.slice(0, 8),
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);

      // More specific error handling
      if (error.response?.status === 404) {
        toast.error(
          "Một số endpoint không tồn tại - vui lòng kiểm tra backend"
        );
      } else if (error.response?.status === 401) {
        toast.error("Phiên đăng nhập đã hết hạn");
      } else {
        toast.error("Không thể tải dữ liệu dashboard");
      }

      // Set empty but valid state
      setStats({
        totalUsers: 0,
        totalVouchers: 0,
        totalSpins: 0,
        totalWins: 0,
        todaySpins: 0,
        todayWins: 0,
        conversionRate: 0,
        stockValue: 0,
        topVouchers: [],
        recentActivity: [],
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, timeRange]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const mainStats = [
    {
      label: "Tổng Người Dùng",
      value: stats.totalUsers || 0,
      change: "+12%",
      trend: "up",
      icon: <Users className="w-6 h-6" />,
      color: "text-blue-600",
      bg: "bg-blue-100",
      gradient: "from-blue-500 to-blue-600",
      description: "Người dùng đã tham gia hệ thống",
    },
    {
      label: "Voucher Đã Phát",
      value: stats.totalWins || 0,
      change: "+24%",
      trend: "up",
      icon: <Gift className="w-6 h-6" />,
      color: "text-green-600",
      bg: "bg-green-100",
      gradient: "from-green-500 to-green-600",
      description: "Voucher đã được trao thưởng",
    },
    {
      label: "Tổng Lượt Bốc Thăm",
      value: stats.totalSpins || 0,
      change: "+15%",
      trend: "up",
      icon: <RotateCcw className="w-6 h-6" />,
      color: "text-orange-600",
      bg: "bg-orange-100",
      gradient: "from-orange-500 to-orange-600",
      description: "Lượt tham gia may mắn",
    },
    {
      label: "Tỷ Lệ Thành Công",
      value: `${(stats.conversionRate || 0).toFixed(1)}%`,
      change: "+2.5%",
      trend: "up",
      icon: <Target className="w-6 h-6" />,
      color: "text-purple-600",
      bg: "bg-purple-100",
      gradient: "from-purple-500 to-purple-600",
      description: "Tỷ lệ người chơi trúng thưởng",
    },
  ];

  const todayStats = [
    {
      label: "Hôm Nay",
      value: stats.todaySpins || 0,
      icon: <Calendar className="w-5 h-5" />,
      color: "text-indigo-600",
      suffix: "lượt bốc thắm",
    },
    {
      label: "Thành Công",
      value: stats.todayWins || 0,
      icon: <Award className="w-5 h-5" />,
      color: "text-green-600",
      suffix: "voucher",
    },
    {
      label: "Tích Cực",
      value: stats.totalUsers || 0,
      icon: <Activity className="w-5 h-5" />,
      color: "text-blue-600",
      suffix: "người dùng",
    },
    {
      label: "Kho Voucher",
      value: stats.stockValue || 0,
      icon: <Package className="w-5 h-5" />,
      color: "text-purple-600",
      suffix: "voucher",
    },
  ];

  const quickActions = [
    {
      title: "Quản Lý Voucher",
      description: "Tạo và chỉnh sửa voucher",
      icon: <Gift className="w-6 h-6" />,
      link: "/admin/vouchers",
      color: "text-blue-600",
      bg: "bg-blue-100",
      gradient: "from-blue-500 to-blue-600",
    },
    {
      title: "Xem Lượt Bốc Thăm",
      description: "Theo dõi hoạt động quay số",
      icon: <RotateCcw className="w-6 h-6" />,
      link: "/admin/spins",
      color: "text-purple-600",
      bg: "bg-purple-100",
      gradient: "from-purple-500 to-purple-600",
    },
    {
      title: "Quản Lý Khách Hàng",
      description: "Xem thông tin khách hàng",
      icon: <Users className="w-6 h-6" />,
      link: "/admin/customers",
      color: "text-green-600",
      bg: "bg-green-100",
      gradient: "from-green-500 to-green-600",
    },
    {
      title: "Nhật Ký Hệ Thống",
      description: "Lịch sử hoạt động hệ thống",
      icon: <Activity className="w-6 h-6" />,
      link: "/admin/audit-logs",
      color: "text-orange-600",
      bg: "bg-orange-100",
      gradient: "from-orange-500 to-orange-600",
    },
  ];

  const getActivityIcon = (action) => {
    switch (action) {
      case "create":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "update":
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case "delete":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "login":
        return <Users className="w-4 h-4 text-blue-500" />;
      case "spin":
        return <Zap className="w-4 h-4 text-purple-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getTimeAgo = (timestamp) => {
    if (!timestamp) return "Không xác định";

    const now = new Date();
    const time = new Date(timestamp);

    if (isNaN(time.getTime())) return "Không xác định";

    const diffInMinutes = Math.floor((now - time) / (1000 * 60));

    if (diffInMinutes < 1) return "Vừa xong";
    if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
    if (diffInMinutes < 1440)
      return `${Math.floor(diffInMinutes / 60)} giờ trước`;
    return `${Math.floor(diffInMinutes / 1440)} ngày trước`;
  };

  if (loading) {
    return (
      <AdminLayout title="Dashboard">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Đang tải dashboard...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Dashboard">
      <div className="space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 sm:mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="mb-4 sm:mb-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center">
                <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 mr-2 sm:mr-3 text-indigo-600" />
                <span className="hidden sm:inline">
                  Bảng Điều Khiển Quản Trị
                </span>
                <span className="sm:hidden">Dashboard</span>
              </h1>
              <p className="text-gray-600 mt-2 text-sm sm:text-base">
                Chào mừng trở lại! Hệ thống đang hoạt động tốt.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="bg-white border border-gray-300 rounded-lg px-3 sm:px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="1d">Hôm nay</option>
                <option value="7d">7 ngày</option>
                <option value="30d">30 ngày</option>
                <option value="90d">90 ngày</option>
              </select>
              <button
                onClick={() => {
                  setRefreshing(true);
                  fetchDashboardData();
                }}
                disabled={refreshing}
                className="bg-indigo-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center text-sm disabled:opacity-50"
              >
                <RefreshCw
                  className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
                />
                <span className="hidden sm:inline">Làm mới</span>
                <span className="sm:hidden">Refresh</span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Main Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {mainStats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl p-4 sm:p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className={`${stat.bg} rounded-lg p-2 sm:p-3`}>
                  <div className={stat.color}>{stat.icon}</div>
                </div>
                <div className="flex items-center space-x-1">
                  {stat.trend === "up" ? (
                    <ArrowUpRight className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3 sm:w-4 sm:h-4 text-red-500" />
                  )}
                  <span
                    className={`text-xs sm:text-sm font-medium ${
                      stat.trend === "up" ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {stat.change}
                  </span>
                </div>
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
                  {typeof stat.value === "number"
                    ? stat.value.toLocaleString("vi-VN")
                    : stat.value}
                </h3>
                <p className="text-gray-600 text-sm font-medium">
                  {stat.label}
                </p>
                <p className="text-xs text-gray-500 mt-1 hidden sm:block">
                  {stat.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Today's Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl p-4 sm:p-6 shadow-lg border border-gray-200"
        >
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Star className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-yellow-500" />
            <span className="hidden sm:inline">Thống Kê Nổi Bật Hôm Nay</span>
            <span className="sm:hidden">Hôm Nay</span>
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {todayStats.map((stat, index) => (
              <div
                key={stat.label}
                className="text-center p-3 sm:p-4 bg-gray-50 rounded-lg"
              >
                <div className={`${stat.color} mb-2 flex justify-center`}>
                  {stat.icon}
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {stat.value.toLocaleString("vi-VN")}
                </div>
                <div className="text-sm text-gray-600">{stat.suffix}</div>
                <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-xl p-6 shadow-lg border border-gray-200"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <Zap className="w-6 h-6 mr-2 text-indigo-600" />
              Thao Tác Nhanh
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {quickActions.map((action, index) => (
                <Link key={action.title} to={action.link} className="group">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="p-4 rounded-lg border-2 border-gray-100 hover:border-indigo-200 transition-all duration-200 hover:shadow-lg"
                  >
                    <div className="flex items-start space-x-3">
                      <div
                        className={`${action.bg} rounded-lg p-2 group-hover:scale-110 transition-transform`}
                      >
                        <div className={action.color}>{action.icon}</div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 group-hover:text-indigo-600 transition-colors">
                          {action.title}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {action.description}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-indigo-600 transition-colors" />
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>
          </motion.div>

          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white rounded-xl p-6 shadow-lg border border-gray-200"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <Activity className="w-6 h-6 mr-2 text-green-600" />
              Hoạt Động Gần Đây
            </h2>
            <div className="space-y-4">
              {stats.recentActivity && stats.recentActivity.length > 0 ? (
                stats.recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      {getActivityIcon(activity?.action)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 truncate">
                        {activity?.description ||
                          `${activity?.action || "Hoạt động"} ${
                            activity?.entity_type || ""
                          }`}
                      </p>
                      <p className="text-xs text-gray-500">
                        {getTimeAgo(activity?.created_at)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <Activity className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p>Chưa có hoạt động nào</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Top Vouchers */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white rounded-xl p-6 shadow-lg border border-gray-200"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <Trophy className="w-6 h-6 mr-2 text-yellow-500" />
            Top Voucher Phổ Biến
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.topVouchers && stats.topVouchers.length > 0 ? (
              stats.topVouchers.map((voucher, index) => (
                <div
                  key={voucher?.id || index}
                  className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-gray-900 truncate">
                      {voucher?.name || "Voucher không tên"}
                    </h3>
                    <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                      #{index + 1}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    {voucher?.face_value ||
                      voucher?.faceValue ||
                      voucher?.value ||
                      "Chưa xác định"}
                  </p>
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600 font-medium">
                      {voucher?.wins || 0} lượt thắng
                    </span>
                    <span className="text-gray-500">
                      {(voucher?.winRate || 0).toFixed(1)}% tỷ lệ
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-4 text-gray-500">
                <Gift className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p>Chưa có dữ liệu voucher</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
