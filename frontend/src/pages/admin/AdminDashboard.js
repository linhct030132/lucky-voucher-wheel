import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Gift,
  DollarSign,
  Calendar,
  Eye,
  ArrowUpRight,
  ArrowDownRight,
  Package,
  Target,
  Star,
  Clock,
  Zap,
  Award,
  Activity,
  Percent,
  RefreshCw,
  Download,
  Filter,
  Settings,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  XCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";

const AdminDashboard = () => {
  const { token } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalVouchers: 0,
    totalSpins: 0,
    totalWins: 0,
    totalRevenue: 0,
    conversionRate: 0,
    stockValue: 0,
    recentActivities: [],
    topVouchers: [],
    monthlyStats: [],
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("7");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, [timeRange]);

  const fetchDashboardData = async () => {
    try {
      if (!token) {
        toast.error("Không có token xác thực");
        return;
      }

      setRefreshing(true);

      // Use dedicated stats endpoint if available, otherwise fallback to individual endpoints
      try {
        const statsResponse = await axios.get(
          `${process.env.REACT_APP_API_BASE_URL}/admin/stats`,
          {
            headers: { Authorization: `Bearer ${token}` },
            params: { timeRange },
          }
        );

        if (statsResponse.data.success) {
          setStats(statsResponse.data.data);
          return;
        }
      } catch (statsError) {
        console.log("Stats endpoint not available, using fallback...");
      }

      // Fallback to individual API calls
      const [usersResponse, vouchersResponse, spinsResponse, auditResponse] =
        await Promise.all([
          axios.get(`${process.env.REACT_APP_API_BASE_URL}/admin/users`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${process.env.REACT_APP_API_BASE_URL}/admin/vouchers`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${process.env.REACT_APP_API_BASE_URL}/admin/spins`, {
            headers: { Authorization: `Bearer ${token}` },
            params: { timeRange },
          }),
          axios.get(`${process.env.REACT_APP_API_BASE_URL}/admin/audit-logs`, {
            headers: { Authorization: `Bearer ${token}` },
            params: { limit: 10, timeRange },
          }),
        ]);

      const users = usersResponse.data.users || usersResponse.data.data || [];
      const vouchers = vouchersResponse.data.vouchers || vouchersResponse.data.data || [];
      const spins = spinsResponse.data.spins || spinsResponse.data.data || [];
      const activities = auditResponse.data.logs || auditResponse.data.data || [];

      // Calculate statistics
      const totalWins = spins.filter((spin) => spin.result === "win").length;
      const conversionRate =
        spins.length > 0 ? (totalWins / spins.length) * 100 : 0;

      // Calculate total value of won vouchers
      const totalRevenue = spins
        .filter((spin) => spin.result === "win")
        .reduce((sum, spin) => {
          const voucher = vouchers.find((v) => v.id === spin.voucher_id);
          return sum + (voucher ? parseFloat(voucher.face_value) || 0 : 0);
        }, 0);

      // Get top performing vouchers
      const voucherWins = {};
      spins
        .filter((spin) => spin.result === "win")
        .forEach((spin) => {
          voucherWins[spin.voucher_id] =
            (voucherWins[spin.voucher_id] || 0) + 1;
        });

      const topVouchers = vouchers
        .map((voucher) => ({
          ...voucher,
          wins: voucherWins[voucher.id] || 0,
          winRate:
            voucher.initial_stock > 0
              ? ((voucherWins[voucher.id] || 0) / voucher.initial_stock) * 100
              : 0,
        }))
        .sort((a, b) => b.wins - a.wins)
        .slice(0, 5);

      setStats({
        totalUsers: users.length,
        totalVouchers: vouchers.length,
        totalSpins: spins.length,
        totalWins,
        totalRevenue,
        conversionRate,
        recentActivities: activities,
        topVouchers,
        activeVouchers: vouchers.filter((v) => v.status === "active").length,
        stockValue: vouchers.reduce(
          (sum, v) => sum + v.remaining_stock * parseFloat(v.face_value || 0),
          0
        ),
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Không thể tải dữ liệu dashboard");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

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
    },
    {
      label: "Tổng Voucher",
      value: stats.totalVouchers || 0,
      change: "+8%",
      trend: "up",
      icon: <Gift className="w-6 h-6" />,
      color: "text-purple-600",
      bg: "bg-purple-100",
      gradient: "from-purple-500 to-purple-600",
    },
    {
      label: "Tổng Lượt Quay",
      value: stats.totalSpins || 0,
      change: "+24%",
      trend: "up",
      icon: <Zap className="w-6 h-6" />,
      color: "text-yellow-600",
      bg: "bg-yellow-100",
      gradient: "from-yellow-500 to-yellow-600",
    },
    {
      label: "Tổng Lượt Thắng",
      value: stats.totalWins || 0,
      change: "+18%",
      trend: "up",
      icon: <Award className="w-6 h-6" />,
      color: "text-green-600",
      bg: "bg-green-100",
      gradient: "from-green-500 to-green-600",
    },
    {
      label: "Tỷ Lệ Chuyển Đổi",
      value: `${(stats.conversionRate || 0).toFixed(1)}%`,
      change: "+5.2%",
      trend: "up",
      icon: <Target className="w-6 h-6" />,
      color: "text-indigo-600",
      bg: "bg-indigo-100",
      gradient: "from-indigo-500 to-indigo-600",
    },
    {
      label: "Giá Trị Kho",
      value: `${stats.stockValue?.toFixed(0) || 0}K VND`,
      change: "-3%",
      trend: "down",
      icon: <DollarSign className="w-6 h-6" />,
      color: "text-emerald-600",
      bg: "bg-emerald-100",
      gradient: "from-emerald-500 to-emerald-600",
    },
  ];

  const quickActions = [
    {
      label: "Quản Lý Voucher",
      description: "Tạo và chỉnh sửa voucher",
      icon: <Gift className="w-6 h-6" />,
      link: "/admin/vouchers",
      color: "text-purple-600",
      bg: "bg-purple-100",
      gradient: "from-purple-500 to-purple-600",
    },
    {
      label: "Xem Báo Cáo",
      description: "Phân tích và thông tin chi tiết",
      icon: <BarChart3 className="w-6 h-6" />,
      link: "/admin/reports",
      color: "text-blue-600",
      bg: "bg-blue-100",
      gradient: "from-blue-500 to-blue-600",
    },
    {
      label: "Nhật Ký Kiểm Tra",
      description: "Nhật ký hoạt động hệ thống",
      icon: <Activity className="w-6 h-6" />,
      link: "/admin/audit-logs",
      color: "text-green-600",
      bg: "bg-green-100",
      gradient: "from-green-500 to-green-600",
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
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));

    if (diffInMinutes < 1) return "Vừa xong";
    if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
    if (diffInMinutes < 1440)
      return `${Math.floor(diffInMinutes / 60)} giờ trước`;
    return `${Math.floor(diffInMinutes / 1440)} ngày trước`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <BarChart3 className="w-8 h-8 mr-3 text-indigo-600" />
                Bảng Điều Khiển Quản Trị
              </h1>
              <p className="text-gray-600 mt-2">
                Chào mừng trở lại! Đây là những gì đang xảy ra với hệ thống của
                bạn.
              </p>
            </div>
            <div className="mt-4 sm:mt-0 flex items-center space-x-4">
              {/* Time Range Filter */}
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="1">24 giờ qua</option>
                <option value="7">7 ngày qua</option>
                <option value="30">30 ngày qua</option>
                <option value="90">90 ngày qua</option>
              </select>

              {/* Refresh Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={fetchDashboardData}
                disabled={refreshing}
                className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors flex items-center space-x-2"
              >
                <RefreshCw
                  className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
                />
                <span>Làm mới</span>
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Main Statistics Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"
        >
          {mainStats.map((stat, index) => (
            <motion.div
              key={index}
              whileHover={{ scale: 1.02, y: -5 }}
              className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`${stat.bg} ${stat.color} p-3 rounded-2xl`}>
                    {stat.icon}
                  </div>
                  <div
                    className={`flex items-center text-sm font-medium ${
                      stat.trend === "up" ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {stat.trend === "up" ? (
                      <ArrowUpRight className="w-4 h-4 mr-1" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4 mr-1" />
                    )}
                    {stat.change}
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-1">
                    {typeof stat.value === "number"
                      ? stat.value.toLocaleString()
                      : stat.value}
                  </h3>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                </div>
              </div>
              <div className={`h-2 bg-gradient-to-r ${stat.gradient}`}></div>
            </motion.div>
          ))}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Top Performing Vouchers */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl shadow-lg border border-gray-100"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center">
                    <TrendingUp className="w-6 h-6 mr-2 text-indigo-600" />
                    Voucher Hiệu Suất Cao
                  </h2>
                  <Link
                    to="/admin/vouchers"
                    className="text-indigo-600 hover:text-indigo-700 text-sm font-medium flex items-center"
                  >
                    Xem Tất Cả
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Link>
                </div>

                <div className="space-y-4">
                  {stats.topVouchers.length > 0 ? (
                    stats.topVouchers.map((voucher, index) => (
                      <motion.div
                        key={voucher.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * index }}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center justify-center w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full text-sm font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {voucher.name}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {voucher.voucher_type === "discount_percentage"
                                ? `${voucher.face_value}% OFF`
                                : voucher.voucher_type === "discount_amount"
                                ? `$${voucher.face_value}`
                                : "Free Product"}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-gray-900">
                            {voucher.wins}
                          </div>
                          <div className="text-sm text-gray-600">thắng</div>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Gift className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                      <p>Không có dữ liệu voucher</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Recent Activity */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-2xl shadow-lg border border-gray-100"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center">
                    <Activity className="w-6 h-6 mr-2 text-indigo-600" />
                    Hoạt Động Gần Đây
                  </h2>
                  <Link
                    to="/admin/audit-logs"
                    className="text-indigo-600 hover:text-indigo-700 text-sm font-medium flex items-center"
                  >
                    Xem Tất Cả
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Link>
                </div>

                <div className="space-y-4">
                  {stats.recentActivities.length > 0 ? (
                    stats.recentActivities.map((activity, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * index }}
                        className="flex items-start space-x-3 p-3 rounded-xl hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex-shrink-0 mt-1">
                          {getActivityIcon(activity.action)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900">
                            <span className="font-medium">
                              {activity.user_email || "System"}
                            </span>{" "}
                            <span className="text-gray-600">
                              {activity.details}
                            </span>
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatTimeAgo(activity.timestamp)}
                          </p>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Activity className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                      <p>Không có hoạt động gần đây</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl shadow-lg border border-gray-100"
            >
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <Zap className="w-6 h-6 mr-2 text-indigo-600" />
                  Hành Động Nhanh
                </h2>
                <div className="space-y-4">
                  {quickActions.map((action, index) => (
                    <motion.div
                      key={index}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Link
                        to={action.link}
                        className="block p-4 rounded-xl border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all duration-200 group"
                      >
                        <div className="flex items-center space-x-3">
                          <div
                            className={`${action.bg} ${action.color} p-2 rounded-lg group-hover:scale-110 transition-transform`}
                          >
                            {action.icon}
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900 group-hover:text-indigo-900">
                              {action.label}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {action.description}
                            </p>
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 ml-auto" />
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* System Status */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white rounded-2xl shadow-lg border border-gray-100"
            >
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <Settings className="w-6 h-6 mr-2 text-indigo-600" />
                  Trạng Thái Hệ Thống
                </h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Cơ Sở Dữ Liệu</span>
                    <div className="flex items-center text-green-600">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      <span className="text-sm font-medium">Trực Tuyến</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Dịch Vụ API</span>
                    <div className="flex items-center text-green-600">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      <span className="text-sm font-medium">Trực Tuyến</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      Voucher Đang Hoạt Động
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      {stats.activeVouchers || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Cập Nhật Lần Cuối</span>
                    <span className="text-sm font-medium text-gray-900">
                      {new Date().toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
