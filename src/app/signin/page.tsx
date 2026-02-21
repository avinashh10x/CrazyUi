"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import {
  signInWithEmail,
  verifyOtpCode,
  supabaseClient,
} from "@/lib/supabase-client";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { useAuthUser, type StoredUser } from "@/hooks/useAuthUser";

function Signin() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { saveUser, clearUser } = useAuthUser();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [step, setStep] = useState<"email" | "otp">("email");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Handle logout event from query params
  useEffect(() => {
    const event = searchParams.get("event");
    if (event === "logout") {
      const performLogout = async () => {
        // Clear localStorage
        localStorage.clear();

        // Clear user from auth hook
        clearUser();

        // Sign out from Supabase (clears session & cookies)
        await supabaseClient.auth.signOut();

        // Clear all cookies
        const cookies = document.cookie.split(";");
        for (const cookie of cookies) {
          const eqPos = cookie.indexOf("=");
          const name = eqPos > -1 ? cookie.substring(0, eqPos) : cookie;
          document.cookie =
            name.trim() + "=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;";
        }

        // Clean the URL to remove query params
        window.history.replaceState({}, document.title, "/signin");
      };

      performLogout();
    }
  }, [searchParams, clearUser]);

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
    <div className="min-h-[calc(100vh-5rem)] bg-gray-50 flex items-center justify-center p-4">
      <motion.div
        className="w-full max-w-sm relative rounded-3xl outline outline-gray-500/20 shadow-lg border-8 border-gray-100 overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        {/* Decorative Banner */}
        <div className="h-36 w-full z-4  overflow-hidden">
          <img src="/signin.png" />
        </div>

        {/* Form Content */}
        <div className="px-8 py-6 rounded-tr-2xl  rounded-tl-2xl -translate-y-5 bg-white">
          <h2 className="text-xl font-bold text-gray-900 mb-1">
            {step === "email" ? "Sign in" : "Enter verification code"}
          </h2>
          <p className="text-sm text-gray-400 mb-6">
            {step === "email"
              ? "Enter your email to receive a one-time code"
              : `We sent a 6-digit code to ${email}`}
          </p>

          {error && (
            <div className="mb-4 text-red-600 text-xs bg-red-50 p-3 rounded-lg text-center border border-red-200">
              {error}
            </div>
          )}

          {step === "email" ? (
            <motion.form
              onSubmit={handleEmailSubmit}
              className="space-y-5"
              layout
              transition={{ duration: 0.4, ease: "easeInOut" }}
            >
              <motion.div
                className="space-y-1.5"
                layout
                transition={{ duration: 0.4, ease: "easeInOut" }}
              >
                <label className="text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  className="w-full bg-white border border-gray-400 rounded-lg px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-all text-sm"
                  required
                />
              </motion.div>

              <motion.button
                type="submit"
                disabled={loading}
                className="w-full bg-gray-900 text-white font-semibold py-2.5 rounded-lg hover:bg-gray-800 transition-colors active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                layout
                transition={{ duration: 0.4, ease: "easeInOut" }}
              >
                {loading ? "Sending OTP..." : "Continue"}
              </motion.button>
            </motion.form>
          ) : (
            <motion.div
              className="space-y-5"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
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
                    className="w-11 h-12 bg-white border border-gray-200 rounded-lg text-center text-lg font-bold text-gray-900 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all"
                  />
                ))}
              </div>
              <button
                onClick={handleVerify}
                disabled={loading}
                className="w-full bg-gray-900 text-white font-semibold py-2.5 rounded-lg hover:bg-gray-800 transition-colors active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {loading ? "Verifying..." : "Verify Code"}
              </button>
              <button
                onClick={() => setStep("email")}
                className="w-full text-xs text-gray-400 hover:text-gray-600 transition-colors"
                disabled={loading}
              >
                Wrong email? Go back
              </button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

import { Suspense } from "react";

export default function SigninPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-black border-t-transparent"></div>
        </div>
      }
    >
      <Signin />
    </Suspense>
  );
}
