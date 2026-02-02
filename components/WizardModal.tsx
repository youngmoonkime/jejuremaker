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
import { config } from '../services/config';
import { uploadToR2 } from '../services/r2Storage';
import { createClient } from '@supabase/supabase-js';

// Icons
import {
    Upload, ImageIcon, FileText, Zap, CheckCircle, RefreshCw, Box, Layers,
    ChevronRight, Lamp, Armchair, Sparkles, PenTool, MousePointer2, Settings,
    Palmtree, Type, Minimize, CloudFog, Activity, Grid, Droplets, Scissors,
    Mountain, MonitorPlay, ScanSearch, Star, X, ArrowLeft, ArrowRight,
    Download, Share2
} from 'lucide-react';

interface WizardModalProps {
    isOpen: boolean;
    onClose: () => void;
    language: Language;
    userTokens: number;
    setUserTokens: (tokens: number) => void;
    onAddProject: (project: Project) => void;
    user: any;
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
        { id: 'zen_minimal', name: '젠 미니멀', icon: <Minimize size={16} />, desc: '얇은 펄프 & 은은한 투과' },
        { id: 'ethereal', name: '에테리얼 글로우', icon: <CloudFog size={16} />, desc: '반투명 HDPE & 몽환적 무드' },
        { id: 'tech_utility', name: '테크니컬 유틸리티', icon: <Activity size={16} />, desc: '전선 노출 & 고프코어 감성' },
        { id: 'jeju_volcanic', name: '제주 볼케이닉', icon: <Palmtree size={16} />, desc: '현무암 다공성 & 빛샘 효과' },
    ],
    furniture: [
        { id: 'modern_nordic', name: '모던 노르딕', icon: <Layers size={16} />, desc: '실용적 라인 & 밝은 톤' },
        { id: 'brutalism', name: '모노리스 브루탈리즘', icon: <Box size={16} />, desc: '압도적 두께 & 건축적 덩어리감' },
        { id: 'modular', name: '모듈러 팩토리', icon: <Grid size={16} />, desc: '조립 구조 노출 & 인더스트리얼' },
        { id: 'jeju_olle', name: '제주 올레', icon: <Palmtree size={16} />, desc: '돌담 적층 구조 & 유기적 곡선' },
    ],
    interior: [
        { id: 'pop_terrazzo', name: '팝 아트 테라조', icon: <Grid size={16} />, desc: '과감한 컬러 칩 & 픽셀 패턴' },
        { id: 'craft_clay', name: '크래프트 클레이', icon: <ImageIcon size={16} />, desc: '손맛이 느껴지는 거친 질감' },
        { id: 'digital_glitch', name: '디지털 글리치', icon: <MonitorPlay size={16} />, desc: '오류난 듯한 현대적 패턴' },
        { id: 'jeju_ocean', name: '제주 오션', icon: <Palmtree size={16} />, desc: '바다 윤슬 & 레이어링' },
    ],
    stationery: [
        { id: 'precision_sleek', name: '프리시전 슬릭', icon: <Scissors size={16} />, desc: '0.1mm 오차 없는 칼각' },
        { id: 'tactile_organic', name: '텍타일 오가닉', icon: <Droplets size={16} />, desc: '손에 감기는 부드러운 곡면' },
        { id: 'color_block', name: '컬러 블록', icon: <Layers size={16} />, desc: '선명한 펄프-플라스틱 대비' },
        { id: 'jeju_earth', name: '제주 어스', icon: <Mountain size={16} />, desc: '붉은 흙(송이) 색감 & 질감' },
    ],
};

