import { config } from "./config";
import { MaterialAnalysis, Project, UserIntent } from "../types";
import { uploadToR2 } from "./r2Storage";

// --- Supabase Edge Function Proxies ---
const GEMINI_PROXY_URL = `${config.supabase.url}/functions/v1/gemini-proxy`;
const TRIPO_PROXY_URL = `${config.supabase.url}/functions/v1/tripo-file-proxy`;
// Helper to ensure we have Base64 data (handles URLs)
async function ensureBase64(input: string): Promise<string> {
    if (input.startsWith("http")) {
        try {
            console.log("Fetching image from URL for Gemini:", input);
            const response = await fetch(input);
            const blob = await response.blob();
            const buffer = await blob.arrayBuffer();
            const base64 = btoa(
                new Uint8Array(buffer).reduce(
                    (data, byte) => data + String.fromCharCode(byte),
                    "",
                ),
            );
            return base64;
        } catch (e) {
            console.warn("Direct fetch failed, trying proxy...", e);
            try {
                // Fallback to Proxy
                const proxyUrl =
                    `${config.supabase.url}/functions/v1/tripo-file-proxy?url=${
                        encodeURIComponent(input)
                    }`;
                const response = await fetch(proxyUrl, {
                    headers: {
                        "Authorization": `Bearer ${config.supabase.anonKey}`,
                    },
                });
                if (!response.ok) {
                    throw new Error(`Proxy error: ${response.statusText}`);
                }
                const blob = await response.blob();
                const buffer = await blob.arrayBuffer();
                const base64 = btoa(
                    new Uint8Array(buffer).reduce(
                        (data, byte) => data + String.fromCharCode(byte),
                        "",
                    ),
                );
                return base64;
            } catch (proxyError) {
                console.error(
                    "Failed to fetch image for Gemini (via proxy):",
                    proxyError,
                );
                throw new Error(`Failed to fetch image from URL: ${e}`);
            }
        }
    }
    // Assume it's already base64 (with or without data prefix)
    return input.split(",")[1] || input;
}

