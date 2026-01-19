import React, { useState, useRef, useEffect } from "react";
import { signInWithEmail, verifyOtpCode } from "../lib/supabase";

function Signup() {
  const [step, setStep] = useState<"details" | "otp">("details");
  const [name, setName] = useState("");
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

  const handleDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (email && name) {
      setLoading(true);
      // Supabase's signInWithOtp handles both sign up and sign in
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
        // Here you would typically update the user's profile with 'name'
        // await updateProfile(data.user.id, { full_name: name });
        const accessToken = encodeURIComponent(data.session.access_token);
        // FORCE REDIRECT - NO ALERT
        window.location.href = `https://positive-sheet-237822.framer.app/?token=${accessToken}`;
      }
    }
  };

  return (
    <div className="w-full">
      {/* Content Transition */}
      <div className="relative">
        {error && (
          <div className="mb-4 text-red-400 text-xs bg-red-900/20 p-2 rounded-lg text-center border border-red-900/50">
            {error}
          </div>
        )}

        {step === "details" ? (
          <form
            onSubmit={handleDetailsSubmit}
            className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500"
          >
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all text-white"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all text-white"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-gradient-to-r from-pink-600 to-orange-600 hover:from-pink-500 hover:to-orange-500 text-white font-semibold py-3.5 rounded-xl shadow-lg transition-transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Sending OTP..." : "Join the Madness"}
            </button>
          </form>
        ) : (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
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
                  className="w-12 h-14 bg-black/20 border border-white/10 rounded-lg text-center text-xl font-bold text-white focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all caret-pink-500"
                />
              ))}
            </div>
            <button
              onClick={handleVerify}
              disabled={loading}
              className="w-full bg-white text-black font-bold py-3.5 rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Verifying..." : "Verify & Create Account"}
            </button>
            <button
              onClick={() => setStep("details")}
              disabled={loading}
              className="w-full text-xs text-gray-500 hover:text-white transition-colors"
            >
              Wrong details? Go back
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Signup;
