import { Cashfree, CFEnvironment } from "cashfree-pg";

// Initialize Cashfree SDK (v5.x with positional arguments)
const mode =
  process.env.CASHFREE_MODE === "LIVE"
    ? CFEnvironment.PRODUCTION
    : CFEnvironment.SANDBOX;

const cashfree = new Cashfree(
  mode,
  process.env.CASHFREE_APP_ID!,
  process.env.CASHFREE_SECRET_KEY!,
);

export default cashfree;