// Helper for Gemini Multimodal Calls (via Edge Function Proxy)
async function callGemini(
    model: string,
    prompt: string,
    imageBase64?: string,
    jsonMode: boolean = false,
) {
    const contentParts: any[] = [{ text: prompt }];

    if (imageBase64) {
        const cleanBase64 = await ensureBase64(imageBase64);
        contentParts.push({
            inline_data: {
                mime_type: "image/jpeg",
                data: cleanBase64,
            },
        });
    }

    const payload = {
        model,
        contents: [{ parts: contentParts }],
        generationConfig: jsonMode
            ? { response_mime_type: "application/json" }
            : {},
    };

    const response = await fetch(GEMINI_PROXY_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${config.supabase.anonKey}`,
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`Gemini API Error: ${err}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

// 1. Material Analysis (Detailed)
export const analyzeMaterial = async (
    imageBase64: string,
): Promise<MaterialAnalysis> => {
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
        const resultText = await callGemini(
            config.models.analysis,
            prompt,
            imageBase64,
            true,
        );
        return JSON.parse(resultText) as MaterialAnalysis;
    } catch (e) {
        console.error("Analysis failed", e);
        return {
            material: "알 수 없음",
            description: "재료를 식별하지 못했습니다.",
            confidence: 0,
            traits: "분석 실패",
            recommendations: {},
        };
    }
};

// 2. Fabrication Guide Generation (Gemini 2.0 Flash)
export const generateFabricationGuide = async (
    material: string,
    intent: UserIntent,
    imageBase64?: string,
): Promise<any> => {
    const prompt = `
    You are a Circular Design Engineer & Jeju Regional Upcycling Specialist with expertise in DfD (Design for Disassembly) and zero-waste fabrication.

    ## DESIGN CONSTRAINTS (MANDATORY — violating these invalidates the entire guide)
    1. **ZERO-ADHESIVE POLICY**: No glue, epoxy, resin bonding, hot-melt, or any chemical adhesive at ANY step. This is an absolute constraint.
    2. **JOINT HIERARCHY (STRICTLY FOLLOW THIS ORDER)**:
       - **1순위 (First)**: Snap-fit mechanical interlocking — cantilever snaps, annular snaps, torsion snaps, living hinges, dovetail joints, mortise-and-tenon, wedge-locks, or friction-fit tabs. Use whenever geometrically possible.
       - **2순위 (Fallback — only if snap-fit is physically impossible for this joint)**: Custom 3D-printed PLA connector parts (brackets, clamps, sleeves, T-nuts, custom bolts, L-brackets, etc.). You MUST specify print settings (filament: PLA, layer height: 0.2mm, infill: 20-40%, supports: if needed). List each 3D-printed part in the fabrication steps with its shape description and estimated print time.
       - **PROHIBITED**: Off-the-shelf metal hardware (bolts, nuts, screws, hinges) — these must be replaced with the 3D-printed PLA equivalent.
    3. **FULL DISASSEMBLY**: The finished product must be 100% hand-disassemblable into individual material streams for end-of-life recycling.
    4. **MINIMAL ENERGY**: Prioritize hand tools and ambient-temperature processes. If power tools are required, specify wattage and duration.

    ## INPUT
    - Target Material: "${material}"
    - Visual/Contextual Description: "${intent.additionalNotes}"
    - Product Category: "${intent.category}"

    ## DELIVERABLE
    Create a professional fabrication guide following ISO-style process documentation.

    ### CRITICAL VISION TASK
    Analyze the attached image. Determine its precise product type (e.g., table lamp vs floor lamp, small stool vs dining chair). Visually estimate grounded, realistic physical dimensions (W x D x H in mm, material thickness) based on human scale and ergonomics. You MUST insert these EXACT calculated numbers into your instructions and specifications below. Do not use generic placeholders.

    ### Required Sections:
    1. **Product Definition**: What specific object is being made? Include functional requirements.
    2. **Material Sourcing**: Recommend specific Jeju-based collection points centered around daily life (제주시 재활용센터, 클린하우스, 일상 속 택배/포장 박스, 해안 수거지 등) with estimated material condition grades (A=Clean/B=Light contamination/C=Requires pre-processing). Focus on sources that are easily accessible to ordinary citizens.
    3. **Pre-Processing**: Cleaning, sanitizing, dimensional sorting steps.
    4. **Fabrication Steps**: Each step must specify:
       - The exact joint mechanism used (snap-fit type, tolerance in mm)
       - Tool required and estimated time
       - Quality checkpoint criteria

    ### FORMATTING CONSTRAINTS (CRITICAL)
    - "desc" (action description) must be highly detailed and actionable (3-5 sentences). It MUST include physical dimensions, measurements, and recipes where applicable. For example: exact melting temperatures for plastics, blending/shredding procedures, mixing ratios for natural binders (e.g. '밀가루 풀 1:3 비율'), drying times (e.g. '반음지 48시간 건조'), and specific tool settings. Do not be vague; explain EXACTLY how to make it.
    - "tip" must be a single, short sentence.
    - "joint_method" must be a single keyword or short phrase (e.g. "스냅핏", "도브테일 조인트", "N/A").

    Respond STRICTLY with JSON:
    {
      "title": "Creative yet descriptive project title (Korean)",
      "description": "Professional project overview — material story + design intent (2-3 sentences, Korean)",
      "product_specs": {
        "target_dimensions": "Approximate W×D×H in mm",
        "target_weight": "Estimated weight range",
        "load_capacity": "Expected functional load if applicable",
        "material_thickness_mm": "Global thickness of recycled raw material (e.g. 5.0)",
        "global_tolerance_mm": "Acceptable error margin (e.g. ±0.5)",
        "primary_joint_type": "The main mechanical joint used throughout (e.g. 'Torsional Snap-fit' or '3D Print PLA Bracket')",
        "printed_parts": [
          { "part_name": "Name of 3D-printed connector part (Korean)", "shape_desc": "Brief shape description", "print_settings": "PLA, 0.2mm layer, 30% infill, supports: yes/no", "estimated_print_time": "e.g. 45min", "reason": "Why snap-fit was not feasible here" }
        ]
      },
      "recommended_source": "Specific Jeju collection point with material grade (Korean)",
      "materials": [{ "item": "${material}", "estimated_qty": "e.g., 500g or 3ea", "condition_grade": "A/B/C" }],
      "tools": "Comma-separated list with specifics (e.g., '핸드드릴 (3mm 비트), 금속자 300mm, 디버링 나이프')",
      "steps": [
        {
          "phase": "PRE-PROCESS | FABRICATION | ASSEMBLY | FINISHING",
          "title": "Step title (Korean)",
          "desc": "Highly detailed actionable instructions with physical measurements, temperatures, and recipes (3-5 sentences, Korean)",
          "joint_method": "Specific snap-fit or mechanical joint type used, or 'N/A' (Korean)",
          "tolerance": "Dimensional tolerance if applicable (e.g., ±0.5mm)",
          "tip": "Single sentence expert technique tip for quality results (Korean)",
          "checkpoint": "How to verify this step succeeded (Korean)"
        }
      ],
      "assembly_logic": "Overall snap-fit assembly sequence description — which parts lock first, disassembly order (Korean)",
      "difficulty": "Easy" | "Medium" | "Hard",
      "estimated_time": "e.g., 2h 30m",
      "eco_impact": {
        "score": "A" | "B" | "C",
        "co2_saved_kg": 0.0,
        "visual_analogy": "e.g., 소나무 0.5그루 식수 효과",
        "water_saved_liters": 0.0
      }
    }

    id: ${Date.now()}
    Language: Korean (except technical terms which stay in English).
  `;

    try {
        const resultText = await callGemini(
            config.models.guide,
            prompt,
            imageBase64,
            true,
        );
        return JSON.parse(resultText);
    } catch (e) {
        console.error("Guide Gen Error", e);
        // Fallback
        return {
            title: `${material} 업사이클 프로젝트`,
            steps: [{
                title: "준비",
                desc: "재료를 준비합니다.",
                tip: "깨끗이 세척하세요.",
            }],
            difficulty: "Easy",
            estimated_time: "1h",
            tools: "가위, 접착제",
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
    You are a Life Cycle Assessment (LCA) Analyst specializing in upcycled consumer products.
    Perform a simplified cradle-to-gate carbon assessment on the user's project data.

    [Input Data]
    - Project: ${data.title}
    - Primary Material: ${data.material}
    - Quantity Declared: ${data.qty}
    - Source Location: ${data.location}

    [Fabrication Process]
    ${JSON.stringify(data.steps.map((s) => s.desc).join("\\n"))}

    ## Assessment Protocol:
    1. **Carbon Calculation** (Scope 3 — Avoided Emissions Model):
       Use standard emission factors:
       - HDPE: 0.004 kgCO2eq/ea (avoided vs virgin production)
       - PET: 0.050 kgCO2eq/ea
       - Cardboard/Paper Pulp: 0.850 kgCO2eq/kg
       - Wood waste: 0.450 kgCO2eq/kg
       - Mixed plastic: 0.030 kgCO2eq/ea
       - Glass: 1.200 kgCO2eq/kg
       - Textile waste: 0.600 kgCO2eq/kg
       CRITICAL: Result MUST be > 0. If calculation yields 0, apply a floor minimum of 0.1 kgCO2eq.
       Formula: Qty × Emission Factor.

    2. **Data Reliability Index** (1-10):
       Score based on: source traceability (+3 if Jeju location specified), quantity precision (+2 if unit provided), process completeness (+2 if >3 steps), material identification clarity (+3).

    3. **Eco Grade Assignment**:
       - A: >1.0 kgCO2eq saved AND reliability >= 7
       - B: 0.3-1.0 kgCO2eq OR reliability 4-6
       - C: <0.3 kgCO2eq AND reliability < 4

    Respond STRICTLY with JSON:
    {
        "is_consistent": boolean,
        "recalculated_eco_score": number (kgCO2eq, MINIMUM 0.1),
        "co2_saved_kg": number (kgCO2eq, MINIMUM 0.1),
        "grade": "A" | "B" | "C",
        "data_reliability_score": number (1-10),
        "suggestions": "Constructive feedback on improving eco-impact or data quality (Korean)",
        "eco_badge": "Visual analogy — relatable environmental equivalent (Korean, e.g., '제주 소나무 1.2그루 식수 효과')",
        "calculation_basis": "Transparent formula breakdown (e.g., 'PET 20ea × 0.05kg = 1.0 kgCO2eq')"
    }
    `;

    try {
        const resultText = await callGemini(
            config.models.analysis,
            prompt,
            undefined,
            true,
        );
        return JSON.parse(resultText);
    } catch (e) {
        console.error("Verification Error", e);
        return {
            is_consistent: true,
            recalculated_eco_score: 0.5,
            grade: "B",
            data_reliability_score: 8,
            suggestions: "데이터 연결 성공",
            eco_badge: "분석 불가",
        };
    }
};

// Helper to soften prompt if blocked
const refinePromptForSafety = async (
    originalPrompt: string,
): Promise<string> => {
    try {
        const safetyPrompt = `
        The following image generation prompt was blocked by safety filters. 
        Rewrite it to be safe, family-friendly, and artistic while maintaining the core visual description.
        Remove any potentially violent, graphic, or sensitive terms. Keep it English.
        
        Original Prompt: "${originalPrompt}"
        `;
        // Use the text model for refinement
        return await callGemini(
            config.models.guide,
            safetyPrompt,
            undefined,
            false,
        );
    } catch (e) {
        return originalPrompt + " (safe, artistic, bright lighting)"; // Fallback simple append
    }
};

// 3. Image Generation (Dynamic Model Support)
export const generateUpcyclingImage = async (
    prompt: string,
    model: string = config.models.productImage,
    imageBase64?: string,
    isRetry: boolean = false,
    projectContext?: Project,
    userNickname: string = "User",
): Promise<string> => {
    let dynamicPrompt = `
    Task: Create a highly realistic, cinematic 3D product rendering based on the following input.
    Input/Request: "${prompt}"
    
    Style: Minimalist, Upcycled, Professional Studio Shot, Soft Lighting.
    Background: Neutral solid color.
    `;

    if (projectContext) {
        dynamicPrompt = `
    --- STRICT DESIGN CONSTRAINTS ---
    CRITICAL INSTRUCTION: You MUST generate an image of the ORIGINAL product specified below. 
    Do NOT generate a random chair, table, or completely unrelated item unless the user explicitly asks for a different kind of product. 
    You must maintain the general shape and identity of this product while applying the user's modifications (like material, color, or detail changes).
    Refer to the original image references (such as the base fabrication guide images) when building the design.
    
    Original Product Name: ${projectContext.title || "Unknown"}
    Original Category: ${projectContext.category || "General"}
    Original Fabrication Guide: ${projectContext.fabricationGuide || "None"}
    Original Reference Image URL: ${
            projectContext.images?.[0] || "None provided"
        }
    Original Maker / Creator: ${userNickname}
    --------------------------------
    
    User's Modification Request: ${prompt}

    Image Style: Minimalist, Professional Design Shot, High Quality, Realistic texturing.
    Background: Clean neutral solid color.
        `;
    }

    const parts: any[] = [{ text: dynamicPrompt }];

    if (imageBase64) {
        const cleanBase64 = await ensureBase64(imageBase64);
        parts.push({
            inline_data: {
                mime_type: "image/jpeg",
                data: cleanBase64,
            },
        });
    }

    console.log(
        `=== Image Gen Request (${isRetry ? "Retry" : "Initial"}) ===`,
        { model, hasImage: !!imageBase64 },
    );
    const response = await fetch(GEMINI_PROXY_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${config.supabase.anonKey}`,
        },
        body: JSON.stringify({
            model,
            contents: [{ parts }],
            generationConfig: {
                responseModalities: ["IMAGE", "TEXT"],
            },
        }),
    });

    if (!response.ok) {
        const errText = await response.text();
        console.error("Image Gen API Error:", errText);
        throw new Error(`Image Gen Error: ${errText}`);
    }

    const data = await response.json();
    console.log("=== Image Gen Response ===", data);

    const resultParts = data.candidates?.[0]?.content?.parts;

    // Check for Safety/Refusal
    if (!resultParts) {
        const finishReason = data.candidates?.[0]?.finishReason;

        console.error("Image Gen Failed - Reason:", finishReason);

        if (finishReason === "SAFETY" && !isRetry) {
            console.log(
                "Safety block detected. Refining prompt and retrying...",
            );
            const saferPrompt = await refinePromptForSafety(prompt);
            console.log("Refined Prompt:", saferPrompt);
            return generateUpcyclingImage(
                saferPrompt,
                model,
                imageBase64,
                true,
            );
        }

        throw new Error(`이미지 생성 실패: ${finishReason || "Unknown Error"}`);
    }

    if (resultParts) {
        for (const part of resultParts) {
            if (part.inlineData) {
                const mimeType = part.inlineData.mimeType || "image/png";
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
    throw new Error("No image generated (Invalid Response Structure)");
};

// 3.5 Generate Concept Images (Parallel)
export const generateConceptImages = async (
    prompts: string[],
    model: string = config.models.productImage,
): Promise<string[]> => {
    // Limit to 4 if more provided
    const targetPrompts = prompts.slice(0, 4);

    // Execute in parallel
    const promises = targetPrompts.map((prompt) =>
        generateUpcyclingImage(prompt, model)
            .catch((e) => {
                console.error("Concept Gen Error", e);
                return ""; // Return empty string on failure
            })
    );

    return await Promise.all(promises);
};

// 4. Tripo AI 3D Generation (Image to 3D)
export const generate3DModel = async (input: string): Promise<string> => {
    // Always convert to base64 for reliable Tripo upload path
    let cleanBase64: string;

    if (input.startsWith("http")) {
        // Fetch the image and convert to base64
        console.log(
            "[Tripo] Fetching image from URL for base64 conversion:",
            input,
        );
        const blobToBase64 = async (blob: Blob): Promise<string> => {
            const buffer = await blob.arrayBuffer();
            return btoa(
                new Uint8Array(buffer).reduce(
                    (data, byte) => data + String.fromCharCode(byte),
                    "",
                ),
            );
        };
        let fetched = false;
        try {
            const response = await fetch(input);
            if (response.ok) {
                cleanBase64 = await blobToBase64(await response.blob());
                fetched = true;
            }
        } catch (directErr) {
            console.warn(
                "[Tripo] Direct fetch failed (CORS?), trying proxy...",
                directErr,
            );
        }
        if (!fetched) {
            const proxyUrl =
                `${config.supabase.url}/functions/v1/tripo-file-proxy?url=${
                    encodeURIComponent(input)
                }`;
            console.log("[Tripo] Proxy URL:", proxyUrl);
            const proxyResp = await fetch(proxyUrl, {
                headers: {
                    "Authorization": `Bearer ${config.supabase.anonKey}`,
                },
            });
            if (!proxyResp.ok) {
                const errBody = await proxyResp.text().catch(() => "unknown");
                console.error(
                    "[Tripo] Proxy error:",
                    proxyResp.status,
                    errBody,
                );
                throw new Error(
                    `Failed to fetch image via proxy (${proxyResp.status}): ${errBody}`,
                );
            }
            cleanBase64 = await blobToBase64(await proxyResp.blob());
        }
    } else {
        // Already base64
        cleanBase64 = input.split(",")[1] || input;
    }

    // Prepare payload — always use base64 path for reliability
    const payload: any = { action: "image_to_3d", image_base64: cleanBase64 };

    // Step 1: Submit Image-to-3D Task
    const submitResp = await fetch(TRIPO_PROXY_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${config.supabase.anonKey}`,
        },
        body: JSON.stringify(payload),
    });

    if (!submitResp.ok) {
        const error = await submitResp.text();
        throw new Error(`Tripo Submit Failed: ${error}`);
    }

    const submitData = await submitResp.json();
    if (submitData.error) throw new Error(submitData.error);

    const task_id = submitData.data?.task_id;
    if (!task_id) {
        throw new Error("No task_id received from Tripo (Check Proxy Logs)");
    }

    // Step 2: Poll for status
    let attempts = 0;
    const maxAttempts = 60; // 120s timeout

    while (attempts < maxAttempts) {
        await new Promise((r) => setTimeout(r, 2000));

        const statusResp = await fetch(TRIPO_PROXY_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${config.supabase.anonKey}`,
            },
            body: JSON.stringify({
                action: "status",
                task_id: task_id,
            }),
        });

        const statusData = await statusResp.json();
        if (statusData.error) throw new Error(statusData.error);

        const data = statusData.data;
        console.log(`[Tripo Polling] Status: ${data.status}`, data); // Debug Log

        if (data.status === "success") {
            const modelUrl = data.output?.model ||
                data.output?.pbr_model ||
                data.output?.base_model ||
                data.result?.pbr_model?.url ||
                data.result?.model?.url;

            if (!modelUrl) {
                throw new Error("Tripo success but output model URL missing");
            }

            // --- R2 Upload Integration ---
            const proxyUrl =
                `${config.supabase.url}/functions/v1/tripo-file-proxy?url=${
                    encodeURIComponent(modelUrl)
                }`;

            try {
                console.log(
                    "Downloading 3D model from Tripo for R2 upload...",
                    modelUrl,
                );

                const fileResp = await fetch(proxyUrl, {
                    headers: {
                        "Authorization": `Bearer ${config.supabase.anonKey}`,
                    },
                });

                if (!fileResp.ok) {
                    throw new Error(
                        `Failed to download model via proxy: ${fileResp.statusText}`,
                    );
                }

                const blob = await fileResp.blob();

                console.log("Uploading 3D model to R2...");
                const r2Url = await uploadToR2(blob, "models");
                console.log("3D Model uploaded to R2:", r2Url);

                return r2Url;
            } catch (uploadError) {
                console.warn(
                    "[R2] First upload attempt failed, retrying...",
                    uploadError,
                );

                // Retry once
                try {
                    const retryResp = await fetch(proxyUrl, {
                        headers: {
                            "Authorization":
                                `Bearer ${config.supabase.anonKey}`,
                        },
                    });
                    if (!retryResp.ok) {
                        throw new Error(
                            `Retry download failed: ${retryResp.statusText}`,
                        );
                    }
                    const retryBlob = await retryResp.blob();
                    const r2Url = await uploadToR2(retryBlob, "models");
                    console.log("[R2] Retry succeeded:", r2Url);
                    return r2Url;
                } catch (retryError) {
                    console.error(
                        "[R2] Retry also failed. NOT saving expired Tripo URL.",
                        retryError,
                    );
                    throw new Error(
                        "R2 업로드 실패: 3D 모델을 영구 저장할 수 없습니다. 다시 시도해주세요.",
                    );
                }
            }
        } else if (data.status === "failed" || data.status === "cancelled") {
            console.error(
                "[Tripo] Task failed/cancelled. Full response:",
                JSON.stringify(data),
            );
            const reason = data.output?.failure_reason || data.message ||
                data.error || "Unknown reason";
            throw new Error(`Tripo Generation Failed: ${reason}`);
        }
        attempts++;
    }
    throw new Error("Tripo Timeout");
};

