import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  Download,
  Filter,
  Calendar,
  TrendingUp,
  TrendingDown,
  Users,
  Gift,
  DollarSign,
  Eye,
  RefreshCw,
  BarChart3,
} from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";

const Reports = () => {
  const { token } = useAuth();
  const [stats, setStats] = useState({
    totalSpins: 0,
    totalWins: 0,
    totalUsers: 0,
    totalVoucherValue: 0,
    winRate: 0,
    todaySpins: 0,
    todayWins: 0,
    weeklyGrowth: 0,
  });
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    to: new Date().toISOString().split("T")[0],
  });
  const [topVouchers, setTopVouchers] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    fetchReports();
  }, [dateRange]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      if (!token) {
        toast.error("Không có token xác thực");
        return;
      }

      // Fetch statistics
      const statsResponse = await axios.get(
        `${process.env.REACT_APP_API_BASE_URL}/admin/reports/stats?from=${dateRange.from}&to=${dateRange.to}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Fetch top performing vouchers
      const vouchersResponse = await axios.get(
        `${process.env.REACT_APP_API_BASE_URL}/admin/reports/top-vouchers?from=${dateRange.from}&to=${dateRange.to}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Fetch recent activity
      const activityResponse = await axios.get(
        `${process.env.REACT_APP_API_BASE_URL}/admin/reports/recent-activity?limit=10`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setStats(statsResponse.data.stats || stats);
      setTopVouchers(vouchersResponse.data.vouchers || []);
      setRecentActivity(activityResponse.data.activities || []);
    } catch (error) {
      console.error("Error fetching reports:", error);
      toast.error("Không thể tải báo cáo");
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async (format) => {
    try {
      if (!token) {
        toast.error("Không có token xác thực");
        return;
      }
      const response = await axios.get(
        `${process.env.REACT_APP_API_BASE_URL}/admin/reports/export?format=${format}&from=${dateRange.from}&to=${dateRange.to}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `bao-cao-${dateRange.from}-${dateRange.to}.${format}`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast.success(`Xuất báo cáo ${format.toUpperCase()} thành công!`);
    } catch (error) {
      console.error("Error exporting report:", error);
      toast.error("Không thể xuất báo cáo");
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải báo cáo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Báo Cáo & Phân Tích
            </h1>
            <p className="text-gray-600">
              Thông tin chi tiết và phân tích cho chương trình quay số may mắn
            </p>
          </div>

          <div className="flex space-x-4">
            <button
              onClick={() => exportReport("csv")}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Xuất CSV</span>
            </button>
            <button
              onClick={() => exportReport("pdf")}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
            >
              <FileText className="w-4 h-4" />
              <span>Xuất PDF</span>
            </button>
          </div>
        </div>

        {/* Date Range Filter */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Khoảng thời gian
            </h3>
            <button
              onClick={fetchReports}
              className="text-blue-600 hover:text-blue-700 flex items-center space-x-1"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Làm mới</span>
            </button>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Từ ngày
              </label>
              <input
                type="date"
                value={dateRange.from}
                onChange={(e) =>
                  setDateRange({ ...dateRange, from: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Đến ngày
              </label>
              <input
                type="date"
                value={dateRange.to}
                onChange={(e) =>
                  setDateRange({ ...dateRange, to: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={fetchReports}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2"
              >
                <Filter className="w-4 h-4" />
                <span>Áp dụng bộ lọc</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-sm p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Tổng lượt quay
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.totalSpins.toLocaleString()}
                </p>
                <p className="text-sm text-green-600 flex items-center">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  Hôm nay: {stats.todaySpins}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <RefreshCw className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg shadow-sm p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Tổng lượt thắng
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.totalWins.toLocaleString()}
                </p>
                <p className="text-sm text-green-600 flex items-center">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  Hôm nay: {stats.todayWins}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Gift className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg shadow-sm p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tỷ lệ thắng</p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.winRate.toFixed(1)}%
                </p>
                <p className="text-sm text-blue-600 flex items-center">
                  <BarChart3 className="w-4 h-4 mr-1" />
                  Tuần này: +{stats.weeklyGrowth.toFixed(1)}%
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-lg shadow-sm p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Tổng người dùng
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.totalUsers.toLocaleString()}
                </p>
                <p className="text-sm text-orange-600 flex items-center">
                  <Users className="w-4 h-4 mr-1" />
                  Người dùng hoạt động
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Top Performing Vouchers and Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-lg shadow-sm p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Phiếu mua hàng được yêu thích nhất
            </h3>

            <div className="space-y-4">
              {topVouchers.map((voucher, index) => (
                <div
                  key={voucher.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-blue-600">
                        #{index + 1}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {voucher.name}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {voucher.face_value}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      {voucher.win_count || 0} lượt
                    </p>
                    <p className="text-sm text-gray-500">Được thắng</p>
                  </div>
                </div>
              ))}

              {topVouchers.length === 0 && (
                <div className="text-center py-8">
                  <Gift className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">
                    Chưa có dữ liệu phiếu mua hàng
                  </p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-lg shadow-sm p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Hoạt động gần đây
            </h3>

            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg"
                >
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Eye className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {activity.user_phone} quay số
                    </p>
                    <p className="text-sm text-gray-500">
                      {activity.result === "win"
                        ? `Trúng: ${activity.voucher_name}`
                        : "Chúc bạn may mắn lần sau"}
                    </p>
                    <p className="text-xs text-gray-400">
                      {formatDate(activity.created_at)}
                    </p>
                  </div>
                </div>
              ))}

              {recentActivity.length === 0 && (
                <div className="text-center py-8">
                  <Eye className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Chưa có hoạt động nào</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
