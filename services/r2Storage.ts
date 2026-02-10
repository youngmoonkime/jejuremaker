import { supabase } from './supabase';
import { config } from './config';

export const isR2Configured = () => {
  return !!config.r2.publicDomain;
};

export type StorageType = 'hub' | 'lab';

// Direct upload fallback (uses client-side S3 SDK when Edge Function is unavailable)
const directUploadToR2 = async (
    file: File | Blob,
    folder: string,
    type: StorageType
): Promise<string> => {
    const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');

    const R2_CONFIG = { hub: config.r2, lab: config.labR2 };
    const currentConfig = R2_CONFIG[type];

    if (!currentConfig.accountId || !currentConfig.accessKeyId) {
        throw new Error(`R2 configuration for ${type} is missing. Please check .env file.`);
    }

    const s3Client = new S3Client({
        region: "auto",
        endpoint: `https://${currentConfig.accountId}.r2.cloudflarestorage.com`,
        credentials: {
            accessKeyId: currentConfig.accessKeyId,
            secretAccessKey: currentConfig.secretAccessKey,
        },
    });

    let fileName = '';
    if (file instanceof File) {
        fileName = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
    } else {
        const ext = file.type === 'image/webp' ? 'webp' : file.type === 'model/gltf-binary' ? 'glb' : 'bin';
        fileName = `${Date.now()}_generated.${ext}`;
    }

    const key = `${folder}/${fileName}`;

    const command = new PutObjectCommand({
        Bucket: currentConfig.bucketName,
        Key: key,
        Body: file,
        ContentType: file.type,
    });

    await s3Client.send(command);

    return `${currentConfig.publicDomain}/${key}`;
};

export const uploadToR2 = async (
    file: File | Blob, 
    folder: string = 'models', 
    type: StorageType = 'hub'
): Promise<string> => {
    
    // Generate file name
    let fileName = '';
    if (file instanceof File) {
        fileName = file.name.replace(/\s+/g, '_');
    } else {
        const ext = file.type === 'image/webp' ? 'webp' : file.type === 'model/gltf-binary' ? 'glb' : 'bin';
        fileName = `generated.${ext}`;
    }

    // Try Edge Function first (secure path — no keys exposed)
    try {
        const { data, error } = await supabase.functions.invoke('upload-r2', {
            body: {
                fileName,
                fileType: file.type || 'application/octet-stream',
                folder,
            },
        });

        if (!error && data?.uploadUrl) {
            // Upload file directly to R2 using the presigned URL
            const uploadResponse = await fetch(data.uploadUrl, {
                method: 'PUT',
                body: file,
                headers: {
                    'Content-Type': file.type || 'application/octet-stream',
                },
            });

            if (uploadResponse.ok) {
                return data.publicUrl;
            }
            console.warn('Presigned URL upload failed, falling back to direct upload');
        } else {
            console.warn('Edge Function unavailable, falling back to direct upload:', error?.message || data?.error);
        }
    } catch (edgeFnError) {
        console.warn('Edge Function call failed, falling back to direct upload:', edgeFnError);
    }

    // Fallback: direct S3 upload (dynamically imports SDK)
    return directUploadToR2(file, folder, type);
};