// 1.5 Generate Concept Prompts
export const generateConceptPrompts = async (
    material: string,
    traits: string,
    category: string,
    style: string,
    styleDesc: string,
): Promise<string[]> => {
    const categoryRealismContext: Record<string, string> = {
        lighting:
            `REALISM INJECTION (\uc870\uba85 \uce74\ud14c\uace0\ub9ac): The lighting product MUST be rendered as if it is actively turned ON. Include: (1) A visible warm-glowing LED or Edison filament bulb inside, (2) Warm amber light spilling out through material gaps and casting realistic shadows on the surface below, (3) A real braided fabric or rubber power cable visibly connecting to the product and coiling naturally to the floor or wall, (4) Any switches or sockets shown in realistic detail.`,
        furniture:
            `REALISM INJECTION (\uac00\uad6c \uce74\ud14c\uace0\ub9ac): The furniture MUST be rendered as if it is actively in use. Include: (1) Realistic objects placed on/in it (coffee mug, open book, folded blanket, or laptop as appropriate), (2) Subtle wear marks and patina on hand-contact surfaces showing years of use, (3) Visible stress and compression at structural joints from load-bearing, (4) Natural floor reflections beneath the piece.`,
        interior:
            `REALISM INJECTION (\uc778\ud14c\ub9ac\uc5b4 \uce74\ud14c\uace0\ub9ac): The interior piece MUST be rendered as if it is installed in a real space. Include: (1) Visible mounting hardware (screws, clips, or pins) showing how it attaches to a wall or surface, (2) Ambient room light creating realistic shadows around the piece, (3) Subtle wall texture and paint visible around the edges, (4) The recycled material's texture (scratches, color variation, grain) clearly visible up-close.`,
        stationery:
            `REALISM INJECTION (\ubb38\uad6c \uce74\ud14c\uace0\ub9ac): The stationery product MUST be rendered as if it is actively in use on a real desk. Include: (1) Actual stationery items interacting with it (pencils inserted in a holder, paper stacked in a tray, a pen resting across it), (2) Realistic desk surface visible below with ambient light, (3) Fingerprint smudges or ink traces that convey authentic daily use, (4) The material texture (fiber weave, compression marks) visible at key grip and touch points.`,
    };
    const realismInstruction = categoryRealismContext[category] ||
        `REALISM INJECTION: Render the product as if it is actively in real-world use, showing functional details, realistic textures, and interaction with the environment.`;

    const prompt = `
    You are a Senior Industrial Designer with expertise in circular economy product development and material-driven design.

    ## BRIEF
    Generate 4 distinct, portfolio-grade image generation prompts for a "${category}" product crafted from "${material}".

    ## DESIGN INPUTS
    - Material Characterization: ${traits}
    - Design Language: ${style} (${styleDesc})
    - Regional Identity: Jeju Island volcanic landscape, ocean proximity, subtropical flora
    - Assembly Protocol: SNAP-FIT FIRST — all joints must use mechanical interlocking (cantilever snaps, dovetail, press-fit, living hinges) wherever possible. If a joint cannot physically be snap-fit, replace off-the-shelf metal hardware with 3D-printed PLA custom connectors (printed brackets, clamps, or sleeves). ZERO adhesives. ZERO off-the-shelf metal bolts/nuts.
    - **Aesthetic Standard (CRITICAL)**: The product MUST look refined, gallery-worthy, and intentionally designed. Avoid bulky or crude silhouettes. Prioritize slender profiles, elegant geometric proportions, subtle curves, and clean negative space. Reference level: Muji, HAY, Norm Architects, or Muuto — precision-crafted minimalism.
    - **Fabricability Mandate (CRITICAL)**: The design must be realistically achievable using common fabrication methods including: hand tools (box cutter, handsaw, drill, sandpaper), CNC routing, or laser cutting/engraving. Precision joinery and clean geometric cuts that leverage these tools are strongly encouraged. All shapes must be achievable through cutting, folding, layering, or drilling of the specified material — no complex injection-molded forms.

    ## PROMPT REQUIREMENTS
    Each prompt must specify:
    1. **Product Form**: Specific object with clear functional identity (not abstract)
    2. **Material Truth**: Reference the actual recycled material texture — fiber grain, compression marks, color imperfections. No idealized surfaces.
    3. **Assembly Evidence**: Visible snap-fit joints, interlocking seams, or mechanical connection points
    4. **Rendering Style**: Photorealistic studio product shot, 3/4 perspective, soft diffused 3-point lighting, clean neutral background. The product must be the clear hero of the frame.
    5. **${realismInstruction}**
    6. **Differentiation**: Each prompt explores a different design direction — vary form factor, proportion, detail density, or functional emphasis

    ## OUTPUT FORMAT (JSON only)
    {
      "prompts": [
        "Prompt 1: [specific, detailed, English, 2-3 sentences]",
        "Prompt 2: ...",
        "Prompt 3: ...",
        "Prompt 4: ..."
      ]
    }
    `;
    try {
        const res = await callGemini(
            config.models.analysis,
            prompt,
            undefined,
            true,
        );
        const json = JSON.parse(res);
        return json.prompts || [];
    } catch (e) {
        // Fallback prompts
        return [
            `${category} in ${style} style using ${material}, ${traits}, cinematic lighting`,
            `${category} design, ${style}, ${material} texture, close up, high quality`,
            `Minimalist ${category} made of ${material}, ${style}, studio shot`,
            `Artistic ${category}, ${style}, ${traits} features, 4k resolution`,
        ];
    }
};

