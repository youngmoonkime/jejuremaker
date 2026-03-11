import React, { useState, useEffect } from 'react';
import { Language } from '../contexts/ThemeContext';

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

    // Hero slides data - Focused on the 3 core tools
    const heroSlides = [
        {
            id: 1,
            title: '현무암 패턴 생성기',
            titleEn: 'Basalt Pattern Generator',
            subtitle: '제주 자연의 질감을 디지털로',
            subtitleEn: 'Digitalizing Jeju Nature Texture',
            description: '제주 현무암 특유의 다공질 패턴을 AI 알고리즘으로 생성하고 3D 모델에 정교하게 적용합니다.',
            descriptionEn: 'Generate unique Jeju basalt pore patterns using AI algorithms and precisely apply them to 3D models.',
            cta: '패턴 생성하기',
            ctaEn: 'Generate Pattern',
            image: '/images/basalt_pattern.png',
            isNew: true
        },
        {
            id: 2,
            title: '골판지 뮤지션',
            titleEn: 'Cardboard Musician',
            subtitle: '폐자재에 리듬을 입히다',
            subtitleEn: 'Giving Rhythm to Waste',
            description: '버려지는 골판지를 활용한 악기와 뮤지션 캐릭터를 디자인하여 업사이클링의 즐거움을 더합니다.',
            descriptionEn: 'Design musical instruments and characters using discarded cardboard, adding joy to upcycling.',
            cta: '연주 시작하기',
            ctaEn: 'Start Playing',
            image: '/images/cardboard_musician.png',
            isNew: true
        },
        {
            id: 3,
            title: '도면 만들기',
            titleEn: 'Blueprint Creator',
            subtitle: '아이디어를 설계도로',
            subtitleEn: 'Ideas into Blueprints',
            description: 'AI의 도움을 받아 복잡한 3D 모델을 실제 제작 가능한 정밀한 2D 도면으로 변환합니다.',
            descriptionEn: 'Convert complex 3D models into precise 2D blueprints for real-world fabrication with AI assistance.',
            cta: '도면 생성하기',
            ctaEn: 'Create Blueprint',
            image: '/images/blueprint_creator.png',
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

    // Lab tools data - Consolidated to 3 tools
    const labTools: LabTool[] = [
        {
            id: 'basalt-pattern',
            title: '현무암 패턴 생성기',
            titleEn: 'Basalt Pattern Gen',
            description: '제주 현무암의 독특한 기공 패턴을 AI로 생성하여 3D 모델에 적용합니다.',
            descriptionEn: 'Generate unique Jeju basalt pore patterns using AI and apply them to 3D models.',
            image: '/images/basalt_pattern.png',
            category: ['ai', 'experimental'],
            isNew: true
        },
        {
            id: 'cardboard-musician',
            title: '골판지 뮤지션',
            titleEn: 'Cardboard Musician',
            description: '버려진 골판지를 활용하여 움직이는 인형이나 실제 연주 가능한 악기를 설계합니다.',
            descriptionEn: 'Design kinetic dolls or playable instruments using recycled cardboard.',
            image: '/images/cardboard_musician.png',
            category: ['experimental', 'laser'],
            isNew: true
        },
        {
            id: 'blueprint-creator',
            title: '도면 만들기',
            titleEn: 'Blueprint Creator',
            description: '3D 모델링 데이터를 바탕으로 레이저 커팅이나 CNC 가공을 위한 정교한 2D 도면을 생성합니다.',
            descriptionEn: 'Create precise 2D blueprints for laser cutting or CNC machining from 3D data.',
            image: '/images/blueprint_creator.png',
            category: ['laser', 'ai'],
            isNew: true
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
                        <div className="relative z-10 px-8 md:px-12 grid grid-cols-12 h-full items-center">
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
            <section className="py-16 px-8 md:px-12">
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

                {/* Grid - Centered */}
                <div className="flex flex-wrap justify-center gap-8 max-w-7xl mx-auto">
                    {filteredTools.map(tool => (
                        <div
                            key={tool.id}
                            className="group bg-white dark:bg-[#1E293B] border border-gray-100 dark:border-gray-800 rounded-3xl overflow-hidden hover:shadow-2xl dark:hover:shadow-black/60 transition-all duration-500 flex flex-col w-full md:w-[calc(50%-1rem)] lg:w-[calc(33.333%-2rem)] min-w-[300px] max-w-[400px] relative"
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
                <div className="px-8 md:px-12 text-center text-gray-500 dark:text-gray-400 text-sm">
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
