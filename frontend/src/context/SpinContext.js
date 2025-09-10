import React, { createContext, useContext, useState, useCallback } from "react";
import axios from "axios";
import FingerprintJS from "fingerprintjs2";

const SpinContext = createContext();

export const useSpin = () => {
  const context = useContext(SpinContext);
  if (!context) {
    throw new Error("useSpin phải được sử dụng trong SpinProvider");
  }
  return context;
};

export const SpinProvider = ({ children }) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinResult, setSpinResult] = useState(null);
  const [deviceId, setDeviceId] = useState(null);
  const [eligibilityStatus, setEligibilityStatus] = useState(null);
  const [availableVouchers, setAvailableVouchers] = useState([]);

  // Generate device fingerprint
  const generateDeviceFingerprint = useCallback(() => {
    return new Promise((resolve) => {
      FingerprintJS.get((components) => {
        const values = components.map((component) => component.value);
        const fingerprint = FingerprintJS.x64hash128(values.join(""), 31);

        // Add additional browser/device info
        const additionalInfo = {
          userAgent: navigator.userAgent,
          language: navigator.language,
          platform: navigator.platform,
          screenResolution: `${window.screen.width}x${window.screen.height}`,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          touchSupport: "ontouchstart" in window,
        };

        const combinedFingerprint =
          fingerprint + JSON.stringify(additionalInfo);
        const finalFingerprint = FingerprintJS.x64hash128(
          combinedFingerprint,
          31
        );

        resolve(finalFingerprint);
      });
    });
  }, []);

  // Initialize device fingerprint
  const initializeDevice = useCallback(async () => {
    if (!deviceId) {
      const fingerprint = await generateDeviceFingerprint();
      setDeviceId(fingerprint);
      return fingerprint;
    }
    return deviceId;
  }, [deviceId, generateDeviceFingerprint]);

  // Get available vouchers
  const getAvailableVouchers = useCallback(async () => {
    try {
      const response = await axios.get("/api/vouchers");
      setAvailableVouchers(response.data.data || []);
      return response.data.data || [];
    } catch (error) {
      console.error("Failed to fetch vouchers:", error);
      setAvailableVouchers([]);
      return [];
    }
  }, []);

  // Store user information for later spinning
  const storeUserInfo = useCallback(
    async (userProfile) => {
      try {
        const currentDeviceId = await initializeDevice();

        const response = await axios.post("/api/store-user-info", {
          fullName: userProfile.fullName,
          email: userProfile.email,
          phone: userProfile.phone,
          consent: Boolean(userProfile.consent),
          deviceId: currentDeviceId,
        });

        return response.data;
      } catch (error) {
        console.error("Failed to store user info:", error);
        throw error;
      }
    },
    [initializeDevice]
  );

  // Get stored user information
  const getStoredUserInfo = useCallback(async () => {
    try {
      const currentDeviceId = await initializeDevice();

      const response = await axios.post("/api/get-stored-user-info", {
        deviceId: currentDeviceId,
      });

      return response.data;
    } catch (error) {
      console.error("Failed to get stored user info:", error);
      return { hasStoredInfo: false };
    }
  }, [initializeDevice]);

  // Check eligibility for spin
  const checkEligibility = useCallback(
    async (email = null, phone = null) => {
      try {
        const currentDeviceId = await initializeDevice();

        const response = await axios.post("/api/verify-eligibility", {
          deviceId: currentDeviceId,
          email,
          phone,
        });

        setEligibilityStatus(response.data);
        return response.data;
      } catch (error) {
        console.error("Eligibility check failed:", error);
        const errorData = {
          eligible: true,
          reason: "NETWORK_ERROR",
          message: "Không thể kiểm tra điều kiện tham gia. Vui lòng thử lại.",
        };
        setEligibilityStatus(errorData);
        return errorData;
      }
    },
    [initializeDevice]
  );

  // Perform spin
  const performSpin = useCallback(
    async (userProfile) => {
      if (isSpinning) return;

      setIsSpinning(true);
      setSpinResult(null);

      try {
        const currentDeviceId = await initializeDevice();

        const spinData = {
          fullName: userProfile.fullName,
          email: userProfile.email,
          phone: userProfile.phone,
          consent: Boolean(userProfile.consent),
          deviceId: currentDeviceId,
        };

        console.log("Sending spin data:", spinData);

        const response = await axios.post("/api/spins", spinData);

        if (response.data) {
          setSpinResult(response.data);
          return response.data;
        }
      } catch (error) {
        console.error("Spin failed:", error);

        let errorMessage = "Quay thất bại. Vui lòng thử lại.";
        let errorCode = "UNKNOWN_ERROR";

        if (error.response?.status === 409) {
          errorMessage = "Bạn đã tham gia quay số may mắn này rồi.";
          errorCode = "ALREADY_PARTICIPATED";
        } else if (error.response?.status === 429) {
          errorMessage = "Quá nhiều lần thử. Vui lòng thử lại sau.";
          errorCode = "RATE_LIMITED";
        } else if (error.response?.data?.error) {
          errorMessage = error.response.data.error;
          errorCode = "API_ERROR";
        }

        const errorResult = {
          outcome: "error",
          error: errorMessage,
          errorCode,
        };

        setSpinResult(errorResult);
        return errorResult;
      } finally {
        setIsSpinning(false);
      }
    },
    [isSpinning, initializeDevice]
  );

  // Reset spin state
  const resetSpin = useCallback(() => {
    setSpinResult(null);
    setEligibilityStatus(null);
  }, []);

  // Get system status
  const getSystemStatus = useCallback(async () => {
    try {
      const response = await axios.get("/api/status");
      return response.data.data;
    } catch (error) {
      console.error("Failed to get system status:", error);
      return null;
    }
  }, []);

  const value = {
    // State
    isSpinning,
    spinResult,
    deviceId,
    eligibilityStatus,
    availableVouchers,

    // Actions
    initializeDevice,
    getAvailableVouchers,
    storeUserInfo,
    getStoredUserInfo,
    checkEligibility,
    performSpin,
    resetSpin,
    getSystemStatus,

    // Utils
    generateDeviceFingerprint,
  };

  return <SpinContext.Provider value={value}>{children}</SpinContext.Provider>;
};
