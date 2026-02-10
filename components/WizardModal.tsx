import React, { useState, useEffect, useRef } from 'react';
import { Language } from '../App';
import { Project, MaterialAnalysis, WizardStep } from '../types';
import {
    analyzeMaterial,
    generateConceptPrompts,
    generateConceptImages,
    generateBlueprintImage,
    generate3DModel,
    generateFabricationGuide
} from '../services/aiService';
import { uploadToR2 } from '../services/r2Storage';
import { supabase } from '../services/supabase';

// Icons
import {
    Upload, ImageIcon, FileText, Zap, CheckCircle, RefreshCw, Box, Layers,
    ChevronRight, Lamp, Armchair, Sparkles, PenTool, MousePointer2, Settings,
    Palmtree, Type, Minimize, CloudFog, Activity, Grid, Droplets, Scissors,
    Mountain, MonitorPlay, ScanSearch, Star, X, ArrowLeft, ArrowRight,
    Download, Share2, Recycle
} from 'lucide-react';

interface WizardModalProps {
    isOpen: boolean;
    onClose: () => void;
    language: Language;
    userTokens: number;
    setUserTokens: (tokens: number) => void;
    onAddProject: (project: Project) => void;
    user: any;
    onCancel?: () => void;
}

// 1. Categories & Styles Data
const CATEGORIES = [
    { id: 'lighting', name: '조명 (Lighting)', icon: <Lamp size={18} />, desc: '빛 투과 & 전선 구조 최적화' },
    { id: 'furniture', name: '가구 (Furniture)', icon: <Armchair size={18} />, desc: '하중 지지 & 구조 강성 강화' },
    { id: 'interior', name: '인테리어 (Interior)', icon: <Sparkles size={18} />, desc: '심미적 질감 & 정밀 결합' },
    { id: 'stationery', name: '문구 (Stationery)', icon: <PenTool size={18} />, desc: '세밀한 스냅핏 & 사용 편의성' },
];

const STYLE_MAPPING: any = {
    lighting: [
        { id: 'zen_minimal', name: '젠 미니멀', icon: <Minimize size={16} />, desc: '얇은 {material} & 은은한 투과' },
        { id: 'ethereal', name: '에테리얼 글로우', icon: <CloudFog size={16} />, desc: '반투명 {material} & 몽환적 무드' },
        { id: 'tech_utility', name: '테크니컬 유틸리티', icon: <Activity size={16} />, desc: '전선 노출 & {material}의 조화' },
        { id: 'jeju_volcanic', name: '제주 볼케이닉', icon: <Palmtree size={16} />, desc: '현무암 다공성 텍스처 & 빛샘 효과' },
    ],
    furniture: [
        { id: 'modern_nordic', name: '모던 노르딕', icon: <Layers size={16} />, desc: '실용적 라인 & {material}의 온기' },
        { id: 'brutalism', name: '모노리스 브루탈리즘', icon: <Box size={16} />, desc: '압도적 두께 & {material} 덩어리감' },
        { id: 'modular', name: '모듈러 팩토리', icon: <Grid size={16} />, desc: '조립 구조 노출 & 인더스트리얼' },
        { id: 'jeju_olle', name: '제주 올레', icon: <Palmtree size={16} />, desc: '돌담 적층 구조 & 유기적 곡선' },
    ],
    interior: [
        { id: 'pop_terrazzo', name: '팝 아트 테라조', icon: <Grid size={16} />, desc: '과감한 컬러 칩 & {material} 패턴' },
        { id: 'craft_clay', name: '크래프트 클레이', icon: <ImageIcon size={16} />, desc: '{material}의 손맛이 느껴지는 질감' },
        { id: 'digital_glitch', name: '디지털 글리치', icon: <MonitorPlay size={16} />, desc: '오류난 듯한 현대적 패턴' },
        { id: 'jeju_ocean', name: '제주 오션', icon: <Palmtree size={16} />, desc: '바다 윤슬 & {material} 레이어링' },
    ],
    stationery: [
        { id: 'precision_sleek', name: '프리시전 슬릭', icon: <Scissors size={16} />, desc: '0.1mm 오차 없는 칼각' },
        { id: 'tactile_organic', name: '텍타일 오가닉', icon: <Droplets size={16} />, desc: '손에 감기는 부드러운 곡면' },
        { id: 'color_block', name: '컬러 블록', icon: <Layers size={16} />, desc: '선명한 {material} & 컬러 대비' },
        { id: 'jeju_earth', name: '제주 어스', icon: <Mountain size={16} />, desc: '붉은 흙(송이) 색감 & {material} 질감' },
    ],
};

