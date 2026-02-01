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
    const TRIPO_API_KEY = Deno.env.get("TRIPO_API_KEY");
    if (!TRIPO_API_KEY) {
      throw new Error("TRIPO_API_KEY is not set in secrets");
    }

    const { action, prompt, task_id } = await req.json();

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

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400
    });
  }
})