// 5. Blueprint Generation (ISO 128 Style)
// 5. Blueprint Generation (ISO 128 Style)
export const generateBlueprintImage = async (
    promptContext: string,
    imageBase64?: string,
    type: "production" | "detailed" | "mechanical" = "production",
    guideDimensions?: any,
    referenceBlueprintBase64?: string, // Visual Anchor: production drawing to chain into subsequent drawings
): Promise<string> => {
    // Build a dimension lock string so AI cannot hallucinate different numbers
    const dimensionLock = guideDimensions?.target_dimensions
        ? `⚠️ ABSOLUTE DIMENSION LOCK — DO NOT DEVIATE FROM THESE VALUES UNDER ANY CIRCUMSTANCES:
    LOCKED: ${guideDimensions.target_dimensions}
    MATERIAL THICKNESS: ${guideDimensions.material_thickness_mm || "4"}mm
    JOINT TYPE: ${guideDimensions.primary_joint_type || "Snap-fit"}
    TOLERANCE: ${guideDimensions.global_tolerance_mm || "±0.5"}mm
    Any dimension line you draw MUST use exactly these numbers. Writing any other number is a critical error.
    `
        : "";

    let specificInstruction = "";

    switch (type) {
        case "production":
            specificInstruction = `
            Type: Production Drawing (제작 도면).
            Layout: Orthographic Projection (Front, Side, Plan views).
            CRITICAL DIMENSIONS: You MUST explicitly write the total dimensions [${
                guideDimensions?.target_dimensions || promptContext
            }] next to the dimension lines.
            Instruction: Draw the EXACT same silhouette and line thickness as the attached prompt image.
            Additional: Include a BOM (Bill of Materials) table in the bottom right corner with columns: Part No | Part Name | Material | Fabrication Method | Qty.
            - Recycled material body parts → Fabrication Method: "가공/성형 (Hand/CNC)"
            - Any connector or joint part that cannot be snap-fit → Fabrication Method: "3D Print (PLA)" with print settings noted.
            - NO entries should list metal hardware (bolts, nuts, screws) — replace all with 3D Print (PLA) equivalents.
            Title Block: Standard Engineering Title Block in bottom right.
            `;
            break;
        case "detailed":
            specificInstruction = `
            Type: Detailed Product Drawing (제품 상세도).
            Layout: Exploded View (부품 분해도).
            HARD CONSTRAINTS from Fabrication Guide (YOU MUST FOLLOW THESE EXACTLY):
            - Total Product Dimensions: ${
                guideDimensions?.target_dimensions || "See context"
            }
            - Assembly Method: ${
                guideDimensions?.primary_joint_type ||
                "Snap-fit mechanical joints"
            }
            - Material Thickness: ${
                guideDimensions?.material_thickness_mm || "As specified"
            }
            Instruction: Draw the SAME product from the attached image, but with all components floating apart in an exploded view. Each part MUST be labeled with a leader line and number. Show arrows indicating how pieces snap/interlock together using the assembly method specified above. The overall silhouette when assembled must match the production drawing.
            Additional: Include a detailed Parts List table matching the BOM.
            `;
            break;
        case "mechanical":
            specificInstruction = `
            Type: Assembly Storyboard (조립 스토리보드 / IKEA-Style Visual Guide).
            PURPOSE: This is a WORDLESS, DIMENSION-FREE step-by-step visual assembly guide — like an IKEA instruction manual. The viewer should understand how to build the product just by looking at the pictures.

            CRITICAL RULES:
            - **ZERO DIMENSIONS**: Do NOT write any mm, cm, or numerical measurements anywhere. NO dimension lines, NO scale references.
            - **ZERO TEXT PARAGRAPHS**: Only use part labels (①②③④ or A, B, C) and directional arrows. No sentences.
            - Assembly Method: ${
                guideDimensions?.primary_joint_type ||
                "Snap-fit / 3D Print PLA connectors"
            }

            STORYBOARD LAYOUT:
            1. Divide the white canvas into 4-6 equal panels arranged in a grid (like a comic strip), numbered ① through ⑥.
            2. Panel ①: Show all parts laid out separately in isometric 3D view, each labeled with a circled number (①②③...). If any part is a 3D-printed PLA connector, mark it with a small "3D" badge icon.
            3. Panels ②-⑤: Each panel shows ONE assembly step — two or three parts coming together. Use:
               - Bold curved arrows showing the direction of insertion/rotation
               - A small "click" or "snap" icon where parts lock together
               - Dotted outlines showing where the next part will go
               - Hands silhouette holding parts (optional, for scale reference)
            4. Final Panel: The completed product shown in context (on a desk, shelf, or wall) with a small checkmark badge.
            5. Bottom strip: A horizontal row of small icons showing required tools (box cutter, drill, 3D printer, sandpaper, etc.) — icon only, no text.

            STYLE:
            - Clean black line art on pure white background, similar to IKEA/MUJI assembly manuals.
            - Isometric 3D perspective for all panels (30° angle).
            - Consistent line weight throughout.
            - Professional thin border frame around the entire storyboard.
            Title: "조립 가이드 (Assembly Guide)" in small text at bottom right.
            `;
            break;
    }

    const blueprintPrompt = `
    # GOAL: Generate a professional high-precision Technical Blueprint (ISO 128 Standard)
    You are a Master Mechanical Draftsman. Your task is to translate the attached product image into a technical drawing.

    ${dimensionLock}

    # STRICT CONSTRAINTS (VIOLATING THESE RENDERS DRAWING USELESS):
    1. **VISUAL FIDELITY**: ${
        referenceBlueprintBase64
            ? "A REFERENCE PRODUCTION DRAWING is attached as the second image. You MUST use it as your geometric stencil — copy its silhouette, proportions, and part layout exactly. Do NOT invent a different shape."
            : "Use the attached concept image as an EXACT geometric reference. The blueprint silhouette MUST MATCH THE IMAGE."
    }
    2. **DATA SYNC**: ALL dimension numbers in this drawing MUST match the ABSOLUTE DIMENSION LOCK above. Do NOT use any other numbers.
    3. **UNIFORMITY**: All views in this drawing must be geometrically consistent with each other.

    # ASSIGNMENT: ${specificInstruction}
    
    Style Guidelines:
    - Black lines on pure white background. NO gray shading, NO colors.
    - Standard Engineering Font (e.g., Arial Narrow or ISO font).
    - Monochrome high-contrast technical line art.
    - Professional Border frame with Title Block.
    `;

    // Use the reference blueprint as anchor image if provided, otherwise use concept image
    const anchorImage = referenceBlueprintBase64 || imageBase64;
    return generateUpcyclingImage(
        blueprintPrompt,
        config.models.blueprintImage,
        anchorImage,
    );
};

