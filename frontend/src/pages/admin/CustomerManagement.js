/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Search,
  Filter,
  Download,
  Eye,
  Calendar,
  Mail,
  Phone,
  Trophy,
  X,
  ChevronLeft,
  ChevronRight,
  User,
  Activity,
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import AdminLayout from "../../components/AdminLayout";
import ExportModal from "../../components/ExportModal";

const CustomerManagement = () => {
  const { token } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerSpins, setCustomerSpins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [spinLoading, setSpinLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    search: "",
    dateFrom: "",
    dateTo: "",
    activityStatus: "all", // all, active, inactive
  });
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filtering, setFiltering] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      setFiltering(true);

      const queryParams = new URLSearchParams({
        page: currentPage,
        limit: 20,
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(filters.dateFrom && { dateFrom: filters.dateFrom }),
        ...(filters.dateTo && { dateTo: filters.dateTo }),
        ...(filters.activityStatus !== "all" && {
          activityStatus: filters.activityStatus,
        }),
      });

      const response = await axios.get(`/api/admin/users?${queryParams}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setCustomers(response.data.data || []);
        setTotalPages(response.data.pagination?.pages || 1);
      }
    } catch (error) {
      console.error("Error fetching customers:", error);
      toast.error("Không thể tải danh sách khách hàng");
    } finally {
      setLoading(false);
      setFiltering(false);
    }
  }, [
    currentPage,
    debouncedSearch,
    filters.dateFrom,
    filters.dateTo,
    filters.activityStatus,
    token,
  ]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const fetchCustomerSpins = async (customerId) => {
    try {
      setSpinLoading(true);

      const response = await axios.get(
        `/api/admin/spins?userId=${customerId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        setCustomerSpins(response.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching customer spins:", error);
      toast.error("Không thể tải lịch sử quay của khách hàng");
    } finally {
      setSpinLoading(false);
    }
  };

  const handleViewCustomer = (customer) => {
    setSelectedCustomer(customer);
    setIsModalOpen(true);
    fetchCustomerSpins(customer.id);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCustomer(null);
    setCustomerSpins([]);
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(filters.search);
    }, 500);
    return () => clearTimeout(timer);
  }, [filters.search]);

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isModalOpen) {
        handleCloseModal();
      }
    };

    if (isModalOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden"; // Prevent background scroll
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isModalOpen]);

  const clearFilters = () => {
    setFilters({
      search: "",
      dateFrom: "",
      dateTo: "",
      activityStatus: "all",
    });
    setDebouncedSearch("");
    setCurrentPage(1);
  };

  const handleShowExportModal = () => {
    setShowExportModal(true);
  };

  const handleCloseExportModal = () => {
    setShowExportModal(false);
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

  const getCustomerStatus = (lastActivity) => {
    if (!lastActivity)
      return {
        status: "new",
        label: "Mới",
        color: "bg-blue-100 text-blue-800",
      };

    const daysSinceActivity = Math.floor(
      (new Date() - new Date(lastActivity)) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceActivity <= 7) {
      return {
        status: "active",
        label: "Hoạt động",
        color: "bg-green-100 text-green-800",
      };
    } else if (daysSinceActivity <= 30) {
      return {
        status: "idle",
        label: "Ít hoạt động",
        color: "bg-yellow-100 text-yellow-800",
      };
    } else {
      return {
        status: "inactive",
        label: "Không hoạt động",
        color: "bg-gray-100 text-gray-800",
      };
    }
  };

  const getCustomerInitials = (name) => {
    if (!name) return "?";
    const parts = name.split(" ");
    return parts.length > 1
      ? `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(
          0
        )}`.toUpperCase()
      : name.charAt(0).toUpperCase();
  };

  if (loading && customers.length === 0) {
    return (
      <AdminLayout title="Quản Lý Khách Hàng">
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
    <AdminLayout title="Quản Lý Khách Hàng">
      <div className="space-y-6">
        {/* Enhanced Filters */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div
            className={`transition-opacity duration-200 ${
              filtering ? "opacity-75" : "opacity-100"
            }`}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Search */}
              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Search className="w-4 h-4 inline mr-1" />
                  Tìm kiếm khách hàng
                </label>
                <div className="relative">
                  <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Tìm theo tên, email, số điện thoại..."
                    value={filters.search}
                    onChange={(e) =>
                      handleFilterChange("search", e.target.value)
                    }
                    className="pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full text-sm shadow-sm"
                  />
                  {filtering && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    </div>
                  )}
                </div>
              </div>

              {/* Activity Status */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Activity className="w-4 h-4 inline mr-1" />
                  Trạng thái
                </label>
                <select
                  value={filters.activityStatus}
                  onChange={(e) =>
                    handleFilterChange("activityStatus", e.target.value)
                  }
                  className="px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full text-sm shadow-sm"
                >
                  <option value="all">Tất cả</option>
                  <option value="active">Hoạt động</option>
                  <option value="idle">Ít hoạt động</option>
                  <option value="inactive">Không hoạt động</option>
                  <option value="new">Khách hàng mới</option>
                </select>
              </div>

              {/* Date From */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Từ ngày
                </label>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) =>
                    handleFilterChange("dateFrom", e.target.value)
                  }
                  className="px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full text-sm shadow-sm"
                />
              </div>

              {/* Date To */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Đến ngày
                </label>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => handleFilterChange("dateTo", e.target.value)}
                  className="px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full text-sm shadow-sm"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between mt-6">
              <div className="flex items-center space-x-2">
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm font-medium"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Xóa bộ lọc
                </button>
              </div>
              <button
                onClick={handleShowExportModal}
                className="inline-flex items-center px-4 py-2 text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-lg transition-all text-sm font-medium shadow-sm"
              >
                <Download className="w-4 h-4 mr-2" />
                Xuất dữ liệu
              </button>
            </div>
          </div>

          {/* Filter Status */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2">
                {filtering && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                )}
                <span className="text-gray-600">
                  Hiển thị {customers.length} khách hàng
                  {(debouncedSearch ||
                    filters.activityStatus !== "all" ||
                    filters.dateFrom ||
                    filters.dateTo) && (
                    <span className="text-blue-600 font-semibold ml-1">
                      (đã lọc)
                    </span>
                  )}
                </span>
              </div>
              <div className="text-gray-500">
                Trang {currentPage} / {totalPages}
              </div>
            </div>
          </div>
        </div>

        {/* Customer List */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-300 bg-gradient-to-r from-gray-50 to-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">
                <Users className="w-5 h-5 inline mr-2" />
                Danh Sách Khách Hàng ({customers.length})
              </h3>
              <div className="text-sm text-gray-600">
                {
                  customers.filter(
                    (c) =>
                      getCustomerStatus(c.last_activity).status === "active"
                  ).length
                }{" "}
                đang hoạt động
              </div>
            </div>
          </div>

          <div className="overflow-hidden">
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
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
                      Trạng thái
                    </th>
                    <th className="px-6 py-5 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Thống kê
                    </th>
                    <th className="px-6 py-5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Tham gia
                    </th>
                    <th className="px-6 py-5 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {customers.map((customer, index) => {
                    const status = getCustomerStatus(customer.last_activity);
                    return (
                      <motion.tr
                        key={customer.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="hover:bg-blue-50 hover:shadow-sm transition-all duration-200 group"
                      >
                        {/* Customer Info */}
                        <td className="px-6 py-5">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8">
                              <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center shadow-sm">
                                <span className="text-sm font-bold text-white">
                                  {getCustomerInitials(customer.full_name)}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-bold text-gray-900">
                                {customer.full_name || "Khách hàng ẩn danh"}
                              </div>
                              <div className="text-xs text-gray-500">
                                ID: {customer.id.substring(0, 8)}...
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Contact Info */}
                        <td className="px-6 py-5">
                          <div className="space-y-1">
                            {customer.email && (
                              <div className="flex items-center text-sm text-gray-600">
                                <Mail className="w-4 h-4 mr-2 text-gray-400" />
                                <span className="truncate">
                                  {customer.email}
                                </span>
                              </div>
                            )}
                            {customer.phone && (
                              <div className="flex items-center text-sm text-gray-600">
                                <Phone className="w-4 h-4 mr-2 text-gray-400" />
                                <span>{customer.phone}</span>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-5 text-center">
                          <div className="flex flex-col items-center space-y-2">
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${status.color}`}
                            >
                              <div
                                className={`w-2 h-2 rounded-full mr-2 ${
                                  status.status === "active"
                                    ? "bg-green-500"
                                    : status.status === "idle"
                                    ? "bg-yellow-500"
                                    : status.status === "new"
                                    ? "bg-blue-500"
                                    : "bg-gray-500"
                                }`}
                              ></div>
                              {status.label}
                            </span>
                            {customer.last_activity && (
                              <div className="text-xs text-gray-500">
                                {Math.floor(
                                  (new Date() -
                                    new Date(customer.last_activity)) /
                                    (1000 * 60 * 60 * 24)
                                )}{" "}
                                ngày trước
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Statistics */}
                        <td className="px-6 py-5 text-center">
                          <div className="space-y-2">
                            <div className="flex items-center justify-center space-x-3">
                              <div className="text-center">
                                <div className="text-sm font-bold text-gray-900">
                                  {customer.activity_count || 0}
                                </div>
                                <div className="text-xs text-gray-500">
                                  Lượt quay
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center justify-center">
                              <Activity className="w-4 h-4 text-blue-500 mr-1" />
                              <span className="text-xs text-gray-600">
                                {customer.activity_count > 0
                                  ? "Đã tham gia"
                                  : "Chưa quay"}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Join Date */}
                        <td className="px-6 py-5">
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {new Date(
                                  customer.first_activity
                                ).toLocaleDateString("vi-VN")}
                              </div>
                              <div className="text-xs text-gray-500">
                                {new Date(
                                  customer.first_activity
                                ).toLocaleTimeString("vi-VN")}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-5 text-center">
                          <button
                            onClick={() => handleViewCustomer(customer)}
                            className="inline-flex items-center px-3 py-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-sm font-medium rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-sm"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Chi tiết
                          </button>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden space-y-3 p-4">
              {customers.map((customer, index) => (
                <motion.div
                  key={customer.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center flex-1 min-w-0">
                      <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div className="ml-3 min-w-0 flex-1">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {customer.full_name || "N/A"}
                        </div>
                        <div className="text-xs text-gray-500 flex items-center mt-1">
                          <Activity className="w-3 h-3 mr-1 text-gray-400" />
                          {customer.activity_count || 0} lượt quay
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleViewCustomer(customer)}
                      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 hover:bg-indigo-200 transition-colors flex-shrink-0 ml-2"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Chi tiết
                    </button>
                  </div>

                  <div className="space-y-2">
                    {customer.email && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Mail className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
                        <span className="truncate">{customer.email}</span>
                      </div>
                    )}
                    {customer.phone && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Phone className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
                        <span className="truncate">{customer.phone}</span>
                      </div>
                    )}
                    {customer.last_activity && (
                      <div className="flex items-center text-xs text-gray-500">
                        <Calendar className="w-3 h-3 mr-2 text-gray-400 flex-shrink-0" />
                        Lần cuối: {formatDate(customer.last_activity)}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {customers.length === 0 && !loading && (
            <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-blue-50">
              <div className="mx-auto max-w-md">
                <div className="bg-white rounded-full p-6 w-24 h-24 mx-auto mb-6 shadow-sm">
                  <Users className="w-12 h-12 text-gray-400 mx-auto" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Không có khách hàng
                </h3>
                <p className="text-gray-600">
                  Không tìm thấy khách hàng nào phù hợp với bộ lọc hiện tại
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
                    • {customers.length} khách hàng được hiển thị
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

        {/* Customer Detail Modal */}
        {isModalOpen && selectedCustomer && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={handleCloseModal}
          >
            <div
              className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="px-6 py-5 border-b border-gray-300 bg-gradient-to-r from-gray-50 to-gray-100 flex items-center justify-between">
                <div className="flex items-center">
                  <User className="w-5 h-5 text-gray-700 mr-2" />
                  <h3 className="text-lg font-bold text-gray-900">
                    Chi Tiết Khách Hàng
                  </h3>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
                {/* Customer Info */}
                <div className="mb-6">
                  <div className="text-center mb-6">
                    <div className="w-20 h-20 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <span className="text-xl font-bold text-white">
                        {getCustomerInitials(selectedCustomer.full_name)}
                      </span>
                    </div>
                    <h4 className="text-xl font-bold text-gray-900 mb-2">
                      {selectedCustomer.full_name || "Khách hàng ẩn danh"}
                    </h4>
                    <div className="flex items-center justify-center">
                      {(() => {
                        const status = getCustomerStatus(
                          selectedCustomer.last_activity
                        );
                        return (
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${status.color}`}
                          >
                            <div
                              className={`w-2 h-2 rounded-full mr-2 ${
                                status.status === "active"
                                  ? "bg-green-500"
                                  : status.status === "idle"
                                  ? "bg-yellow-500"
                                  : status.status === "new"
                                  ? "bg-blue-500"
                                  : "bg-gray-500"
                              }`}
                            ></div>
                            {status.label}
                          </span>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Customer Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                      <div className="text-3xl font-bold text-blue-600">
                        {selectedCustomer.activity_count || 0}
                      </div>
                      <div className="text-sm text-blue-700">Lượt quay</div>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                      <div className="text-3xl font-bold text-green-600">
                        {selectedCustomer.last_activity
                          ? Math.floor(
                              (new Date() -
                                new Date(selectedCustomer.last_activity)) /
                                (1000 * 60 * 60 * 24)
                            )
                          : 0}
                      </div>
                      <div className="text-sm text-green-700">Ngày trước</div>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {selectedCustomer.email && (
                      <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                        <Mail className="w-5 h-5 mr-3 text-gray-400 flex-shrink-0" />
                        <div className="min-w-0">
                          <div className="text-xs text-gray-500 mb-1">
                            Email
                          </div>
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {selectedCustomer.email}
                          </div>
                        </div>
                      </div>
                    )}
                    {selectedCustomer.phone && (
                      <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                        <Phone className="w-5 h-5 mr-3 text-gray-400 flex-shrink-0" />
                        <div>
                          <div className="text-xs text-gray-500 mb-1">
                            Số điện thoại
                          </div>
                          <div className="text-sm font-medium text-gray-900">
                            {selectedCustomer.phone}
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center p-4 bg-gray-50 rounded-lg md:col-span-2">
                      <Calendar className="w-5 h-5 mr-3 text-gray-400 flex-shrink-0" />
                      <div>
                        <div className="text-xs text-gray-500 mb-1">
                          Ngày tham gia
                        </div>
                        <div className="text-sm font-medium text-gray-900">
                          {selectedCustomer.first_activity
                            ? formatDate(selectedCustomer.first_activity)
                            : "N/A"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Spin History */}
                <div>
                  <h5 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                    <Trophy className="w-5 h-5 mr-2 text-yellow-600" />
                    Lịch Sử Bốc Thăm Số
                  </h5>

                  {spinLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="text-gray-600 mt-2">Đang tải lịch sử...</p>
                    </div>
                  ) : customerSpins.length > 0 ? (
                    <div className="space-y-3 max-h-80 overflow-y-auto">
                      {customerSpins.map((spin, index) => (
                        <div
                          key={spin.id}
                          className="p-4 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getOutcomeColor(
                                spin.outcome
                              )}`}
                            >
                              {getOutcomeIcon(spin.outcome)}
                              <span className="ml-2">
                                {spin.outcome === "win" ? "Thắng" : "Thua"}
                              </span>
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatDate(spin.created_at)}
                            </span>
                          </div>

                          {spin.outcome === "win" && spin.voucher_name && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                              <div className="font-medium text-gray-900 mb-1">
                                🎁 {spin.voucher_name}
                              </div>
                              <div className="text-sm text-gray-600">
                                <span className="font-mono bg-gray-100 px-2 py-1 rounded text-xs">
                                  {spin.voucher_code}
                                </span>
                                <span className="ml-2">
                                  • {spin.voucher_value}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">Chưa có lượt quay nào</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Export Modal */}
        <ExportModal
          isOpen={showExportModal}
          onClose={handleCloseExportModal}
          token={token}
          exportType="customers"
          currentFilters={{
            search: debouncedSearch,
            activityStatus: filters.activityStatus,
            dateFrom: filters.dateFrom,
            dateTo: filters.dateTo,
          }}
          title="Xuất Dữ Liệu Khách Hàng"
        />
      </div>
    </AdminLayout>
  );
};

export default CustomerManagement;
