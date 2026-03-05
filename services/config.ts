// Centralized configuration management
// Accesses environment variables securely and provides defaults where safe

const getEnv = (key: string) => {
    if (typeof import.meta !== "undefined" && import.meta.env) {
        return import.meta.env[key];
    }
    if (typeof process !== "undefined" && process.env) {
        return process.env[key];
    }
    return undefined;
};

export const config = {
    app: {
        labUrl: getEnv("VITE_LAB_URL"), // Optional external URL for Lab
        domain: getEnv("VITE_APP_DOMAIN"), // e.g. '.jejuremaker.com' for cookie sharing
    },
    supabase: {
        url: getEnv("VITE_SUPABASE_URL") || "",
        anonKey: getEnv("VITE_SUPABASE_ANON_KEY") || "",
    },
    ai: {
        geminiApiKey: getEnv("VITE_GEMINI_API_KEY") || "",
        tripoApiKey: getEnv("VITE_TRIPO_API_KEY") || "",
    },
    r2: {
        accountId: getEnv("VITE_R2_ACCOUNT_ID") || "",
        accessKeyId: getEnv("VITE_R2_ACCESS_KEY_ID") || "",
        secretAccessKey: getEnv("VITE_R2_SECRET_ACCESS_KEY") || "",
        bucketName: getEnv("VITE_R2_BUCKET_NAME") || "jeju-remaker-assets",
        publicDomain: getEnv("VITE_R2_PUBLIC_DOMAIN") ||
            "https://pub-b7d22eda2a2840a99f84fad5136127e0.r2.dev",
    },
    // Lab-specific R2 Configuration (Separate Bucket/Account)
    labR2: {
        accountId: getEnv("VITE_LAB_R2_ACCOUNT_ID") ||
            getEnv("VITE_R2_ACCOUNT_ID") || "",
        accessKeyId: getEnv("VITE_LAB_R2_ACCESS_KEY_ID") ||
            getEnv("VITE_R2_ACCESS_KEY_ID") || "",
        secretAccessKey: getEnv("VITE_LAB_R2_SECRET_ACCESS_KEY") ||
            getEnv("VITE_R2_SECRET_ACCESS_KEY") || "",
        bucketName: getEnv("VITE_LAB_R2_BUCKET_NAME") ||
            "jeju-remaker-lab-data",
        publicDomain: getEnv("VITE_LAB_R2_PUBLIC_DOMAIN") ||
            getEnv("VITE_R2_PUBLIC_DOMAIN") ||
            "https://pub-b7d22eda2a2840a99f84fad5136127e0.r2.dev",
    },
    // Model Configuration - Easily swap model names here
    models: {
        analysis: "gemini-2.5-flash",
        guide: "gemini-3-flash-preview",
        productImage: "gemini-2.5-flash-image", // Nano Banana
        blueprintImage: "gemini-3.1-flash-image-preview", // Fallback for blueprint
        tripo: "default", // Tripo auto-selects best model usually
    },
};

// Validation helper
export const validateConfig = () => {
    const missing = [];
    if (!config.supabase.url) missing.push("VITE_SUPABASE_URL");
    if (!config.supabase.anonKey) missing.push("VITE_SUPABASE_ANON_KEY");
    if (!config.ai.geminiApiKey) missing.push("VITE_GEMINI_API_KEY");
    if (!config.ai.tripoApiKey) missing.push("VITE_TRIPO_API_KEY");

    if (missing.length > 0) {
        console.warn(
            `⚠️ Missing configuration keys: ${
                missing.join(", ")
            }. Some features may not work. Check your .env file.`,
        );
        return false;
    }
    return true;
};
