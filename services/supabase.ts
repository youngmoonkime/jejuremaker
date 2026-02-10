import { createClient } from '@supabase/supabase-js';
import { config } from './config';

// Shared Supabase client instance - prevents Multiple GoTrueClient warning
// Shared Supabase client instance - prevents Multiple GoTrueClient warning
// Configured to share cookies across subdomains if domain is provided
export const supabase = createClient(config.supabase.url, config.supabase.anonKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'sb-auth-token',
        // If domain is set (e.g. '.jejuremaker.com'), share cookies across subdomains (hub. & lab.)
        // Otherwise use default localStorage (fine for single domain or localhost)
        ...(config.app.domain ? {
            storage: {
                getItem: (key) => {
                    const name = `${key}=`;
                    const decodedCookie = decodeURIComponent(document.cookie);
                    const ca = decodedCookie.split(';');
                    for (let i = 0; i < ca.length; i++) {
                        let c = ca[i];
                        while (c.charAt(0) === ' ') {
                            c = c.substring(1);
                        }
                        if (c.indexOf(name) === 0) {
                            return c.substring(name.length, c.length);
                        }
                    }
                    return null;
                },
                setItem: (key, value) => {
                    // Set cookie on the root domain
                    const domain = config.app.domain;
                    const expires = new Date();
                    expires.setFullYear(expires.getFullYear() + 100); // Persistent
                    document.cookie = `${key}=${encodeURIComponent(value)}; domain=${domain}; path=/; samesite=lax; secure; expires=${expires.toUTCString()}`;
                },
                removeItem: (key) => {
                    const domain = config.app.domain;
                    document.cookie = `${key}=; domain=${domain}; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
                }
            }
        } : {})
    }
});
