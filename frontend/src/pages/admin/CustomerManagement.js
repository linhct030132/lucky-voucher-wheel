import React, { useState, useEffect } from "react";
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
  RotateCcw,
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

const CustomerManagement = () => {
  const { token } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerSpins, setCustomerSpins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [spinLoading, setSpinLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    search: "",
    dateFrom: "",
    dateTo: "",
  });

  useEffect(() => {
    fetchCustomers();
  }, [currentPage, filters]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);

      const queryParams = new URLSearchParams({
        page: currentPage,
        limit: 20,
        ...(filters.search && { search: filters.search }),
        ...(filters.dateFrom && { dateFrom: filters.dateFrom }),
        ...(filters.dateTo && { dateTo: filters.dateTo }),
      });

      const response = await axios.get(
        `${process.env.REACT_APP_API_BASE_URL}/admin/users?${queryParams}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        setCustomers(response.data.data || []);
        setTotalPages(response.data.pagination?.pages || 1);
      }
    } catch (error) {
      console.error("Error fetching customers:", error);
      toast.error("Không thể tải danh sách khách hàng");
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerSpins = async (customerId) => {
    try {
      setSpinLoading(true);

      const response = await axios.get(
        `${process.env.REACT_APP_API_BASE_URL}/admin/spins?userId=${customerId}`,
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
    fetchCustomerSpins(customer.id);
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      dateFrom: "",
      dateTo: "",
    });
    setCurrentPage(1);
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
        {/* Filters */}
        <div className="bg-white rounded-xl p-4 lg:p-6 shadow-lg border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            <div className="md:col-span-2 lg:col-span-2 xl:col-span-2">
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
                Từ ngày
              </label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent w-full"
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
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent w-full"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-2 md:col-span-2 lg:col-span-4 xl:col-span-1">
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm"
              >
                <Filter className="w-4 h-4 mr-2 inline" />
                Xóa bộ lọc
              </button>
              <button
                onClick={() => toast.success("Xuất dữ liệu thành công!")}
                className="px-4 py-2 text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
              >
                <Download className="w-4 h-4 mr-2 inline" />
                Xuất dữ liệu
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Customer List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Danh Sách Khách Hàng
                </h3>
              </div>

              <div className="overflow-x-auto">
                {/* Desktop Table View */}
                <div className="hidden lg:block">
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
                          Hoạt động
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">
                          Lần cuối
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">
                          Hành động
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {customers.map((customer, index) => (
                        <motion.tr
                          key={customer.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="hover:bg-gray-50"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                                <User className="w-5 h-5 text-indigo-600" />
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-medium text-gray-900">
                                  {customer.full_name || "N/A"}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-600">
                              {customer.email && (
                                <div className="flex items-center mb-1">
                                  <Mail className="w-4 h-4 mr-1 text-gray-400" />
                                  {customer.email}
                                </div>
                              )}
                              {customer.phone && (
                                <div className="flex items-center text-xs text-gray-500">
                                  <Phone className="w-4 h-4 mr-1 text-gray-400" />
                                  {customer.phone}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-600">
                              <div className="flex items-center">
                                <Activity className="w-4 h-4 mr-1 text-gray-400" />
                                {customer.activity_count || 0} lượt quay
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {customer.last_activity
                              ? formatDate(customer.last_activity)
                              : "N/A"}
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => handleViewCustomer(customer)}
                              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 hover:bg-indigo-200 transition-colors"
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Xem chi tiết
                            </button>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="lg:hidden space-y-4">
                  {customers.map((customer, index) => (
                    <motion.div
                      key={customer.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-indigo-600" />
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {customer.full_name || "N/A"}
                            </div>
                            <div className="text-xs text-gray-500">
                              {customer.activity_count || 0} lượt quay
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleViewCustomer(customer)}
                          className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 hover:bg-indigo-200 transition-colors"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Chi tiết
                        </button>
                      </div>

                      <div className="space-y-2">
                        {customer.email && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Mail className="w-4 h-4 mr-2 text-gray-400" />
                            <span className="truncate">{customer.email}</span>
                          </div>
                        )}
                        {customer.phone && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Phone className="w-4 h-4 mr-2 text-gray-400" />
                            {customer.phone}
                          </div>
                        )}
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                          {customer.last_activity
                            ? formatDate(customer.last_activity)
                            : "Chưa có hoạt động"}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {customers.length === 0 && !loading && (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Không có dữ liệu khách hàng</p>
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
                        onClick={() =>
                          setCurrentPage(Math.max(1, currentPage - 1))
                        }
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

          {/* Customer Detail */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Chi Tiết Khách Hàng
                </h3>
              </div>

              {selectedCustomer ? (
                <div className="p-6">
                  {/* Customer Info */}
                  <div className="mb-6">
                    <div className="flex items-center mb-4">
                      <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-indigo-600" />
                      </div>
                      <div className="ml-3">
                        <h4 className="text-lg font-medium text-gray-900">
                          {selectedCustomer.full_name || "N/A"}
                        </h4>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {selectedCustomer.email && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Mail className="w-4 h-4 mr-2 text-gray-400" />
                          {selectedCustomer.email}
                        </div>
                      )}
                      {selectedCustomer.phone && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Phone className="w-4 h-4 mr-2 text-gray-400" />
                          {selectedCustomer.phone}
                        </div>
                      )}
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                        Tham gia:{" "}
                        {selectedCustomer.first_activity
                          ? formatDate(selectedCustomer.first_activity)
                          : "N/A"}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Activity className="w-4 h-4 mr-2 text-gray-400" />
                        {selectedCustomer.activity_count || 0} lượt quay
                      </div>
                    </div>
                  </div>

                  {/* Spin History */}
                  <div>
                    <h5 className="text-md font-medium text-gray-900 mb-4">
                      Lịch Sử Quay Số
                    </h5>

                    {spinLoading ? (
                      <div className="text-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mx-auto"></div>
                      </div>
                    ) : customerSpins.length > 0 ? (
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {customerSpins.map((spin, index) => (
                          <div
                            key={spin.id}
                            className="p-3 border border-gray-200 rounded-lg"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span
                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getOutcomeColor(
                                  spin.outcome
                                )}`}
                              >
                                {getOutcomeIcon(spin.outcome)}
                                <span className="ml-1">
                                  {spin.outcome === "win" ? "Thắng" : "Thua"}
                                </span>
                              </span>
                              <span className="text-xs text-gray-500">
                                {formatDate(spin.created_at)}
                              </span>
                            </div>

                            {spin.outcome === "win" && spin.voucher_name && (
                              <div className="text-sm">
                                <div className="font-medium text-gray-900">
                                  {spin.voucher_name}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {spin.voucher_code} • {spin.voucher_value}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-500 text-sm">
                        Chưa có lượt quay nào
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Chọn khách hàng để xem chi tiết</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default CustomerManagement;
