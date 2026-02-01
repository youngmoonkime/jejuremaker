import React, { useState } from 'react';
import { Language } from '../App';
import { Project, MaterialAnalysis, UserIntent, WizardStep } from '../types';

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
            // TODO: Implement actual Gemini API call with gemini-1.5-flash
            // For now, simulate analysis
            await new Promise(resolve => setTimeout(resolve, 2000));

            setMaterialAnalysis({
                material: '플라스틱 병',
                description: '투명한 PET 플라스틱 병으로 보입니다',
                confidence: 0.95
            });

            setCurrentStep('intent');
        } catch (error) {
            console.error('Material analysis failed:', error);
            alert(t.error);
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

        try {
            // TODO: Implement actual Gemini API call with gemini-1.5-pro
            // For now, simulate generation
            await new Promise(resolve => setTimeout(resolve, 3000));

            // Deduct tokens - pass the new value directly, not a callback
            const newTokenCount = userTokens - 5;
            setUserTokens(newTokenCount);

            // Import supabase for saving
            const supabaseUrl = 'https://jbkfsvinitavzyflcuwg.supabase.co';
            const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impia2ZzdmluaXRhdnp5ZmxjdXdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0MDAxOTUsImV4cCI6MjA4NDk3NjE5NX0.Nn3_-8Oky-yZ7VwFiiWbhxKdWfqOSz1ddj93fztfMak';
            const { createClient } = await import('@supabase/supabase-js');
            const supabase = createClient(supabaseUrl, supabaseKey);

            // Save project to Supabase
            const projectData = {
                title: `${materialAnalysis?.material}로 만든 ${userIntent.desiredOutcome}`,
                material: materialAnalysis?.material || 'Unknown',
                category: userIntent.category || 'Upcycling',
                difficulty: 'Medium',
                co2_reduction: 0.5,
                estimated_time: '2h',
                required_tools: userIntent.additionalNotes || '',
                image_url: imagePreview.startsWith('data:') ? null : imagePreview, // Don't store base64 in DB
                is_ai_generated: true,
                is_public: false,
                owner_id: user?.id,
                metadata: {
                    material_analysis: materialAnalysis,
                    user_intent: userIntent,
                    fabrication_guide: [
                        { title: '재료 준비', desc: `${materialAnalysis?.material} 세척 및 준비` },
                        { title: '제작', desc: `${userIntent.desiredOutcome} 형태로 가공` },
                        { title: '마무리', desc: '최종 마무리 및 장식' }
                    ]
                }
            };

            console.log('Saving project to Supabase:', projectData);

            const { data: savedProject, error: saveError } = await supabase
                .from('items')
                .insert(projectData)
                .select()
                .single();

            if (saveError) {
                console.error('Failed to save project:', saveError);
                // Still create local project as fallback
            }

            // Create project object for local state
            const newProject: Project = {
                id: savedProject?.id?.toString() || `wizard-${Date.now()}`,
                title: `${materialAnalysis?.material}로 만든 ${userIntent.desiredOutcome}`,
                maker: user?.email || 'Me',
                image: imagePreview,
                category: userIntent.category || 'Upcycling',
                time: '2h',
                difficulty: 'Medium',
                isAiRemix: true,
                description: `${materialAnalysis?.material}을(를) 활용한 ${userIntent.desiredOutcome} 제작 프로젝트`,
                steps: [
                    { title: '재료 준비', desc: `${materialAnalysis?.material} 세척 및 준비` },
                    { title: '제작', desc: `${userIntent.desiredOutcome} 형태로 가공` },
                    { title: '마무리', desc: '최종 마무리 및 장식' }
                ],
                isPublic: false,
                ownerId: user?.id
            };

            onAddProject(newProject);
            setCurrentStep('complete');

            setTimeout(() => {
                alert(t.success);
                onClose();
                resetWizard();
            }, 1500);
        } catch (error) {
            console.error('Generation failed:', error);
            alert(t.error);
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
    };

    const handleClose = () => {
        resetWizard();
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-2xl w-full mx-4 overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-800">
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
                                    <div className="animate-spin w-16 h-16 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t.generating}</h3>
                                    <p className="text-gray-600 dark:text-gray-400">AI가 상세한 제작 가이드를 생성하고 있습니다...</p>
                                </>
                            ) : (
                                <>
                                    <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <span className="material-icons-round text-5xl text-green-600 dark:text-green-400">check_circle</span>
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t.success}</h3>
                                    <p className="text-gray-600 dark:text-gray-400">내 정보 탭에서 확인하실 수 있습니다</p>
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
