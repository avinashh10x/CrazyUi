import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const NavbarData = [
  {
    name: "Home",
    href: "/",
  },
  {
    name: "Components",
    href: "/components",
  },
  {
    name: "Templates",
    href: "/templates",
  },
  {
    name: "Pricing",
    href: "/pricing",
  },
        ];

function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <a href="/" className="text-xl font-bold text-black w-24">
                <img src="/logo.png" alt="crazyui_logo" className="w-24" />
            </a>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
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
          <div className="hidden md:block">
            <button className="bg-black text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors">
              Explore Collection
            </button>
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
            className="md:hidden bg-white border-t border-gray-200 overflow-hidden"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className="px-2 pt-2 pb-10 space-y-1">
              <motion.a
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, delay: 0.05 }}
                href="/"
                className="block px-3 py-2 text-sm text-gray-700 hover:text-black hover:bg-gray-50 rounded-md transition-colors"
              >
                Home
              </motion.a>
              <motion.a
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                href="/components"
                className="block px-3 py-2 text-sm text-gray-700 hover:text-black hover:bg-gray-50 rounded-md transition-colors"
              >
                Components
              </motion.a>
              <motion.a
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, delay: 0.15 }}
                href="/templates"
                className="block px-3 py-2 text-sm text-gray-700 hover:text-black hover:bg-gray-50 rounded-md transition-colors"
              >
                Templates
              </motion.a>
              <motion.a
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                href="/pricing"
                className="block px-3 py-2 text-sm text-gray-700 hover:text-black hover:bg-gray-50 rounded-md transition-colors"
              >
                Pricing
              </motion.a>
              <motion.a
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, delay: 0.25 }}
                href="/collection"
                className="block px-3 py-2 text-sm w-full bg-black text-white rounded-lg"
              >
                Explore Collection
              </motion.a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

export default Navbar;
