'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

function SuccessContent() {
    const searchParams = useSearchParams();
    const orderId = searchParams.get('order_id');

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-gray-900 dark:via-black dark:to-green-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md text-center">
                {/* Success Icon */}
                <div className="mb-6 flex justify-center">
                    <div className="bg-green-100 dark:bg-green-900/30 rounded-full p-6">
                        <svg
                            className="w-16 h-16 text-green-600 dark:text-green-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                            />
                        </svg>
                    </div>
                </div>

                {/* Success Message */}
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                    Welcome to CrazyUI! 🎉
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
                    Your payment was successful and your membership is now active.
                </p>

                {/* Order Details */}
                {orderId && (
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 mb-8 border border-gray-200 dark:border-gray-700">
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Order ID</p>
                        <p className="font-mono text-sm text-gray-900 dark:text-white break-all">
                            {orderId}
                        </p>
                    </div>
                )}

                {/* Next Steps */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 mb-8 border border-gray-200 dark:border-gray-700 text-left">
                    <h2 className="font-semibold text-gray-900 dark:text-white mb-4">
                        What's Next?
                    </h2>
                    <ul className="space-y-3 text-gray-600 dark:text-gray-400">
                        <li className="flex items-start">
                            <svg
                                className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                    clipRule="evenodd"
                                />
                            </svg>
                            <span>Check your email for confirmation and login details</span>
                        </li>
                        <li className="flex items-start">
                            <svg
                                className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                    clipRule="evenodd"
                                />
                            </svg>
                            <span>Access all premium UI components and templates</span>
                        </li>
                        <li className="flex items-start">
                            <svg
                                className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                    clipRule="evenodd"
                                />
                            </svg>
                            <span>Join our community and get support</span>
                        </li>
                    </ul>
                </div>

                {/* CTA Buttons */}
                <div className="space-y-3">
                    <Link
                        href="/"
                        className="block w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                        Go to Dashboard
                    </Link>
                    <Link
                        href="/"
                        className="block w-full border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium py-3 px-6 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                    >
                        Back to Home
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default function SuccessPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
        }>
            <SuccessContent />
        </Suspense>
    );
}
