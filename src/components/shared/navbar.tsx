"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useAuthUser } from "@/hooks/useAuthUser";

const NavbarData = [
  {
    name: "Home",
    href: "http://crazyui.com/",
  },
  {
    name: "Components",
    href: "https://crazyui.com/components-category/figma-herosection",
  },
  {
    name: "Templates",
    href: "http://crazyui.com/templates",
  },
  {
    name: "Pricing",
    href: "http://crazyui.com/pricing",
  },
];

function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isAuthenticated, loading, clearUser } = useAuthUser();

  const handleLogout = () => {
    clearUser();
  };

  return (
    <nav className="relative top-0 left-0 right-0 bg-white border-b border-gray-200 z-50">
      <div className="w-full mx-auto px-10 ">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="http://crazyui.com/">
              <span className="text-xl font-bold text-black w-24">
                <img src="/image.png" alt="crazyui_logo" className="w-24" />
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8 absolute left-1/2 transform -translate-x-1/2">
            {NavbarData.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="text-sm text-gray-700 hover:text-black transition-colors"
              >
                {item.name}
              </a>
            ))}
          </div>

          {/* Desktop CTA Button */}
          <div className="flex gap-5">
            {!loading && (
              <>
                {isAuthenticated ? (
                  <>
                    <div className="hidden md:block">
                      <Link href="http://crazyui.com/account">
                        <button className="text-black border border-gray-300 px-5 py-2 rounded-lg text-sm font-medium cursor-pointer hover:bg-gray-50 transition-colors">
                          Account
                        </button>
                      </Link>
                    </div>
                    <div className="hidden md:block">
                      <Link href="http://crazyui.com/templates">
                        <button className="bg-black text-white px-5 py-2 rounded-lg text-sm font-medium cursor-pointer hover:bg-gray-800 transition-colors">
                          Explore Collection
                        </button>
                      </Link>
                    </div>

                  </>
                ) : (
                  <>
                    <div className="hidden md:block">
                      <Link href="/signin">
                        <button className="text-black border border-gray-300 px-5 py-2 rounded-lg text-sm font-medium cursor-pointer hover:bg-gray-50 transition-colors">
                          Sign In
                        </button>
                      </Link>
                    </div>
                    <div className="hidden md:block">
                      <Link href="http://crazyui.com/pricing">
                        <button className="bg-black text-white px-5 py-2 rounded-lg text-sm font-medium cursor-pointer hover:bg-gray-800 transition-colors">
                          Become Member
                        </button>
                      </Link>
                    </div>
                  </>
                )}
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-700 hover:text-black focus:outline-none p-2"
            >
              <div className="w-6 h-6 relative flex items-center justify-center">
                <motion.span
                  animate={
                    isMobileMenuOpen
                      ? { rotate: 45, translateY: 0 }
                      : { rotate: 0, translateY: -8 }
                  }
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="w-full h-0.5 bg-current block absolute top-1/2 left-0"
                  style={{ transformOrigin: "center" }}
                />
                <motion.span
                  animate={
                    isMobileMenuOpen
                      ? { rotate: -45, translateY: 0 }
                      : { rotate: 0, translateY: 8 }
                  }
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="w-full h-0.5 bg-current block absolute top-1/2 left-0"
                  style={{ transformOrigin: "center" }}
                />
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            className="md:hidden absolute top-16 left-0 right-0 bg-white border-b border-gray-200 shadow-lg z-50 overflow-hidden"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className="px-2 pt-2 pb-10 space-y-1">
              {NavbarData.map((item, index) => (
                <motion.a
                  key={item.name}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, delay: 0.05 * index }}
                  href={item.href}
                  className="block px-3 py-2 text-sm text-gray-700 hover:text-black hover:bg-gray-50 rounded-md transition-colors"
                >
                  {item.name}
                </motion.a>
              ))}

              <div className="border-t border-gray-200 mt-4 pt-4">
                {!loading && (
                  <>
                    {isAuthenticated ? (
                      <>
                        <Link href="http://crazyui.com/account">
                          <motion.button
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3, delay: 0.25 }}
                            className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:text-black hover:bg-gray-50 rounded-md transition-colors"
                          >
                            Account
                          </motion.button>
                        </Link>
                        <Link href="http://crazyui.com/templates">
                          <motion.button
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3, delay: 0.3 }}
                            className="w-full px-3 py-2 text-sm bg-black text-white rounded-lg mt-2"
                          >
                            Explore Collection
                          </motion.button>
                        </Link>
                      
                      </>
                    ) : (
                      <>
                        <Link href="/signin">
                          <motion.button
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3, delay: 0.25 }}
                            className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:text-black hover:bg-gray-50 rounded-md transition-colors"
                          >
                            Sign In
                          </motion.button>
                        </Link>
                        <Link href="http://crazyui.com/pricing">
                          <motion.button
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3, delay: 0.3 }}
                            className="w-full px-3 py-2 text-sm bg-black text-white rounded-lg mt-2"
                          >
                            Become Member
                          </motion.button>
                        </Link>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

export default Navbar;
