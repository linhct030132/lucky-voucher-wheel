import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Eye,
  Search,
  Shield,
  Clock,
  Filter,
  RefreshCw,
  Calendar,
  User,
  FileText,
  Download,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";

const AuditLogs = () => {
  const { token } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAction, setSelectedAction] = useState("all");
  const [selectedUser, setSelectedUser] = useState("all");
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    to: new Date().toISOString().split("T")[0],
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  const actionTypes = [
    { value: "all", label: "Tất cả hành động" },
    { value: "login", label: "Đăng nhập" },
    { value: "logout", label: "Đăng xuất" },
    { value: "create_voucher", label: "Tạo phiếu mua hàng" },
    { value: "update_voucher", label: "Cập nhật phiếu mua hàng" },
    { value: "delete_voucher", label: "Xóa phiếu mua hàng" },
    { value: "spin_attempt", label: "Quay số" },
    { value: "view_reports", label: "Xem báo cáo" },
    { value: "export_data", label: "Xuất dữ liệu" },
  ];

  useEffect(() => {
    fetchAuditLogs();
  }, [pagination.page, dateRange, selectedAction, selectedUser, searchTerm]);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      if (!token) {
        toast.error("Không có token xác thực");
        return;
      }

      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        from: dateRange.from,
        to: dateRange.to,
        action: selectedAction !== "all" ? selectedAction : "",
        user: selectedUser !== "all" ? selectedUser : "",
        search: searchTerm,
      });

      const response = await axios.get(
        `${process.env.REACT_APP_API_BASE_URL}/admin/audit-logs?${params}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setLogs(response.data.logs || []);
      setPagination((prev) => ({
        ...prev,
        total: response.data.total || 0,
        totalPages: response.data.totalPages || 0,
      }));
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      toast.error("Không thể tải nhật ký hệ thống");
    } finally {
      setLoading(false);
    }
  };

  const exportLogs = async () => {
    try {
      if (!token) {
        toast.error("Không có token xác thực");
        return;
      }
      const params = new URLSearchParams({
        from: dateRange.from,
        to: dateRange.to,
        action: selectedAction !== "all" ? selectedAction : "",
        user: selectedUser !== "all" ? selectedUser : "",
        search: searchTerm,
      });

      const response = await axios.get(
        `${process.env.REACT_APP_API_BASE_URL}/admin/audit-logs/export?${params}`,
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
        `nhat-ky-he-thong-${dateRange.from}-${dateRange.to}.csv`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast.success("Xuất nhật ký hệ thống thành công!");
    } catch (error) {
      console.error("Error exporting logs:", error);
      toast.error("Không thể xuất nhật ký hệ thống");
    }
  };

  const getActionLabel = (action) => {
    const actionType = actionTypes.find((type) => type.value === action);
    return actionType ? actionType.label : action;
  };

  const getActionColor = (action) => {
    switch (action) {
      case "login":
        return "bg-green-100 text-green-800";
      case "logout":
        return "bg-gray-100 text-gray-800";
      case "create_voucher":
        return "bg-blue-100 text-blue-800";
      case "update_voucher":
        return "bg-yellow-100 text-yellow-800";
      case "delete_voucher":
        return "bg-red-100 text-red-800";
      case "spin_attempt":
        return "bg-purple-100 text-purple-800";
      case "view_reports":
        return "bg-indigo-100 text-indigo-800";
      case "export_data":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const handlePageChange = (newPage) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải nhật ký hệ thống...</p>
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
              Nhật Ký Hệ Thống
            </h1>
            <p className="text-gray-600">
              Theo dõi tất cả hoạt động hệ thống và hành động người dùng để đảm
              bảo bảo mật
            </p>
          </div>

          <div className="flex space-x-4">
            <button
              onClick={fetchAuditLogs}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Làm mới</span>
            </button>
            <button
              onClick={exportLogs}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Xuất CSV</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {actionTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>

            <input
              type="date"
              value={dateRange.from}
              onChange={(e) =>
                setDateRange({ ...dateRange, from: e.target.value })
              }
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />

            <input
              type="date"
              value={dateRange.to}
              onChange={(e) =>
                setDateRange({ ...dateRange, to: e.target.value })
              }
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />

            <button
              onClick={() => setPagination((prev) => ({ ...prev, page: 1 }))}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2"
            >
              <Filter className="w-4 h-4" />
              <span>Lọc</span>
            </button>
          </div>
        </div>

        {/* Audit Logs Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thời gian
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Người dùng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hành động
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Chi tiết
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    IP Address
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User Agent
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {logs.map((log) => (
                  <motion.tr
                    key={log.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(log.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-gray-600" />
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {log.user_phone || log.admin_username || "Hệ thống"}
                          </div>
                          <div className="text-sm text-gray-500">
                            {log.user_type === "admin"
                              ? "Quản trị viên"
                              : "Người dùng"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${getActionColor(
                          log.action
                        )}`}
                      >
                        {getActionLabel(log.action)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                      {log.details || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {log.ip_address}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {log.user_agent || "-"}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {logs.length === 0 && (
            <div className="text-center py-12">
              <Eye className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Không có nhật ký nào
              </h3>
              <p className="text-gray-500">
                Không tìm thấy nhật ký nào phù hợp với bộ lọc của bạn.
              </p>
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Trước
                </button>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Sau
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Hiển thị{" "}
                    <span className="font-medium">
                      {(pagination.page - 1) * pagination.limit + 1}
                    </span>{" "}
                    đến{" "}
                    <span className="font-medium">
                      {Math.min(
                        pagination.page * pagination.limit,
                        pagination.total
                      )}
                    </span>{" "}
                    trong{" "}
                    <span className="font-medium">{pagination.total}</span> kết
                    quả
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>

                    {Array.from(
                      { length: Math.min(5, pagination.totalPages) },
                      (_, i) => {
                        const page = i + 1;
                        return (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              page === pagination.page
                                ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                                : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                            }`}
                          >
                            {page}
                          </button>
                        );
                      }
                    )}

                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuditLogs;
