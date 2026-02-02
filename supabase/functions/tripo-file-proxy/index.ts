import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const TRIPO_BASE_URL = 'https://api.tripo3d.ai/v2/openapi';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url);

    // --- 1. PROXY DOWNLOAD (GET) ---
    // Usage: GET /tripo-file-proxy?url=https://...
    if (req.method === 'GET') {
      const targetUrl = url.searchParams.get('url');
      if (!targetUrl) {
        throw new Error("Missing 'url' query parameter");
      }

      console.log(`Proxying request to: ${targetUrl}`);

      // Fetch the remote file
      const fileResp = await fetch(targetUrl);
      
      // If fetch failed, return validation error or upstream error
      if (!fileResp.ok) {
        // Try to read body if possible for debugging
        const errText = await fileResp.text().catch(() => 'Unknown upstream error');
        return new Response(`Failed to fetch upstream (${fileResp.status}): ${errText}`, { 
          status: fileResp.status,
          headers: corsHeaders 
        });
      }

      // Prepare headers (forward content-type, ensure CORS)
      const newHeaders = new Headers(fileResp.headers);
      newHeaders.set('Access-Control-Allow-Origin', '*');
      newHeaders.set('Cache-Control', 'public, max-age=3600'); 

      // Stream the body back
      return new Response(fileResp.body, {
        status: fileResp.status,
        headers: newHeaders
      });
    }

    // --- 2. API ACTIONS (POST) ---
    if (req.method === 'POST') {
        const TRIPO_API_KEY = Deno.env.get("TRIPO_API_KEY");
        if (!TRIPO_API_KEY) {
            throw new Error("TRIPO_API_KEY is not set in secrets");
        }

        const body = await req.json();
        const { action, prompt, task_id } = body;

        if (action === 'submit') {
            const resp = await fetch(`${TRIPO_BASE_URL}/task`, {
                method: 'POST',
                headers: {
                'Authorization': `Bearer ${TRIPO_API_KEY}`,
                'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                type: 'text_to_model',
                prompt: prompt
                })
            });
            const data = await resp.json();
            return new Response(JSON.stringify(data), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: resp.status
            });
        }

        if (action === 'status') {
            if (!task_id) throw new Error("task_id is required for status action");
            const resp = await fetch(`${TRIPO_BASE_URL}/task/${task_id}`, {
                headers: {
                'Authorization': `Bearer ${TRIPO_API_KEY}`
                }
            });
            const data = await resp.json();
            return new Response(JSON.stringify(data), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: resp.status
            });
        }

        throw new Error(`Invalid action: ${action}`);
    }

    throw new Error(`Method ${req.method} not supported`);

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400
    });
  }
})
