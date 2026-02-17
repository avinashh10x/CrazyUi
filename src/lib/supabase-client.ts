import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// Sign in with email OTP
export async function signInWithEmail(email: string) {
    const { data, error } = await supabaseClient.auth.signInWithOtp({
        email,
        options: {
            shouldCreateUser: true,
        },
    });

    if (error) throw error;
    return data;
}

// Verify OTP code
export async function verifyOtpCode(email: string, token: string) {
    const { data, error } = await supabaseClient.auth.verifyOtp({
        email,
        token,
        type: "email",
    });

    if (error) throw error;
    return data;
}
