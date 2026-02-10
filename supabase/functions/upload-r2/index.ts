import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

// AWS Signature V4 implementation for generating presigned URLs
// No external SDK dependency — pure Deno crypto

const encoder = new TextEncoder();

async function hmacSHA256(key: ArrayBuffer, message: string): Promise<ArrayBuffer> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  return crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(message));
}

async function sha256(message: string): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-256", encoder.encode(message));
  return [...new Uint8Array(hash)].map(b => b.toString(16).padStart(2, '0')).join('');
}

function toHex(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)].map(b => b.toString(16).padStart(2, '0')).join('');
}

async function getSigningKey(secretKey: string, dateStamp: string, region: string, service: string): Promise<ArrayBuffer> {
  let key = await hmacSHA256(encoder.encode("AWS4" + secretKey).buffer, dateStamp);
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
  expiresIn: number = 600
): Promise<string> {
  const host = `${accountId}.r2.cloudflarestorage.com`;
  const region = "auto";
  const service = "s3";
  const method = "PUT";

  const now = new Date();
  const dateStamp = now.toISOString().replace(/[-:]/g, '').split('.')[0].replace('T', 'T').substring(0, 8);
  const amzDate = now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const credential = `${accessKeyId}/${credentialScope}`;

  const queryParams = new URLSearchParams({
    'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
    'X-Amz-Credential': credential,
    'X-Amz-Date': amzDate,
    'X-Amz-Expires': expiresIn.toString(),
    'X-Amz-SignedHeaders': 'content-type;host',
  });

  // Sort query params
  const sortedParams = new URLSearchParams([...queryParams.entries()].sort());
  const canonicalQueryString = sortedParams.toString();

  const canonicalHeaders = `content-type:${contentType}\nhost:${host}\n`;
  const signedHeaders = 'content-type;host';

  const canonicalRequest = [
    method,
    `/${bucketName}/${key}`,
    canonicalQueryString,
    canonicalHeaders,
    signedHeaders,
    'UNSIGNED-PAYLOAD'
  ].join('\n');

  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    await sha256(canonicalRequest)
  ].join('\n');

  const signingKey = await getSigningKey(secretAccessKey, dateStamp, region, service);
  const signature = toHex(await hmacSHA256(signingKey, stringToSign));

  return `https://${host}/${bucketName}/${key}?${canonicalQueryString}&X-Amz-Signature=${signature}`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const R2_ACCOUNT_ID = Deno.env.get("R2_ACCOUNT_ID");
    const R2_ACCESS_KEY_ID = Deno.env.get("R2_ACCESS_KEY_ID");
    const R2_SECRET_ACCESS_KEY = Deno.env.get("R2_SECRET_ACCESS_KEY");
    const R2_BUCKET_NAME = Deno.env.get("R2_BUCKET_NAME");
    const R2_PUBLIC_DOMAIN = Deno.env.get("R2_PUBLIC_DOMAIN");

    if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME) {
      return new Response(
        JSON.stringify({ error: "R2 configuration missing. Set secrets: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { fileName, fileType, folder = 'uploads' } = await req.json();

    if (!fileName || !fileType) {
      return new Response(
        JSON.stringify({ error: "Missing fileName or fileType" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const key = `${folder}/${Date.now()}_${fileName}`;

    const signedUrl = await generatePresignedUrl(
      R2_ACCOUNT_ID,
      R2_ACCESS_KEY_ID,
      R2_SECRET_ACCESS_KEY,
      R2_BUCKET_NAME,
      key,
      fileType
    );

    return new Response(
      JSON.stringify({
        uploadUrl: signedUrl,
        publicUrl: `https://${R2_PUBLIC_DOMAIN || 'pub-b7d22eda2a2840a99f84fad5136127e0.r2.dev'}/${key}`,
        key: key
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
