import React, { createContext, useContext, useState } from "react";
import axios from "axios";
import FingerprintJS from "fingerprintjs2";

const SpinContext = createContext();

export const useSpin = () => {
  const context = useContext(SpinContext);
  if (!context) {
    throw new Error("useSpin must be used within a SpinProvider");
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
  const generateDeviceFingerprint = () => {
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
  };

  // Initialize device fingerprint
  const initializeDevice = async () => {
    if (!deviceId) {
      const fingerprint = await generateDeviceFingerprint();
      setDeviceId(fingerprint);
      return fingerprint;
    }
    return deviceId;
  };

  // Get available vouchers
  const getAvailableVouchers = async () => {
    try {
      const response = await axios.get("/api/vouchers");
      setAvailableVouchers(response.data.data || []);
      return response.data.data || [];
    } catch (error) {
      console.error("Failed to fetch vouchers:", error);
      setAvailableVouchers([]);
      return [];
    }
  };

  // Check eligibility for spin
  const checkEligibility = async (email = null, phone = null) => {
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
        eligible: false,
        reason: "NETWORK_ERROR",
        message: "Unable to check eligibility. Please try again.",
      };
      setEligibilityStatus(errorData);
      return errorData;
    }
  };

  // Perform spin
  const performSpin = async (userProfile) => {
    if (isSpinning) return;

    setIsSpinning(true);
    setSpinResult(null);

    try {
      const currentDeviceId = await initializeDevice();

      const spinData = {
        fullName: userProfile.fullName,
        email: userProfile.email || null,
        phone: userProfile.phone || null,
        consent: userProfile.consent,
        deviceId: currentDeviceId,
      };

      const response = await axios.post("/api/spins", spinData);

      if (response.data) {
        setSpinResult(response.data);
        return response.data;
      }
    } catch (error) {
      console.error("Spin failed:", error);

      let errorMessage = "Spin failed. Please try again.";
      let errorCode = "UNKNOWN_ERROR";

      if (error.response?.status === 409) {
        errorMessage = "You have already participated in this lucky draw.";
        errorCode = "ALREADY_PARTICIPATED";
      } else if (error.response?.status === 429) {
        errorMessage = "Too many attempts. Please try again later.";
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
  };

  // Reset spin state
  const resetSpin = () => {
    setSpinResult(null);
    setEligibilityStatus(null);
  };

  // Get system status
  const getSystemStatus = async () => {
    try {
      const response = await axios.get("/api/status");
      return response.data.data;
    } catch (error) {
      console.error("Failed to get system status:", error);
      return null;
    }
  };

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
    checkEligibility,
    performSpin,
    resetSpin,
    getSystemStatus,

    // Utils
    generateDeviceFingerprint,
  };

  return <SpinContext.Provider value={value}>{children}</SpinContext.Provider>;
};
