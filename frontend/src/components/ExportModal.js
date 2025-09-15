import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  X,
  Download,
  Calendar,
  Filter,
  FileText,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";

const ExportModal = ({
  isOpen,
  onClose,
  token,
  exportType, // 'spins' or 'customers'
  currentFilters = {},
  title,
}) => {
  const [exportFilters, setExportFilters] = useState({
    dateFrom: currentFilters.dateFrom || "",
    dateTo: currentFilters.dateTo || "",
    search: currentFilters.search || "",
    outcome: currentFilters.outcome || "", // For spins only
    activityStatus: currentFilters.activityStatus || "", // For customers only
    format: "excel",
    includeDetails: true,
  });
  const [exporting, setExporting] = useState(false);

  const handleFilterChange = (key, value) => {
    setExportFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleExport = async () => {
    try {
      setExporting(true);

      // Prepare query parameters
      const queryParams = new URLSearchParams({
        format: exportFilters.format,
        includeDetails: exportFilters.includeDetails,
        ...(exportFilters.search && { search: exportFilters.search }),
        ...(exportFilters.dateFrom && { dateFrom: exportFilters.dateFrom }),
        ...(exportFilters.dateTo && { dateTo: exportFilters.dateTo }),
      });

      // Add type-specific filters
      if (exportType === "spins" && exportFilters.outcome) {
        queryParams.append("outcome", exportFilters.outcome);
      }
      if (
        exportType === "customers" &&
        exportFilters.activityStatus &&
        exportFilters.activityStatus !== "all"
      ) {
        queryParams.append("activityStatus", exportFilters.activityStatus);
      }

      const endpoint =
        exportType === "spins"
          ? `/api/admin/spins/export?${queryParams}`
          : `/api/admin/users/export?${queryParams}`;

      const response = await axios.get(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        responseType: "blob", // Important for file download
      });

      // Create download link
      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().split("T")[0];
      const filename =
        exportType === "spins"
          ? `spin-data-${timestamp}.xlsx`
          : `customer-data-${timestamp}.xlsx`;

      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Xuất dữ liệu thành công!");
      onClose();
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Không thể xuất dữ liệu. Vui lòng thử lại.");
    } finally {
      setExporting(false);
    }
  };

  const getFilterCount = () => {
    let count = 0;
    if (exportFilters.search) count++;
    if (exportFilters.dateFrom) count++;
    if (exportFilters.dateTo) count++;
    if (exportType === "spins" && exportFilters.outcome) count++;
    if (
      exportType === "customers" &&
      exportFilters.activityStatus &&
      exportFilters.activityStatus !== "all"
    )
      count++;
    return count;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Download className="w-5 h-5 text-blue-600 mr-2" />
              <h3 className="text-lg font-bold text-gray-900">
                {title ||
                  `Xuất Dữ Liệu ${
                    exportType === "spins" ? "Lượt Quay" : "Khách Hàng"
                  }`}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-200 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Export Format */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              <FileText className="w-4 h-4 inline mr-1" />
              Định dạng xuất
            </label>
            <div className="space-y-2">
              <label className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  value="excel"
                  checked={exportFilters.format === "excel"}
                  onChange={(e) => handleFilterChange("format", e.target.value)}
                  className="mr-3 text-blue-600"
                />
                <div>
                  <div className="font-medium text-gray-900">Excel (.xlsx)</div>
                  <div className="text-sm text-gray-500">
                    Định dạng bảng tính Excel
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Export Options */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Tùy chọn xuất
            </label>
            <label className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                checked={exportFilters.includeDetails}
                onChange={(e) =>
                  handleFilterChange("includeDetails", e.target.checked)
                }
                className="mr-3 text-blue-600"
              />
              <div>
                <div className="font-medium text-gray-900">
                  Bao gồm chi tiết
                </div>
                <div className="text-sm text-gray-500">
                  {exportType === "spins"
                    ? "Xuất thông tin voucher, mã voucher chi tiết"
                    : "Xuất thông tin liên hệ, thống kê chi tiết"}
                </div>
              </div>
            </label>
          </div>

          {/* Filters */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-semibold text-gray-700">
                <Filter className="w-4 h-4 inline mr-1" />
                Bộ lọc dữ liệu
              </label>
              {getFilterCount() > 0 && (
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                  {getFilterCount()} bộ lọc
                </span>
              )}
            </div>

            <div className="space-y-4">
              {/* Search Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Tìm kiếm
                </label>
                <input
                  type="text"
                  placeholder={
                    exportType === "spins"
                      ? "Tìm theo tên, email, phone..."
                      : "Tìm theo tên, email, số điện thoại..."
                  }
                  value={exportFilters.search}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Từ ngày
                  </label>
                  <input
                    type="date"
                    value={exportFilters.dateFrom}
                    onChange={(e) =>
                      handleFilterChange("dateFrom", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Đến ngày
                  </label>
                  <input
                    type="date"
                    value={exportFilters.dateTo}
                    onChange={(e) =>
                      handleFilterChange("dateTo", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>

              {/* Type-specific filters */}
              {exportType === "spins" && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Kết quả
                  </label>
                  <select
                    value={exportFilters.outcome}
                    onChange={(e) =>
                      handleFilterChange("outcome", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    <option value="">Tất cả</option>
                    <option value="win">Thắng</option>
                    <option value="lose">Thua</option>
                  </select>
                </div>
              )}

              {exportType === "customers" && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Trạng thái hoạt động
                  </label>
                  <select
                    value={exportFilters.activityStatus}
                    onChange={(e) =>
                      handleFilterChange("activityStatus", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    <option value="">Tất cả</option>
                    <option value="active">Hoạt động</option>
                    <option value="idle">Ít hoạt động</option>
                    <option value="inactive">Không hoạt động</option>
                    <option value="new">Khách hàng mới</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Info Note */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <div className="font-medium mb-1">Lưu ý khi xuất dữ liệu:</div>
                <ul className="space-y-1 text-sm">
                  <li>• Dữ liệu sẽ được xuất theo bộ lọc đã chọn</li>
                  <li>• Tệp Excel sẽ được tự động tải xuống</li>
                  <li>• Quá trình xuất có thể mất vài giây với dữ liệu lớn</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Hủy
            </button>
            <button
              onClick={handleExport}
              disabled={exporting}
              className="inline-flex items-center px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {exporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Đang xuất...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Xuất dữ liệu
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ExportModal;
