"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { supabaseClient } from "@/lib/supabase-client";
import Link from "next/link";

interface UserData {
  id: string;
  email: string;
  name: string;
  phone: string;
  membership_status: string;
}

interface Payment {
  order_id: string;
  cf_payment_id: string;
  email: string;
  amount: number;
  status: string;
  created_at: string;
}

export default function HomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const {
        data: { session },
      } = await supabaseClient.auth.getSession();

      if (session?.user) {
        setIsLoggedIn(true);

        // Fetch user details from our API
        const res = await fetch("/api/user/me", {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          setUserData(data.user);
          setPayments(data.payments);
        }
      }
    } catch (err) {
      console.error("Auth check failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabaseClient.auth.signOut();
    setIsLoggedIn(false);
    setUserData(null);
    setPayments([]);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-black border-t-transparent"></div>
      </div>
    );
  }

  // ─── LOGGED IN: Account Page ───
  if (isLoggedIn && userData) {
    const isPremium = userData.membership_status === "active";

    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
            <img src="/logo.png" alt="CrazyUI" className="w-24" />
            <button
              onClick={handleSignOut}
              className="text-sm text-gray-500 hover:text-black transition-colors"
            >
              Sign Out
            </button>
          </div>
        </header>

        <div className="max-w-4xl mx-auto px-4 py-10">
          {/* Welcome */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <h1 className="text-3xl font-bold text-gray-900 mb-1">
              Welcome back, {userData.name || "User"}
            </h1>
            <p className="text-gray-500 text-sm">{userData.email}</p>
          </motion.div>

          {/* Membership Status */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="mt-8"
          >
            <div
              className={`rounded-2xl p-6 border ${isPremium
                  ? "bg-gradient-to-r from-black to-gray-800 text-white border-transparent"
                  : "bg-white border-gray-200"
                }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p
                    className={`text-xs font-medium uppercase tracking-wider ${isPremium ? "text-gray-400" : "text-gray-500"
                      }`}
                  >
                    Membership
                  </p>
                  <p className="text-xl font-bold mt-1">
                    {isPremium ? "Premium Active ✨" : "Free Plan"}
                  </p>
                </div>
                {isPremium ? (
                  <div className="bg-green-500/20 text-green-400 text-xs font-semibold px-3 py-1 rounded-full">
                    ACTIVE
                  </div>
                ) : (
                  <Link
                    href="/membership"
                    className="bg-black text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    Upgrade
                  </Link>
                )}
              </div>
              {isPremium && (
                <p className="text-gray-400 text-sm mt-3">
                  Lifetime access to all premium components & templates
                </p>
              )}
            </div>
          </motion.div>

          {/* User Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="mt-6"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Account Details
            </h2>
            <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100">
              <div className="flex justify-between items-center px-6 py-4">
                <span className="text-sm text-gray-500">Name</span>
                <span className="text-sm font-medium text-gray-900">
                  {userData.name || "—"}
                </span>
              </div>
              <div className="flex justify-between items-center px-6 py-4">
                <span className="text-sm text-gray-500">Email</span>
                <span className="text-sm font-medium text-gray-900">
                  {userData.email}
                </span>
              </div>
              <div className="flex justify-between items-center px-6 py-4">
                <span className="text-sm text-gray-500">Phone</span>
                <span className="text-sm font-medium text-gray-900">
                  {userData.phone || "—"}
                </span>
              </div>
              <div className="flex justify-between items-center px-6 py-4">
                <span className="text-sm text-gray-500">Status</span>
                <span
                  className={`text-sm font-semibold ${isPremium ? "text-green-600" : "text-gray-400"
                    }`}
                >
                  {isPremium ? "Premium Member" : "Free"}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Payment History */}
          {payments.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="mt-6"
            >
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Payment History
              </h2>
              <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100">
                {payments.map((payment) => (
                  <div
                    key={payment.cf_payment_id}
                    className="flex items-center justify-between px-6 py-4"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        ₹{payment.amount}
                      </p>
                      <p className="text-xs text-gray-400 font-mono mt-0.5">
                        {payment.order_id}
                      </p>
                    </div>
                    <div className="text-right">
                      <span
                        className={`text-xs font-semibold px-2 py-1 rounded-full ${payment.status === "SUCCESS"
                            ? "bg-green-50 text-green-600"
                            : "bg-red-50 text-red-600"
                          }`}
                      >
                        {payment.status}
                      </span>
                      {payment.created_at && (
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(payment.created_at).toLocaleDateString(
                            "en-IN",
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            }
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    );
  }

  // ─── NOT LOGGED IN: Premium Plan CTA ───
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <img src="/logo.png" alt="CrazyUI" className="w-24" />
          <Link
            href="/signin"
            className="text-sm font-medium text-gray-700 hover:text-black transition-colors"
          >
            Sign In
          </Link>
        </div>
      </header>

      {/* Hero */}
      <div className="max-w-3xl mx-auto px-4 pt-20 pb-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-block bg-black text-white text-xs font-semibold px-4 py-1.5 rounded-full mb-6">
            LIFETIME ACCESS
          </div>
          <h1 className="text-5xl font-bold text-gray-900 leading-tight mb-4">
            Premium UI Components
            <br />
            <span className="text-gray-400">for Modern Developers</span>
          </h1>
          <p className="text-lg text-gray-500 max-w-xl mx-auto mb-10">
            Get access to beautifully crafted, production-ready UI components
            and templates. One payment, lifetime access.
          </p>
        </motion.div>

        {/* Pricing Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="max-w-3xl mx-auto flex md:flex-row gap-4"
        >
          <div className="bg-white rounded-2xl border-2 border-black p-8 flex-1">
            <p className="text-sm font-medium text-gray-500 mb-1">
              One-Time Payment
            </p>
            <div className="flex items-baseline justify-center mb-6">
              <span className="text-5xl font-bold text-gray-900">
                ₹{process.env.NEXT_PUBLIC_MEMBERSHIP_AMOUNT || "999"}
              </span>
              <span className="text-gray-400 ml-2 text-sm">/ lifetime</span>
            </div>

            <ul className="text-left space-y-3 mb-8">
              {[
                "All premium components",
                "All templates & layouts",
                "Lifetime updates",
                "Priority support",
                "Commercial license",
              ].map((feature) => (
                <li
                  key={feature}
                  className="flex items-center text-sm text-gray-700"
                >
                  <svg
                    className="w-4 h-4 text-green-500 mr-3 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>

            <Link
              href="/membership"
              className="block w-full bg-black text-white font-semibold py-3 rounded-lg text-center hover:bg-gray-800 transition-colors active:scale-[0.98]"
            >
              Get Premium Access
            </Link>

            <p className="text-xs text-gray-400 mt-4">
              Secure payment via Cashfree
            </p>
          </div>
          <div className="bg-white rounded-2xl border-2 border-black p-8 flex-1">
            <p className="text-sm font-medium text-gray-500 mb-1">
              One-Time Payment
            </p>
            <div className="flex items-baseline justify-center mb-6">
              <span className="text-5xl font-bold text-gray-900">
                ₹{process.env.NEXT_PUBLIC_MEMBERSHIP_AMOUNT || "999"}
              </span>
              <span className="text-gray-400 ml-2 text-sm">/ lifetime</span>
            </div>

            <ul className="text-left space-y-3 mb-8">
              {[
                "All premium components",
                "All templates & layouts",
                "Lifetime updates",
                "Priority support",
                "Commercial license",
              ].map((feature) => (
                <li
                  key={feature}
                  className="flex items-center text-sm text-gray-700"
                >
                  <svg
                    className="w-4 h-4 text-green-500 mr-3 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>

            <Link
              href="/membership"
              className="block w-full bg-black text-white font-semibold py-3 rounded-lg text-center hover:bg-gray-800 transition-colors active:scale-[0.98]"
            >
              Get Premium Access
            </Link>

            <p className="text-xs text-gray-400 mt-4">
              Secure payment via Cashfree
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
