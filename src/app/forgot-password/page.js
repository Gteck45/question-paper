"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import AuthGuard from "../component/AuthGuard";

export default function ForgotPassword() {
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [verificationToken, setVerificationToken] = useState("");
  const [attemptsLeft, setAttemptsLeft] = useState(7);
  const [timeLeft, setTimeLeft] = useState(0);
  const router = useRouter();

  // Timer for OTP expiration
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const sendOTP = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/forgot-password/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success(data.message);
        setStep(2);
        setTimeLeft(300); // 5 minutes
        setAttemptsLeft(7);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async (e) => {
    e.preventDefault();
    if (!otp) {
      toast.error("Please enter the OTP");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/forgot-password/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success(data.message);
        setVerificationToken(data.token);
        setStep(3);
      } else {
        toast.error(data.message);
        if (data.attemptsLeft !== undefined) {
          setAttemptsLeft(data.attemptsLeft);
        }
      }
    } catch (error) {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (e) => {
    e.preventDefault();
    
    if (!newPassword || !confirmPassword) {
      toast.error("Please fill in all fields");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/forgot-password/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email, 
          newPassword, 
          token: verificationToken 
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success(data.message);
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = (password) => {
    if (password.length < 6) return { strength: 'weak', color: 'red', text: 'Too Short' };
    if (password.length < 8) return { strength: 'fair', color: 'orange', text: 'Fair' };
    if (password.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)) {
      return { strength: 'strong', color: 'green', text: 'Strong' };
    }
    return { strength: 'good', color: 'blue', text: 'Good' };
  };

  const passwordStrength = getPasswordStrength(newPassword);

  return (
    <AuthGuard requireAuth={false} redirectIfAuth={true}>
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-4 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
          <div className="absolute -top-4 -right-4 w-72 h-72 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{animationDelay: '2s'}}></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{animationDelay: '4s'}}></div>
        </div>

        <div className="relative z-10 w-full max-w-md">
          <div className="backdrop-blur-xl bg-white/10 rounded-2xl shadow-2xl border border-white/20 p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🔐</span>
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">Reset Password</h1>
              <p className="text-gray-300">
                {step === 1 && "Enter your email to receive OTP"}
                {step === 2 && "Enter the 6-digit code sent to your email"}
                {step === 3 && "Create your new password"}
              </p>
            </div>

            {/* Progress Indicator */}
            <div className="flex justify-center mb-8">
              <div className="flex items-center space-x-4">
                {[1, 2, 3].map((stepNum) => (
                  <div key={stepNum} className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      stepNum <= step 
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' 
                        : 'bg-gray-600 text-gray-400'
                    }`}>
                      {stepNum}
                    </div>
                    {stepNum < 3 && (
                      <div className={`w-12 h-1 ${
                        stepNum < step ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-gray-600'
                      }`}></div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Step 1: Email */}
            {step === 1 && (
              <form onSubmit={sendOTP} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter your registered email"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transform transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Sending OTP...
                    </div>
                  ) : (
                    "Send OTP"
                  )}
                </button>
              </form>
            )}

            {/* Step 2: OTP Verification */}
            {step === 2 && (
              <form onSubmit={verifyOTP} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    6-Digit OTP
                  </label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white text-center text-lg tracking-widest placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="000000"
                    maxLength={6}
                    required
                  />
                </div>

                {/* Timer and Attempts */}
                <div className="flex justify-between text-sm text-gray-300">
                  <span>Attempts left: {attemptsLeft}</span>
                  {timeLeft > 0 ? (
                    <span>Expires in: {formatTime(timeLeft)}</span>
                  ) : (
                    <span className="text-red-400">OTP Expired</span>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || timeLeft === 0}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transform transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Verifying...
                    </div>
                  ) : (
                    "Verify OTP"
                  )}
                </button>

                {timeLeft === 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setStep(1);
                      setOtp("");
                    }}
                    className="w-full text-purple-400 hover:text-purple-300 py-2 font-medium"
                  >
                    Request New OTP
                  </button>
                )}
              </form>
            )}

            {/* Step 3: New Password */}
            {step === 3 && (
              <form onSubmit={resetPassword} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter new password"
                    required
                  />
                  {newPassword && (
                    <div className="mt-2 flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-2`} style={{ backgroundColor: passwordStrength.color }}></div>
                      <span className="text-sm text-gray-300">Strength: {passwordStrength.text}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Confirm new password"
                    required
                  />
                  {confirmPassword && (
                    <div className="mt-2 flex items-center">
                      {newPassword === confirmPassword ? (
                        <>
                          <div className="w-3 h-3 rounded-full mr-2 bg-green-500"></div>
                          <span className="text-sm text-green-400">Passwords match</span>
                        </>
                      ) : (
                        <>
                          <div className="w-3 h-3 rounded-full mr-2 bg-red-500"></div>
                          <span className="text-sm text-red-400">Passwords do not match</span>
                        </>
                      )}
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || newPassword !== confirmPassword}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transform transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Resetting Password...
                    </div>
                  ) : (
                    "Reset Password"
                  )}
                </button>
              </form>
            )}

            {/* Back to Login */}
            <div className="mt-6 text-center">
              <button
                onClick={() => router.push("/login")}
                className="text-purple-400 hover:text-purple-300 font-medium"
              >
                ← Back to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
