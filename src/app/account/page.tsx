"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

function AccountContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id");

  const [loading, setLoading] = useState(true);
  const [payment, setPayment] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }

    const verifyPayment = async () => {
      try {
        setLoading(true);

        // Call our verify endpoint — this handles:
        // 1. Already processed → returns existing data
        // 2. Not processed yet → calls Cashfree API, creates user/auth/payment
        const response = await fetch("/api/order/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order_id: orderId }),
        });

        const data = await response.json();

        if (!response.ok) {
          // If verify failed and we haven't retried much, wait and try again
          // (webhook might still be processing)
          if (retryCount < 3) {
            console.log(
              `Verify attempt ${retryCount + 1} failed, retrying in 3s...`,
            );
            setTimeout(() => {
              setRetryCount((prev) => prev + 1);
            }, 3000);
            return;
          }
          setError(data.error || "Could not verify payment");
          setLoading(false);
          return;
        }

        if (data.status === "not_paid") {
          setError("Payment was not completed. Please try again.");
          setLoading(false);
          return;
        }

        // Payment is either "already_processed" or "processed"
        setPayment({
          order_id: orderId,
          status: data.payment_status,
          amount: data.user?.payment_id ? "Paid" : "N/A",
        });
        setUser(data.user);
        setLoading(false);
      } catch (err: any) {
        console.error("Verify error:", err);
        if (retryCount < 3) {
          setTimeout(() => {
            setRetryCount((prev) => prev + 1);
          }, 3000);
          return;
        }
        setError(err.message || "Something went wrong");
        setLoading(false);
      }
    };

    verifyPayment();
  }, [orderId, retryCount]);

  if (!orderId) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold text-red-600">No Order ID Found</h1>
        <p className="mt-2 text-gray-600">Please complete a payment first.</p>
        <Link href="/" className="mt-4 text-blue-600 hover:underline">
          Go Home
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
        <div className="max-w-lg w-full text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
            <svg
              className="animate-spin h-8 w-8 text-gray-600"
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
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            Verifying your payment...
          </h1>
          <p className="text-gray-500 text-sm">
            {retryCount > 0
              ? `Attempt ${retryCount + 1}... Please wait.`
              : "This may take a few seconds."}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
        <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-gray-100">
          <div className="w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6 bg-red-100">
            <svg
              className="w-10 h-10 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
            Payment Issue
          </h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            href="/membership"
            className="inline-block w-full py-3 px-6 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition shadow-lg"
          >
            Try Again
          </Link>
        </div>
      </div>
    );
  }

  const isSuccess =
    payment?.status?.toUpperCase() === "SUCCESS" || payment?.status === "PAID";

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-gray-100">
        <div
          className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6 ${isSuccess ? "bg-green-100" : "bg-red-100"}`}
        >
          {isSuccess ? (
            <svg
              className="w-10 h-10 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
          ) : (
            <svg
              className="w-10 h-10 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          )}
        </div>

        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
          {isSuccess ? "Membership Active!" : "Payment Failed"}
        </h1>

        <p className="text-gray-600 mb-6">
          {isSuccess
            ? `Welcome aboard, ${user?.name || user?.email || ""}! Your membership is now active.`
            : "There was an issue processing your payment. Please try again."}
        </p>

        {isSuccess && (
          <div className="bg-gray-50 rounded-lg p-4 text-left mb-6">
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="text-gray-500">Order ID</span>
              <span className="font-mono font-medium text-gray-900 text-sm">
                {payment.order_id}
              </span>
            </div>
            {user?.email && (
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-gray-500">Email</span>
                <span className="font-medium text-gray-900">{user.email}</span>
              </div>
            )}
            <div className="flex justify-between py-2">
              <span className="text-gray-500">Status</span>
              <span className="text-green-600 font-bold">Active</span>
            </div>
          </div>
        )}

        <Link
          href="/"
          className="inline-block w-full py-3 px-6 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition shadow-lg"
        >
          {isSuccess ? "Go to Dashboard" : "Try Again"}
        </Link>
      </div>
    </div>
  );
}

export default function AccountPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          Loading...
        </div>
      }
    >
      <AccountContent />
    </Suspense>
  );
}
