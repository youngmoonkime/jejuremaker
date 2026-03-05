// @ts-ignore: Deno std library import for Supabase Edge Functions
import { serve } from "std/http/server";

import { createClient } from "@supabase/supabase-js";

const TRIPO_BASE_URL = "https://api.tripo3d.ai/v2/openapi";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);

    // --- 1. PROXY DOWNLOAD (GET) ---
    // Usage: GET /tripo-file-proxy?url=https://...
    if (req.method === "GET") {
      const targetUrl = url.searchParams.get("url");
      if (!targetUrl) {
        throw new Error("Missing 'url' query parameter");
      }

      // SSRF Protection: Only allow proxying to trusted domains
      const ALLOWED_DOMAINS = [
        "tripo3d.ai",
        "tripo3d.com",
        "r2.dev",
        "r2.cloudflarestorage.com",
      ];
      try {
        const parsedUrl = new URL(targetUrl);
        const isAllowed = ALLOWED_DOMAINS.some((domain) =>
          parsedUrl.hostname.endsWith(domain)
        );
        if (!isAllowed) {
          return new Response(
            JSON.stringify({ error: "Domain not allowed" }),
            {
              status: 403,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            },
          );
        }
      } catch {
        return new Response(
          JSON.stringify({ error: "Invalid URL" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      console.log(`Proxying request to: ${targetUrl}`);

      // Fetch the remote file
      const fileResp = await fetch(targetUrl);

      // If fetch failed, return validation error or upstream error
      if (!fileResp.ok) {
        // Try to read body if possible for debugging
        const errText = await fileResp.text().catch(() =>
          "Unknown upstream error"
        );
        return new Response(
          `Failed to fetch upstream (${fileResp.status}): ${errText}`,
          {
            status: fileResp.status,
            headers: corsHeaders,
          },
        );
      }

      // Prepare headers (forward content-type, ensure CORS)
      const newHeaders = new Headers(fileResp.headers);
      newHeaders.set("Access-Control-Allow-Origin", "*");
      newHeaders.set("Cache-Control", "public, max-age=3600");

      // Stream the body back
      return new Response(fileResp.body, {
        status: fileResp.status,
        headers: newHeaders,
      });
    }

    // --- 2. API ACTIONS (POST) ---
    if (req.method === "POST") {
      // @ts-ignore: Deno runtime API for environment variables
      const TRIPO_API_KEY = Deno.env.get("TRIPO_API_KEY");
      if (!TRIPO_API_KEY) {
        throw new Error("TRIPO_API_KEY is not set in secrets");
      }

      const body = await req.json();
      const { action, prompt, task_id } = body;

      // ----------------------------------------------------
      // NON-TRIPO: LIKE PROXY (Bypasses RLS)
      // ----------------------------------------------------
      if (action === "toggle_like") {
        const { projectId, increment } = body;
        if (!projectId || typeof increment !== "number") {
          throw new Error("Missing projectId or increment");
        }

        // @ts-ignore
        const supabaseUrl = Deno.env.get("SUPABASE_URL");
        // @ts-ignore
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

        const supabaseFunc = createClient(supabaseUrl, supabaseServiceKey);

        const { data: item, error: fetchErr } = await supabaseFunc
          .from("items")
          .select("likes")
          .eq("id", projectId)
          .single();

        if (fetchErr || !item) {
          throw new Error(`Item not found: ${fetchErr?.message || "null"}`);
        }

        const newLikes = Math.max(0, (item.likes || 0) + increment);

        const { error: updateErr } = await supabaseFunc
          .from("items")
          .update({ likes: newLikes })
          .eq("id", projectId);

        if (updateErr) throw new Error(`Update failed: ${updateErr.message}`);

        return new Response(
          JSON.stringify({ success: true, likes: newLikes }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          },
        );
      }
      // ----------------------------------------------------

      if (action === "submit") {
        const resp = await fetch(`${TRIPO_BASE_URL}/task`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${TRIPO_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type: "text_to_model",
            prompt: prompt,
          }),
        });
        const data = await resp.json();
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: resp.status,
        });
      }

      if (action === "image_to_3d") {
        const { image_base64, image_url } = body;

        // Step 1: Get the image_token via upload
        let token = "";
        if (image_base64) {
          const formData = new FormData();
          const cleanBase64 = image_base64.indexOf(",") > -1
            ? image_base64.split(",")[1]
            : image_base64;
          const binaryString = atob(cleanBase64);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          const blob = new Blob([bytes], { type: "image/png" });
          formData.append("file", blob, "image.png");

          const uploadResp = await fetch(`${TRIPO_BASE_URL}/upload`, {
            method: "POST",
            headers: { "Authorization": `Bearer ${TRIPO_API_KEY}` },
            body: formData,
          });
          const uploadData = await uploadResp.json();
          console.log("[Tripo] Upload response:", JSON.stringify(uploadData));
          token = uploadData.data?.image_token || uploadData.data?.file_token ||
            "";
          if (!token) {
            throw new Error(`Upload failed: ${JSON.stringify(uploadData)}`);
          }
        }

        // Step 2: Try multiple payload formats to find the correct one
        const payloads = token
          ? [
            {
              type: "image_to_model",
              file: { type: "image", file_token: token },
            },
            {
              type: "image_to_model",
              file: { type: "image", image_token: token },
            },
            {
              type: "image_to_model",
              file: { type: "image_token", file_token: token },
            },
            {
              type: "image_to_model",
              file: { type: "image_token", image_token: token },
            },
            { type: "image_to_model", file_token: token },
            { type: "image_to_model", image_token: token },
          ]
          : [
            { type: "image_to_model", file: { type: "url", url: image_url } },
            { type: "image_to_model", image_url: image_url },
          ];

        for (const payload of payloads) {
          console.log("[Tripo] Trying payload:", JSON.stringify(payload));
          const resp = await fetch(`${TRIPO_BASE_URL}/task`, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${TRIPO_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          });
          const data = await resp.json();
          console.log(
            "[Tripo] Response:",
            JSON.stringify(data),
            "Status:",
            resp.status,
          );

          if (resp.ok && data.code === 0) {
            // SUCCESS! Log which format worked
            console.log(
              "[Tripo] SUCCESS with payload:",
              JSON.stringify(payload),
            );
            return new Response(JSON.stringify(data), {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: resp.status,
            });
          }
        }

        // All formats failed - return last error with debug info
        return new Response(
          JSON.stringify({
            error: "All Tripo payload formats failed with 1004",
            tried: payloads.length,
            token_preview: token ? token.substring(0, 8) + "..." : "none",
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
          },
        );
      }

      if (action === "status") {
        if (!task_id) throw new Error("task_id is required for status action");
        const resp = await fetch(`${TRIPO_BASE_URL}/task/${task_id}`, {
          headers: {
            "Authorization": `Bearer ${TRIPO_API_KEY}`,
          },
        });
        const data = await resp.json();
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: resp.status,
        });
      }

      throw new Error(`Invalid action: ${action}`);
    }

    throw new Error(`Method ${req.method} not supported`);
  } catch (error) {
    const err = error as Error;
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
