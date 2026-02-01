import React, { useState } from 'react';
import { Language } from '../App';
import { Project, MaterialAnalysis, UserIntent, WizardStep } from '../types';
import { analyzeMaterial as apiAnalyze, generateFabricationGuide, generateUpcyclingImage, generate3DModel, generateBlueprintImage } from '../services/aiService';
import { config } from '../services/config';

interface WizardModalProps {
    isOpen: boolean;
    onClose: () => void;
    language: Language;
    userTokens: number;
    setUserTokens: (tokens: number) => void;
    onAddProject: (project: Project) => void;
    user: any;
}

const TRANSLATIONS = {
    ko: {
        step1Title: '재료 분석',
        step1Desc: 'AI가 사진을 분석하여 재료를 식별합니다',
        step2Title: 'AI 추천',
        step2Desc: '분석된 재료로 만들 수 있는 것들을 추천해드립니다',
        step3Title: '최종 생성',
        step3Desc: '상세한 제작 가이드를 생성합니다',
        uploadImage: '이미지 업로드',
        analyzing: '분석 중...',
        next: '다음',
        generate: '생성하기 (5 토큰)',
        close: '닫기',
        back: '이전',
        recommendedCategories: '추천 카테고리',
        selectCategory: '카테고리를 선택하세요',
        customIdea: '직접 입력',
        customPlaceholder: '만들고 싶은 것을 입력하세요',
        additionalNotes: '추가 요구사항 (선택)',
        notesPlaceholder: '색상, 크기, 스타일 등',
        insufficientTokens: '토큰이 부족합니다',
        generating: '생성 중...',
        success: '프로젝트가 생성되었습니다!',
        error: '오류가 발생했습니다'
    },
    en: {
        step1Title: 'Material Analysis',
        step1Desc: 'AI identifies the material from your photo',
        step2Title: 'AI Recommendations',
        step2Desc: 'Discover what you can create with this material',
        step3Title: 'Final Generation',
        step3Desc: 'Generate detailed fabrication guide',
        uploadImage: 'Upload Image',
        analyzing: 'Analyzing...',
        next: 'Next',
        generate: 'Generate (5 Tokens)',
        close: 'Close',
        back: 'Back',
        recommendedCategories: 'Recommended Categories',
        selectCategory: 'Select a category',
        customIdea: 'Custom Idea',
        customPlaceholder: 'Enter what you want to make',
        additionalNotes: 'Additional Notes (Optional)',
        notesPlaceholder: 'color, size, style, etc.',
        insufficientTokens: 'Insufficient tokens',
        generating: 'Generating...',
        success: 'Project created!',
        error: 'An error occurred'
    }
};

const CATEGORIES = {
    ko: [
        { id: 'furniture', name: '가구', icon: 'chair', suggestions: ['의자', '테이블', '선반', '수납장'] },
        { id: 'lighting', name: '조명', icon: 'lightbulb', suggestions: ['스탠드', '펜던트 조명', '무드등', '랜턴'] },
        { id: 'interior', name: '인테리어 소품', icon: 'home', suggestions: ['화분', '꽃병', '액자', '장식품'] },
        { id: 'art', name: '예술', icon: 'palette', suggestions: ['조형물', '벽걸이', '모빌', '오브제'] },
        { id: 'education', name: '교육', icon: 'school', suggestions: ['학습 도구', '교구', '실험 키트', '퍼즐'] },
        { id: 'lifestyle', name: '생활용품', icon: 'shopping_bag', suggestions: ['수납함', '필통', '소품 케이스', '정리함'] }
    ],
    en: [
        { id: 'furniture', name: 'Furniture', icon: 'chair', suggestions: ['Chair', 'Table', 'Shelf', 'Storage'] },
        { id: 'lighting', name: 'Lighting', icon: 'lightbulb', suggestions: ['Lamp', 'Pendant Light', 'Mood Light', 'Lantern'] },
        { id: 'interior', name: 'Interior', icon: 'home', suggestions: ['Planter', 'Vase', 'Frame', 'Decoration'] },
        { id: 'art', name: 'Art', icon: 'palette', suggestions: ['Sculpture', 'Wall Art', 'Mobile', 'Object'] },
        { id: 'education', name: 'Education', icon: 'school', suggestions: ['Learning Tool', 'Educational Kit', 'Experiment Kit', 'Puzzle'] },
        { id: 'lifestyle', name: 'Lifestyle', icon: 'shopping_bag', suggestions: ['Storage Box', 'Pencil Case', 'Organizer', 'Container'] }
    ]
};

