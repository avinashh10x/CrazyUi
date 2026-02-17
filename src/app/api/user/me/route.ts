import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
    try {
        // Get the access token from the Authorization header
        const authHeader = request.headers.get("authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const token = authHeader.replace("Bearer ", "");

        // Verify the token and get the user
        const {
            data: { user },
            error: authError,
        } = await createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        ).auth.getUser(token);

        if (authError || !user) {
            return NextResponse.json({ error: "Invalid token" }, { status: 401 });
        }

        // Fetch user profile from our users table
        const { data: profile } = await supabaseAdmin
            .from("users")
            .select("*")
            .eq("email", user.email)
            .single();

        // Fetch payment history
        const { data: payments } = await supabaseAdmin
            .from("payments")
            .select("*")
            .eq("email", user.email)
            .order("created_at", { ascending: false });

        return NextResponse.json({
            user: {
                id: user.id,
                email: user.email,
                name: profile?.name || user.user_metadata?.name || "",
                phone: profile?.phone || user.user_metadata?.phone || "",
                membership_status: profile?.membership_status || "inactive",
            },
            payments: payments || [],
        });
    } catch (error: any) {
        console.error("Error fetching user data:", error);
        return NextResponse.json(
            { error: error.message || "Failed to fetch user data" },
            { status: 500 }
        );
    }
}
