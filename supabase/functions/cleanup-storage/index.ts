
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { S3Client, ListObjectsV2Command, DeleteObjectsCommand } from "https://esm.sh/@aws-sdk/client-s3@3.370.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";
import { corsHeaders } from "../_shared/cors.ts";

const R2_ACCOUNT_ID = Deno.env.get("R2_ACCOUNT_ID");
const R2_ACCESS_KEY_ID = Deno.env.get("R2_ACCESS_KEY_ID");
const R2_SECRET_ACCESS_KEY = Deno.env.get("R2_SECRET_ACCESS_KEY");
const R2_BUCKET_NAME = Deno.env.get("R2_BUCKET_NAME");
const R2_PUBLIC_DOMAIN = Deno.env.get("R2_PUBLIC_DOMAIN");

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { dryRun = true } = await req.json().catch(() => ({ dryRun: true }));

    // 1. Initialize Supabase Admin Client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 2. Fetch all used file URLs from DB
    // We scan 'items' table for image_url, metadata->model_3d_url, metadata->blueprint_url, metadata->images
    const { data: items, error: dbError } = await supabase
      .from('items')
      .select('image_url, metadata');

    if (dbError) throw dbError;

    const usedKeys = new Set<string>();

    const extractKeyFromUrl = (url: string) => {
      if (!url) return null;
      try {
        // Assume URL is like https://pub-domain.r2.dev/folder/file.ext
        // We want 'folder/file.ext'
        const urlObj = new URL(url);
        // The path usually starts with /, so remove it
        return urlObj.pathname.substring(1); 
      } catch (e) {
        return null;
      }
    };

    items?.forEach(item => {
      if (item.image_url) {
        const key = extractKeyFromUrl(item.image_url);
        if (key) usedKeys.add(key);
      }
      if (item.metadata) {
        if (item.metadata.model_3d_url) {
           const key = extractKeyFromUrl(item.metadata.model_3d_url);
           if (key) usedKeys.add(key);
        }
        if (item.metadata.blueprint_url) {
           const key = extractKeyFromUrl(item.metadata.blueprint_url);
           if (key) usedKeys.add(key);
        }
        if (Array.isArray(item.metadata.images)) {
          item.metadata.images.forEach((img: string) => {
            const key = extractKeyFromUrl(img);
            if (key) usedKeys.add(key);
          });
        }
      }
    });

    // 3. List all objects in R2
    const s3Client = new S3Client({
      region: "auto",
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID!,
        secretAccessKey: R2_SECRET_ACCESS_KEY!,
      },
    });

    let continuationToken: string | undefined = undefined;
    const orphanedKeys: string[] = [];

    do {
      const command: ListObjectsV2Command = new ListObjectsV2Command({
        Bucket: R2_BUCKET_NAME,
        ContinuationToken: continuationToken,
      });
      const response = await s3Client.send(command);
      
      response.Contents?.forEach((obj) => {
        if (obj.Key && !usedKeys.has(obj.Key)) {
          // Exclude folders if any (end with /)
          if (!obj.Key.endsWith('/')) {
             orphanedKeys.push(obj.Key);
          }
        }
      });
      
      continuationToken = response.NextContinuationToken;
    } while (continuationToken);

    // 4. Delete if not dryRun
    let deletedCount = 0;
    if (!dryRun && orphanedKeys.length > 0) {
      // S3 deleteObjects supports max 1000 keys per request
      const chunkSize = 1000;
      for (let i = 0; i < orphanedKeys.length; i += chunkSize) {
        const chunk = orphanedKeys.slice(i, i + chunkSize);
        const deleteParams = {
          Bucket: R2_BUCKET_NAME,
          Delete: {
            Objects: chunk.map(key => ({ Key: key })),
            Quiet: true,
          },
        };
        await s3Client.send(new DeleteObjectsCommand(deleteParams));
        deletedCount += chunk.length;
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        dryRun,
        totalUsedFiles: usedKeys.size,
        orphanedFiles: orphanedKeys.length,
        deletedFiles: deletedCount,
        orphanedExamples: orphanedKeys.slice(0, 5)
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
