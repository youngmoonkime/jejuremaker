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
    r2: {
        accountId: getEnv("VITE_R2_ACCOUNT_ID") || "",
        bucketName: getEnv("VITE_R2_BUCKET_NAME") || "jeju-remaker-assets",
        publicDomain: getEnv("VITE_R2_PUBLIC_DOMAIN") ||
            "https://pub-b7d22eda2a2840a99f84fad5136127e0.r2.dev",
    },
    labR2: {
        accountId: getEnv("VITE_LAB_R2_ACCOUNT_ID") ||
            getEnv("VITE_R2_ACCOUNT_ID") || "",
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
        productImage: "gemini-2.5-flash-image", // Nano Banana2
        blueprintImage: "gemini-3.1-flash-image-preview", // 상세도/조립가이드 생성용
        tripo: "default", // Tripo auto-selects best model usually
    },
};
