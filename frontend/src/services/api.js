import axios from "axios";
import toast from "react-hot-toast";

// Create axios instance
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "/api",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Important for cookies
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token to requests
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 errors (unauthorized)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh token
        const refreshResponse = await api.post("/auth/refresh");
        const { accessToken } = refreshResponse.data;

        // Update stored token
        localStorage.setItem("accessToken", accessToken);

        // Update request header and retry
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem("accessToken");
        window.location.href = "/admin/login";
        return Promise.reject(refreshError);
      }
    }

    // Handle other errors
    if (error.response?.status >= 500) {
      toast.error("Server error. Please try again later.");
    } else if (error.response?.status === 429) {
      toast.error("Too many requests. Please wait a moment.");
    } else if (error.response?.data?.error) {
      // Don't show toast for spin-related errors as they're handled in components
      if (
        !error.config?.url?.includes("/spins") &&
        !error.config?.url?.includes("/verify-eligibility")
      ) {
        toast.error(error.response.data.error);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
