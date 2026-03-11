import { config } from "./config";

export const isR2Configured = () => {
    return !!config.r2.publicDomain;
};

export type StorageType = "hub" | "lab";

export const uploadToR2 = async (
    file: File | Blob,
    folder: string = "models",
    type: StorageType = "hub",
): Promise<string> => {
    // Generate file name
    let fileName = "";
    if (file instanceof File) {
        fileName = file.name.replace(/\s+/g, "_");
    } else {
        const type = file.type;
        const ext = type.includes("webp")
            ? "webp"
            : type.includes("png")
            ? "png"
            : type.includes("jpeg") || type.includes("jpg")
            ? "jpg"
            : type.includes("gif")
            ? "gif"
            : type.includes("svg")
            ? "svg"
            : type.includes("gltf-binary") ||
                    type.includes("octet-stream") && folder === "models"
            ? "glb"
            : type.includes("stl")
            ? "stl"
            : type.includes("obj")
            ? "obj"
            : "bin";
        fileName = `${Date.now()}_generated.${ext}`;
    }

    // 1. Prepare FormData for proxy upload
    const formData = new FormData();
    formData.append("file", file, fileName);
    formData.append("folder", folder);

    // 2. Send directly to Supabase Edge Function (Proxy)
    // This completely bypasses browser ad-blockers and local CORS issues
    const response = await fetch(
        `${config.supabase.url}/functions/v1/upload-r2`,
        {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${config.supabase.anonKey}`,
                // IMPORTANT: Do NOT set Content-Type manually.
                // Browser automatically sets 'multipart/form-data' with the correct boundary.
            },
            body: formData,
        },
    );

    const responseText = await response.text();
    let data;
    try {
        data = JSON.parse(responseText);
    } catch (parseError) {
        throw new Error(
            `Proxy Upload Server Error (Not JSON format): ${
                responseText.substring(0, 100)
            }...`,
        );
    }

    if (!response.ok || !data?.publicUrl) {
        throw new Error(
            `Proxy Upload Error: ${
                data?.error || response.statusText ||
                "Failed to upload file to proxy server"
            }`,
        );
    }

    return data.publicUrl;
};

export const deleteFromR2 = async (keys: string[]): Promise<boolean> => {
    if (!keys || keys.length === 0) return true;

    try {
        const response = await fetch(
            `${config.supabase.url}/functions/v1/upload-r2`,
            {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${config.supabase.anonKey}`,
                },
                body: JSON.stringify({ keys }),
            },
        );

        if (!response.ok) {
            const err = await response.json();
            console.error("[deleteFromR2] Error:", err);
            return false;
        }

        const data = await response.json();
        console.log(`[deleteFromR2] Successfully deleted ${data.count} assets`);
        return true;
    } catch (error) {
        console.error("[deleteFromR2] Failed:", error);
        return false;
    }
};

export const getR2KeyFromUrl = (url: string): string | null => {
    if (!url || !url.includes("r2.dev") && !url.includes("cloudflarestorage.com")) return null;
    try {
        const urlObj = new URL(url);
        // Path starts with /, so remove it (e.g., /models/123.glb -> models/123.glb)
        return urlObj.pathname.substring(1);
    } catch (e) {
        return null;
    }
};
