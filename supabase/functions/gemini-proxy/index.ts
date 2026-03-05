// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

const GEMINI_BASE_URL =
    "https://generativelanguage.googleapis.com/v1beta/models";

serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    if (req.method !== "POST") {
        return new Response(JSON.stringify({ error: "Method not allowed" }), {
            status: 405,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    try {
        // @ts-ignore
        const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
        if (!GEMINI_API_KEY) {
            throw new Error("GEMINI_API_KEY is not set in secrets");
        }

        const body = await req.json();
        const { model, contents, generationConfig } = body;

        if (!model || !contents) {
            throw new Error("Missing required fields: model, contents");
        }

        const geminiUrl =
            `${GEMINI_BASE_URL}/${model}:generateContent?key=${GEMINI_API_KEY}`;

        const geminiResp = await fetch(geminiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents,
                generationConfig: generationConfig || {},
            }),
        });

        const data = await geminiResp.json();

        return new Response(JSON.stringify(data), {
            status: geminiResp.status,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    } catch (error) {
        const err = error as Error;
        return new Response(JSON.stringify({ error: err.message }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
