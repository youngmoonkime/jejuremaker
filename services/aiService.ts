import { config } from './config';
import { MaterialAnalysis, UserIntent } from '../types';

// --- Gemini API Interface ---
const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

// --- Supabase Edge Function URL for Tripo ---
const TRIPO_PROXY_URL = `${config.supabase.url}/functions/v1/tripo-proxy`;

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

// 1. Material Analysis (Gemini 2.0 Flash)
export const analyzeMaterial = async (imageBase64: string): Promise<MaterialAnalysis> => {
    const prompt = `
    Analyze this image and identify the primary waste material shown (e.g., Plastic Bottle, Cardboard, Denim).
    Respond with a JSON object containing:
    - "material": The name of the material in Korean.
    - "description": A brief description of its condition in Korean.
    - "confidence": A number between 0 and 1 indicating confidence.
  `;

    try {
        const resultText = await callGemini(config.models.analysis, prompt, imageBase64, true);
        return JSON.parse(resultText) as MaterialAnalysis;
    } catch (e) {
        console.error('Analysis failed', e);
        return { material: '알 수 없음', description: '재료를 식별하지 못했습니다.', confidence: 0 };
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

// 3. Image Generation (Gemini 2.0 Flash)
export const generateUpcyclingImage = async (prompt: string): Promise<string> => {
    if (!config.ai.geminiApiKey) throw new Error('Gemini API Key가 설정되지 않았습니다.');

    const url = `${GEMINI_BASE_URL}/gemini-2.0-flash-exp-image-generation:generateContent?key=${config.ai.geminiApiKey}`;

    const payload = {
        contents: [{
            parts: [{
                text: prompt
            }]
        }],
        generationConfig: {
            responseModalities: ["IMAGE", "TEXT"]
        }
    };

    console.log('=== Image Gen Request ===');
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

    const parts = data.candidates?.[0]?.content?.parts;
    if (parts) {
        for (const part of parts) {
            if (part.inlineData) {
                const mimeType = part.inlineData.mimeType || 'image/png';
                const base64Data = part.inlineData.data;
                return `data:${mimeType};base64,${base64Data}`;
            }
        }
    }
    throw new Error('No image generated');
};

// 4. Tripo AI 3D Generation (Image to 3D)
export const generate3DModel = async (imageBase64: string): Promise<string> => {
    // base64 데이터만 추출
    const cleanBase64 = imageBase64.split(',')[1] || imageBase64;

    // Step 1: Submit Image-to-3D Task
    const submitResp = await fetch(TRIPO_PROXY_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.supabase.anonKey}`
        },
        body: JSON.stringify({
            action: 'image_to_3d',
            image_base64: cleanBase64
        })
    });

    if (!submitResp.ok) {
        const error = await submitResp.text();
        throw new Error(`Tripo Submit Failed: ${error}`);
    }

    const submitData = await submitResp.json();
    if (submitData.error) throw new Error(submitData.error);

    const task_id = submitData.data?.task_id;
    if (!task_id) throw new Error('No task_id received from Tripo');

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
        if (data.status === 'success') {
            return data.output.model; // URL to .glb
        } else if (data.status === 'failed' || data.status === 'cancelled') {
            throw new Error('Tripo Generation Failed');
        }
        attempts++;
    }
    throw new Error('Tripo Timeout');
};

// 5. Blueprint Generation (Specialized Image Gen)
export const generateBlueprintImage = async (promptContext: string): Promise<string> => {
    const blueprintPrompt = `
    Create a detailed technical blueprint design for: ${promptContext}.
    Style: Industrial design sketch, white lines on classic blueprint blue background.
    View: Orthographic projection or isometric view showing structure clearly.
    Details: High contrast, precise lines, technical annotations style.
    No text, just the drawing.
    `;
    return generateUpcyclingImage(blueprintPrompt);
};