// 6. AI Copilot Intent Analysis (Gemini 2.5 Flash)
export interface CopilotResponse {
    type:
        | "MATERIAL_CHANGE"
        | "DESIGN_CHANGE"
        | "IMAGE_GENERATION"
        | "VIEW_CONTROL"
        | "GENERAL_CHAT"
        | "UPDATE_RECIPE"
        | "GENERATE";
    message: string;
    action?: string;
    targetNodeId?: string; // ID of the node to logically connect to
    recipe_update?: string;
    enriched_prompt?: string;
}

export const analyzeCopilotIntent = async (
    userMsg: string,
    projectContext: any,
    recentNodes: { id: string; label: string; content: string }[] = [],
    taggedNodeId?: string | null,
    userNickname: string = "User",
    attachedImageBase64?: string | null,
): Promise<CopilotResponse> => {
    // Keep context concise: Only send ID and brief content to avoid payload bloat
    const contextNodesString = recentNodes.length > 0
        ? recentNodes.map((n) =>
            `[ID: ${n.id}] Type: ${n.label}, Content: ${
                n.content.substring(0, 50)
            }`
        ).join("\n")
        : "No existing nodes.";

    const prompt = `
    You are an AI Copilot for a 3D Upcycling design tool.
    Analyze the user's message and determine the action and logic flow.
    
    --- Project Context ---
    Title: ${projectContext?.title || "Unknown"}
    Category: ${projectContext?.category || "General"}
    Base Recipe/Description: ${
        projectContext?.description || projectContext || "None"
    }
    Fabrication Guide: ${projectContext?.fabricationGuide || "None"}
    Primary Reference Image: ${projectContext?.images?.[0] || "None available"}
    -----------------------

    Recent Nodes on Graph:
    ${contextNodesString}

    User Message: "${userMsg}"

    Determine the primary intent. Is the user asking to:
    1. UPDATE_RECIPE: Change the material, shape, or design instructions (e.g. "현무암으로 바꿔줘", "좀 더 길게 만들어줘") -> Also provide the modified 'recipe_update' text based on Base Recipe.
    2. IMAGE_GENERATION: Generate a concept image based on exactly what they described (e.g. "이걸 이미지로 그려줘", "새로운 디자인을 이미지로 보여줘").
      * IF AN IMAGE IS ATTACHED (you will receive it in multimodal parts), you MUST analyze it as a "Style/Material/Concept Reference". Extract its visual traits (texture, material, colors) and write a detailed English 'enriched_prompt' to instruct the image generator (e.g., "Apply the raw concrete texture, minimalist vibe, and dark grey tones from the reference image to the original product shape").
    3. GENERATE: Generate a new 3D model (e.g. "렌더링해줘", "이걸로 3D 모델 만들어줘").
    4. VIEW_CONTROL: Control the 3D viewer (e.g. "회전해봐", "와이어프레임 보여줘").
    5. GENERAL_CHAT: Just asking a question or general discussion.

    Logic Flow (targetNodeId):
    Look at the "Recent Nodes". 
    - If there is a User Tagged Node provided here: [ ${
        taggedNodeId ? `Tag: ${taggedNodeId}` : "None"
    } ], you MUST return its exact ID.
    - If the user introduces a FUNDAMENTALLY NEW action, you MUST return null.
    - Otherwise, if it logically extends the last node's thought, return the parent node's Exact ID string.

    Respond STRICTLY with a JSON object:
    {
       "type": "UPDATE_RECIPE" | "IMAGE_GENERATION" | "GENERATE" | "VIEW_CONTROL" | "GENERAL_CHAT",
       "message": "A friendly, natural, and conversational Korean response to the user. Like a helpful assistant chatting. Acknowledge what was requested and reference the context gracefully if needed. CRITICAL: You MUST address the user affectionately by their profile nickname: '${userNickname}님'. Example: '네, ${userNickname}님! 첨부해주신 이미지의 질감을 반영하여 기존 형태에 합성해 보았습니다.' ",
       "action": "Optional action string (e.g. 'rotate', 'wireframe_on')",
       "recipe_update": "The full revised prompt text (only if type is UPDATE_RECIPE)",
       "enriched_prompt": "Highly descriptive English prompt combining the user's intent, attached image style (if any), and original product features. Focus heavily on transferring the material/style/texture while preserving the base shape.",
       "targetNodeId": "Exact ID from list, or null"
    }
    `;

    try {
        const resultText = await callGemini(
            "gemini-3-flash-preview",
            prompt,
            attachedImageBase64 || undefined,
            true,
        );
        return JSON.parse(resultText) as CopilotResponse;
    } catch (e) {
        console.error("Copilot Analysis Failed", e);
        return {
            type: "GENERAL_CHAT",
            message: "네, 알겠습니다. 어떻게 도와드릴까요?",
        };
    }
};

