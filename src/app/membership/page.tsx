"use client";

import { useState, useEffect } from "react";
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

export default function MembershipPage() {
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

      if (!data.success) {
        setError(data.error || "Failed to create order");
        setLoading(false);
        return;
      }

      // Load Cashfree SDK
      const CashfreeSDK = await loadCashfreeSDK();

      // Initialize with production mode (change to "sandbox" for testing)
      const cashfree = CashfreeSDK({ mode: "production" });

      // Initialize checkout
      const checkoutOptions = {
        paymentSessionId: data.paymentSessionId,
        returnUrl: `${window.location.origin}/?order_id=${data.orderId}`,
      };

      cashfree.checkout(checkoutOptions);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Join CrazyUI - {plan.name}
          </h1>
          <p className="text-gray-500">{plan.description}</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl p-8 border-2 border-black">
          {/* Price Badge */}
          <div className="bg-black text-white rounded-xl p-6 mb-6 text-center">
            <div className="text-sm font-medium mb-1 opacity-80">
              Membership Fee - {plan.name}
            </div>
            <div className="text-4xl font-bold">₹{plan.amount}</div>
            <div className="text-sm opacity-60 mt-1">One-time payment</div>
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
                className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 text-gray-900 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition"
                placeholder="John Doe"
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
                className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 text-gray-900 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition"
                placeholder="john@example.com"
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
                className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 text-gray-900 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition"
                placeholder="9999999999"
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
                "Pay & Join CrazyUI"
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
            Secure payment powered by Cashfree
          </div>
        </div>
      </div>
    </div>
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
