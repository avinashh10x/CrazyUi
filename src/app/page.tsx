"use client";

import { useEffect, useState } from "react";
import { supabaseClient } from "@/lib/supabase-client";
import { motion } from "framer-motion";
import Link from "next/link";

export default function HomePage() {
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    const redirect = async () => {
      try {
        const {
          data: { session },
        } = await supabaseClient.auth.getSession();

        if (session?.user) {
          // Signed in — fetch user details and forward to external site
          const res = await fetch("/api/user/me", {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          });

          const params = new URLSearchParams();
          params.append("userId", session.user.id);
          params.append("email", session.user.email || "");

          if (res.ok) {
            const data = await res.json();
            if (data.user) {
              params.append("name", data.user.name || "");
              params.append("phone", data.user.phone || "");
              params.append(
                "membership_status",
                data.user.membership_status || "",
              );
            }
          }

          // window.location.href = `${process.env.NEXT_PUBLIC_REDIRECT_URL}?${params.toString()}`;

          // After 10 seconds, show the welcome screen
          setTimeout(() => {
            setShowWelcome(true);
          }, 5000);
        } else {
          // Not signed in — go to signin page
          window.location.href = "/signin";
        }
      } catch {
        window.location.href = "/signin";
      }
    };

    redirect();
  }, []);

  if (showWelcome) {
    return (
      <div className="min-h-[calc(100vh-5rem)] bg-white flex items-center justify-center p-4">
        <motion.div
          className="max-w-md w-full text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <div className="mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Welcome to CrazyUI
            </h1>
            <p className="text-gray-500 text-sm leading-relaxed">
              You have successfully joined the membership. Enjoy unlimited
              access to premium components, templates, and exclusive resources.
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              href={"https://crazyui.com/"}
              className="flex-1 bg-gray-900 text-white font-semibold py-2.5 rounded-lg hover:bg-gray-800 transition-colors text-sm"
            >
              Home
            </Link>
            <Link
              href={
                `${process.env.NEXT_PUBLIC_REDIRECT_URL}` || "/account"
              }
              className="flex-1 bg-white text-gray-900 font-semibold py-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-sm"
            >
              Account
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-2 border-black border-t-transparent"></div>
    </div>
  );
}
