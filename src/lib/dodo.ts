import DodoPayments from "dodopayments";

const apiKey = process.env.DODO_PAYMENTS_API_KEY || "";
const env = process.env.DODO_PAYMENTS_ENVIRONMENT || "test_mode";

// Debug: log what we're working with (remove after fixing)
console.log("🔑 Dodo init:", {
  keyLength: apiKey.length,
  keyPrefix: apiKey.substring(0, 10) + "...",
  environment: `"${env}"`,
  envLength: env.length,
});

// Initialize Dodo Payments client (server-side only)
const dodo = new DodoPayments({
  bearerToken: apiKey,
  environment: env === "live_mode" ? "live_mode" : "test_mode",
});

export default dodo;
