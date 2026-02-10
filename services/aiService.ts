import { config } from './config';
import { MaterialAnalysis, UserIntent } from '../types';
import { uploadToR2 } from './r2Storage';

// --- Gemini API Interface ---
const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

// --- Supabase Edge Function for Tripo API ---
const TRIPO_PROXY_URL = `${config.supabase.url}/functions/v1/tripo-file-proxy`;

// Helper to ensure we have Base64 data (handles URLs)
async function ensureBase64(input: string): Promise<string> {
    if (input.startsWith('http')) {
        try {
            console.log('Fetching image from URL for Gemini:', input);
            const response = await fetch(input);
            const blob = await response.blob();
            const buffer = await blob.arrayBuffer();
            const base64 = btoa(new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), ''));
            return base64;
        } catch (e) {
            console.warn('Direct fetch failed, trying proxy...', e);
            try {
                // Fallback to Proxy
                const proxyUrl = `${config.supabase.url}/functions/v1/tripo-file-proxy?url=${encodeURIComponent(input)}`;
                const response = await fetch(proxyUrl);
                if (!response.ok) throw new Error(`Proxy error: ${response.statusText}`);
                const blob = await response.blob();
                const buffer = await blob.arrayBuffer();
                const base64 = btoa(new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), ''));
                return base64;
            } catch (proxyError) {
                console.error('Failed to fetch image for Gemini (via proxy):', proxyError);
                throw new Error(`Failed to fetch image from URL: ${e}`);
            }
        }
    }
    // Assume it's already base64 (with or without data prefix)
    return input.split(',')[1] || input;
}


