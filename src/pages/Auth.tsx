import React, { useState } from "react";
import Signin from "./Signin";
import Signup from "./SignUp";

function Auth() {
  const [activeTab, setActiveTab] = useState<"signin" | "signup">("signin");

  return (
    <div className="min-h-screen w-full bg-black flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background Ambience */}
      <div
        className={`absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] transition-colors duration-1000 ${activeTab === "signin" ? "bg-purple-600/30" : "bg-orange-600/30"}`}
      />
      <div
        className={`absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] transition-colors duration-1000 ${activeTab === "signin" ? "bg-blue-600/30" : "bg-pink-600/30"}`}
      />

      {/* Main Card */}
      <div className="w-full max-w-md bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl relative z-10 transition-all duration-300">
        {/* Header & Tabs */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent mb-6 animate-pulse">
            CRAZY UI
          </h1>

          <div className="flex p-1 bg-black/40 rounded-xl relative">
            {/* Sliding Background for Tabs */}
            <div
              className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white/10 rounded-lg transition-all duration-300 ease-out border border-white/5 shadow-inner ${
                activeTab === "signin" ? "left-1" : "left-[calc(50%+4px)]"
              }`}
            />

            <button
              onClick={() => setActiveTab("signin")}
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg relative z-10 transition-colors duration-300 ${
                activeTab === "signin"
                  ? "text-white"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setActiveTab("signup")}
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg relative z-10 transition-colors duration-300 ${
                activeTab === "signup"
                  ? "text-white"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              Sign Up
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="relative overflow-hidden min-h-[300px]">
          {activeTab === "signin" && (
            <div className="animate-in fade-in zoom-in-95 duration-300">
              <p className="text-gray-400 text-sm text-center mb-6">
                Welcome back, legend.
              </p>
              <Signin />
            </div>
          )}
          {activeTab === "signup" && (
            <div className="animate-in fade-in zoom-in-95 duration-300">
              <p className="text-gray-400 text-sm text-center mb-6">
                Join the crazy side.
              </p>
              <Signup />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Auth;
