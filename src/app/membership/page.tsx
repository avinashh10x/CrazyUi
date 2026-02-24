"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type PlanType = "premium" | "premium-plus";

interface PlanConfig {
  name: string;
  amount: number;
  features: string[];
  description: string;
}

const PLANS: Record<PlanType, PlanConfig> = {
  premium: {
    name: "Premium",
    amount: parseFloat(process.env.NEXT_PUBLIC_PREMIUM_AMOUNT || "1"),
    description: "Perfect for individual designers",
    features: [
      "Access all UI components",
      "Figma component library",
      "Basic Framer sections",
      "Commercial usage license",
      "Future component updates",
    ],
  },
  "premium-plus": {
    name: "Premium Plus",
    amount: parseFloat(process.env.NEXT_PUBLIC_PREMIUM_PLUS_AMOUNT || "2"),
    description: "Built for growing teams & agencies",
    features: [
      "Everything in Premium",
      "Premium Framer templates",
      "Advanced layout sections",
      "Priority support",
      "Lifetime access",
    ],
  },
};

function MembershipContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Get plan from query parameter, default to 'premium'
  const planType = (searchParams.get("plan") as PlanType) || "premium";
  const plan = PLANS[planType] || PLANS.premium;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Create order
      const response = await fetch("/api/order/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          plan: planType, // Send plan type to backend
        }),
      });

      const data = await response.json();

      if (!data.payment_session_id) {
        setError(data.error || "Failed to create order");
        setLoading(false);
        return;
      }

      // Load Cashfree SDK
      const CashfreeSDK = await loadCashfreeSDK();

      // Initialize with sandbox mode (change to "production" for live)
      const cashfree = CashfreeSDK({ mode: "production" });

      // Initialize checkout
      const checkoutOptions = {
        paymentSessionId: data.payment_session_id,
        returnUrl: `${window.location.origin}/account?order_id=${data.order_id}`,
      };

      cashfree.checkout(checkoutOptions);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row px-10 lg:px-40 py-12  gap-10">
      <div className="flex flex-col lg:flex-row w-full mx-auto gap-10 justify-between mt-5">
        {/* ─── LEFT SIDE: Product Info ─── */}
        <div className="w-full lg:w-[45%]    flex flex-col justify-center ">
          <h1 className="text-2xl font-medium text-gray-900 mb-6">
            CrazyUI {plan.name}
          </h1>

          {/* Product visual */}
          <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden mb-8 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <span className="text-5xl font-black bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                  CrazyUI
                </span>
                <p className="text-sm text-indigo-400 font-medium mt-1">
                  {plan.name}
                </p>
              </div>
            </div>
          </div>

          <p className="text-gray-800 text-sm leading-relaxed mb-8">
            Simplify your design process with customizable Figma &amp; Framer
            components, templates, and design assets — giving you everything you
            need to design quickly and efficiently.
          </p>

          {/* Testimonials */}
          <div className="space-y-5 mb-8">
            <div>
              <p className="text-sm font-semibold text-gray-900">
                Hossein Fathi
                <span className="font-normal text-gray-500">
                  {" "}
                  — Professional UI/UX Designer
                </span>
              </p>
              <p className="text-sm text-gray-500 mt-1 italic leading-relaxed">
                &ldquo;CrazyUI has a wide variety of design on each component. A
                comprehensive products everyone should checkout.&rdquo;
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">
                Razvan Badea
                <span className="font-normal text-gray-500">
                  {" "}
                  — Founder of Artone Studio
                </span>
              </p>
              <p className="text-sm text-gray-500 mt-1 italic leading-relaxed">
                &ldquo;CrazyUI is a fantastic tool, not just for its resources
                but also for exploring fresh ideas. The components are well
                crafted. A must-have!&rdquo;
              </p>
            </div>
          </div>

          {/* Plan selector */}
          <div className="space-y-3">
            {(Object.entries(PLANS) as [PlanType, PlanConfig][]).map(
              ([key, p]) => {
                const isSelected = key === planType;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      const params = new URLSearchParams(
                        searchParams.toString(),
                      );
                      params.set("plan", key);
                      router.push(`/membership?${params.toString()}`);
                    }}
                    className={`w-full text-left rounded-xl border-2 p-4 transition-all ${
                      isSelected
                        ? "border-black bg-white"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                            isSelected ? "border-black" : "border-gray-300"
                          }`}
                        >
                          {isSelected && (
                            <div className="w-2.5 h-2.5 rounded-full bg-black" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            CrazyUI {p.name} — ₹{p.amount} Lifetime
                          </p>
                          <p className="text-xs text-gray-800 mt-0.5">
                            {p.features.slice(0, 3).join(", ")}
                          </p>
                        </div>
                      </div>
                      <span className="text-sm font-bold text-gray-900">
                        ₹{p.amount}
                      </span>
                    </div>
                  </button>
                );
              },
            )}
          </div>
        </div>

        {/* ─── RIGHT SIDE: Payment Form ─── */}
        <div className="w-full lg:w-[45%]  border-gray-200 flex flex-col justify-start items-center ">
          <div className="max-w-md mx-auto w-full">
            {/* Price summary */}
            <div className="mb-8">
              <h2 className="text-lg font-medium text-gray-900 mb-1">
                Complete your purchase
              </h2>
              <p className="text-sm text-gray-500">{plan.description}</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white text-gray-900 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition"
                  placeholder="Shivanand pandey"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white text-gray-900 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition"
                  placeholder="shivandand@crazyui.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  required
                  pattern="[0-9]{10}"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white text-gray-900 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition"
                  placeholder="9876543210"
                />
                <p className="text-xs text-gray-400 mt-1">
                  10 digits, no spaces or special characters
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {/* Subtotal / Total */}
              <div className="border-t border-gray-200 pt-4 space-y-2">
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Subtotal</span>
                  <span>₹{plan.amount}</span>
                </div>
                <div className="flex justify-between text-base font-bold text-gray-900">
                  <span>Total</span>
                  <span>₹{plan.amount}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-black hover:bg-gray-800 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin h-5 w-5 mr-3"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Processing...
                  </span>
                ) : (
                  `Pay ₹${plan.amount}`
                )}
              </button>
            </form>

            {/* Security Badge */}
            <div className="mt-6 flex items-center justify-center text-sm text-gray-400">
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              Payments are secure and encrypted
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MembershipPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          Loading...
        </div>
      }
    >
      <MembershipContent />
    </Suspense>
  );
}

// Load Cashfree SDK dynamically
function loadCashfreeSDK(): Promise<any> {
  return new Promise((resolve, reject) => {
    if ((window as any).Cashfree) {
      resolve((window as any).Cashfree);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
    script.async = true;
    script.onload = () => {
      if ((window as any).Cashfree) {
        resolve((window as any).Cashfree);
      } else {
        reject(new Error("Cashfree SDK failed to load"));
      }
    };
    script.onerror = () => reject(new Error("Failed to load Cashfree SDK"));
    document.head.appendChild(script);
  });
}