const WizardModal: React.FC<WizardModalProps> = ({
    isOpen, onClose, language, userTokens, setUserTokens, onAddProject, user
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

    const [conceptPrompts, setConceptPrompts] = useState<string[]>([]);
    const [conceptImages, setConceptImages] = useState<string[]>([]);
    const [selectedConceptIdx, setSelectedConceptIdx] = useState<number | null>(null);

    const [blueprintImage, setBlueprintImage] = useState<string | null>(null);

    // Final Data
    const [model3dUrl, setModel3dUrl] = useState<string | null>(null);
    const [guideData, setGuideData] = useState<any>(null);

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
        if (!materialAnalysis || !selectedStyle) return;

        setIsLoading(true);
        setStep('concepts');
        setConceptImages([]);
        addLog("디자인 컨셉을 생성하고 있습니다...");

        try {
            const styleObj = STYLE_MAPPING[selectedCategory]?.find((s: any) => s.id === selectedStyle);
            const styleDesc = styleObj ? styleObj.desc : "";
            const styleName = styleObj ? styleObj.name : selectedStyle;

            // 1. Get Prompts
            const prompts = await generateConceptPrompts(
                materialAnalysis.material,
                materialAnalysis.traits || "",
                CATEGORIES.find(c => c.id === selectedCategory)?.name || "Item",
                styleName,
                styleDesc
            );
            setConceptPrompts(prompts);
            addLog("컨셉 프롬프트 생성 완료. 상세 렌더링을 시작합니다...");

            // 2. Render Images (Parallel)
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
            // Generate Blueprint immediately upon selection? Or user clicks next?
            // User flow: Select -> Transition to Blueprint
            setStep('blueprint');

            const selectedImage = conceptImages[idx];
            // Context from prompts
            const context = conceptPrompts[idx] || "Upcycled Product";

            const bp = await generateBlueprintImage(context, selectedImage);
            setBlueprintImage(bp);
            addLog("도면 설계가 완료되었습니다.");
        } catch (e) {
            console.error(e);
            addLog("도면 생성에 실패했습니다.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleGenerate3D = async () => {
        if (selectedConceptIdx === null) return;
        setIsLoading(true);
        addLog("3D 모델을 구축하고 있습니다... (약 1분 소요)");

        try {
            const selectedImage = conceptImages[selectedConceptIdx];
            const modelUrl = await generate3DModel(selectedImage);
            setModel3dUrl(modelUrl);
            addLog("3D 모델 구축 성공.");

            // Also generate guide here
            const guide = await generateFabricationGuide(materialAnalysis?.material || "Unknown", {
                desiredOutcome: "Upcycled Object",
                category: selectedCategory,
                additionalNotes: "Selected from AI Wizard"
            });
            setGuideData(guide);

            setStep('final');
            await handleSaveProject(modelUrl, guide); // Save automatically
        } catch (e) {
            console.error(e);
            addLog("3D 생성에 실패했습니다.");
            // Even if 3D fails, proceed to final?
            setStep('final');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSkip3D = async () => {
        if (selectedConceptIdx === null) return;
        setIsLoading(true);
        addLog("3D 단계를 건너뛰고 프로젝트를 저장합니다...");

        try {
            const guide = await generateFabricationGuide(materialAnalysis?.material || "Unknown", {
                desiredOutcome: "Upcycled Object",
                category: selectedCategory,
                additionalNotes: "Selected from AI Wizard"
            });
            setGuideData(guide);
            setStep('final');
            await handleSaveProject(null, guide);
        } catch (e) {
            console.error(e);
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

            const supabase = createClient(config.supabase.url, config.supabase.anonKey);

            const projectData = {
                title: `${materialAnalysis?.material} Upcycle Project`,
                material: materialAnalysis?.material || 'unknown',
                category: selectedCategory,
                difficulty: guide?.difficulty || 'Medium',
                // description: guide?.steps?.[0]?.desc || 'AI Generated Project', // Move to metadata
                image_url: r2ConceptUrl, // Correct column name
                // images: [r2ConceptUrl, r2BlueprintUrl].filter(Boolean), // Move to metadata
                metadata: {
                    description: guide?.steps?.[0]?.desc || 'AI Generated Project',
                    material: materialAnalysis?.material,
                    images: [r2ConceptUrl, r2BlueprintUrl].filter(Boolean),
                    blueprint_url: r2BlueprintUrl,
                    model_3d_url: modelUrl,
                    guide: guide,
                    traits: materialAnalysis?.traits,
                    style: selectedStyle
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
                maker: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Maker',
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
            // Update User Tokens
            setUserTokens(userTokens - 5);
            onAddProject(newProject);
            addLog("프로젝트가 성공적으로 저장되었습니다.");

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
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                                <Zap size={10} className="text-yellow-400 fill-current" />
                                {userTokens} Tokens Available
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center transition-colors">
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
                                                onClick={() => setSelectedCategory(cat.id)}
                                                className={`p-3 rounded-xl border text-left transition-all ${selectedCategory === cat.id
                                                    ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-200'
                                                    : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:border-emerald-300 text-gray-500'
                                                    }`}
                                            >
                                                <div className="text-[10px] font-bold uppercase opacity-70 mb-1">Category</div>
                                                <div className="font-bold text-sm flex items-center gap-2">
                                                    {/*{cat.icon}*/}
                                                    {cat.name.split(' ')[0]}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Right: Style Selector */}
                            <div className="lg:col-span-8 flex flex-col justify-between">
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Choose a Design Style</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {(STYLE_MAPPING[selectedCategory] || []).map((style: any) => {
                                            const isRecommended = materialAnalysis.recommendations?.[selectedCategory] === style.id;
                                            const isSelected = selectedStyle === style.id;

                                            return (
                                                <button
                                                    key={style.id}
                                                    onClick={() => setSelectedStyle(style.id)}
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
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">{style.desc}</p>
                                                </button>
                                            );
                                        })}
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

                            <div className="flex-1 grid grid-cols-2 gap-4 md:gap-6 max-w-4xl mx-auto w-full">
                                {conceptImages.map((img, idx) => (
                                    <div
                                        key={idx}
                                        onClick={() => handleSelectConcept(idx)}
                                        className="group relative rounded-[2rem] overflow-hidden cursor-pointer shadow-lg hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 border-4 border-transparent hover:border-emerald-400 bg-white"
                                    >
                                        <img src={img} className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                            <div className="bg-white text-gray-900 px-6 py-3 rounded-full font-bold shadow-xl transform translate-y-4 group-hover:translate-y-0 transition-transform">
                                                Select This
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {isLoading && (
                                <div className="absolute inset-0 z-20 bg-white/80 dark:bg-black/80 backdrop-blur-md flex flex-col items-center justify-center">
                                    <RefreshCw size={48} className="text-emerald-500 animate-spin mb-4" />
                                    <p className="text-xl font-bold text-gray-800 dark:text-white">
                                        {logs[logs.length - 1]}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 4: Blueprint & 3D Choice */}
                    {step === 'blueprint' && blueprintImage && (
                        <div className="h-full grid grid-cols-1 lg:grid-cols-2 gap-10 animate-fade-in">
                            {/* Blueprint View */}
                            <div className="bg-blue-900/5 rounded-[2.5rem] p-8 border border-blue-900/10 flex flex-col relative overflow-hidden">
                                <h4 className="text-blue-900 dark:text-blue-200 font-black tracking-widest uppercase mb-4 opacity-50">ISO 128 Engineering Blueprint</h4>
                                <img src={blueprintImage} className="flex-1 object-contain mix-blend-multiply dark:mix-blend-normal" />
                                <div className="absolute bottom-6 right-6 flex gap-2">
                                    <span className="bg-white/80 dark:bg-black/50 backdrop-blur px-3 py-1 rounded text-[10px] font-mono border">SCALE 1:5</span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col justify-center space-y-8 pl-4">
                                <div>
                                    <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-4">Ready to Build?</h2>
                                    <p className="text-xl text-gray-500 dark:text-gray-400 font-medium">
                                        We can generate a 3D model for this design now.
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    <button
                                        onClick={handleGenerate3D}
                                        disabled={isLoading}
                                        className="w-full py-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xl shadow-xl shadow-blue-200 hover:scale-[1.02] transition-transform flex items-center justify-center gap-3"
                                    >
                                        {isLoading ? <RefreshCw className="animate-spin" /> : <Box size={24} className="fill-white/20" />}
                                        Launch Reality Studio (3D)
                                    </button>

                                    <button
                                        onClick={handleSkip3D}
                                        disabled={isLoading}
                                        className="w-full py-4 text-gray-400 font-bold hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                                    >
                                        Skip 3D, just save the project
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
                <div className="bg-gray-50 dark:bg-black/40 border-t border-gray-100 dark:border-gray-800 px-8 py-3 flex justify-between items-center text-[10px] font-mono text-gray-400">
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${isLoading ? 'bg-emerald-500 animate-ping' : 'bg-gray-300'}`}></div>
                        <span className="uppercase tracking-widest">{logs[logs.length - 1] || "시스템 대기 중"}</span>
                    </div>
                    <div>JEJU REMAKER AI CORE v2.5</div>
                </div>

            </div>
        </div>
    );
};

export default WizardModal;