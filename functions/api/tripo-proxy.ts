interface Env {
  TRIPO_API_KEY: string;
  R2_BUCKET: R2Bucket;
}

const TRIPO_BASE_URL = 'https://api.tripo3d.ai/v2/openapi';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(request.url);

    // --- 1. PROXY DOWNLOAD (GET) ---
    // Usage: GET /api/tripo-proxy?url=https://...
    if (request.method === 'GET') {
      const targetUrl = url.searchParams.get('url');
      if (!targetUrl) {
        throw new Error("Missing 'url' query parameter");
      }

      // Fetch the remote file
      const fileResp = await fetch(targetUrl);
      
      if (!fileResp.ok) {
        return new Response(`Failed to fetch upstream: ${fileResp.statusText}`, { 
          status: fileResp.status,
          headers: corsHeaders 
        });
      }

      const newHeaders = new Headers(fileResp.headers);
      newHeaders.set('Access-Control-Allow-Origin', '*');
      newHeaders.set('Cache-Control', 'public, max-age=3600'); 

      return new Response(fileResp.body, {
        status: fileResp.status,
        headers: newHeaders
      });
    }

    // --- 2. API ACTIONS (POST) ---
    if (request.method === 'POST') {
        const apiKey = env.TRIPO_API_KEY;
        if (!apiKey) {
            throw new Error("TRIPO_API_KEY is not set in environment variables");
        }

        const payload = await request.json<any>();
        const { action } = payload;

        // A. TEXT TO 3D
        if (action === 'submit') {
            const { prompt } = payload;
            const resp = await fetch(`${TRIPO_BASE_URL}/task`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
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

        // B. IMAGE TO 3D
        if (action === 'image_to_3d') {
            const { image_url, image_base64 } = payload;
            let blob: Blob;

            // 1. Get Image Blob (from URL or Base64)
            if (image_url) {
                const imgResp = await fetch(image_url);
                if (!imgResp.ok) throw new Error("Failed to fetch image from provided URL");
                blob = await imgResp.blob();
            } else if (image_base64) {
               const byteString = atob(image_base64.split(',')[1] || image_base64);
               const ab = new ArrayBuffer(byteString.length);
               const ia = new Uint8Array(ab);
               for (let i = 0; i < byteString.length; i++) {
                   ia[i] = byteString.charCodeAt(i);
               }
               blob = new Blob([ab], { type: 'image/png' }); 
            } else {
                throw new Error("Either image_url or image_base64 is required");
            }

            // 2. Upload to Tripo to get Token
            const formData = new FormData();
            formData.append('file', blob, 'image.png');

            const uploadResp = await fetch(`${TRIPO_BASE_URL}/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`
                },
                body: formData
            });

            const uploadData = await uploadResp.json<any>();
            if (uploadData.code !== 0) {
                 throw new Error(`Tripo Upload Failed: ${uploadData.message}`);
            }
            const imageToken = uploadData.data.image_token;

            // 3. Create Task
            const taskResp = await fetch(`${TRIPO_BASE_URL}/task`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    type: 'image_to_model',
                    file: {
                        type: 'png', 
                        file_token: imageToken
                    }
                })
            });

            const taskData = await taskResp.json();
             return new Response(JSON.stringify(taskData), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: taskResp.status
            });
        }

        // C. CHECK STATUS
        if (action === 'status') {
            const { task_id } = payload;
            if (!task_id) throw new Error("task_id is required for status action");
            const resp = await fetch(`${TRIPO_BASE_URL}/task/${task_id}`, {
                headers: {
                    'Authorization': `Bearer ${apiKey}`
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

    return new Response("Method not allowed", { status: 405, headers: corsHeaders });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400
    });
  }
};
