/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Gift,
  Plus,
  Edit,
  Trash2,
  BarChart3,
  Save,
  X,
  Search,
  Filter,
  Calendar,
  DollarSign,
  Percent,
  Package,
  ChevronDown,
  TrendingUp,
  Target,
  AlertCircle,
  CheckCircle,
  Clock,
} from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import AdminLayout from "../../components/AdminLayout";

const VoucherManagement = () => {
  const { token } = useAuth();
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    faceValue: "",
    voucherType: "discount_percentage",
    baseProbability: "",
    initialStock: "",
    maxPerUser: 1,
    validFrom: "",
    validTo: "",
    status: "active",
    codeGeneration: "auto",
    codePrefix: "LV",
  });

  // Fetch data on component mount
  useEffect(() => {
    fetchVouchers();
  }, []);

  const fetchVouchers = async () => {
    try {
      if (!token) {
        toast.error("Không có token xác thực");
        return;
      }
      const response = await axios.get(`/api/admin/vouchers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("API Response:", response.data); // Debug log
      // Handle both old and new response structures
      const vouchersData = response.data.data || response.data.vouchers || [];
      setVouchers(vouchersData);
      console.log("Vouchers set:", vouchersData); // Debug log
    } catch (error) {
      console.error("Error fetching vouchers:", error);
      toast.error("Không thể tải voucher");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!token) {
        toast.error("Không có token xác thực");
        return;
      }

      const url = editingVoucher
        ? `/api/admin/vouchers/${editingVoucher.id}`
        : `/api/admin/vouchers`;

      const method = editingVoucher ? "PUT" : "POST";

      const response = await axios({
        method,
        url,
        data: formData,
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        toast.success(
          editingVoucher
            ? "Cập nhật voucher thành công"
            : "Tạo voucher thành công"
        );
        setShowModal(false);
        setEditingVoucher(null);
        resetForm();
        fetchVouchers();
      }
    } catch (error) {
      console.error("Error saving voucher:", error);
      toast.error(error.response?.data?.error || "Không thể lưu voucher");
    }
  };

  const handleEdit = (voucher) => {
    setEditingVoucher(voucher);
    setFormData({
      name: voucher.name,
      description: voucher.description,
      faceValue: voucher.face_value,
      voucherType: voucher.voucher_type || "discount_percentage",
      baseProbability: voucher.base_probability,
      initialStock: voucher.initial_stock || voucher.remaining_stock,
      maxPerUser: voucher.max_per_user || 1,
      validFrom: voucher.valid_from ? voucher.valid_from.split("T")[0] : "",
      validTo: voucher.valid_to ? voucher.valid_to.split("T")[0] : "",
      status: voucher.status,
      codeGeneration: voucher.code_generation || "auto",
      codePrefix: voucher.code_prefix || "LV",
    });
    setShowModal(true);
  };

  const handleDelete = async (voucherId) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa voucher này?")) {
      try {
        if (!token) {
          toast.error("Không có token xác thực");
          return;
        }
        await axios.delete(`/api/admin/vouchers/${voucherId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Xóa voucher thành công");
        fetchVouchers();
      } catch (error) {
        console.error("Error deleting voucher:", error);
        toast.error("Không thể xóa voucher");
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      faceValue: "",
      voucherType: "discount_percentage",
      baseProbability: "",
      initialStock: "",
      maxPerUser: 1,
      validFrom: "",
      validTo: "",
      status: "active",
      codeGeneration: "auto",
      codePrefix: "LV",
    });
  };

  const filteredVouchers = vouchers
    .filter((voucher) => {
      // Safety check for voucher properties
      if (!voucher || !voucher.name) return false;

      const matchesSearch = voucher.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesStatus =
        filterStatus === "all" || voucher.status === filterStatus;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];

      if (sortBy === "remaining_stock_percentage") {
        aVal =
          (a.remaining_stock / (a.initial_stock || a.remaining_stock || 1)) *
          100;
        bVal =
          (b.remaining_stock / (b.initial_stock || b.remaining_stock || 1)) *
          100;
      }

      if (sortOrder === "asc") {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 border-green-200";
      case "inactive":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "draft":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "expired":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "active":
        return <CheckCircle className="w-4 h-4" />;
      case "inactive":
        return <AlertCircle className="w-4 h-4" />;
      case "draft":
        return <Clock className="w-4 h-4" />;
      case "expired":
        return <X className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case "discount_percentage":
        return <Percent className="w-5 h-5 text-blue-600" />;
      case "discount_amount":
        return <DollarSign className="w-5 h-5 text-green-600" />;
      case "free_product":
        return <Gift className="w-5 h-5 text-purple-600" />;
      default:
        return <Package className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStockPercentage = (voucher) => {
    const total = voucher.initial_stock || voucher.remaining_stock;
    if (total === 0) return 0;
    return Math.round((voucher.remaining_stock / total) * 100);
  };

  const getStockColor = (percentage) => {
    if (percentage > 50) return "bg-green-500";
    if (percentage > 20) return "bg-yellow-500";
    return "bg-red-500";
  };

  // Statistics
  const stats = [
    {
      label: "Tổng Voucher",
      value: vouchers.length,
      icon: <Gift className="w-6 h-6" />,
      color: "text-blue-600",
      bg: "bg-blue-100",
    },
    {
      label: "Đang Hoạt Động",
      value: vouchers.filter((v) => v.status === "active").length,
      icon: <CheckCircle className="w-6 h-6" />,
      color: "text-green-600",
      bg: "bg-green-100",
    },
    {
      label: "Tổng Kho",
      value: vouchers.reduce(
        (sum, v) => sum + (v.initial_stock || v.remaining_stock || 0),
        0
      ),
      icon: <Package className="w-6 h-6" />,
      color: "text-purple-600",
      bg: "bg-purple-100",
    },
    {
      label: "Còn Lại",
      value: vouchers.reduce((sum, v) => sum + (v.remaining_stock || 0), 0),
      icon: <TrendingUp className="w-6 h-6" />,
      color: "text-orange-600",
      bg: "bg-orange-100",
    },
  ];

  if (loading) {
    return (
      <AdminLayout title="Quản Lý Voucher">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Đang tải voucher...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Quản Lý Voucher">
      <div className="space-y-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
          >
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center">
                <Gift className="w-6 h-6 sm:w-8 sm:h-8 mr-3 text-indigo-600" />
                Quản Lý Voucher
              </h1>
              <p className="text-gray-600 mt-2 text-sm sm:text-base">
                Tạo và quản lý voucher cho hệ thống quay số may mắn
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setEditingVoucher(null);
                resetForm();
                setShowModal(true);
              }}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl sm:rounded-2xl font-medium flex items-center justify-center space-x-2 hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl text-sm sm:text-base"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Tạo Voucher Mới</span>
            </motion.button>
          </motion.div>
        </div>

        {/* Statistics Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              whileHover={{ scale: 1.02, y: -5 }}
              className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-100"
            >
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1 truncate">
                    {stat.label}
                  </p>
                  <p className="text-xl sm:text-3xl font-bold text-gray-900">
                    {stat.value.toLocaleString()}
                  </p>
                </div>
                <div
                  className={`${stat.bg} ${stat.color} p-2 sm:p-3 rounded-xl sm:rounded-2xl flex-shrink-0 ml-2`}
                >
                  <div className="w-4 h-4 sm:w-6 sm:h-6">{stat.icon}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Filters and Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-6 mb-6 sm:mb-8"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="relative sm:col-span-2 lg:col-span-2">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm voucher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 sm:py-3 w-full border border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 text-sm sm:text-base"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <Filter className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="pl-10 pr-4 py-3 w-full border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none transition-all duration-200"
              >
                <option value="all">Tất Cả Trạng Thái</option>
                <option value="active">Đang Hoạt Động</option>
                <option value="inactive">Không Hoạt Động</option>
                <option value="draft">Nháp</option>
                <option value="expired">Hết Hạn</option>
              </select>
            </div>

            {/* Sort By */}
            <div className="relative">
              <BarChart3 className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="pl-10 pr-4 py-3 w-full border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none transition-all duration-200"
              >
                <option value="created_at">Ngày Tạo</option>
                <option value="name">Tên</option>
                <option value="remaining_stock">Kho</option>
                <option value="base_probability">Xác Suất</option>
              </select>
            </div>

            {/* Sort Order */}
            <div className="relative">
              <ChevronDown className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="pl-10 pr-4 py-3 w-full border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none transition-all duration-200"
              >
                <option value="desc">Giảm Dần</option>
                <option value="asc">Tăng Dần</option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
            <span>
              Hiển thị {filteredVouchers.length} trong {vouchers.length} voucher
            </span>
            <span>
              Tổng kho:{" "}
              {vouchers.reduce((sum, v) => sum + (v.remaining_stock || 0), 0)}
            </span>
          </div>
        </motion.div>

        {/* Vouchers Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6"
        >
          <AnimatePresence>
            {filteredVouchers.map((voucher) => (
              <motion.div
                key={voucher.id}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                whileHover={{ scale: 1.02, y: -5 }}
                className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300"
              >
                {/* Card Header */}
                <div className="p-6 pb-4">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      {getTypeIcon(voucher.voucher_type)}
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg line-clamp-1">
                          {voucher.name}
                        </h3>
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {voucher.description || "Không có mô tả"}
                        </p>
                      </div>
                    </div>
                    <div
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                        voucher.status
                      )}`}
                    >
                      {getStatusIcon(voucher.status)}
                      <span className="ml-1 capitalize">{voucher.status}</span>
                    </div>
                  </div>

                  {/* Value Display */}
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 mb-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-indigo-600">
                        {voucher.voucher_type === "discount_percentage"
                          ? `${voucher.face_value}% OFF`
                          : voucher.voucher_type === "discount_amount"
                          ? `$${voucher.face_value}`
                          : "Free Product"}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {voucher.base_probability * 100}% xác suất trúng
                      </div>
                    </div>
                  </div>

                  {/* Stock Progress */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        Kho
                      </span>
                      <span className="text-sm text-gray-600">
                        {voucher.remaining_stock}/
                        {voucher.initial_stock || voucher.remaining_stock}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${getStockColor(
                          getStockPercentage(voucher)
                        )}`}
                        style={{ width: `${getStockPercentage(voucher)}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {getStockPercentage(voucher)}% còn lại
                    </div>
                  </div>

                  {/* Validity */}
                  {(voucher.valid_from || voucher.valid_to) && (
                    <div className="text-xs text-gray-500 mb-4 flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      <span>
                        {voucher.valid_from &&
                          new Date(voucher.valid_from).toLocaleDateString()}
                        {voucher.valid_from && voucher.valid_to && " - "}
                        {voucher.valid_to &&
                          new Date(voucher.valid_to).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div className="bg-gray-50 px-6 py-4 flex justify-between items-center">
                  <div className="text-xs text-gray-500">
                    Tối đa mỗi người: {voucher.max_per_user || 1}
                  </div>
                  <div className="flex space-x-2">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleEdit(voucher)}
                      className="bg-indigo-100 text-indigo-600 p-2 rounded-lg hover:bg-indigo-200 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleDelete(voucher.id)}
                      className="bg-red-100 text-red-600 p-2 rounded-lg hover:bg-red-200 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Empty State */}
        {filteredVouchers.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <Gift className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              Không tìm thấy voucher
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || filterStatus !== "all"
                ? "Thử điều chỉnh tìm kiếm hoặc bộ lọc của bạn"
                : "Bắt đầu bằng cách tạo voucher đầu tiên"}
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setEditingVoucher(null);
                resetForm();
                setShowModal(true);
              }}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-2xl font-medium"
            >
              Tạo Voucher Đầu Tiên
            </motion.button>
          </motion.div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-8">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-3xl font-bold text-gray-900">
                    {editingVoucher ? "Chỉnh Sửa Voucher" : "Tạo Voucher Mới"}
                  </h2>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Basic Information */}
                    <div className="space-y-6">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <Gift className="w-5 h-5 mr-2 text-indigo-600" />
                        Thông Tin Cơ Bản
                      </h3>

                      {/* Name */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Tên Voucher *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.name}
                          onChange={(e) =>
                            setFormData({ ...formData, name: e.target.value })
                          }
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                          placeholder="Nhập tên voucher"
                        />
                      </div>

                      {/* Description */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Mô Tả
                        </label>
                        <textarea
                          rows="3"
                          value={formData.description}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              description: e.target.value,
                            })
                          }
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                          placeholder="Mô tả voucher của bạn..."
                        />
                      </div>

                      {/* Voucher Type */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Loại Voucher *
                        </label>
                        <select
                          required
                          value={formData.voucherType}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              voucherType: e.target.value,
                            })
                          }
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                        >
                          <option value="discount_percentage">
                            Giảm Giá Phần Trăm
                          </option>
                          <option value="discount_amount">
                            Giảm Giá Cố Định
                          </option>
                          <option value="free_product">
                            Sản Phẩm Miễn Phí
                          </option>
                        </select>
                      </div>

                      {/* Face Value */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Giá Trị *
                        </label>
                        <input
                          type="number"
                          required
                          min="0"
                          step="0.01"
                          value={formData.faceValue}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              faceValue: e.target.value,
                            })
                          }
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                          placeholder={
                            formData.voucherType === "discount_percentage"
                              ? "10"
                              : "100000"
                          }
                        />
                        <p className="mt-1 text-sm text-gray-500">
                          {formData.voucherType === "discount_percentage"
                            ? "Nhập phần trăm (ví dụ: 10 cho 10%)"
                            : formData.voucherType === "discount_amount"
                            ? "Nhập số tiền bằng VND"
                            : "Nhập bất kỳ giá trị nào cho sản phẩm miễn phí"}
                        </p>
                      </div>
                    </div>

                    {/* Configuration */}
                    <div className="space-y-6">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <Target className="w-5 h-5 mr-2 text-indigo-600" />
                        Cấu Hình
                      </h3>

                      {/* Base Probability */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Xác Suất Thắng (0-1) *
                        </label>
                        <input
                          type="number"
                          required
                          min="0"
                          max="1"
                          step="0.01"
                          value={formData.baseProbability}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              baseProbability: e.target.value,
                            })
                          }
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                          placeholder="0.1"
                        />
                        <p className="mt-1 text-sm text-gray-500">
                          0.1 = 10% cơ hội thắng
                        </p>
                      </div>

                      {/* Initial Stock */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Kho Ban Đầu *
                        </label>
                        <input
                          type="number"
                          required
                          min="1"
                          value={formData.initialStock}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              initialStock: e.target.value,
                            })
                          }
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                          placeholder="100"
                        />
                      </div>

                      {/* Max Per User */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Tối Đa Mỗi Người *
                        </label>
                        <input
                          type="number"
                          required
                          min="1"
                          value={formData.maxPerUser}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              maxPerUser: e.target.value,
                            })
                          }
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                          placeholder="1"
                        />
                      </div>

                      {/* Valid From */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Có Hiệu Lực Từ
                        </label>
                        <input
                          type="date"
                          value={formData.validFrom}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              validFrom: e.target.value,
                            })
                          }
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                        />
                      </div>

                      {/* Valid To */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Có Hiệu Lực Đến
                        </label>
                        <input
                          type="date"
                          value={formData.validTo}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              validTo: e.target.value,
                            })
                          }
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                        />
                      </div>

                      {/* Status */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Trạng Thái *
                        </label>
                        <select
                          required
                          value={formData.status}
                          onChange={(e) =>
                            setFormData({ ...formData, status: e.target.value })
                          }
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                        >
                          <option value="draft">Nháp</option>
                          <option value="active">Đang Hoạt Động</option>
                          <option value="inactive">Không Hoạt Động</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end space-x-4 pt-8 border-t border-gray-200">
                    <motion.button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="px-6 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors font-medium"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Hủy
                    </motion.button>
                    <motion.button
                      type="submit"
                      className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 font-medium flex items-center space-x-2"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Save className="w-5 h-5" />
                      <span>
                        {editingVoucher ? "Cập Nhật Voucher" : "Tạo Voucher"}
                      </span>
                    </motion.button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
};

export default VoucherManagement;