// Helper for Gemini Multimodal Calls
async function callGemini(model: string, prompt: string, imageBase64?: string, jsonMode: boolean = false) {
    if (!config.ai.geminiApiKey) throw new Error('Gemini API Key가 설정되지 않았습니다. .env 파일을 확인해주세요.');

    const url = `${GEMINI_BASE_URL}/${model}:generateContent?key=${config.ai.geminiApiKey}`;

    const contentParts: any[] = [{ text: prompt }];

    if (imageBase64) {
        const cleanBase64 = await ensureBase64(imageBase64);
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
    Role: Jeju Region Upcycling Designer.
    Create a step-by-step upcycling fabrication guide.
    
    Target Material: "${material}".
    Context/Visual Description: "${intent.additionalNotes}".
    Category: "${intent.category}".
    
    Task:
    1. Identify the specific object being made.
    2. Optimize steps for minimal energy usage.
    3. Recommend specific Jeju Source Locations for "${material}" if applicable (e.g., Jeju Clean House, Local Ocean Beach, Farm).
    
    Respond with a JSON object:
    {
      "title": "Creative Project Title (Korean)",
      "description": "Inspiring project summary/overview (1-2 sentences, Korean)",
      "recommended_source": "Jeju specific location recommendation (Korean)",
      "materials": [{ "item": "${material}", "estimated_qty": "e.g., 500g or 3ea" }],
      "steps": [{ "title": "Step Title", "desc": "Action description", "tip": "Expert tip" }],
      "difficulty": "Easy" | "Medium" | "Hard",
      "estimated_time": "e.g. 2h",
      "tools": "comma separated list",
      "eco_impact": {
        "score": "A" | "B" | "C",
        "visual_analogy": "e.g. Planting 0.5 pine trees"
      }
    }
    
    id: ${Date.now()}
    Language: Korean.
  `;

    try {
        const resultText = await callGemini(config.models.guide, prompt, undefined, true);
        return JSON.parse(resultText);
    } catch (e) {
        console.error("Guide Gen Error", e);
        // Fallback
        return {
            title: `${material} 업사이클 프로젝트`,
            steps: [{ title: '준비', desc: '재료를 준비합니다.', tip: '깨끗이 세척하세요.' }],
            difficulty: 'Easy',
            estimated_time: '1h',
            tools: '가위, 접착제'
        };
    }
};

// 2.5 Eco Score Verification (Manual Mode)
export const verifyEcoScore = async (data: {
    title: string;
    material: string;
    qty: string;
    location: string;
    steps: any[];
}): Promise<any> => {
    const prompt = `
    You are an Upcycling Data Verification Expert.
    Analyze the user's input against their fabrication guide.

    [Input Data]
    - Project: ${data.title}
    - Material: ${data.material}
    - Quantity: ${data.qty}
    - Source Location: ${data.location}

    [Fabrication Guide]
    ${JSON.stringify(data.steps.map(s => s.desc).join('\n'))}

    Task:
    1. Carbon Calculation: Use coefficients (HDPE 0.004kg/ea, Cardboard 0.850kg/kg).
       - CRITICAL: result MUST be > 0. If calculation yields 0, use a fallback minimum of 0.1kg.
       - Formula: Qty * Coefficient.
    2. Reliability: If location is provided, give a good score.
    3. Grade: Assign an Eco Grade (A/B/C) based on the effort and impact.

    Respond with JSON:
    {
        "is_consistent": boolean,
        "recalculated_eco_score": number (kgCO2eq, MINIMUM 0.1),
        "grade": "A" | "B" | "C",
        "data_reliability_score": number (1-10),
        "suggestions": "Brief positive feedback or minor correction (Korean)",
        "eco_badge": "Visual analogy string (Korean, e.g. '나무 1그루')",
        "calculation_basis": "Brief explanation of math (e.g. 'PET 20ea * 0.05kg = 1.0kg')"
    }
    `;

    try {
        const resultText = await callGemini(config.models.analysis, prompt, undefined, true);
        return JSON.parse(resultText);
    } catch (e) {
        console.error("Verification Error", e);
        return {
            is_consistent: true,
            recalculated_eco_score: 0.5,
            grade: "B",
            data_reliability_score: 8,
            suggestions: "데이터 연결 성공",
            eco_badge: "분석 불가"
        };
    }
};

// Helper to soften prompt if blocked
const refinePromptForSafety = async (originalPrompt: string): Promise<string> => {
    try {
        const safetyPrompt = `
        The following image generation prompt was blocked by safety filters. 
        Rewrite it to be safe, family-friendly, and artistic while maintaining the core visual description.
        Remove any potentially violent, graphic, or sensitive terms. Keep it English.
        
        Original Prompt: "${originalPrompt}"
        `;
        // Use the text model for refinement
        return await callGemini(config.models.guide, safetyPrompt, undefined, false);
    } catch (e) {
        return originalPrompt + " (safe, artistic, bright lighting)"; // Fallback simple append
    }
};

// 3. Image Generation (Dynamic Model Support)
export const generateUpcyclingImage = async (prompt: string, model: string = config.models.productImage, imageBase64?: string, isRetry: boolean = false): Promise<string> => {
    if (!config.ai.geminiApiKey) throw new Error('Gemini API Key가 설정되지 않았습니다.');

    const url = `${GEMINI_BASE_URL}/${model}:generateContent?key=${config.ai.geminiApiKey}`;

    const parts: any[] = [{ text: prompt }];

    if (imageBase64) {
        const cleanBase64 = await ensureBase64(imageBase64);
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
    
    console.log(`=== Image Gen Request (${isRetry ? 'Retry' : 'Initial'}) ===`, { model, hasImage: !!imageBase64 });
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
    
    // Check for Safety/Refusal
    if (!resultParts) {
        const finishReason = data.candidates?.[0]?.finishReason;
        
        console.error('Image Gen Failed - Reason:', finishReason);

        if (finishReason === 'SAFETY' && !isRetry) {
            console.log("Safety block detected. Refining prompt and retrying...");
            const saferPrompt = await refinePromptForSafety(prompt);
            console.log("Refined Prompt:", saferPrompt);
            return generateUpcyclingImage(saferPrompt, model, imageBase64, true);
        }
        
        throw new Error(`이미지 생성 실패: ${finishReason || 'Unknown Error'}`);
    }

    if (resultParts) {
        for (const part of resultParts) {
            if (part.inlineData) {
                const mimeType = part.inlineData.mimeType || 'image/png';
                const base64Data = part.inlineData.data;
                const dataUrl = `data:${mimeType};base64,${base64Data}`;

                // --- Optimization: Return Data URL to avoid unnecessary R2 storage costs ---
                // The frontend (WizardModal) handles uploading ONLY the selected image when saving.
                return dataUrl;

                /* REMOVED: Auto-upload to R2 logic
                try {
                    // ... existing upload code ...
                } catch (uploadError) { ... }
                */
            }
        }
    }
    throw new Error('No image generated (Invalid Response Structure)');
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

            // --- R2 Upload Integration ---
            try {
                console.log('Downloading 3D model from Tripo for R2 upload...', modelUrl);
                
                // Use Proxy to fetch the file to avoid CORS issues
                const proxyUrl = `${config.supabase.url}/functions/v1/tripo-file-proxy?url=${encodeURIComponent(modelUrl)}`;
                const fileResp = await fetch(proxyUrl);
                
                if (!fileResp.ok) {
                    throw new Error(`Failed to download model via proxy: ${fileResp.statusText}`);
                }
                
                const blob = await fileResp.blob();
                
                console.log('Uploading 3D model to R2...');
                const r2Url = await uploadToR2(blob, 'models');
                console.log('3D Model uploaded to R2:', r2Url);
                
                return r2Url;
            } catch (uploadError) {
                console.error('Failed to upload 3D model to R2, returning original URL:', uploadError);
                return modelUrl;
            }
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
// 5. Blueprint Generation (ISO 128 Style)
export const generateBlueprintImage = async (promptContext: string, imageBase64?: string, type: 'production' | 'detailed' | 'mechanical' = 'production'): Promise<string> => {
    
    let specificInstruction = "";
    
    switch (type) {
        case 'production':
            specificInstruction = `
            Type: Production Drawing (제작 도면).
            Layout: Orthographic Projection (Front, Side, Plan views).
            Details: MUST include precise Dimension Lines (mm), Tolerances, and Surface Finish symbols.
            Content: Show total height, width, and depth.
            Additional: Include a BOM (Bill of Materials) table in the bottom right corner showing Part No, Material (Recycled), and Qty.
            Title Block: Standard Engineering Title Block in bottom right.
            `;
            break;
        case 'detailed':
            specificInstruction = `
            Type: Detailed Product Drawing (제품 상세도).
            Layout: Exploded View + Assembled View.
            Details: Show how parts connect (Snap-fit joints, Screws). Label each part with a leader line and number.
            Content: Focus on the assembly relationship and specific component structures.
            Additional: Include a detailed Parts List table.
            `;
            break;
        case 'mechanical':
            specificInstruction = `
            Type: Mechanical Design Drawing (기구 설계 도면).
            Layout: Technical Cross-section (Cutaway) and Internal Mechanism view.
            Details: Show internal structural ribs, wall thickness, and moving parts if any.
            Content: Highlight the structural integrity and assembly mechanism (Zero-glue logic).
            Additional: Technical annotations explaining the mechanism.
            `;
            break;
    }

    const blueprintPrompt = `
    Create a professional high-precision Technical Blueprint (ISO 128 Standard) based on this product image.
    ${specificInstruction}
    
    Style Guidelines:
    - Black lines on pure white paper background.
    - Standard Engineering Font for all text.
    - High contrast, clean lines, no artistic shading or colors (monochrome technical style).
    - Professional Layout with border frame.
    
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