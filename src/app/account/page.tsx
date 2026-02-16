import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams; // Next.js 15+ needs await
  const orderId = params.order_id as string;

  if (!orderId) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold text-red-600">No Order ID Found</h1>
        <p className="mt-2 text-gray-600">
          Please complete a payment verification first.
        </p>
        <Link href="/" className="mt-4 text-blue-600 hover:underline">
          Go Home
        </Link>
      </div>
    );
  }

  // Fetch payment status
  const { data: payment, error } = await supabase
    .from("payments")
    .select("*")
    .eq("order_id", orderId)
    .single();

  if (error || !payment) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold text-yellow-600">
          Payment Not Found
        </h1>
        <p className="mt-2 text-gray-600">
          We could not find a record for Order ID:{" "}
          <span className="font-mono">{orderId}</span>
        </p>
        <p className="mt-2 text-sm text-gray-500">
          Wait a moment if you just paid, webhooks might differ.
        </p>
        <Link href="/" className="mt-4 text-blue-600 hover:underline">
          Go Home
        </Link>
      </div>
    );
  }

  const isSuccess = payment.status === "SUCCESS";

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
              ></path>
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
              ></path>
            </svg>
          )}
        </div>

        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
          {isSuccess ? "Membership Active!" : "Payment Failed"}
        </h1>

        <p className="text-gray-600 mb-6">
          {isSuccess
            ? `Welcome aboard, ${payment.email}. Your membership is now active.`
            : "There was an issue processing your payment. Please try again."}
        </p>

        {isSuccess && (
          <div className="bg-gray-50 rounded-lg p-4 text-left mb-6">
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="text-gray-500">Order ID</span>
              <span className="font-mono font-medium text-gray-900">
                {payment.order_id}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="text-gray-500">Amount</span>
              <span className="font-medium text-gray-900">
                ₹{payment.amount}
              </span>
            </div>
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
