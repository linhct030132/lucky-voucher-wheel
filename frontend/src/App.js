import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import { SpinProvider } from "./context/SpinContext";

// Public Pages
import LandingPage from "./pages/LandingPage";
import SpinPage from "./pages/SpinPage";
import ThankYouPage from "./pages/ThankYouPage";

// Admin Pages
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import VoucherManagement from "./pages/admin/VoucherManagement";
import SpinManagement from "./pages/admin/SpinManagement";
import CustomerManagement from "./pages/admin/CustomerManagement";
import AuditLogs from "./pages/admin/AuditLogs";

// Components
import ProtectedRoute from "./components/ProtectedRoute";
import NotFound from "./pages/NotFound";

function App() {
  return (
    <Router>
      <AuthProvider>
        <SpinProvider>
          <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/spin" element={<SpinPage />} />
              <Route path="/thank-you" element={<ThankYouPage />} />

              {/* Admin Routes */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route
                path="/admin/dashboard"
                element={
                  <ProtectedRoute>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/vouchers"
                element={
                  <ProtectedRoute>
                    <VoucherManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/spins"
                element={
                  <ProtectedRoute>
                    <SpinManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/customers"
                element={
                  <ProtectedRoute>
                    <CustomerManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/audit-logs"
                element={
                  <ProtectedRoute>
                    <AuditLogs />
                  </ProtectedRoute>
                }
              />

              {/* 404 Route */}
              <Route path="*" element={<NotFound />} />
            </Routes>

            {/* Global Toast Notifications */}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: "#fff",
                  color: "#333",
                  fontWeight: "500",
                  borderRadius: "12px",
                  boxShadow:
                    "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                  border: "1px solid #e5e7eb",
                  padding: "16px",
                },
                success: {
                  iconTheme: {
                    primary: "#10b981",
                    secondary: "#fff",
                  },
                },
                error: {
                  iconTheme: {
                    primary: "#dc2626",
                    secondary: "#fff",
                  },
                },
                loading: {
                  iconTheme: {
                    primary: "#6b7280",
                    secondary: "#fff",
                  },
                },
              }}
            />
          </div>
        </SpinProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
