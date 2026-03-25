// @ts-nocheck
// Note: This file runs in Supabase Edge Functions (Deno runtime), not Node.js.
// 'Cannot find name Deno' or HTTPS import errors in VSCode are expected unless the Deno extension is installed.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

// AWS Signature V4 implementation for generating presigned URLs
// No external SDK dependency — pure Deno crypto

const encoder = new TextEncoder();

async function hmacSHA256(
  key: ArrayBuffer,
  message: string,
): Promise<ArrayBuffer> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    key,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(message));
}

async function sha256(message: string): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-256", encoder.encode(message));
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function toHex(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function getSigningKey(
  secretKey: string,
  dateStamp: string,
  region: string,
  service: string,
): Promise<ArrayBuffer> {
  let key = await hmacSHA256(
    encoder.encode("AWS4" + secretKey).buffer,
    dateStamp,
  );
  key = await hmacSHA256(key, region);
  key = await hmacSHA256(key, service);
  key = await hmacSHA256(key, "aws4_request");
  return key;
}

async function generatePresignedUrl(
  accountId: string,
  accessKeyId: string,
  secretAccessKey: string,
  bucketName: string,
  key: string,
  contentType: string,
  expiresIn: number = 600,
): Promise<string> {
  const host = `${accountId}.r2.cloudflarestorage.com`;
  const region = "auto";
  const service = "s3";
  const method = "PUT";

  const now = new Date();
  const dateStamp = now.toISOString().replace(/[-:]/g, "").split(".")[0]
    .replace("T", "T").substring(0, 8);
  const amzDate = now.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const credential = `${accessKeyId}/${credentialScope}`;

  const queryParams = new URLSearchParams({
    "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
    "X-Amz-Credential": credential,
    "X-Amz-Date": amzDate,
    "X-Amz-Expires": expiresIn.toString(),
    "X-Amz-SignedHeaders": "content-type;host",
  });

  // Sort query params
  const sortedParams = new URLSearchParams([...queryParams.entries()].sort());
  const canonicalQueryString = sortedParams.toString();

  const lowerContentType = contentType.toLowerCase().trim();
  const canonicalHeaders = `content-type:${lowerContentType}\nhost:${host}\n`;
  const signedHeaders = "content-type;host";

  const canonicalRequest = [
    method,
    `/${bucketName}/${key}`,
    canonicalQueryString,
    canonicalHeaders,
    signedHeaders,
    "UNSIGNED-PAYLOAD",
  ].join("\n");

  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    await sha256(canonicalRequest),
  ].join("\n");

  const signingKey = await getSigningKey(
    secretAccessKey,
    dateStamp,
    region,
    service,
  );
  const signature = toHex(await hmacSHA256(signingKey, stringToSign));

  return `https://${host}/${bucketName}/${key}?${canonicalQueryString}&X-Amz-Signature=${signature}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const R2_ACCOUNT_ID = Deno.env.get("R2_ACCOUNT_ID") ||
      Deno.env.get("VITE_R2_ACCOUNT_ID");
    const R2_ACCESS_KEY_ID = Deno.env.get("R2_ACCESS_KEY_ID") ||
      Deno.env.get("VITE_R2_ACCESS_KEY_ID");
    const R2_SECRET_ACCESS_KEY = Deno.env.get("R2_SECRET_ACCESS_KEY") ||
      Deno.env.get("VITE_R2_SECRET_ACCESS_KEY");
    const R2_BUCKET_NAME = Deno.env.get("R2_BUCKET_NAME") ||
      Deno.env.get("VITE_R2_BUCKET_NAME");
    const R2_PUBLIC_DOMAIN = Deno.env.get("R2_PUBLIC_DOMAIN") ||
      Deno.env.get("VITE_R2_PUBLIC_DOMAIN");

    if (
      !R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY ||
      !R2_BUCKET_NAME
    ) {
      return new Response(
        JSON.stringify({
          error:
            "R2 configuration missing. Set secrets: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const contentType = (req.headers.get("content-type") || "").toLowerCase();

    // 1. Proxy Upload Path (Bypasses Browser CORS / AdBlockers)
    if (contentType.includes("multipart/form-data")) {
      let formData;
      try {
        formData = await req.formData();
      } catch (e) {
        throw new Error(`[ERR_FORMDATA_PARSE] ${e.message}`);
      }

      const file = formData.get("file") as File;
      const folder = formData.get("folder") as string || "uploads";

      if (!file) throw new Error("[ERR_NO_FILE] No file found in formData");

      const fileName = file.name || "upload.bin";
      const fileType = file.type || "application/octet-stream";
      const key = `${folder}/${Date.now()}_${fileName.replace(/\\s+/g, "_")}`;

      const signedUrl = await generatePresignedUrl(
        R2_ACCOUNT_ID,
        R2_ACCESS_KEY_ID,
        R2_SECRET_ACCESS_KEY,
        R2_BUCKET_NAME,
        key,
        fileType,
      );

      let r2Response;
      try {
        // Edge Function (Server) uploads directly to R2
        r2Response = await fetch(signedUrl, {
          method: "PUT",
          headers: {
            "Content-Type": fileType,
          },
          body: await file.arrayBuffer(),
        });
      } catch (e) {
        throw new Error(`[ERR_R2_FETCH] ${e.message}`);
      }

      if (!r2Response.ok) {
        const errorBody = await r2Response.text();
        console.error(`R2 Error (${r2Response.status}):`, errorBody);
        throw new Error(
          `[ERR_R2_UPLOAD] R2 rejected the upload (${r2Response.status}). Details: ${errorBody.substring(0, 200)}`,
        );
      }

      return new Response(
        JSON.stringify({
          publicUrl: `https://${
            R2_PUBLIC_DOMAIN || "pub-b7d22eda2a2840a99f84fad5136127e0.r2.dev"
          }/${key}`,
          key: key,
          v: "V3",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 2. Legacy Presigned URL Path (Browser uploads directly)
    let bodyText;
    try {
      bodyText = await req.text();
    } catch (e) {
      throw new Error(`[ERR_READ_BODY] ${e.message}`);
    }

    let payload;
    try {
      payload = JSON.parse(bodyText);
    } catch (e) {
      throw new Error(
        `[ERR_JSON_PARSE] Invalid JSON payload. Content-Type was: '${contentType}'. Parsing error: ${e.message}`,
      );
    }

    const { fileName, fileType, folder = "uploads" } = payload;

    if (!fileName || !fileType) {
      return new Response(
        JSON.stringify({ error: "Missing fileName or fileType" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const key = `${folder}/${Date.now()}_${fileName}`;

    const signedUrl = await generatePresignedUrl(
      R2_ACCOUNT_ID,
      R2_ACCESS_KEY_ID,
      R2_SECRET_ACCESS_KEY,
      R2_BUCKET_NAME,
      key,
      fileType,
    );

    return new Response(
      JSON.stringify({
        uploadUrl: signedUrl,
        publicUrl: `https://${
          R2_PUBLIC_DOMAIN || "pub-b7d22eda2a2840a99f84fad5136127e0.r2.dev"
        }/${key}`,
        key: key,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Upload Error:", error.message);
    return new Response(
      JSON.stringify({ error: `[V3_CATCH] ${error.message}` }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
