import { Cashfree, CFEnvironment } from "cashfree-pg";

// Initialize Cashfree SDK (v5.x with positional arguments)
const mode =
  process.env.CASHFREE_MODE === "LIVE"
    ? CFEnvironment.PRODUCTION
    : CFEnvironment.SANDBOX;

console.log("Initializing Cashfree SDK:", {
  mode: process.env.CASHFREE_MODE || "SANDBOX (default)",
  appIdParsed: !!process.env.CASHFREE_APP_ID,
  secretParsed: !!process.env.CASHFREE_SECRET_KEY,
});

const cashfree = new Cashfree(
  mode,
  process.env.CASHFREE_APP_ID!,
  process.env.CASHFREE_SECRET_KEY!,
);

// Optional: Set API version if needed defaults to 2025-01-01
// cashfree.XApiVersion = "2023-08-01";

export default cashfree;
