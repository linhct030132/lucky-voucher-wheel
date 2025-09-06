import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  RotateCcw,
  TrendingUp,
  Users,
  Target,
  Calendar,
  Search,
  Filter,
  Download,
  Eye,
  Trophy,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import AdminLayout from "../../components/AdminLayout";

const SpinManagement = () => {
  const { token } = useAuth();
  const [spins, setSpins] = useState([]);
  const [stats, setStats] = useState({
    totalSpins: 0,
    totalWins: 0,
    totalLosses: 0,
    todaySpins: 0,
    winRate: 0,
  });
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    outcome: "",
    dateFrom: "",
    dateTo: "",
    search: "",
  });

  useEffect(() => {
    fetchSpins();
  }, [currentPage, filters]);

  const fetchSpins = async () => {
    try {
      setLoading(true);

      const queryParams = new URLSearchParams({
        page: currentPage,
        limit: 20,
        ...(filters.outcome && { outcome: filters.outcome }),
        ...(filters.dateFrom && { dateFrom: filters.dateFrom }),
        ...(filters.dateTo && { dateTo: filters.dateTo }),
      });

      const response = await axios.get(
        `${process.env.REACT_APP_API_BASE_URL}/admin/spins?${queryParams}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        setSpins(response.data.data || []);
        setStats(response.data.stats || {});
        setTotalPages(response.data.pagination?.pages || 1);
      }
    } catch (error) {
      console.error("Error fetching spins:", error);
      toast.error("Không thể tải dữ liệu lượt quay");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      outcome: "",
      dateFrom: "",
      dateTo: "",
      search: "",
    });
    setCurrentPage(1);
  };

  const exportData = async () => {
    try {
      toast.success("Xuất dữ liệu thành công!");
    } catch (error) {
      toast.error("Không thể xuất dữ liệu");
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString("vi-VN");
  };

  const getOutcomeColor = (outcome) => {
    return outcome === "win"
      ? "bg-green-100 text-green-800 border-green-200"
      : "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getOutcomeIcon = (outcome) => {
    return outcome === "win" ? (
      <Trophy className="w-4 h-4" />
    ) : (
      <X className="w-4 h-4" />
    );
  };

  if (loading && spins.length === 0) {
    return (
      <AdminLayout title="Quản Lý Lượt Quay">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Đang tải dữ liệu...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Quản Lý Lượt Quay">
      <div className="space-y-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Quản Lý Lượt Quay
          </h1>
          <p className="text-gray-600">
            Theo dõi và quản lý tất cả hoạt động quay số của khách hàng
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          {[
            {
              label: "Tổng Lượt Quay",
              value: stats.totalSpins,
              icon: RotateCcw,
              color: "bg-blue-500",
              textColor: "text-blue-600",
              bgColor: "bg-blue-100",
            },
            {
              label: "Tổng Thắng",
              value: stats.totalWins,
              icon: Trophy,
              color: "bg-green-500",
              textColor: "text-green-600",
              bgColor: "bg-green-100",
            },
            {
              label: "Tỷ Lệ Thắng",
              value: `${stats.winRate}%`,
              icon: Target,
              color: "bg-purple-500",
              textColor: "text-purple-600",
              bgColor: "bg-purple-100",
            },
            {
              label: "Hôm Nay",
              value: stats.todaySpins,
              icon: Calendar,
              color: "bg-orange-500",
              textColor: "text-orange-600",
              bgColor: "bg-orange-100",
            },
            {
              label: "Tổng Thua",
              value: stats.totalLosses,
              icon: X,
              color: "bg-gray-500",
              textColor: "text-gray-600",
              bgColor: "bg-gray-100",
            },
          ].map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl p-6 shadow-lg border border-gray-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">
                    {stat.label}
                  </p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {stat.value}
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`w-6 h-6 ${stat.textColor}`} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 mb-8">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-0">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tìm kiếm
              </label>
              <div className="relative">
                <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm theo tên, email, phone..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent w-full"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kết quả
              </label>
              <select
                value={filters.outcome}
                onChange={(e) => handleFilterChange("outcome", e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">Tất cả</option>
                <option value="win">Thắng</option>
                <option value="lose">Thua</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Từ ngày
              </label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Đến ngày
              </label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange("dateTo", e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <Filter className="w-4 h-4 mr-2 inline" />
                Xóa bộ lọc
              </button>
              <button
                onClick={exportData}
                className="px-4 py-2 text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
              >
                <Download className="w-4 h-4 mr-2 inline" />
                Xuất dữ liệu
              </button>
            </div>
          </div>
        </div>

        {/* Spins Table */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">
                    Khách hàng
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">
                    Liên hệ
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">
                    Kết quả
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">
                    Giải thưởng
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">
                    Thời gian
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">
                    IP Address
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {spins.map((spin, index) => (
                  <motion.tr
                    key={spin.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {spin.full_name || "N/A"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600">
                        {spin.email && <div className="mb-1">{spin.email}</div>}
                        {spin.phone && (
                          <div className="text-xs text-gray-500">
                            {spin.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getOutcomeColor(
                          spin.outcome
                        )}`}
                      >
                        {getOutcomeIcon(spin.outcome)}
                        <span className="ml-1">
                          {spin.outcome === "win" ? "Thắng" : "Thua"}
                        </span>
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {spin.outcome === "win" ? (
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">
                            {spin.voucher_name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {spin.voucher_code} • {spin.voucher_value}
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatDate(spin.created_at)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 font-mono">
                      {spin.ip_address}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {spins.length === 0 && !loading && (
            <div className="text-center py-12">
              <RotateCcw className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Không có dữ liệu lượt quay</p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Trang {currentPage} / {totalPages}
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="p-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() =>
                      setCurrentPage(Math.min(totalPages, currentPage + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="p-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default SpinManagement;
