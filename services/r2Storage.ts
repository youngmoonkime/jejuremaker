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
        const ext = file.type === "image/webp"
            ? "webp"
            : file.type === "model/gltf-binary"
            ? "glb"
            : "bin";
        fileName = `generated.${ext}`;
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

    return data.publicUrl;
};