const WizardModal: React.FC<WizardModalProps> = ({
    isOpen, onClose, language, userTokens, setUserTokens, onAddProject, user, onCancel
}) => {
    // State
    const [step, setStep] = useState<WizardStep>('material');
    const [isLoading, setIsLoading] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);

    // Data
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>('');
    const [materialAnalysis, setMaterialAnalysis] = useState<MaterialAnalysis | null>(null);

    const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0].id);
    const [selectedStyle, setSelectedStyle] = useState<string | null>(null);

    // Custom Input State
    const [isCustomCategory, setIsCustomCategory] = useState(false);
    const [customCategory, setCustomCategory] = useState("");
    const [isCustomStyle, setIsCustomStyle] = useState(false);
    const [customStyleName, setCustomStyleName] = useState("");
    const [customStyleDesc, setCustomStyleDesc] = useState("");
    const [customRefImage, setCustomRefImage] = useState<File | null>(null);

    const [conceptPrompts, setConceptPrompts] = useState<string[]>([]);
    const [conceptImages, setConceptImages] = useState<string[]>([]);
    const [selectedConceptIdx, setSelectedConceptIdx] = useState<number | null>(null);

    const [blueprintImage, setBlueprintImage] = useState<string | null>(null);
    const [blueprintType, setBlueprintType] = useState<'production' | 'detailed' | 'mechanical'>('production');

    // Final Data
    const [model3dUrl, setModel3dUrl] = useState<string | null>(null);
    const [guideData, setGuideData] = useState<any>(null);
    const [userNickname, setUserNickname] = useState<string>('');

    // Fetch user's custom nickname from user_profiles table
    useEffect(() => {
        const fetchUserNickname = async () => {
            if (!user) {
                setUserNickname('Maker');
                return;
            }
            try {
                const { data: profile } = await supabase
                    .from('user_profiles')
                    .select('nickname')
                    .eq('user_id', user.id)
                    .maybeSingle();

                if (profile?.nickname) {
                    setUserNickname(profile.nickname);
                } else {
                    // Fallback to OAuth metadata
                    setUserNickname(user.user_metadata?.full_name || user.email?.split('@')[0] || 'Maker');
                }
            } catch (err) {
                console.error('Failed to fetch user nickname:', err);
                setUserNickname(user.user_metadata?.full_name || user.email?.split('@')[0] || 'Maker');
            }
        };
        fetchUserNickname();
    }, [user]);

    // Reset on Open
    useEffect(() => {
        if (isOpen) {
            setStep('material');
            setLogs(['시스템 준비 완료. 재료 분석 대기 중...']);
            setSelectedImage(null);
            setImagePreview('');
            setMaterialAnalysis(null);
            setConceptImages([]);
            setBlueprintImage(null);
            setModel3dUrl(null);
            setIsLoading(false);
            // Reset Custom Inputs
            setIsCustomCategory(false);
            setCustomCategory("");
            setIsCustomStyle(false);
            setCustomStyleName("");
            setCustomStyleDesc("");
            setCustomRefImage(null);
            setBlueprintType('production');
        }
    }, [isOpen]);

    const addLog = (msg: string) => setLogs(prev => [...prev.slice(-4), msg]);

    if (!isOpen) return null;

    // --- Actions ---

    const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setSelectedImage(file);
        const reader = new FileReader();
        reader.onloadend = () => setImagePreview(reader.result as string);
        reader.readAsDataURL(file);

        // Auto Analyze
        setIsLoading(true);
        addLog("재료의 DNA를 분석하는 중...");
        try {
            const base64 = await new Promise<string>((resolve) => {
                const r = new FileReader();
                r.onloadend = () => resolve(r.result as string);
                r.readAsDataURL(file);
            });

            const analysis = await analyzeMaterial(base64);
            setMaterialAnalysis(analysis);
            setStep('analysis_result');
            addLog(`재료 식별 완료: ${analysis.material}`);

            // Auto-select recommended style if any
            if (analysis.recommendations && analysis.recommendations[selectedCategory]) {
                const recStyle = analysis.recommendations[selectedCategory];
                if (recStyle) setSelectedStyle(recStyle);
            }
        } catch (e) {
            console.error(e);
            addLog("분석에 실패했습니다.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleGenerateConcepts = async () => {
        if (!materialAnalysis) return;
        if (!isCustomStyle && !selectedStyle) return;

        setIsLoading(true);
        setStep('concepts');
        setConceptImages([]);
        addLog("디자인 컨셉을 생성하고 있습니다...");

        try {
            let styleName = selectedStyle || "";
            let styleDesc = "";

            if (isCustomStyle) {
                styleName = customStyleName;
                styleDesc = customStyleDesc;
            } else {
                const styleObj = STYLE_MAPPING[selectedCategory]?.find((s: any) => s.id === selectedStyle);
                styleDesc = styleObj ? styleObj.desc : "";
                styleName = styleObj ? styleObj.name : selectedStyle;
            }

            const categoryName = isCustomCategory ? customCategory : (CATEGORIES.find(c => c.id === selectedCategory)?.name || "Item");

            // 1. Get Prompts
            const prompts = await generateConceptPrompts(
                materialAnalysis.material,
                materialAnalysis.traits || "",
                categoryName,
                styleName,
                styleDesc
            );
            setConceptPrompts(prompts);
            addLog("컨셉 프롬프트 생성 완료. 상세 렌더링을 시작합니다...");

            // 2. Render Images (Parallel)
            // Note: Currently generateConceptImages doesn't support customRefImage directly unless we modify aiService
            // For now, we rely on the detailed text prompt.
            const images = await generateConceptImages(prompts);
            setConceptImages(images);
            addLog("렌더링 완료. 마음에 드는 디자인을 선택해주세요.");
        } catch (e) {
            console.error(e);
            addLog("생성에 실패했습니다.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectConcept = async (idx: number) => {
        setSelectedConceptIdx(idx);
        addLog(`컨셉 #${idx + 1} 선택됨. 정밀 도면을 설계 중입니다...`);

        setIsLoading(true);
        try {
            const selectedImage = conceptImages[idx];
            const context = conceptPrompts[idx] || "Upcycled Product";

            // Default to 'production' on first load
            setBlueprintType('production');
            const bp = await generateBlueprintImage(context, selectedImage, 'production');
            setBlueprintImage(bp);
            setStep('blueprint');
            addLog("도면 설계가 완료되었습니다.");
        } catch (e) {
            console.error(e);
            addLog("도면 생성에 실패했습니다.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegenerateBlueprint = async (type: 'production' | 'detailed' | 'mechanical') => {
        if (selectedConceptIdx === null) return;

        setBlueprintType(type);
        setIsLoading(true);
        addLog(`${type === 'production' ? '제작 도면' : type === 'detailed' ? '상세 도면' : '기구 설계 도면'}을 생성하고 있습니다...`);

        try {
            const selectedImage = conceptImages[selectedConceptIdx];
            const context = conceptPrompts[selectedConceptIdx] || "Upcycled Product";

            const bp = await generateBlueprintImage(context, selectedImage, type);
            setBlueprintImage(bp);
            addLog("도면이 업데이트되었습니다.");
        } catch (e) {
            console.error(e);
            addLog("도면 변경에 실패했습니다.");
        } finally {
            setIsLoading(false);
        }
    };

    // 3D generation is now moved to ProjectDetail execution.
    // This handler generates the guide and saves the project directly.
    const handleSkip3D = async () => {
        if (selectedConceptIdx === null) return;
        setIsLoading(true);
        addLog("AI가 제작 가이드를 생성하고 분석 결과를 정리중입니다... (약 10초)");

        try {
            const selectedPrompt = conceptPrompts[selectedConceptIdx] || "";

            // Generate Guide
            const guide = await generateFabricationGuide(materialAnalysis?.material || "Unknown", {
                desiredOutcome: "Upcycled Object",
                category: selectedCategory,
                additionalNotes: `Selected Design Concept Prompt: ${selectedPrompt}. Ensure the guide matches the visual concept.`
            });

            // Even if guide is partial, we proceed
            setGuideData(guide);
            addLog("프로젝트를 저장하고 업로드합니다...");

            // Proceed to save - handleSaveProject handles the finalization
            await handleSaveProject(null, guide);

        } catch (e) {
            console.error("Guide Generation Failed", e);
            addLog("가이드 생성에 실패했습니다. 기본 템플릿으로 저장합니다.");

            // Fallback save
            const fallbackGuide = {
                title: `${materialAnalysis?.material} 업사이클 프로젝트`,
                steps: [{ title: '프로젝트 시작', desc: '분석된 재료를 바탕으로 아이디어를 구체화하세요.' }],
                difficulty: 'Medium',
                estimated_time: '1h',
                tools: '기본 공구'
            };
            await handleSaveProject(null, fallbackGuide);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveProject = async (modelUrl: string | null, guide: any) => {
        if (selectedConceptIdx === null || !user) return;

        try {
            // Upload Generated Assets to R2
            // We have base64 concept image -> Upload
            const conceptImg = conceptImages[selectedConceptIdx];
            const r2ConceptUrl = await uploadToR2(
                await (await fetch(conceptImg)).blob() as File,
                'ai-generated'
            );

            let r2BlueprintUrl = '';
            if (blueprintImage) {
                r2BlueprintUrl = await uploadToR2(
                    await (await fetch(blueprintImage)).blob() as File,
                    'ai-generated'
                );
            }



            // --- Validation & Defaults ---
            const safeGuide = guide || {};
            const safeSteps = Array.isArray(safeGuide.steps) && safeGuide.steps.length > 0
                ? safeGuide.steps
                : [{ title: '프로젝트 시작', desc: 'AI가 생성한 가이드 정보를 불러오지 못했습니다. 나만의 창의적인 방법으로 프로젝트를 시작해보세요!', tip: '자유롭게 수정 가능합니다.' }];

            const safeDescription = safeGuide.description
                || (safeGuide.steps?.[0]?.desc ? safeGuide.steps[0].desc.slice(0, 150) + "..." : null)
                || '제주에서 영감을 받은 업사이클링 프로젝트입니다.';

            const projectData = {
                title: safeGuide.title || `${materialAnalysis?.material || 'Upcycle'} Project`,
                material: materialAnalysis?.material || 'unknown',
                category: selectedCategory,
                estimated_time: safeGuide.estimated_time || '2h', // Default 2h
                difficulty: ['Easy', 'Medium', 'Hard'].includes(safeGuide.difficulty) ? safeGuide.difficulty : 'Medium',
                image_url: r2ConceptUrl,
                metadata: {
                    description: safeDescription,
                    material: materialAnalysis?.material,
                    images: [r2ConceptUrl, r2BlueprintUrl].filter(Boolean),
                    blueprint_url: r2BlueprintUrl,
                    model_3d_url: modelUrl,
                    guide: safeGuide,
                    fabrication_guide: safeSteps,
                    tools: safeGuide.tools || '기본 공구',
                    traits: materialAnalysis?.traits,
                    style: selectedStyle,
                    source_location: safeGuide.recommended_source || 'Jeju Island',
                    eco_impact: safeGuide.eco_impact || { score: 'B', visual_analogy: '지구를 위한 작은 실천' },
                    eco_score: safeGuide.eco_impact?.score || 'B',
                    materials_list: Array.isArray(safeGuide.materials) ? safeGuide.materials : [{ item: materialAnalysis?.material || 'Main Material', estimated_qty: '1' }]
                },
                is_ai_generated: true,
                owner_id: user.id,
                created_at: new Date().toISOString()
            };

            const { data, error } = await supabase.from('items').insert(projectData).select().single();

            if (error) throw error;

            // Map DB response to Project type for local state
            const newProject: Project = {
                id: data.id.toString(),
                title: data.title,
                maker: userNickname || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Maker',
                image: data.image_url,
                images: data.metadata?.images || [],
                category: data.category,
                time: data.estimated_time || '2h',
                difficulty: data.difficulty as 'Easy' | 'Medium' | 'Hard',
                isAiRemix: data.is_ai_generated,
                description: data.description,
                steps: data.metadata?.guide?.steps || [],
                downloadUrl: data.metadata?.blueprint_url,
                modelFiles: (data.metadata?.model_3d_url || data.metadata?.model_url)
                    ? [{ name: '3d_model.glb', type: 'glb', size: 0, url: (data.metadata?.model_3d_url || data.metadata?.model_url) }]
                    : [],
                isPublic: data.is_public ?? false,
                ownerId: data.owner_id,
                likes: data.likes || 0,
                views: data.views || 0,
                createdAt: data.created_at,
                metadata: data.metadata
            };

            console.log('WizardModal: Calling onAddProject with:', newProject);

            // Token deduction moved to App.tsx (Pay to Enter)

            onAddProject(newProject);
            addLog(`프로젝트가 성공적으로 저장되었습니다.`);

            // Transition to Final Step
            setStep('final');

        } catch (e) {
            console.error("Save failed", e);
            addLog("프로젝트 저장에 실패했습니다.");
        }
    };

    // --- Render Logic ---

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-[#FDFCFB] dark:bg-[#1A1A1A] w-full max-w-5xl h-[85vh] rounded-[2rem] shadow-2xl flex flex-col overflow-hidden border border-white/20 relative">

                {/* Header */}
                <div className="px-8 py-5 flex justify-between items-center border-b border-gray-100 dark:border-gray-800 bg-white/50 dark:bg-black/20 backdrop-blur-md sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-200 dark:shadow-none">
                            <Sparkles size={20} />
                        </div>
                        <div>
                            <h2 className="font-bold text-xl text-gray-900 dark:text-white tracking-tight">AI Studio</h2>
                            <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest flex items-center gap-1">
                                <Recycle size={11} className="text-emerald-500 fill-current" />
                                {userTokens} Tokens Available
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            // If not final step, treat as cancel (refund)
                            if (step !== 'final' && onCancel) {
                                onCancel();
                            } else {
                                onClose();
                            }
                        }}
                        className="w-10 h-10 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center transition-colors">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 overflow-y-auto p-8 relative">

                    {/* Step 1: Upload & Material */}
                    {step === 'material' && (
                        <div className="h-full flex flex-col items-center justify-center max-w-lg mx-auto text-center space-y-8 animate-fade-in-up">
                            <div className="space-y-4">
                                <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                                    어떤 재료를 <br />재탄생시키시겠습니까?
                                </h1>
                                <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
                                    사진을 업로드하면 AI가 소재의 DNA를 분석하여<br />가장 이상적인 디자인을 제안합니다.
                                </p>
                            </div>

                            <label className="group w-full aspect-square max-w-sm rounded-[2.5rem] border-4 border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 hover:border-emerald-500 hover:bg-emerald-50/10 transition-all cursor-pointer flex flex-col items-center justify-center relative overflow-hidden">
                                {isLoading ? (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 dark:bg-black/80 backdrop-blur-sm z-10">
                                        <RefreshCw size={40} className="text-emerald-500 animate-spin mb-4" />
                                        <p className="text-sm font-bold text-emerald-600 animate-pulse">{logs[logs.length - 1]}</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="w-20 h-20 rounded-full bg-white dark:bg-gray-700 shadow-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                                            <Upload size={32} className="text-gray-400 group-hover:text-emerald-500 transition-colors" />
                                        </div>
                                        <span className="text-sm font-bold text-gray-400 group-hover:text-emerald-500">사진 선택 또는 촬영</span>
                                    </>
                                )}
                                <input type="file" className="hidden" accept="image/*" onChange={handleImageSelect} disabled={isLoading} />
                            </label>
                        </div>
                    )}

                    {/* Step 2: Analysis & Style Selection */}
                    {step === 'analysis_result' && materialAnalysis && (
                        <div className="max-w-6xl mx-auto h-full grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
                            {/* Left: Identified Material */}
                            <div className="lg:col-span-4 space-y-6">
                                <div className="aspect-square rounded-[2rem] overflow-hidden relative shadow-2xl border-4 border-white dark:border-gray-700">
                                    <img src={imagePreview} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-6">
                                        <div>
                                            <p className="text-emerald-400 font-bold text-sm mb-1 flex items-center gap-1">
                                                <ScanSearch size={14} /> Analysis Complete
                                            </p>
                                            <h2 className="text-3xl font-black text-white">{materialAnalysis.material}</h2>
                                            <p className="text-gray-300 text-sm mt-2 line-clamp-2">{materialAnalysis.traits}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-3xl border border-gray-100 dark:border-gray-700">
                                    <h4 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                        <Settings size={16} /> Category
                                    </h4>
                                    <div className="grid grid-cols-2 gap-2">
                                        {CATEGORIES.map(cat => (
                                            <button
                                                key={cat.id}
                                                onClick={() => { setSelectedCategory(cat.id); setIsCustomCategory(false); }}
                                                className={`p-3 rounded-xl border text-left transition-all ${selectedCategory === cat.id && !isCustomCategory
                                                    ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-200'
                                                    : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:border-emerald-300 text-gray-500'
                                                    }`}
                                            >
                                                <div className="text-[10px] font-bold uppercase opacity-70 mb-1">Category</div>
                                                <div className="font-bold text-sm flex items-center gap-2">
                                                    {cat.name.split(' ')[0]}
                                                </div>
                                            </button>
                                        ))}
                                        {/* Custom Category Button */}
                                        <button
                                            onClick={() => { setIsCustomCategory(true); }}
                                            className={`col-span-2 p-3 rounded-xl border text-left transition-all ${isCustomCategory
                                                ? 'bg-indigo-500 text-white border-indigo-500 shadow-lg shadow-indigo-200'
                                                : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:border-indigo-300 text-gray-500'
                                                }`}
                                        >
                                            <div className="font-bold text-sm flex items-center justify-center gap-2">
                                                <PenTool size={14} /> 직접 입력 (Custom)
                                            </div>
                                        </button>
                                    </div>
                                    {isCustomCategory && (
                                        <div className="mt-3 animate-fade-in-up">
                                            <input
                                                type="text"
                                                placeholder="예: 반려동물 용품, 캠핑 장비..."
                                                className="w-full px-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                                value={customCategory}
                                                onChange={(e) => setCustomCategory(e.target.value)}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Right: Style Selector */}
                            <div className="lg:col-span-8 flex flex-col justify-between">
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Choose a Design Style</h3>

                                    {/* Scrollable Style Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                                        {/* Existing Styles */}
                                        {(!isCustomCategory ? (STYLE_MAPPING[selectedCategory] || []) : []).map((style: any) => {
                                            const isRecommended = materialAnalysis.recommendations?.[selectedCategory] === style.id;
                                            const isSelected = selectedStyle === style.id && !isCustomStyle;
                                            const displayDesc = style.desc.replace('{material}', materialAnalysis.material || '재료');

                                            return (
                                                <button
                                                    key={style.id}
                                                    onClick={() => { setSelectedStyle(style.id); setIsCustomStyle(false); }}
                                                    className={`relative p-5 rounded-3xl border-2 text-left transition-all duration-300 group ${isSelected
                                                        ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/20 shadow-xl'
                                                        : 'border-gray-100 dark:border-gray-800 hover:border-emerald-200 hover:bg-gray-50 dark:hover:bg-gray-800'
                                                        }`}
                                                >
                                                    {isRecommended && (
                                                        <div className="absolute top-4 right-4 bg-emerald-500 text-white text-[10px] font-black px-2 py-1 rounded-full flex items-center gap-1 shadow-md">
                                                            <Star size={8} className="fill-current" /> AI PICK
                                                        </div>
                                                    )}
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 transition-colors ${isSelected ? 'bg-emerald-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 group-hover:text-emerald-500'
                                                        }`}>
                                                        {style.icon}
                                                    </div>
                                                    <h4 className={`font-bold text-lg mb-1 ${isSelected ? 'text-emerald-900 dark:text-emerald-100' : 'text-gray-900 dark:text-white'}`}>
                                                        {style.name}
                                                    </h4>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">{displayDesc}</p>
                                                </button>
                                            );
                                        })}

                                        {/* Custom Style Card */}
                                        <div
                                            onClick={() => setIsCustomStyle(true)}
                                            className={`md:col-span-2 relative p-6 rounded-3xl border-2 text-left transition-all duration-300 cursor-pointer ${isCustomStyle
                                                ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/20 shadow-xl'
                                                : 'border-dashed border-gray-300 dark:border-gray-700 hover:border-indigo-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                                                }`}
                                        >
                                            <div className="flex items-center gap-4 mb-4">
                                                <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${isCustomStyle ? 'bg-indigo-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-400'}`}>
                                                    <PenTool size={20} />
                                                </div>
                                                <div>
                                                    <h4 className={`font-bold text-lg ${isCustomStyle ? 'text-indigo-900 dark:text-indigo-100' : 'text-gray-500 dark:text-gray-400'}`}>
                                                        나만의 스타일 만들기 (Custom)
                                                    </h4>
                                                    <p className="text-xs text-gray-400">원하는 분위기나 디자인을 직접 설명해주세요.</p>
                                                </div>
                                            </div>

                                            {isCustomStyle && (
                                                <div className="space-y-4 animate-fade-in-up" onClick={e => e.stopPropagation()}>
                                                    <input
                                                        type="text"
                                                        placeholder="스타일 이름 (예: 사이버펑크 네온)"
                                                        className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                                                        value={customStyleName}
                                                        onChange={(e) => setCustomStyleName(e.target.value)}
                                                    />
                                                    <textarea
                                                        placeholder="구체적인 묘사 (예: 네온 사인이 빛나는 미래지향적인 분위기, 금속 질감 강조...)"
                                                        className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 outline-none text-sm h-24 resize-none"
                                                        value={customStyleDesc}
                                                        onChange={(e) => setCustomStyleDesc(e.target.value)}
                                                    />
                                                    {/* Reference Image Upload (UI only for now) */}
                                                    <div className="flex items-center gap-2">
                                                        <label className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50">
                                                            <ImageIcon size={16} className="text-gray-500" />
                                                            <span className="text-xs font-bold text-gray-500">참고 이미지 추가 (선택)</span>
                                                            <input type="file" className="hidden" accept="image/*" onChange={(e) => setCustomRefImage(e.target.files?.[0] || null)} />
                                                        </label>
                                                        {customRefImage && <span className="text-xs text-indigo-500 font-bold">{customRefImage.name}</span>}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={handleGenerateConcepts}
                                    disabled={isLoading}
                                    className="mt-8 w-full py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl font-bold text-lg hover:scale-[1.02] active:scale-95 transition-all shadow-xl flex items-center justify-center gap-2"
                                >
                                    {isLoading ? <RefreshCw className="animate-spin" /> : <Zap className="fill-current" />}
                                    Generate 4 Concepts
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Concept Selection (4-Grid) */}
                    {step === 'concepts' && (
                        <div className="h-full flex flex-col">
                            <h3 className="text-center text-2xl font-bold text-gray-900 dark:text-white mb-8 animate-fade-in-up">
                                Select Your Favorite Design
                            </h3>

                            <div className="flex-1 w-full flex flex-col overflow-hidden">
                                {/* Mobile: Horizontal Snapping Carousel */}
                                <div className="md:hidden flex-1 w-full overflow-x-auto snap-x snap-mandatory scrollbar-hide flex items-center px-[10vw] gap-4 pb-8">
                                    {conceptImages.map((img, idx) => (
                                        <div
                                            key={idx}
                                            onClick={() => handleSelectConcept(idx)}
                                            className="relative flex-shrink-0 w-[80vw] aspect-[3/4] rounded-[2rem] overflow-hidden snap-center shadow-xl transition-all duration-500 border-4 border-transparent hover:border-emerald-400 group"
                                        >
                                            <img src={img} className="w-full h-full object-cover" />
                                            {/* Glassmorphism Selection Overlay */}
                                            <div className={`absolute inset-0 flex items-end justify-center p-6 bg-gradient-to-t from-black/60 to-transparent transition-opacity duration-300 ${selectedConceptIdx === idx ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                                <div className="w-full bg-white/20 backdrop-blur-md border border-white/30 text-white py-3 rounded-xl font-bold text-center shadow-lg">
                                                    {selectedConceptIdx === idx ? 'Selected' : 'Select Design'}
                                                </div>
                                            </div>
                                            {/* Active Indicator */}
                                            {selectedConceptIdx === idx && (
                                                <div className="absolute top-4 right-4 bg-emerald-500 text-white p-2 rounded-full shadow-lg animate-bounce">
                                                    <CheckCircle size={20} />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {/* Desktop: Grid Layout (Existing) */}
                                <div className="hidden md:grid grid-cols-2 gap-6 max-w-4xl mx-auto w-full overflow-y-auto custom-scrollbar pr-2 pb-4">
                                    {conceptImages.map((img, idx) => (
                                        <div
                                            key={idx}
                                            onClick={() => handleSelectConcept(idx)}
                                            className={`group relative rounded-[2rem] overflow-hidden cursor-pointer shadow-lg hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 border-4 bg-white aspect-[4/3] ${selectedConceptIdx === idx ? 'border-emerald-500 ring-4 ring-emerald-500/20' : 'border-transparent hover:border-emerald-400'}`}
                                        >
                                            <img src={img} className="w-full h-full object-cover" />
                                            <div className={`absolute inset-0 bg-black/40 transition-opacity flex items-center justify-center ${selectedConceptIdx === idx ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                                <div className="bg-white text-gray-900 px-6 py-3 rounded-full font-bold shadow-xl transform translate-y-4 group-hover:translate-y-0 transition-transform">
                                                    {selectedConceptIdx === idx ? 'Selected' : 'Select This'}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            {isLoading && (
                                <div className="absolute inset-0 z-20 bg-white/80 dark:bg-black/80 backdrop-blur-md flex flex-col items-center justify-center px-6 text-center">
                                    <RefreshCw size={48} className="text-emerald-500 animate-spin mb-4" />
                                    <p className="text-xl font-bold text-gray-800 dark:text-white max-w-md leading-relaxed whitespace-pre-wrap">
                                        {logs[logs.length - 1]}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 4: Blueprint & 3D Choice */}
                    {step === 'blueprint' && blueprintImage && (
                        <div className="h-full flex flex-col gap-8 animate-fade-in overflow-y-auto custom-scrollbar p-1">
                            {/* Blueprint View (Full Width) */}
                            <div className="flex flex-col gap-4 w-full">
                                {/* Type Selector Removed as per request - Only Production Drawing in Wizard */}

                                <div className="bg-blue-900/5 rounded-[2.5rem] p-6 lg:p-8 border border-blue-900/10 flex flex-col relative overflow-hidden min-h-[400px] lg:min-h-[600px] w-full max-w-5xl mx-auto shadow-sm">
                                    <h4 className="text-blue-900 dark:text-blue-200 font-black tracking-widest uppercase mb-4 opacity-50 text-xs lg:text-sm">
                                        ISO 128 • Production Drawing
                                    </h4>
                                    {isLoading && step === 'blueprint' ? (
                                        <div className="flex-1 flex items-center justify-center">
                                            <RefreshCw className="animate-spin text-blue-500" size={48} />
                                        </div>
                                    ) : (
                                        <img src={blueprintImage} className="flex-1 object-contain mix-blend-multiply dark:mix-blend-normal w-full" />
                                    )}
                                    <div className="absolute bottom-6 right-6 flex gap-2">
                                        <span className="bg-white/80 dark:bg-black/50 backdrop-blur px-3 py-1 rounded text-[10px] font-mono border">SCALE 1:5</span>
                                    </div>
                                </div>
                            </div>

                            {/* Actions (Centered Below) */}
                            <div className="flex flex-col justify-center space-y-6 w-full max-w-2xl mx-auto text-center pb-8">
                                <div>
                                    <h2 className="text-3xl lg:text-4xl font-black text-gray-900 dark:text-white mb-2 lg:mb-4">Ready to Build?</h2>
                                    <p className="text-lg lg:text-xl text-gray-500 dark:text-gray-400 font-medium">
                                        Save your project to the library.
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    <button
                                        onClick={handleSkip3D}
                                        disabled={isLoading}
                                        className="w-full py-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xl shadow-xl shadow-blue-200 hover:scale-[1.02] transition-transform flex items-center justify-center gap-3"
                                    >
                                        {isLoading ? <RefreshCw className="animate-spin" /> : <CheckCircle size={24} className="fill-white/20" />}
                                        Save to Library
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 5: Final Loading / Result */}
                    {step === 'final' && (
                        <div className="h-full flex flex-col items-center justify-center text-center animate-fade-in">
                            {/* Assuming we close or show success state. For now just loading finalization or close */}
                            <CheckCircle size={64} className="text-emerald-500 mb-6 animate-bounce" />
                            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">프로젝트 생성 완료!</h2>
                            <p className="text-gray-500 mb-8">당신의 걸작이 서재에 저장되었습니다.</p>
                            <button onClick={onClose} className="px-8 py-3 bg-gray-900 text-white rounded-xl font-bold">스튜디오 닫기</button>
                        </div>
                    )}
                </div>

                {/* Footer / Logs */}
                <div className="bg-gray-50 dark:bg-black/40 border-t border-gray-100 dark:border-gray-800 px-6 py-3 flex justify-between items-center text-[10px] font-mono text-gray-400">
                    <div className="flex items-center gap-2 max-w-[70%]">
                        <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isLoading ? 'bg-emerald-500 animate-ping' : 'bg-gray-300'}`}></div>
                        <span className="uppercase tracking-widest truncate">{logs[logs.length - 1] || "시스템 대기 중"}</span>
                    </div>
                    <div className="hidden sm:block">JEJU REMAKER AI CORE v2.5</div>
                </div>

            </div>
        </div>
    );
};

export default WizardModal;