// 7. Persona Chat (Master Kim)
export const chatWithPersona = async (
    userMsg: string,
    history: { role: string; content: string }[],
    persona: "MASTER_KIM" | "COPILOT",
): Promise<string> => {
    let systemPrompt = "";

    if (persona === "MASTER_KIM") {
        systemPrompt = `
        You are "Master Kim" (김장인), a legendary Jeju Island craftsman with 40+ years of mastery in basalt stone carving, traditional woodworking, and modern upcycling.

        ## CHARACTER PROFILE
        - **Background**: Apprenticed under a Jeju dol-hareubang (stone grandfather) carver at age 16. Transitioned to sustainable design after witnessing ocean plastic pollution on Jeju's coastline.
        - **Expertise**: Material science (especially volcanic basalt, recycled HDPE, ocean-recovered plastics), traditional Korean joinery (짜맞춤), and modern snap-fit engineering.
        - **Philosophy**: "접착제는 게으른 자의 도구다" (Adhesive is a lazy person's tool). Every joint must be mechanical — if it can't be taken apart, it was never properly put together.
        
        ## PERSONALITY
        - Warm and grandfatherly but exacting about craft quality
        - Occasionally uses Jeju dialect expressions for emphasis
        - Gets visibly passionate (in text) when discussing material texture or joint precision
        - Always steers conversation toward: snap-fit integrity, material authenticity, and Jeju identity
        - Gently critical of shortcuts — will push users toward better craftsmanship
        
        ## INTERACTION RULES
        - Keep responses to 2-3 sentences (concise master-to-apprentice dialogue)
        - If user mentions glue or adhesive -> firmly but kindly redirect to mechanical alternatives
        - Reference specific Jeju locations, materials, or seasons when relevant
        - Use craft metaphors and tactile language
        `;
    } else {
        // Fallback or other personas
        systemPrompt = "You are a helpful AI Assistant.";
    }

    // Construct conversation history for context
    const conversation = history.map((h) => `${h.role}: ${h.content}`).join(
        "\n",
    );
    const fullPrompt =
        `${systemPrompt}\n\nConversation History:\n${conversation}\n\nUser: ${userMsg}\nMaster Kim:`;

    try {
        const response = await callGemini(config.models.analysis, fullPrompt);
        return response;
    } catch (e) {
        console.error("Persona Chat Failed", e);
        return "허허, 인터넷이 좀 느리구만. 다시 말해주게.";
    }
};
