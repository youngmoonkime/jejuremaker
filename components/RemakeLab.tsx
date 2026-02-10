import React, { useState, useEffect } from 'react';
import { Language } from '../App';

interface RemakeLabProps {
    language: Language;
    userTokens: number;
}

// Tool data structure
interface LabTool {
    id: string;
    title: string;
    titleEn: string;
    description: string;
    descriptionEn: string;
    image: string;
    category: string[];
    isNew?: boolean;
    url?: string;
}

const RemakeLab: React.FC<RemakeLabProps> = ({
    language,
    userTokens
}) => {
    const [activeTab, setActiveTab] = useState('all');
    const [currentSlide, setCurrentSlide] = useState(0);

    // Change browser tab title for Lab view
    useEffect(() => {
        const originalTitle = document.title;
        document.title = 'Jeju Remake Lab';
        return () => {
            document.title = originalTitle;
        };
    }, []);

    // Hero slides data
    const heroSlides = [
        {
            id: 1,
            title: '이미지를 3D 모델로 변환',
            titleEn: 'Convert Images to 3D Models',
            subtitle: 'AI 기반 3D 모델 생성 기술',
            subtitleEn: 'AI-based 3D Model Generation Tech',
            description: 'Hunyuan 3.0, Hitem3D 1.5, Tripo 1.0으로 더욱 정교하고 생생한 디테일을 생성합니다.',
            descriptionEn: 'Generate precise and vivid details with Hunyuan 3.0, Hitem3D 1.5, and Tripo 1.0. Experience the next level of creation today.',
            cta: '바로 체험하기',
            ctaEn: 'Try It Now',
            image: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=1200&q=80',
            isNew: true
        },
        {
            id: 2,
            title: '라이트박스 제작기',
            titleEn: 'Lightbox Maker',
            subtitle: '레이저 커팅에 최적화',
            subtitleEn: 'Optimized for laser cutting',
            description: '이미지, 텍스트를 입력으로 멋진 라이트박스를 만드세요.',
            descriptionEn: 'Create beautiful lightboxes from images and text.',
            cta: '시작하기',
            ctaEn: 'Get Started',
            image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1200&q=80',
            isNew: false
        },
        {
            id: 3,
            title: '제주 폐자재 3D 스캔',
            titleEn: 'Jeju Waste Material 3D Scan',
            subtitle: '현무암, 해양 폐기물을 디지털화',
            subtitleEn: 'Digitize basalt and marine waste',
            description: '제주도의 다양한 폐자재를 3D 스캔하여 리메이크 프로젝트에 활용하세요.',
            descriptionEn: 'Scan various Jeju waste materials in 3D for remake projects.',
            cta: '스캔하기',
            ctaEn: 'Start Scanning',
            image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=1200&q=80',
            isNew: true
        }
    ];

    // Tool categories
    const categories = [
        { id: 'all', label: '모두', labelEn: 'All' },
        { id: 'ai', label: 'AI 생성기', labelEn: 'AI Generators' },
        { id: 'single-color', label: '단색 생성에 적합', labelEn: 'Monochrome' },
        { id: 'multi-color', label: '다색 생성에 적합', labelEn: 'Multicolor' },
        { id: 'laser', label: '레이저 및 커팅', labelEn: 'Laser & Cutting' },
        { id: 'experimental', label: '실험', labelEn: 'Experimental' }
    ];

    // Lab tools data
    const labTools: LabTool[] = [
        {
            id: 'ai-waste-analysis',
            title: 'AI 폐자재 분석',
            titleEn: 'AI Waste Analysis',
            description: '폐자재 사진을 업로드하면 소재를 분석하고 업사이클링 아이디어를 제안합니다.',
            descriptionEn: 'Analyze waste photos to identify materials and suggest upcycling ideas.',
            image: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=400&q=80',
            category: ['ai', 'experimental'],
            isNew: true
        },
        {
            id: 'image-to-3d',
            title: '이미지를 3D 모델로',
            titleEn: 'Image to 3D Model',
            description: '스케치나 사진을 3D 프린팅 가능한 모델로 즉시 변환합니다.',
            descriptionEn: 'Instantly convert sketches or photos into 3D printable models.',
            image: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=400&q=80',
            category: ['ai']
        },
        {
            id: 'basalt-pattern',
            title: '현무암 패턴 생성기',
            titleEn: 'Basalt Pattern Gen',
            description: '제주 현무암의 독특한 기공 패턴을 3D 모델에 적용합니다.',
            descriptionEn: 'Apply unique Jeju basalt pore patterns to 3D models.',
            image: 'https://images.unsplash.com/photo-1596131460596-6e2ee79e2c2e?auto=format&fit=crop&w=400&q=80',
            category: ['experimental', 'single-color']
        },
        {
            id: 'sea-glass-art',
            title: '바다 유리 공예',
            titleEn: 'Sea Glass Art',
            description: '마모된 유리 조각들을 조합하여 아름다운 조명과 장식품을 디자인합니다.',
            descriptionEn: 'Design beautiful lights and ornaments using weathered sea glass pieces.',
            image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=80',
            category: ['multi-color', 'ai']
        },
        {
            id: 'souvenir-creator',
            title: '제주 기념품 제작',
            titleEn: 'Jeju Souvenir Creator',
            description: '돌하르방, 한라산, 감귤 모티브의 커스텀 기념품을 3D로 디자인합니다.',
            descriptionEn: 'Design custom 3D souvenirs with Harubang, Hallasan, and Mandarin motifs.',
            image: 'https://images.unsplash.com/photo-1580556637482-1df697274db2?auto=format&fit=crop&w=400&q=80',
            category: ['single-color', 'laser']
        },
        {
            id: 'upcycle-furniture',
            title: '업사이클 가구 디자인',
            titleEn: 'Upcycle Furniture',
            description: '폐목재와 플라스틱을 결합한 실용적인 가구를 설계합니다.',
            descriptionEn: 'Design practical furniture combining waste wood and recycled plastic.',
            image: 'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=400&q=80',
            category: ['laser', 'experimental']
        },
        {
            id: 'marine-debris-art',
            title: '해양 쓰레기 아트',
            titleEn: 'Marine Debris Art',
            description: '해양 플라스틱의 색감과 형태를 살린 예술 작품을 구상합니다.',
            descriptionEn: 'Create art pieces utilizing the colors and shapes of marine plastic.',
            image: 'https://images.unsplash.com/photo-1621451537084-482c73073a0f?auto=format&fit=crop&w=400&q=80',
            category: ['multi-color', 'experimental']
        },
        {
            id: 'net-remake',
            title: '폐그물 리메이크',
            titleEn: 'Fishing Net Remake',
            description: '버려진 그물을 활용한 가방, 인테리어 소품을 디자인합니다.',
            descriptionEn: 'Design bags and interior props using discarded fishing nets.',
            image: 'https://images.unsplash.com/photo-1520113412141-860c23984d68?auto=format&fit=crop&w=400&q=80',
            category: ['experimental']
        }
    ];

    // Auto-slide for hero carousel
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [heroSlides.length]);

    // Filter tools by category
    const filteredTools = activeTab === 'all'
        ? labTools
        : labTools.filter(tool => tool.category.includes(activeTab));

    return (
        // Using arbitrary values for colors to match user request: bg-[#F8FAFC] dark:bg-[#0F172A]
        <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0F172A] text-[#111827] dark:text-[#F3F4F6] transition-colors duration-300 font-sans">

            {/* Hero Section */}
            <section className="relative h-[500px] w-full bg-[#0F172A] overflow-hidden flex items-center">
                {heroSlides.map((slide, index) => (
                    <div
                        key={slide.id}
                        className={`absolute inset-0 transition-opacity duration-1000 ${index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                    >
                        {/* Background Image with Overlay */}
                        <div className="absolute inset-0 z-0 opacity-40">
                            <img
                                src={slide.image}
                                alt={language === 'ko' ? slide.title : slide.titleEn}
                                className="w-full h-full object-cover filter blur-sm"
                            />
                        </div>
                        <div className="absolute inset-0 z-0 bg-gradient-to-r from-[#0F172A] via-[#0F172A]/80 to-transparent"></div>

                        {/* Content */}
                        <div className="relative z-10 container mx-auto px-6 grid grid-cols-12 h-full items-center">
                            <div className="col-span-12 lg:col-span-7 py-12">
                                {slide.isNew && (
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#4ADE80]/20 text-[#4ADE80] border border-[#4ADE80]/30 text-xs font-bold mb-6">
                                        <span className="w-2 h-2 rounded-full bg-[#4ADE80] animate-pulse"></span>
                                        {language === 'ko' ? '새로운 기능' : 'New Feature'}
                                    </div>
                                )}
                                <p className="text-gray-400 font-medium mb-2">
                                    {language === 'ko' ? slide.subtitle : slide.subtitleEn}
                                </p>
                                <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-4 tracking-tight">
                                    {language === 'ko' ? slide.title : slide.titleEn}
                                </h1>
                                <p className="text-gray-300 mb-8 max-w-xl leading-relaxed text-lg">
                                    {language === 'ko' ? slide.description : slide.descriptionEn}
                                </p>
                                <button className="bg-white text-black hover:bg-gray-100 font-semibold py-3 px-6 rounded-lg flex items-center gap-2 transition group shadow-lg">
                                    {language === 'ko' ? slide.cta : slide.ctaEn}
                                    <span className="material-icons-round group-hover:translate-x-1 transition-transform text-sm">arrow_forward</span>
                                </button>
                            </div>
                        </div>
                    </div>
                ))}

                {/* Carousel Indicators */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                    {heroSlides.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentSlide(index)}
                            className={`h-1.5 rounded-full transition-all duration-300 ${index === currentSlide
                                ? 'w-8 bg-white'
                                : 'w-2 bg-white/40 hover:bg-white/60'
                                }`}
                        />
                    ))}
                </div>
            </section>

            {/* Modeling Tools Section */}
            <section className="py-16 px-6 container mx-auto">
                <div className="text-center mb-10">
                    <h2 className="text-3xl font-bold mb-3 dark:text-white">
                        {language === 'ko' ? '모델링 도구' : 'Modeling Tools'}
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400">
                        {language === 'ko'
                            ? '멋지고 유용하며 흥미로운 MakerLab 도구가 항상 여러분과 함께합니다.'
                            : 'Cool, useful, and interesting MakerLab tools are always with you.'}
                    </p>
                </div>

                {/* Category Tabs */}
                <div className="flex justify-center mb-12 overflow-x-auto no-scrollbar pb-2">
                    <div className="flex gap-3 min-w-max px-4">
                        {categories.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setActiveTab(cat.id)}
                                className={`px-5 py-2 rounded-full text-sm font-medium transition shadow-sm border ${activeTab === cat.id
                                    ? 'bg-[#1E293B] text-white border-[#1E293B] dark:bg-white dark:text-[#1E293B]'
                                    : 'bg-white dark:bg-[#1E293B] border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-700 dark:text-gray-300'
                                    }`}
                            >
                                {language === 'ko' ? cat.label : cat.labelEn}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {filteredTools.map(tool => (
                        <div
                            key={tool.id}
                            className="group bg-white dark:bg-[#1E293B] border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden hover:shadow-xl dark:hover:shadow-black/40 transition-all duration-300 flex flex-col h-full relative"
                        >
                            {tool.isNew && (
                                <div className="absolute top-3 left-3 z-10 bg-[#4ADE80] text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">
                                    NEW
                                </div>
                            )}
                            <div className="h-48 overflow-hidden relative bg-gray-50 dark:bg-gray-800">
                                <img
                                    src={tool.image}
                                    alt={language === 'ko' ? tool.title : tool.titleEn}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                            </div>
                            <div className="p-5 flex-1 flex flex-col">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-bold text-lg text-gray-900 dark:text-white truncate pr-2">
                                        {language === 'ko' ? tool.title : tool.titleEn}
                                    </h3>
                                    <button className="w-8 h-8 rounded-full bg-gray-50 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 transition flex-shrink-0">
                                        <span className="material-icons-round text-sm">arrow_forward</span>
                                    </button>
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                                    {language === 'ko' ? tool.description : tool.descriptionEn}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Empty State */}
                {filteredTools.length === 0 && (
                    <div className="text-center py-16">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="material-icons-round text-3xl text-gray-400">search_off</span>
                        </div>
                        <p className="text-gray-500 dark:text-gray-400">
                            {language === 'ko' ? '해당 카테고리에 도구가 없습니다.' : 'No tools in this category.'}
                        </p>
                    </div>
                )}
            </section>

            {/* Footer - Added from user request */}
            <footer className="bg-gray-50 dark:bg-[#0B1120] border-t border-gray-200 dark:border-gray-800 py-12 mt-12 transition-colors duration-300">
                <div className="container mx-auto px-6 text-center text-gray-500 dark:text-gray-400 text-sm">
                    <p>© 2026 Jeju Remake Lab. All rights reserved.</p>
                    <div className="mt-4 space-x-4">
                        <a className="hover:text-[#4ADE80] transition cursor-pointer">Privacy Policy</a>
                        <a className="hover:text-[#4ADE80] transition cursor-pointer">Terms of Service</a>
                        <a className="hover:text-[#4ADE80] transition cursor-pointer">Contact Support</a>
                    </div>
                </div>
            </footer>


        </div>
    );
};

export default RemakeLab;
