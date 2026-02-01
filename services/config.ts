
// Centralized configuration management
// Accesses environment variables securely and provides defaults where safe

export const config = {
    supabase: {
        url: import.meta.env.VITE_SUPABASE_URL || 'https://jbkfsvinitavzyflcuwg.supabase.co',
        anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impia2ZzdmluaXRhdnp5ZmxjdXdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0MDAxOTUsImV4cCI6MjA4NDk3NjE5NX0.Nn3_-8Oky-yZ7VwFiiWbhxKdWfqOSz1ddj93fztfMak',
    },
    ai: {
        geminiApiKey: import.meta.env.VITE_GEMINI_API_KEY || 'AIzaSyDKhsD0ZhaoamlEjbcwWb9SJOyARA4WbJw',
        tripoApiKey: import.meta.env.VITE_TRIPO_API_KEY || 'tsk_rB5tgb8Sgp-9m6_DosTob_h9XMhhPbE2OkJF6cyLMxR',
    },
    r2: {
        accountId: import.meta.env.VITE_R2_ACCOUNT_ID || '170a312dca9dcb4790b82ea3f0bd3034',
        accessKeyId: import.meta.env.VITE_R2_ACCESS_KEY_ID || '4e8c26d0b1a2d706fe96aa470704dc18',
        secretAccessKey: import.meta.env.VITE_R2_SECRET_ACCESS_KEY || '9e35d5139ae68e1f9fc305d8268494f8ab47755ca244b0369a0040e82c754f23',
        bucketName: import.meta.env.VITE_R2_BUCKET_NAME || 'jeju-remaker-assets',
        publicDomain: import.meta.env.VITE_R2_PUBLIC_DOMAIN || 'https://pub-b7d22eda2a2840a99f84fad5136127e0.r2.dev',
    },
    // Model Configuration - Easily swap model names here
    models: {
        analysis: 'gemini-2.0-flash',
        guide: 'gemini-2.0-flash',
        image: 'gemini-2.0-flash-exp-image-generation', // Standard "Nano Banana" equivalent for now
        tripo: 'default' // Tripo auto-selects best model usually
    }
};

// Validation helper
export const validateConfig = () => {
    const missing = [];
    if (!config.ai.geminiApiKey) missing.push('VITE_GEMINI_API_KEY');
    if (!config.ai.tripoApiKey) missing.push('VITE_TRIPO_API_KEY');

    if (missing.length > 0) {
        console.warn(`Missing AI Configuration keys: ${missing.join(', ')}. AI features will not work.`);
        return false;
    }
    return true;
};
