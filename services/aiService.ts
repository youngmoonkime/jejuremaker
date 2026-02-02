import { config } from './config';
import { MaterialAnalysis, UserIntent } from '../types';

// --- Gemini API Interface ---
const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

// --- Cloudflare Pages Function URL for Tripo ---
// In development (localhost), points to the deployed Cloudflare worker to access the proxy.
// In production, uses relative path.
const TRIPO_PROXY_URL = import.meta.env.DEV 
    ? 'https://jejuremaker.pages.dev/api/tripo-proxy' 
    : '/api/tripo-proxy';

// Helper for Gemini Multimodal Calls
async function callGemini(model: string, prompt: string, imageBase64?: string, jsonMode: boolean = false) {
    if (!config.ai.geminiApiKey) throw new Error('Gemini API Key가 설정되지 않았습니다. .env 파일을 확인해주세요.');

    const url = `${GEMINI_BASE_URL}/${model}:generateContent?key=${config.ai.geminiApiKey}`;

    const contentParts: any[] = [{ text: prompt }];

    if (imageBase64) {
        const cleanBase64 = imageBase64.split(',')[1] || imageBase64;
        contentParts.push({
            inline_data: {
                mime_type: 'image/jpeg',
                data: cleanBase64
            }
        });
    }

    const payload = {
        contents: [{ parts: contentParts }],
        generationConfig: jsonMode ? { response_mime_type: "application/json" } : {}
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`Gemini API Error: ${err}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

// 1. Material Analysis (Detailed)
export const analyzeMaterial = async (imageBase64: string): Promise<MaterialAnalysis> => {
    const prompt = `
    Analyze this image of recycled material (pulp/plastic/wood/etc).
    1. Identify visual traits: Texture (Rough/Smooth/Porous), Fiber Length, Color Pattern (Terrazzo/Monochrome).
    2. Based on these traits, recommend the BEST style ID for EACH category:
       - Lighting: [zen_minimal, ethereal, tech_utility, jeju_volcanic]
       - Furniture: [modern_nordic, brutalism, modular, jeju_olle]
       - Interior: [pop_terrazzo, craft_clay, digital_glitch, jeju_ocean]
       - Stationery: [precision_sleek, tactile_organic, color_block, jeju_earth]
    
    Respond with JSON:
    {
      "material": "Material Name (Korean)",
      "description": "Brief description (Korean)",
      "confidence": 0.0-1.0,
      "traits": "Summary of visual traits (Korean)",
      "recommendations": {
        "lighting": "style_id",
        "furniture": "style_id",
        "interior": "style_id",
        "stationery": "style_id"
      }
    }
  `;

    try {
        const resultText = await callGemini(config.models.analysis, prompt, imageBase64, true);
        return JSON.parse(resultText) as MaterialAnalysis;
    } catch (e) {
        console.error('Analysis failed', e);
        return { material: '알 수 없음', description: '재료를 식별하지 못했습니다.', confidence: 0, traits: '분석 실패', recommendations: {} };
    }
};

// 2. Fabrication Guide Generation (Gemini 2.0 Flash)
export const generateFabricationGuide = async (material: string, intent: UserIntent): Promise<any> => {
    const prompt = `
    Create a step-by-step upcycling fabrication guide for making a "${intent.desiredOutcome}" using "${material}".
    Category: ${intent.category}.
    Additional Requirements: ${intent.additionalNotes}.
    
    Respond with a JSON object containing:
    - "steps": Array of objects { "title": string, "desc": string, "tip": string }.
    - "difficulty": "Easy", "Medium", or "Hard".
    - "estimated_time": string (e.g. "2h").
    - "tools": string (comma separated list).
    
    Language: Korean.
  `;

    const resultText = await callGemini(config.models.guide, prompt, undefined, true);
    return JSON.parse(resultText);
};

// 3. Image Generation (Dynamic Model Support)
export const generateUpcyclingImage = async (prompt: string, model: string = config.models.productImage, imageBase64?: string): Promise<string> => {
    if (!config.ai.geminiApiKey) throw new Error('Gemini API Key가 설정되지 않았습니다.');

    const url = `${GEMINI_BASE_URL}/${model}:generateContent?key=${config.ai.geminiApiKey}`;

    const parts: any[] = [{ text: prompt }];

    if (imageBase64) {
        const cleanBase64 = imageBase64.split(',')[1] || imageBase64;
        parts.push({
            inline_data: {
                mime_type: 'image/jpeg',
                data: cleanBase64
            }
        });
    }

    const payload = {
        contents: [{ parts }],
        generationConfig: {
            responseModalities: ["IMAGE", "TEXT"]
        }
    };
    
    console.log('=== Image Gen Request ===', { model, hasImage: !!imageBase64 });
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errText = await response.text();
        console.error('Image Gen API Error:', errText);
        throw new Error(`Image Gen Error: ${errText}`);
    }

    const data = await response.json();
    console.log('=== Image Gen Response ===', data);

    const resultParts = data.candidates?.[0]?.content?.parts;
    if (resultParts) {
        for (const part of resultParts) {
            if (part.inlineData) {
                const mimeType = part.inlineData.mimeType || 'image/png';
                const base64Data = part.inlineData.data;
                return `data:${mimeType};base64,${base64Data}`;
            }
        }
    }
    throw new Error('No image generated');
};

// ... existing code ...

// ... existing code ...

// 3.5 Generate Concept Images (Parallel)
export const generateConceptImages = async (prompts: string[], model: string = config.models.productImage): Promise<string[]> => {
    // Limit to 4 if more provided
    const targetPrompts = prompts.slice(0, 4);
    
    // Execute in parallel
    const promises = targetPrompts.map(prompt => 
        generateUpcyclingImage(prompt, model)
            .catch(e => {
                console.error("Concept Gen Error", e);
                return ""; // Return empty string on failure
            })
    );
    
    return await Promise.all(promises);
};

// 4. Tripo AI 3D Generation (Image to 3D)
export const generate3DModel = async (input: string): Promise<string> => {
    // Determine if input is URL or Base64
    const isUrl = input.startsWith('http');
    
    // Prepare payload for proxy
    const payload: any = { action: 'image_to_3d' };
    
    if (isUrl) {
       payload.image_url = input;
    } else {
       // It's base64
       const cleanBase64 = input.split(',')[1] || input;
       payload.image_base64 = cleanBase64;
    }

    // Step 1: Submit Image-to-3D Task
    const submitResp = await fetch(TRIPO_PROXY_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.supabase.anonKey}`
        },
        body: JSON.stringify(payload)
    });

    if (!submitResp.ok) {
        const error = await submitResp.text();
        throw new Error(`Tripo Submit Failed: ${error}`);
    }

    const submitData = await submitResp.json();
    if (submitData.error) throw new Error(submitData.error);

    const task_id = submitData.data?.task_id;
    if (!task_id) throw new Error('No task_id received from Tripo (Check Proxy Logs)');

    // Step 2: Poll for status
    let attempts = 0;
    const maxAttempts = 60; // 120s timeout

    while (attempts < maxAttempts) {
        await new Promise(r => setTimeout(r, 2000));

        const statusResp = await fetch(TRIPO_PROXY_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.supabase.anonKey}`
            },
            body: JSON.stringify({
                action: 'status',
                task_id: task_id
            })
        });

        const statusData = await statusResp.json();
        if (statusData.error) throw new Error(statusData.error);

        const data = statusData.data;
        console.log(`[Tripo Polling] Status: ${data.status}`, data); // Debug Log

        if (data.status === 'success') {
            const modelUrl = 
                data.output?.model || 
                data.output?.pbr_model || 
                data.output?.base_model ||
                data.result?.pbr_model?.url ||
                data.result?.model?.url;

            if (!modelUrl) throw new Error("Tripo success but output model URL missing");
            return modelUrl;
        } else if (data.status === 'failed' || data.status === 'cancelled') {
            throw new Error('Tripo Generation Failed');
        }
        attempts++;
    }
    throw new Error('Tripo Timeout');
};

// 1.5 Generate Concept Prompts
export const generateConceptPrompts = async (material: string, traits: string, category: string, style: string, styleDesc: string): Promise<string[]> => {
    const prompt = `
    Role: Senior Sustainable Designer.
    Task: Create 4 distinct design concept prompts for a "${category}" item using "${material}".
    Input:
    - Material Traits: ${traits}
    - Style: ${style} (${styleDesc})
    - Design Protocol: Jeju Identity, Zero-glue, Snap-fit assembly.

    Output JSON only:
    {
      "prompts": [
        "Prompt 1...",
        "Prompt 2...",
        "Prompt 3...",
        "Prompt 4..."
      ]
    }
    `;
    try {
        const res = await callGemini(config.models.analysis, prompt, undefined, true);
        const json = JSON.parse(res);
        return json.prompts || [];
    } catch (e) {
        // Fallback prompts
        return [
            `${category} in ${style} style using ${material}, ${traits}, cinematic lighting`,
            `${category} design, ${style}, ${material} texture, close up, high quality`,
            `Minimalist ${category} made of ${material}, ${style}, studio shot`,
            `Artistic ${category}, ${style}, ${traits} features, 4k resolution`
        ];
    }
};

// 5. Blueprint Generation (ISO 128 Style)
export const generateBlueprintImage = async (promptContext: string, imageBase64?: string): Promise<string> => {
    const blueprintPrompt = `
    Create a technical blueprint (ISO 128) based on this product image.
    - View: Exploded or Cutaway showing internal structure.
    - Label: "Material: Recycled", "Interference: 0.2mm".
    - Style: Black lines on white paper. High precision technical drawing.
    - No artistic shading, only line work. 
    Context: ${promptContext}
    `;
    return generateUpcyclingImage(blueprintPrompt, config.models.blueprintImage, imageBase64);
};

// 6. AI Copilot Intent Analysis (Gemini 2.0 Flash)
export interface CopilotResponse {
    type: 'VIEW_CONTROL' | 'UPDATE_RECIPE' | 'GENERATE' | 'CHAT';
    action?: 'rotate_left' | 'rotate_right' | 'zoom_in' | 'zoom_out' | 'wireframe_on' | 'wireframe_off' | 'bg_black' | 'bg_white';
    recipe_update?: string;
    message: string;
    reasoning?: string;
}

export const analyzeCopilotIntent = async (userMsg: string, currentRecipe: string): Promise<CopilotResponse> => {
    const prompt = `
    You are an AI 3D Modeling Assistant.
    User is viewing a 3D model with the current recipe/description: "${currentRecipe}".
    
    Analyze the user's message: "${userMsg}"
    
    Determine the INTENT and respond with JSON.
    
    RULES:
    1. VIEW_CONTROL: If user wants to just SEE differently (rotate, zoom, wireframe, background color).
       - actions: rotate_left, rotate_right, zoom_in, zoom_out, wireframe_on, wireframe_off, bg_black, bg_white.
    
    2. UPDATE_RECIPE: If user wants to CHANGE the model's design (color, shape, material).
       - Do NOT create a new model yet. Just acknowledge and update the text recipe.
       - "recipe_update": The unified new prompt description.
    
    3. GENERATE: ONLY if user EXPLICITLY says "Generate", "Make it now", "Apply changes", "Render".
    
    4. CHAT: General questions or unclear intent.
    
    Response Format (JSON):
    {
      "type": "VIEW_CONTROL" | "UPDATE_RECIPE" | "GENERATE" | "CHAT",
      "action": "...",
      "recipe_update": "...",
      "message": "Friendly response to user (Korean)",
      "reasoning": "why you chose this"
    }
    `;

    try {
        const resultText = await callGemini(config.models.analysis, prompt, undefined, true);
        return JSON.parse(resultText) as CopilotResponse;
    } catch (e) {
        console.error('Copilot Analysis Failed', e);
        return { type: 'CHAT', message: '죄송합니다. AI 연결에 문제가 발생했습니다.' };
    }
};

// 7. Persona Chat (Master Kim)
export const chatWithPersona = async (userMsg: string, history: { role: string, content: string }[], persona: 'MASTER_KIM' | 'COPILOT'): Promise<string> => {
    
    let systemPrompt = "";

    if (persona === 'MASTER_KIM') {
        systemPrompt = `
        You are "Master Kim" (김장인), a legendary artisan in Jeju Island with 40 years of experience in stone carving and upcycling.
        
        Personality:
        - Warm, grandfatherly, but very strict about details.
        - Uses Jeju dialect occasionally (optional) or polite Korean.
        - Obsessed with "Basalt texturing" and "Natural connectivity".
        - Your goal is to guide the user to make their design more authentic and sustainable.
        
        Current Context:
        User is designing an upcycled product using waste materials.
        
        Respond to the user's last message in character. Keep it brief (2-3 sentences).
        `;
    } else {
        // Fallback or other personas
        systemPrompt = "You are a helpful AI Assistant.";
    }

    // Construct conversation history for context
    const conversation = history.map(h => `${h.role}: ${h.content}`).join('\n');
    const fullPrompt = `${systemPrompt}\n\nConversation History:\n${conversation}\n\nUser: ${userMsg}\nMaster Kim:`;

    try {
        const response = await callGemini(config.models.analysis, fullPrompt);
        return response;
    } catch (e) {
        console.error('Persona Chat Failed', e);
        return "허허, 인터넷이 좀 느리구만. 다시 말해주게.";
    }
};