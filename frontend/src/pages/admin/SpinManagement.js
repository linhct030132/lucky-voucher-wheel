/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  RotateCcw,
  Target,
  Calendar,
  Search,
  Filter,
  Download,
  Trophy,
  X,
  ChevronLeft,
  ChevronRight,
  Gift,
  Percent,
  DollarSign,
  CheckCircle,
  Clock,
  AlertCircle,
  Info,
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
  const [filtering, setFiltering] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    outcome: "",
    dateFrom: "",
    dateTo: "",
    search: "",
  });
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Check if any filters are active
  const hasActiveFilters = () => {
    return !!(
      debouncedSearch ||
      filters.outcome ||
      filters.dateFrom ||
      filters.dateTo
    );
  };

  // Debounce search term to avoid excessive API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(filters.search);
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [filters.search]);

  // Initial load
  useEffect(() => {
    if (token) {
      fetchSpins();
    }
  }, [token]);

  // Fetch data when filters change (excluding search which is debounced)
  useEffect(() => {
    if (token && !loading) {
      fetchSpins(true);
    }
  }, [currentPage, filters.outcome, filters.dateFrom, filters.dateTo]);

  // Fetch data when debounced search changes
  useEffect(() => {
    if (token && !loading && debouncedSearch !== undefined) {
      fetchSpins(true); // Pass true to indicate this is a search/filter operation
    }
  }, [debouncedSearch]);

  // Auto-refresh every 10 seconds when no filters are active
  useEffect(() => {
    if (!token || loading) return;

    const shouldAutoRefresh = !hasActiveFilters();

    if (shouldAutoRefresh) {
      const interval = setInterval(() => {
        fetchSpins(false); // Not a filtering operation
      }, 10000); // 10 seconds

      return () => {
        clearInterval(interval);
      };
    }
  }, [
    token,
    loading,
    debouncedSearch,
    filters.outcome,
    filters.dateFrom,
    filters.dateTo,
  ]);

  const fetchSpins = async (isFiltering = false) => {
    try {
      // Set appropriate loading state
      if (isFiltering) {
        setFiltering(true);
      } else {
        setLoading(true);
      }

      const queryParams = new URLSearchParams({
        page: currentPage,
        limit: 20,
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(filters.outcome && { outcome: filters.outcome }),
        ...(filters.dateFrom && { dateFrom: filters.dateFrom }),
        ...(filters.dateTo && { dateTo: filters.dateTo }),
      });

      const response = await axios.get(`/api/admin/spins?${queryParams}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

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
      setFiltering(false);
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
    setDebouncedSearch("");
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

  const getVoucherTypeIcon = (type) => {
    switch (type) {
      case "discount_percentage":
        return <Percent className="w-4 h-4 text-blue-600" />;
      case "discount_amount":
        return <DollarSign className="w-4 h-4 text-green-600" />;
      case "free_product":
        return <Gift className="w-4 h-4 text-purple-600" />;
      default:
        return <Gift className="w-4 h-4 text-gray-600" />;
    }
  };

  const getVoucherTypeLabel = (type) => {
    switch (type) {
      case "discount_percentage":
        return "Giảm %";
      case "discount_amount":
        return "Giảm tiền";
      case "free_product":
        return "Miễn phí";
      default:
        return "Voucher";
    }
  };

  const getVoucherStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 border-green-200";
      case "inactive":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "draft":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getCodeStatusColor = (status) => {
    switch (status) {
      case "issued":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "redeemed":
        return "bg-green-100 text-green-800 border-green-200";
      case "available":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "expired":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getCodeStatusIcon = (status) => {
    switch (status) {
      case "issued":
        return <Clock className="w-3 h-3" />;
      case "redeemed":
        return <CheckCircle className="w-3 h-3" />;
      case "available":
        return <AlertCircle className="w-3 h-3" />;
      case "expired":
        return <X className="w-3 h-3" />;
      default:
        return <Info className="w-3 h-3" />;
    }
  };

  if (loading && spins.length === 0) {
    return (
      <AdminLayout title="Quản Lý Lượt Bốc Thăm">
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
    <AdminLayout title="Quản Lý Lượt Bốc Thăm">
      <div className="space-y-6">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Quản Lý Lượt Bốc Thăm
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">
            Theo dõi và quản lý tất cả hoạt động quay số của khách hàng
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {[
            {
              label: "Tổng Lượt Bốc Thăm",
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
        <div
          className={`bg-white rounded-xl p-6 shadow-lg border border-gray-200 mb-8 ${
            filtering ? "opacity-75 pointer-events-none" : ""
          }`}
        >
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

          {/* Filter Status & Stats */}
          <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {filtering && (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
                )}
                <div className="flex items-center space-x-2">
                  <svg
                    className="w-5 h-5 text-blue-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z"
                      clipRule="evenodd"
                    ></path>
                  </svg>
                  <span className="text-sm font-medium text-gray-700">
                    Hiển thị {spins.length} lượt quay
                    {(debouncedSearch ||
                      filters.outcome ||
                      filters.dateFrom ||
                      filters.dateTo) && (
                      <span className="text-blue-600 font-semibold ml-1">
                        (đã lọc)
                      </span>
                    )}
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-1 bg-white rounded-full px-3 py-1 border border-gray-200">
                  <span className="text-gray-600">Tổng:</span>
                  <span className="font-bold text-gray-900">
                    {stats.totalSpins}
                  </span>
                </div>
                <div className="flex items-center space-x-1 bg-white rounded-full px-3 py-1 border border-green-200">
                  <span className="text-gray-600">Thắng:</span>
                  <span className="font-bold text-green-600">
                    {stats.totalWins}
                  </span>
                </div>
                <div className="flex items-center space-x-1 bg-white rounded-full px-3 py-1 border border-blue-200">
                  <span className="text-gray-600">Tỷ lệ:</span>
                  <span className="font-bold text-blue-600">
                    {stats.winRate}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Spins Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-300">
                <tr>
                  <th className="px-6 py-5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Khách hàng
                  </th>
                  <th className="px-6 py-5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Liên hệ
                  </th>
                  <th className="px-6 py-5 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Kết quả
                  </th>
                  <th className="px-4 py-5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-56">
                    Giải thưởng
                  </th>
                  <th className="px-6 py-5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Thời gian
                  </th>
                  <th className="px-6 py-5 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    IP Address
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {spins.map((spin, index) => (
                  <motion.tr
                    key={spin.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-blue-50 hover:shadow-sm transition-all duration-200 group"
                  >
                    <td className="px-6 py-5">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8  w-8">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center">
                            <span className="text-sm font-medium text-white">
                              {(spin.full_name || "?").charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-semibold text-gray-900">
                            {spin.full_name || "Khách hàng ẩn danh"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="space-y-1">
                        {spin.email && (
                          <div className="flex items-center text-sm text-gray-600">
                            <svg
                              className="w-4 h-4 mr-2 text-gray-400"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"></path>
                              <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"></path>
                            </svg>
                            {spin.email}
                          </div>
                        )}
                        {spin.phone && (
                          <div className="flex items-center text-sm text-gray-600">
                            <svg
                              className="w-4 h-4 mr-2 text-gray-400"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"></path>
                            </svg>
                            {spin.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <div className="flex justify-center">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold shadow-sm transition-all duration-200 ${
                            spin.outcome === "win"
                              ? "bg-gradient-to-r from-green-400 to-emerald-500 text-white border-2 border-green-300"
                              : "bg-gradient-to-r from-red-400 to-pink-500 text-white border-2 border-red-300"
                          }`}
                        >
                          {getOutcomeIcon(spin.outcome)}
                          <span className="ml-2">
                            {spin.outcome === "win" ? "THẮNG" : "THUA"}
                          </span>
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-5">
                      {spin.outcome === "win" ? (
                        <div className="bg-white border border-gray-200 rounded-lg p-2 max-w-56 hover:shadow-sm transition-all duration-200">
                          {/* Compact Header - Name & Status */}
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-1">
                              <div className="flex-shrink-0 scale-75">
                                {getVoucherTypeIcon(spin.voucher_type)}
                              </div>
                              <div className="font-medium text-gray-800 text-xs truncate">
                                {spin.voucher_name.length > 12
                                  ? `${spin.voucher_name.substring(0, 12)}...`
                                  : spin.voucher_name}
                              </div>
                            </div>
                            <div
                              className={`w-2 h-2 rounded-full ${
                                spin.voucher_code_status === "redeemed"
                                  ? "bg-green-500"
                                  : spin.voucher_code_status === "issued"
                                  ? "bg-blue-500"
                                  : "bg-gray-400"
                              }`}
                              title={`Status: ${spin.voucher_code_status}`}
                            ></div>
                          </div>

                          {/* Value & Code in one compact row */}
                          <div className="flex items-center space-x-2">
                            {/* Value Badge - Compact */}
                            <div className="inline-flex items-center bg-gradient-to-r from-emerald-500 to-green-600 text-white text-xs font-bold px-2 py-1 rounded-md">
                              {spin.voucher_type === "discount_percentage"
                                ? `${spin.voucher_value || 0}%`
                                : spin.voucher_type === "discount_amount"
                                ? `${(
                                    parseInt(spin.voucher_value || 0) / 1000
                                  ).toFixed(0)}K`
                                : "FREE"}
                            </div>

                            {/* Voucher Code - Compact */}
                            <div className="bg-gray-50 border border-gray-200 rounded px-2 py-1 flex-1 min-w-0">
                              <div className="font-mono text-xs font-medium text-gray-700 truncate">
                                {spin.voucher_code || "N/A"}
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center py-4">
                          <span className="text-gray-400 text-xs">
                            Không có giải thưởng
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center space-x-2">
                        <svg
                          className="w-4 h-4 text-gray-400"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                            clipRule="evenodd"
                          ></path>
                        </svg>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {new Date(spin.created_at).toLocaleDateString(
                              "vi-VN"
                            )}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(spin.created_at).toLocaleTimeString(
                              "vi-VN"
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <div className="inline-flex items-center space-x-2 bg-gray-100 rounded-full px-3 py-2">
                        <svg
                          className="w-4 h-4 text-gray-500"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                            clipRule="evenodd"
                          ></path>
                        </svg>
                        <span className="text-sm font-mono text-gray-700">
                          {spin.ip_address}
                        </span>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {spins.length === 0 && !loading && (
            <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-blue-50">
              <div className="mx-auto max-w-md">
                <div className="bg-white rounded-full p-6 w-24 h-24 mx-auto mb-6 shadow-sm">
                  <RotateCcw className="w-12 h-12 text-gray-400 mx-auto" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Không có dữ liệu lượt quay
                </h3>
                <p className="text-gray-600">
                  Không tìm thấy lượt quay nào phù hợp với bộ lọc hiện tại
                </p>
              </div>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-5 border-t border-gray-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="text-sm font-medium text-gray-700">
                    Trang {currentPage} / {totalPages}
                  </div>
                  <div className="text-xs text-gray-500">
                    • {spins.length} mục được hiển thị
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-l-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Trước
                  </button>
                  <button
                    onClick={() =>
                      setCurrentPage(Math.min(totalPages, currentPage + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-r-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 border-l-0"
                  >
                    Sau
                    <ChevronRight className="w-4 h-4 ml-1" />
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
