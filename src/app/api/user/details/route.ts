import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Basic in-memory rate limiter
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 30;
const requestCounts = new Map<string, { count: number; startTime: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = requestCounts.get(ip);

  if (!record) {
    requestCounts.set(ip, { count: 1, startTime: now });
    return false;
  }

  if (now - record.startTime > RATE_LIMIT_WINDOW) {
    // Reset window
    requestCounts.set(ip, { count: 1, startTime: now });
    return false;
  }

  if (record.count >= MAX_REQUESTS) {
    return true;
  }

  record.count++;
  return false;
}

export async function POST(request: Request) {
  try {
    // 1. Rate Limiting (Basic IP-based)
    // Note: In production, use X-Forwarded-For or a proper middleware/service like Upstash
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 },
      );
    }

    // 2. Auth & Input Validation
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 },
      );
    }

    const token = authHeader.replace("Bearer ", "");

    // Create a Supabase client with the user's token (RLS enabled)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      },
    );

    // 3. Verify Token and User Match
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    if (user.id !== userId) {
      return NextResponse.json(
        { error: "Forbidden: You can only access your own data" },
        { status: 403 },
      );
    }

    // 4. Create Admin Client to fetch user data (bypass RLS after auth verification)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    // 5. Fetch User Profile and Payments in Parallel
    const [userProfileResult, paymentsResult] = await Promise.all([
      supabaseAdmin.from("users").select("*").eq("id", userId).single(),
      supabaseAdmin
        .from("payments")
        .select("*")
        .eq("email", user.email || "")
        .order("created_at", { ascending: false }),
    ]);

    // Handle potential errors
    const userProfile = userProfileResult.data;
    const payments = paymentsResult.data || [];

    if (
      userProfileResult.error &&
      userProfileResult.error.code !== "PGRST116"
    ) {
      console.error("Error fetching user profile:", userProfileResult.error);
      console.log(
        "User Profile Not Found - This might mean webhook hasn't completed yet",
      );
    }

    // 6. Construct Response
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        // Prioritize profile data, fallback to auth metadata
        name: userProfile?.name || user.user_metadata?.name || "",
        phone: userProfile?.phone || user.user_metadata?.phone || "",
        membership_status: userProfile?.membership_status || "inactive",
      },
      payments: payments,
    });
  } catch (error: any) {
    console.error("Error in user details endpoint:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}
