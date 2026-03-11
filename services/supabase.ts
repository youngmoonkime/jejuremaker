import { createClient } from "@supabase/supabase-js";
import { config } from "./config";

// Shared Supabase client instance - standard configuration is most reliable for localhost
export const supabase = createClient(
    config.supabase.url,
    config.supabase.anonKey,
    {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
            // Using default storage key for maximum compatibility
        },
    },
);
