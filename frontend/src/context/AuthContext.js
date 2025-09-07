/* eslint-disable react-hooks/exhaustive-deps */
import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem("accessToken"));

  // Configure axios defaults
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common["Authorization"];
    }
  }, [token]);

  // Check if user is authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (token) {
          const response = await axios.get("/api/auth/me");
          if (response.data.success) {
            setUser(response.data.user);
          } else {
            // Token is invalid, clear it
            logout();
          }
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        // If token is expired or invalid, try to refresh
        if (error.response?.status === 401) {
          await tryRefreshToken();
        } else {
          logout();
        }
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [token]);

  const tryRefreshToken = async () => {
    try {
      const response = await axios.post("/api/auth/refresh");
      if (response.data.success) {
        const newToken = response.data.accessToken;
        setToken(newToken);
        localStorage.setItem("accessToken", newToken);
        setUser(response.data.user);
        return true;
      }
    } catch (error) {
      console.error("Token refresh failed:", error);
      logout();
    }
    return false;
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post("/api/auth/login", {
        email,
        password,
      });

      if (response.data.success) {
        const { accessToken, user: userData } = response.data;

        setToken(accessToken);
        setUser(userData);
        localStorage.setItem("accessToken", accessToken);

        return { success: true, user: userData };
      }
    } catch (error) {
      console.error("Login failed:", error);

      if (error.response?.data?.error) {
        return {
          success: false,
          error: error.response.data.error,
        };
      }

      return {
        success: false,
        error: "Login failed. Please try again.",
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await axios.post("/api/auth/register", userData);

      if (response.data.success) {
        return { success: true, user: response.data.user };
      }
    } catch (error) {
      console.error("Registration failed:", error);

      if (error.response?.data?.error) {
        return {
          success: false,
          error: error.response.data.error,
        };
      }

      return {
        success: false,
        error: "Registration failed. Please try again.",
      };
    }
  };

  const logout = async () => {
    try {
      await axios.post("/api/auth/logout");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setToken(null);
      setUser(null);
      localStorage.removeItem("accessToken");
      Cookies.remove("refreshToken");
      delete axios.defaults.headers.common["Authorization"];
    }
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user && !!token,
    isAdmin: user?.role === "ADMIN",
    isStaff: user?.role === "STAFF" || user?.role === "ADMIN",
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
