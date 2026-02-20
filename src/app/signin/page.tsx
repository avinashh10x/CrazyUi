"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { signInWithEmail, verifyOtpCode } from "@/lib/supabase-client";
import { useRouter } from "next/navigation";
import { useAuthUser, type StoredUser } from "@/hooks/useAuthUser";

function Signin() {
  const router = useRouter();
  const { saveUser } = useAuthUser();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [step, setStep] = useState<"email" | "otp">("email");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (step === "otp" && inputRefs.current[0]) {
      inputRefs.current[0]?.focus();
    }
  }, [step]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await signInWithEmail(email);
      setStep("otp");
    } catch (err: any) {
      setError(err.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text").trim();
    if (/^\d{6}$/.test(pasteData)) {
      const digits = pasteData.split("");
      setOtp(digits);
      inputRefs.current[5]?.focus();
    }
  };

  const handleVerify = async () => {
    setLoading(true);
    setError("");

    try {
      const code = otp.join("");
      if (code.length !== 6) {
        setError("Please enter the complete 6-digit code");
        setLoading(false);
        return;
      }

      const { user, session } = await verifyOtpCode(email, code);

      if (!session || !user) {
        throw new Error("No session created");
      }

      // Fetch user details for the redirect
      const res = await fetch("/api/user/details", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ userId: user.id }),
      });

      const data = await res.json();

      // Save user to localStorage for navbar checking
      const userData: StoredUser = {
        id: user.id,
        email: user.email || email,
        name: data.user?.name || "",
        phone: data.user?.phone || "",
        membership_status: data.user?.membership_status || "inactive",
        access_token: session.access_token,
      };
      saveUser(userData);

      // Construct redirect URL
      const params = new URLSearchParams();
      params.append("userId", user.id);
      params.append("email", user.email || "");

      if (data.user) {
        params.append("name", data.user.name || "");
        params.append("phone", data.user.phone || "");
        params.append("membership_status", data.user.membership_status || "");
      }

      // Redirect to Framer
      window.location.href = `${process.env.NEXT_PUBLIC_REDIRECT_URL}?${params.toString()}`;
    } catch (err: any) {
      setError(err.message || "Invalid OTP");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {step === "email" ? "Sign in to CrazyUI" : "Check your email"}
          </h1>
          <p className="text-sm text-gray-500">
            {step === "email"
              ? "Enter your email to receive a one-time code"
              : `We sent a 6-digit code to ${email}`}
          </p>
        </div>

        {/* Form */}
        <div className="w-full">
          {error && (
            <div className="mb-4 text-red-600 text-xs bg-red-50 p-3 rounded-lg text-center border border-red-200">
              {error}
            </div>
          )}

          {step === "email" ? (
            <motion.form
              onSubmit={handleEmailSubmit}
              className="space-y-6"
              layout
              transition={{ duration: 0.5, ease: "easeInOut" }}
            >
              <motion.div
                className="space-y-2"
                layout
                transition={{ duration: 0.5, ease: "easeInOut" }}
              >
                <label className="text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-all"
                  required
                />
              </motion.div>

              <motion.button
                type="submit"
                disabled={loading}
                className="w-full bg-black text-white font-semibold py-3 rounded-lg hover:bg-gray-800 transition-colors active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                layout
                transition={{ duration: 0.5, ease: "easeInOut" }}
              >
                {loading ? "Sending OTP..." : "Continue"}
              </motion.button>
            </motion.form>
          ) : (
            <div className="space-y-6">
              <div className="flex justify-between gap-2" onPaste={handlePaste}>
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => {
                      inputRefs.current[index] = el;
                    }}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-12 h-14 bg-white border-2 border-gray-300 rounded-lg text-center text-xl font-bold text-gray-900 focus:outline-none focus:border-black transition-all"
                  />
                ))}
              </div>
              <button
                onClick={handleVerify}
                disabled={loading}
                className="w-full bg-black text-white font-semibold py-3 rounded-lg hover:bg-gray-800 transition-colors active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Verifying..." : "Verify Code"}
              </button>
              <button
                onClick={() => setStep("email")}
                className="w-full text-sm text-gray-500 hover:text-gray-700 transition-colors"
                disabled={loading}
              >
                Wrong email? Go back
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SigninPage() {
  return <Signin />;
}
