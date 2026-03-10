import DodoPayments from "dodopayments";

// Initialize Dodo Payments client (server-side only)
const dodo = new DodoPayments({
  bearerToken: process.env.DODO_PAYMENTS_API_KEY!,
  environment:
    process.env.DODO_PAYMENTS_ENVIRONMENT === "live_mode"
      ? "live_mode"
      : "test_mode",
});

export default dodo;
