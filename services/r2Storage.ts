import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { config } from './config';

// R2 Configuration
// Note: In a real production app, you might want to use Supabase Edge Functions 
// to sign these URLs instead of exposing keys, but for this project scope, 
// we are using direct client-side upload for R2.
const R2_ACCOUNT_ID = config.r2.accountId;
const R2_ACCESS_KEY_ID = config.r2.accessKeyId;
const R2_SECRET_ACCESS_KEY = config.r2.secretAccessKey;
const R2_BUCKET_NAME = config.r2.bucketName;
const R2_PUBLIC_DOMAIN = config.r2.publicDomain;

export const isR2Configured = () => {
  return R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_BUCKET_NAME;
};

export const uploadToR2 = async (file: File | Blob, folder: string = 'models'): Promise<string> => {
    if (!isR2Configured()) {
        throw new Error("R2 configuration is missing. Please check .env file.");
    }

    const s3Client = new S3Client({
        region: "auto",
        endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        credentials: {
            accessKeyId: R2_ACCESS_KEY_ID,
            secretAccessKey: R2_SECRET_ACCESS_KEY,
        },
    });

    // Generate a unique file name
    // If it's a File, use its name; if a Blob, generate a random name with appropriate extension
    let fileName = '';
    if (file instanceof File) {
        fileName = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
    } else {
        const ext = file.type === 'image/webp' ? 'webp' : file.type === 'model/gltf-binary' ? 'glb' : 'bin';
        fileName = `${Date.now()}_generated.${ext}`;
    }
    
    const key = `${folder}/${fileName}`;

    const command = new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
        Body: file,
        ContentType: file.type,
        // ACL: 'public-read', // R2 doesn't always support ACLs depending on bucket settings, usually public bucket policy is preferred
    });

    await s3Client.send(command);

    return `${R2_PUBLIC_DOMAIN}/${key}`;
};
