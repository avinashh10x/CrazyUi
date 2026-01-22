import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { signInWithEmail, verifyOtpCode } from "../lib/supabase";

function Signin() {
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState<string[]>(new Array(6).fill(""));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Focus first input when OTP step loads
  useEffect(() => {
    if (step === "otp") {
      inputRefs.current[0]?.focus();
    }
  }, [step]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (email) {
      setLoading(true);
      const { error } = await signInWithEmail(email);
      setLoading(false);

      if (error) {
        setError(error.message);
      } else {
        setStep("otp");
      }
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (isNaN(Number(value))) return;

    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    // Move to next input if value is entered
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6).split("");
    if (pastedData.every((char) => !isNaN(Number(char)))) {
      const newOtp = [...otp];
      pastedData.forEach((char, index) => {
        if (index < 6) newOtp[index] = char;
      });
      setOtp(newOtp);

      // Focus the input after the last pasted character
      const focusIndex = Math.min(pastedData.length, 5);
      inputRefs.current[focusIndex]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "Enter") {
      handleVerify();
    }
  };

  const handleVerify = async () => {
    const token = otp.join("");
    if (token.length === 6) {
      setLoading(true);
      setError("");
      const { data, error } = await verifyOtpCode(email, token);
      setLoading(false);

      if (error) {
        setError(error.message);
      } else if (data.session) {
        const accessToken = encodeURIComponent(data.session.access_token);
        window.location.href = `${import.meta.env.VITE_REDIRECT_URL}?token=${accessToken}`;
      }
    }
  };

  return (
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
            <label className="text-sm font-medium text-gray-700">Email</label>
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
  );
}

export default Signin;