const WizardModal: React.FC<WizardModalProps> = ({
    isOpen,
    onClose,
    language,
    userTokens,
    setUserTokens,
    onAddProject,
    user
}) => {
    const t = TRANSLATIONS[language];
    const categories = CATEGORIES[language];
    const [currentStep, setCurrentStep] = useState<WizardStep>('material');
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>('');
    const [materialAnalysis, setMaterialAnalysis] = useState<MaterialAnalysis | null>(null);
    const [userIntent, setUserIntent] = useState<UserIntent>({ desiredOutcome: '', category: '', additionalNotes: '' });

    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);

    // Detailed Generation Status
    const [genStatus, setGenStatus] = useState({
        image: 'pending' as 'pending' | 'loading' | 'success' | 'error',
        model3d: 'pending' as 'pending' | 'loading' | 'success' | 'error',
        guide: 'pending' as 'pending' | 'loading' | 'success' | 'error'
    });
    const [generatedArtifacts, setGeneratedArtifacts] = useState({
        imageUrl: '',
        modelUrl: '',
        guideData: null as any
    });

    if (!isOpen) return null;

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);

            // Auto-start analysis
            analyzeMaterial(file);
        }
        // Clear input value to allow re-selection of same file
        e.target.value = '';
    };

    const analyzeMaterial = async (file: File) => {
        setIsLoading(true);
        try {
            // Convert to base64
            const reader = new FileReader();
            reader.readAsDataURL(file);

            const base64Promise = new Promise<string>((resolve) => {
                reader.onloadend = () => resolve(reader.result as string);
            });
            const base64 = await base64Promise;

            // Call Gemini API
            const result = await apiAnalyze(base64);

            setMaterialAnalysis(result);
            setCurrentStep('intent');
        } catch (error) {
            console.error('Material analysis failed:', error);
            alert(error instanceof Error ? error.message : t.error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGenerate = async () => {
        if (userTokens < 5) {
            alert(t.insufficientTokens);
            return;
        }

        setIsLoading(true);
        setCurrentStep('generation');
        setGenStatus({ image: 'loading', model3d: 'pending', guide: 'loading' });

        try {
            // Import supabase for saving
            const { createClient } = await import('@supabase/supabase-js');
            const supabase = createClient(config.supabase.url, config.supabase.anonKey);

            // 1. Upload User Image (Synchronous)
            let userImageUrl = imagePreview.startsWith('data:') ? null : imagePreview;
            if (selectedImage) {
                const fileExt = selectedImage.name.split('.').pop() || 'jpg';
                const fileName = `wizard_${Date.now()}_${Math.random().toString(36).slice(2, 9)}.${fileExt}`;
                try {
                    const { error: uploadError } = await supabase.storage.from('item-images').upload(fileName, selectedImage);
                    if (!uploadError) {
                        const { data } = supabase.storage.from('item-images').getPublicUrl(fileName);
                        userImageUrl = data.publicUrl;
                    }
                } catch (err) { console.error("Upload failed", err); }
            }

            const promptContext = `${materialAnalysis?.material}로 만든 ${userIntent.desiredOutcome}. ${userIntent.additionalNotes}. 고품질 제품 사진 스타일, 깨끗한 배경, 상세한 디테일`;

            // 2. Parallel AI Generation: ImageFirst, Blueprint, Guide. 3D is separate now.

            // A. 가이드 생성 (병렬 시작)
            const guidePromise = generateFabricationGuide(materialAnalysis?.material || '', userIntent)
                .then(data => {
                    setGenStatus(prev => ({ ...prev, guide: 'success' }));
                    setGeneratedArtifacts(prev => ({ ...prev, guideData: data }));
                    return data;
                })
                .catch(err => {
                    console.error('Guide Gen Failed', err);
                    setGenStatus(prev => ({ ...prev, guide: 'error' }));
                    return null;
                });

            // B. 이미지 생성 (병렬 시작 - 2장: 제품샷, 도면)
            const imagePromise = generateUpcyclingImage(promptContext);
            const blueprintPromise = generateBlueprintImage(promptContext); // Assume imported

            // Wait for Images
            const [imgRes, blueprintRes] = await Promise.allSettled([imagePromise, blueprintPromise]);

            const generatedImageBase64 = imgRes.status === 'fulfilled' ? imgRes.value : null;
            const generatedBlueprintBase64 = blueprintRes.status === 'fulfilled' ? blueprintRes.value : null;

            if (generatedImageBase64) setGenStatus(prev => ({ ...prev, image: 'success' }));
            else setGenStatus(prev => ({ ...prev, image: 'error' }));

            if (generatedBlueprintBase64) setGenStatus(prev => ({ ...prev, blueprint: 'success' }));
            else setGenStatus(prev => ({ ...prev, blueprint: 'error' }));

            setGeneratedArtifacts(prev => ({
                ...prev,
                imageUrl: generatedImageBase64 || '',
                blueprintUrl: generatedBlueprintBase64 || ''
            }));


            // 3D는 여기서 자동 생성하지 않음
            setGenStatus(prev => ({ ...prev, model3d: 'idle' }));
            const model3dUrl = null; // 아직 생성 안함

            // 가이드 완료 대기
            const guideData = await guidePromise;

            if (!guideData) throw new Error("가이드 생성에 실패했습니다.");

            // 최종 이미지 결정
            const finalImage = generatedImageBase64 || userImageUrl;

            // Deduct tokens
            setUserTokens(userTokens - 5);

            // Construct Project Data
            const projectData = {
                title: `${materialAnalysis?.material}로 만든 ${userIntent.desiredOutcome}`,
                material: materialAnalysis?.material || 'Unknown',
                category: userIntent.category || 'Upcycling',
                difficulty: guideData.difficulty || 'Medium',
                co2_reduction: 0.5,
                estimated_time: guideData.estimated_time || '2h',
                required_tools: guideData.tools || '',
                image_url: finalImage,
                is_ai_generated: true,
                is_public: false,
                owner_id: user?.id,
                metadata: {
                    material_analysis: materialAnalysis,
                    user_intent: userIntent,
                    fabrication_guide: guideData.steps || [],
                    images: finalImage ? [finalImage] : [],
                    model_3d_url: null, // 추후 생성
                    blueprint_url: generatedBlueprintBase64 // 도면 저장
                }
            };

            // Save to Supabase
            const { data: savedProject, error: saveError } = await supabase
                .from('items')
                .insert(projectData)
                .select()
                .single();

            // Create Local Project object
            const newProject: Project = {
                id: savedProject?.id?.toString() || `wizard-${Date.now()}`,
                title: projectData.title,
                maker: user?.email || 'AI Architect',
                image: finalImage || '',
                category: projectData.category,
                time: projectData.estimated_time,
                difficulty: projectData.difficulty as any,
                isAiRemix: true,
                description: `${materialAnalysis?.material} 재활용 프로젝트`,
                steps: guideData.steps || [],
                isPublic: false,
                ownerId: user?.id,
                metadata: projectData.metadata, // include metadata for local display
                likes: 0,
                views: 0,
                images: projectData.metadata.images,
                modelFiles: [] // 3D 파일 없음
            };

            onAddProject(newProject);
            setCurrentStep('complete');

            setCurrentStep('complete');

            // alert(t.success); // 제거: 결과 화면에서 사용자가 닫기 버튼을 누르도록 변경
            // onClose();        // 제거
            // resetWizard();    // 제거

        } catch (error) {
            console.error('Generation Error:', error);
            alert(error instanceof Error ? error.message : t.error);
        } finally {
            setIsLoading(false);
        }
    };

    const resetWizard = () => {
        setCurrentStep('material');
        setSelectedImage(null);
        setImagePreview('');
        setMaterialAnalysis(null);
        setUserIntent({ desiredOutcome: '', category: '', additionalNotes: '' });
        setSelectedCategory('');
        setIsLoading(false);
        setGenStatus({ image: 'pending', model3d: 'pending', guide: 'pending' });
        setGeneratedArtifacts({ imageUrl: '', modelUrl: '', guideData: null });
    };

    const handleClose = () => {
        resetWizard();
        onClose();
    };

    const handleGenerate3D = async () => {
        if (!generatedArtifacts.blueprintUrl && !generatedArtifacts.imageUrl) {
            alert("도면 이미지가 없습니다.");
            return;
        }
        if (userTokens < 5) {
            alert(t.insufficientTokens);
            return;
        }

        setIsLoading(true);
        setGenStatus(prev => ({ ...prev, model3d: 'loading' }));

        try {
            // Use blueprint if available, otherwise product image
            const sourceImage = generatedArtifacts.blueprintUrl || generatedArtifacts.imageUrl;
            const modelUrl = await generate3DModel(sourceImage);

            setGenStatus(prev => ({ ...prev, model3d: 'success' }));
            setGeneratedArtifacts(prev => ({ ...prev, modelUrl }));
            setUserTokens(userTokens - 5);

            // TODO: Update project in Supabase with new model URL (omitted for brevity, assume user saves later or simple alert)
            alert("3D 모델 생성이 완료되었습니다!");

        } catch (error) {
            console.error(error);
            setGenStatus(prev => ({ ...prev, model3d: 'error' }));
            alert("3D 생성 실패");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-2xl w-full mx-4 overflow-hidden max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 z-10">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">AI 분석 마법사</h2>
                        <button
                            onClick={handleClose}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                        >
                            <span className="material-icons-round text-gray-500">close</span>
                        </button>
                    </div>

                    {/* Progress Steps */}
                    <div className="flex items-center gap-2 mt-6">
                        <div className={`flex-1 h-2 rounded-full ${currentStep !== 'material' ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'}`}></div>
                        <div className={`flex-1 h-2 rounded-full ${currentStep === 'generation' || currentStep === 'complete' ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'}`}></div>
                        <div className={`flex-1 h-2 rounded-full ${currentStep === 'complete' ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'}`}></div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    {currentStep === 'material' && (
                        <div className="text-center">
                            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="material-icons-round text-4xl text-primary">photo_camera</span>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t.step1Title}</h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-6">{t.step1Desc}</p>

                            {imagePreview ? (
                                <div className="relative">
                                    <img src={imagePreview} alt="Preview" className="w-full h-64 object-cover rounded-xl mb-4" />
                                    {isLoading && (
                                        <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center">
                                            <div className="text-white text-center">
                                                <div className="animate-spin w-12 h-12 border-4 border-white border-t-transparent rounded-full mx-auto mb-2"></div>
                                                <p>{t.analyzing}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <label className="block cursor-pointer">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageSelect}
                                        className="hidden"
                                    />
                                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-12 hover:border-primary transition-colors">
                                        <span className="material-icons-round text-6xl text-gray-400 mb-2">add_photo_alternate</span>
                                        <p className="text-gray-600 dark:text-gray-400">{t.uploadImage}</p>
                                    </div>
                                </label>
                            )}
                        </div>
                    )}

                    {currentStep === 'intent' && materialAnalysis && (
                        <div>
                            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 mb-6">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="material-icons-round text-green-600 dark:text-green-400">check_circle</span>
                                    <span className="font-bold text-green-900 dark:text-green-100">재료 식별 완료</span>
                                </div>
                                <p className="text-green-800 dark:text-green-200">{materialAnalysis.material} - {materialAnalysis.description}</p>
                            </div>

                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t.step2Title}</h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-6">{t.step2Desc}</p>

                            {/* Category Grid */}
                            <div className="mb-6">
                                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">{t.recommendedCategories}</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    {categories.map((cat) => (
                                        <button
                                            key={cat.id}
                                            onClick={() => {
                                                setSelectedCategory(cat.id);
                                                setUserIntent({ ...userIntent, category: cat.name, desiredOutcome: '' });
                                            }}
                                            className={`p-4 rounded-xl border-2 transition-all ${selectedCategory === cat.id
                                                ? 'border-primary bg-primary/10 dark:bg-primary/20'
                                                : 'border-gray-200 dark:border-gray-700 hover:border-primary/50'
                                                }`}
                                        >
                                            <span className="material-icons-round text-3xl mb-2 block text-primary">{cat.icon}</span>
                                            <span className="text-sm font-medium text-gray-900 dark:text-white">{cat.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Suggestions for selected category */}
                            {selectedCategory && (
                                <div className="mb-6">
                                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                        {categories.find(c => c.id === selectedCategory)?.name} 추천
                                    </h4>
                                    <div className="grid grid-cols-2 gap-2">
                                        {categories.find(c => c.id === selectedCategory)?.suggestions.map((suggestion, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => setUserIntent({ ...userIntent, desiredOutcome: suggestion })}
                                                className={`px-4 py-3 rounded-lg text-sm font-medium transition-all ${userIntent.desiredOutcome === suggestion
                                                    ? 'bg-primary text-white'
                                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                                                    }`}
                                            >
                                                {suggestion}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Custom input */}
                            {selectedCategory && (
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        {t.customIdea}
                                    </label>
                                    <input
                                        type="text"
                                        value={userIntent.desiredOutcome}
                                        onChange={(e) => setUserIntent({ ...userIntent, desiredOutcome: e.target.value })}
                                        placeholder={t.customPlaceholder}
                                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                                    />
                                </div>
                            )}

                            {/* Additional notes */}
                            {userIntent.desiredOutcome && (
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        {t.additionalNotes}
                                    </label>
                                    <textarea
                                        value={userIntent.additionalNotes}
                                        onChange={(e) => setUserIntent({ ...userIntent, additionalNotes: e.target.value })}
                                        placeholder={t.notesPlaceholder}
                                        rows={3}
                                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                                    />
                                </div>
                            )}

                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => setCurrentStep('material')}
                                    className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-700 rounded-xl font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                >
                                    {t.back}
                                </button>
                                <button
                                    onClick={handleGenerate}
                                    disabled={!userIntent.desiredOutcome || userTokens < 5}
                                    className="flex-1 px-6 py-3 bg-primary hover:bg-primary-dark text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    <span className="material-icons-round text-sm">auto_awesome</span>
                                    {t.generate}
                                </button>
                            </div>
                        </div>
                    )}

                    {(currentStep === 'generation' || currentStep === 'complete') && (
                        <div className="text-center py-12">
                            {currentStep === 'generation' ? (
                                <>
                                    <div className="mb-6">
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{t.generating}</h3>
                                        <div className="space-y-4 max-w-sm mx-auto">
                                            {/* Gen Image Status */}
                                            <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <span className="material-icons-round text-purple-500">image</span>
                                                    <span className="text-sm font-medium dark:text-gray-300">제품 이미지 생성</span>
                                                </div>
                                                {genStatus.image === 'pending' && <span className="material-icons-round text-gray-400 text-sm">schedule</span>}
                                                {genStatus.image === 'loading' && <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full"></div>}
                                                {genStatus.image === 'success' && <span className="material-icons-round text-green-500 text-sm">check_circle</span>}
                                                {genStatus.image === 'error' && <span className="material-icons-round text-red-500 text-sm">error</span>}
                                            </div>

                                            {/* Gen Blueprint Status */}
                                            <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <span className="material-icons-round text-blue-500">architecture</span>
                                                    <span className="text-sm font-medium dark:text-gray-300">도면 생성</span>
                                                </div>
                                                {genStatus.blueprint === 'pending' && <span className="material-icons-round text-gray-400 text-sm">schedule</span>}
                                                {genStatus.blueprint === 'loading' && <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full"></div>}
                                                {genStatus.blueprint === 'success' && <span className="material-icons-round text-green-500 text-sm">check_circle</span>}
                                                {genStatus.blueprint === 'error' && <span className="material-icons-round text-red-500 text-sm">error</span>}
                                            </div>

                                            {/* Gen Guide Status */}
                                            <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <span className="material-icons-round text-orange-500">description</span>
                                                    <span className="text-sm font-medium dark:text-gray-300">제작 가이드 생성</span>
                                                </div>
                                                {genStatus.guide === 'pending' && <span className="material-icons-round text-gray-400 text-sm">schedule</span>}
                                                {genStatus.guide === 'loading' && <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full"></div>}
                                                {genStatus.guide === 'success' && <span className="material-icons-round text-green-500 text-sm">check_circle</span>}
                                                {genStatus.guide === 'error' && <span className="material-icons-round text-red-500 text-sm">error</span>}
                                            </div>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <span className="material-icons-round text-5xl text-green-600 dark:text-green-400">check_circle</span>
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t.success}</h3>
                                    <p className="text-gray-600 dark:text-gray-400 mb-8">프로젝트가 생성되었습니다.</p>

                                    {/* Result Showcase */}
                                    <div className="grid grid-cols-2 gap-4 mb-8">
                                        <div className="space-y-2">
                                            <p className="text-sm font-bold text-gray-700 dark:text-gray-300">제품 이미지</p>
                                            {generatedArtifacts.imageUrl && (
                                                <img src={generatedArtifacts.imageUrl} alt="Generated Product" className="w-full aspect-square rounded-xl object-cover border" />
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-sm font-bold text-gray-700 dark:text-gray-300">도면 이미지</p>
                                            {generatedArtifacts.blueprintUrl ? (
                                                <img src={generatedArtifacts.blueprintUrl} alt="Generated Blueprint" className="w-full aspect-square rounded-xl object-cover border" />
                                            ) : (
                                                <div className="w-full aspect-square rounded-xl border bg-gray-100 flex items-center justify-center text-gray-400">생성 실패</div>
                                            )}
                                        </div>
                                    </div>

                                    {/* 3D Generation Section */}
                                    <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 mb-6">
                                        <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">3D 모델링이 필요하신가요?</h4>
                                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                                            생성된 도면 이미지를 바탕으로 Tripo AI가 3D 모델을 생성합니다. (5토큰 소모)
                                        </p>

                                        {genStatus.model3d === 'success' ? (
                                            <div className="flex items-center justify-center gap-2 text-green-600 font-bold bg-green-50 p-3 rounded-lg">
                                                <span className="material-icons-round">check_circle</span>
                                                <span>3D 모델 생성 완료!</span>
                                            </div>
                                        ) : genStatus.model3d === 'loading' ? (
                                            <div className="flex items-center justify-center gap-2 text-primary font-bold bg-primary/5 p-3 rounded-lg">
                                                <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full"></div>
                                                <span>3D 변환 중... (최대 1분 소요)</span>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={handleGenerate3D}
                                                disabled={isLoading || !generatedArtifacts.blueprintUrl}
                                                className="w-full py-3 bg-gray-900 text-white dark:bg-white dark:text-gray-900 rounded-lg font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                                            >
                                                <span className="material-icons-round">view_in_ar</span>
                                                <span>3D 모델 생성하기 (5 Credits)</span>
                                            </button>
                                        )}

                                        {genStatus.model3d === 'error' && (
                                            <p className="text-red-500 text-sm mt-2 font-medium">생성에 실패했습니다. 다시 시도해주세요.</p>
                                        )}
                                    </div>

                                    <button
                                        onClick={handleClose}
                                        className="w-full py-3 border border-gray-300 dark:border-gray-700 rounded-xl font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                    >
                                        확인 및 닫기
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default WizardModal;