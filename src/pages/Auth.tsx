import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../components/Navbar";
import { signInWithEmail, verifyOtpCode } from "../lib/supabase";

function Auth() {
  const [activeTab, setActiveTab] = useState<"signin" | "signup">("signup");
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (activeTab === "signup" && !name) {
      setError("Please enter your name");
      return;
    }

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
    <div className="min-h-screen w-full bg-gray-50 font-sans">
      {/* Fixed Navbar */}
      <Navbar />

      {/* Announcement Banner */}
      <div className="fixed top-16 left-0 right-0 bg-black text-white text-center py-2 text-sm z-40">
        Framer Templates Launching soooon →
      </div>

      {/* Main Content */}
      <div className="pt-32 pb-12 px-4 flex items-center justify-center min-h-screen">
        {/* Centered Card */}
        <div className="w-full max-w-md bg-white rounded-3xl shadow-lg overflow-hidden border-white border-10 outline outline-black/10">
          {/* Gradient Wave Banner */}
          <div className="h-32 relative overflow-hidden">
            <div className="absolute inset-0">
              <img src="/image.png" alt="crazyUi_login_BG" />
            </div>
          </div>

          {/* Card Content */}
          <motion.div
            className="relative"
            layout
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <motion.div
              className="bg-white w-full p-4 -translate-y-5 rounded-2xl"
              layout
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <motion.h2
                className="text-2xl font-medium text-gray-900 mb-6"
                layout
                transition={{ duration: 0.3 }}
              >
                {activeTab === "signup" ? "Sign up" : "Sign in"}
              </motion.h2>

              {error && (
                <div className="mb-4 text-red-600 text-xs bg-red-50 p-3 rounded-lg text-center border border-red-200">
                  {error}
                </div>
              )}

              {step === "details" ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Name field - only for Sign Up, animated */}
                  <AnimatePresence initial={false}>
                    {activeTab === "signup" && (
                      <motion.div
                        key="name-field"
                        initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                        animate={{
                          opacity: 1,
                          height: "auto",
                          marginBottom: 16,
                        }}
                        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">
                            First name
                          </label>
                          <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="First name"
                            className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-all"
                            required={activeTab === "signup"}
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Email field - common for both, no animation */}
                  <div className="space-y-2">
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
                  </div>

                  {/* Continue button - common for both, no animation */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-black text-white font-semibold py-3 rounded-lg hover:bg-gray-800 transition-colors active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading
                      ? "Sending OTP..."
                      : activeTab === "signup"
                        ? "Sign Up"
                        : "Continue"}
                  </button>
                </form>
              ) : (
                <div className="space-y-6">
                  <div
                    className="flex justify-between gap-2"
                    onPaste={handlePaste}
                  >
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
                    {loading ? "Verifying..." : "Verify & Create Account"}
                  </button>
                  <button
                    onClick={() => setStep("details")}
                    disabled={loading}
                    className="w-full text-sm text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    Wrong details? Go back
                  </button>
                </div>
              )}

              {/* Toggle Link */}
              {/* {step === "details" && (
                <motion.div
                  className="mt-6 text-center text-sm text-gray-600 "
                  layout
                  transition={{ duration: 0.3 }}
                >
                  {activeTab === "signup" ? (
                    <>
                      Already have an account?{" "}
                      <button
                        onClick={() => setActiveTab("signin")}
                        className="text-black font-medium hover:underline cursor-pointer"
                      >
                        Sign In
                      </button>
                    </>
                  ) : (
                    <>
                      Don't have an account?{" "}
                      <button
                        onClick={() => setActiveTab("signup")}
                        className="text-black font-medium hover:underline cursor-pointer"
                      >
                        Sign Up
                      </button>
                    </>
                  )}
                </motion.div>
              )} */}
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default Auth;
