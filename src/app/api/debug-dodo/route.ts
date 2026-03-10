import { NextResponse } from "next/server";

/**
 * Quick diagnostic endpoint to test Dodo API auth
 * GET /api/debug-dodo
 *
 * DELETE THIS FILE after debugging!
 */
export async function GET() {
  const apiKey = (process.env.DODO_PAYMENTS_API_KEY || "").trim();
  const env = (process.env.DODO_PAYMENTS_ENVIRONMENT || "test_mode").trim();

  const results: any = {
    key_length: apiKey.length,
    key_prefix: apiKey.substring(0, 15),
    key_suffix: apiKey.substring(apiKey.length - 5),
    env_value: env,
    env_length: env.length,
    // Check for hidden characters
    key_charCodes_last3: [...apiKey.slice(-3)].map((c) => c.charCodeAt(0)),
    env_charCodes: [...env].map((c) => c.charCodeAt(0)),
  };

  // Test both endpoints
  const endpoints = [
    { name: "test_mode", url: "https://test.dodopayments.com/payments" },
    { name: "live_mode", url: "https://api.dodopayments.com/payments" },
  ];

  for (const ep of endpoints) {
    try {
      const res = await fetch(ep.url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });
      const body = await res.text();
      results[ep.name] = {
        status: res.status,
        body: body.substring(0, 200),
      };
    } catch (err: any) {
      results[ep.name] = { error: err.message };
    }
  }

  console.log("🔍 Dodo Debug Results:", JSON.stringify(results, null, 2));

  return NextResponse.json(results);
}
