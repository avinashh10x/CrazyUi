import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase URL or Anon Key is missing. Check your .env file.");
}

export const supabase = createClient(supabaseUrl || "", supabaseAnonKey || "");

/**
 * Sign in with email using OTP (Magic Link logic but simplified for OTP usage if configured)
 * @param email User's email address
 */
export const signInWithEmail = async (email: string) => {
  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      // If you want a magic link, leave this default.
      // If you want purely an OTP code to be emailed, you might need to configure Supabase
      // settings to "Send Email OTP" and possibly disable "Magic Link" or strictly extract the token from the link.
      // However, simplified standard flow:
      shouldCreateUser: true,
    },
  });
  return { data, error };
};

/**
 * Verify the OTP code sent to the email
 * @param email User's email address
 * @param token The 6-digit code
 */
export const verifyOtpCode = async (email: string, token: string) => {
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "email",
  });
  return { data, error };
};
