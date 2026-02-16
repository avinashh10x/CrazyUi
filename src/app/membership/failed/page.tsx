'use client';

import Link from 'next/link';

export default function FailedPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 dark:from-gray-900 dark:via-black dark:to-red-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md text-center">
                {/* Error Icon */}
                <div className="mb-6 flex justify-center">
                    <div className="bg-red-100 dark:bg-red-900/30 rounded-full p-6">
                        <svg
                            className="w-16 h-16 text-red-600 dark:text-red-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </div>
                </div>

                {/* Error Message */}
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                    Payment Failed
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
                    We couldn't process your payment. Please try again or contact support if the issue persists.
                </p>

                {/* Common Reasons */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 mb-8 border border-gray-200 dark:border-gray-700 text-left">
                    <h2 className="font-semibold text-gray-900 dark:text-white mb-4">
                        Common Reasons
                    </h2>
                    <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                        <li className="flex items-start">
                            <span className="text-red-500 mr-2">•</span>
                            <span>Insufficient funds in your account</span>
                        </li>
                        <li className="flex items-start">
                            <span className="text-red-500 mr-2">•</span>
                            <span>Incorrect card details or expired card</span>
                        </li>
                        <li className="flex items-start">
                            <span className="text-red-500 mr-2">•</span>
                            <span>Payment declined by your bank</span>
                        </li>
                        <li className="flex items-start">
                            <span className="text-red-500 mr-2">•</span>
                            <span>Network or connection issues</span>
                        </li>
                    </ul>
                </div>

                {/* CTA Buttons */}
                <div className="space-y-3">
                    <Link
                        href="/membership"
                        className="block w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                        Try Again
                    </Link>
                    <Link
                        href="/"
                        className="block w-full border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium py-3 px-6 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                    >
                        Back to Home
                    </Link>
                    <a
                        href="mailto:support@crazyui.com"
                        className="block w-full text-indigo-600 dark:text-indigo-400 font-medium py-3 px-6 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition"
                    >
                        Contact Support
                    </a>
                </div>
            </div>
        </div>
    );
}
