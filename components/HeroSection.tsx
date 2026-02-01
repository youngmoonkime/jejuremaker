import React, { useState, useRef } from 'react';

/**
 * Jeju Re-Maker Hero Section Component
 * 340px height with Stacked Glass Cards effect
 */
interface HeroSectionProps {
    t: any;
    handleAnalyzeClick: () => void;
    handlePaste: (e: React.ClipboardEvent) => void;
    isDragging: boolean;
    handleDragOver: (e: React.DragEvent) => void;
    handleDragLeave: (e: React.DragEvent) => void;
    handleDrop: (e: React.DragEvent) => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({
    t,
    handleAnalyzeClick,
    handlePaste,
    isDragging,
    handleDragOver,
    handleDragLeave,
    handleDrop
}) => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const scrollRef = useRef<HTMLDivElement>(null);

    const slides = [
        {
            id: 1,
            tag: t.hero?.campaignTag || "CAMPAIGN",
            title: t.hero?.title || "폐기물의 재발견. 새로운 가치를 창조하세요.",
            subtitle: t.hero?.subtitle || "수천 명의 메이커들과 함께 쓰레기를 보물로 바꿔보세요.",
            bgColor: "bg-[#0d2118]",
            gradient: "from-[#0d2a1f] to-[#05120d]",
            featuredImage: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=800&q=80",
            featuredTitle: "Sea Glass Lamp",
            featuredMaker: "JejuMaker"
        },
        {
            id: 2,
            tag: "COMMUNITY",
            title: "함께 만드는 친환경 제주",
            subtitle: "12,000명의 메이커와 아이디어를 공유하고 협업하세요.",
            bgColor: "bg-[#1a1a2e]",
            gradient: "from-[#1a1a2e] to-[#16213e]",
            featuredImage: "https://images.unsplash.com/photo-1544367563-12123d832d34?auto=format&fit=crop&w=800&q=80",
            featuredTitle: "Ocean Plastic Chair",
            featuredMaker: "EcoWarrior"
        },
        {
            id: 3,
            tag: "IMPACT",
            title: "우리가 만든 변화",
            subtitle: "지난 달, 3.5톤의 해양 폐기물이 새로운 생명을 얻었습니다.",
            bgColor: "bg-[#2c3e50]",
            gradient: "from-[#2c3e50] to-[#000000]",
            featuredImage: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=800&q=80",
            featuredTitle: "Recycled Art",
            featuredMaker: "GreenArtist"
        }
    ];

    const handleScroll = () => {
        if (scrollRef.current) {
            const index = Math.round(scrollRef.current.scrollLeft / scrollRef.current.clientWidth);
            setCurrentSlide(index);
        }
    };

    const scrollToSlide = (index: number) => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({
                left: index * scrollRef.current.clientWidth,
                behavior: 'smooth'
            });
            setCurrentSlide(index);
        }
    };

    return (
        <div className="mb-12 relative rounded-[2.5rem] overflow-hidden min-h-[340px] shadow-2xl transition-all duration-500">
            {/* Slider Container */}
            <div
                ref={scrollRef}
                className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide h-full w-full"
                onScroll={handleScroll}
                style={{ scrollBehavior: 'smooth' }}
            >
                {slides.map((slide, index) => (
                    <div
                        key={slide.id}
                        className={`flex-shrink-0 w-full snap-center flex items-center relative ${slide.bgColor} text-white transition-all duration-300
                            ${isDragging ? 'ring-4 ring-primary ring-offset-4 ring-offset-background-light dark:ring-offset-background-dark' : ''}
                        `}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                    >
                        {/* Background Gradient & Effects */}
                        <div className={`absolute inset-0 bg-gradient-to-br ${slide.gradient} z-0`}></div>
                        <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[120%] bg-primary/20 rounded-full blur-[120px]"></div>

                        {/* Slide Content */}
                        <div className="relative z-10 w-full px-12 py-8 flex flex-col md:flex-row items-center justify-between gap-12 min-h-[340px]">
                            {/* Left: Text Content */}
                            <div className="flex-1 max-w-xl">
                                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-md rounded-full border border-white/20 mb-6">
                                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                                    <span className="text-[11px] font-bold uppercase tracking-widest text-primary-light">{slide.tag}</span>
                                </div>

                                <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight tracking-tight">{slide.title}</h1>
                                <p className="text-gray-300 mb-8 text-base font-light leading-relaxed opacity-90 line-clamp-2">{slide.subtitle}</p>

                                <div className="flex flex-wrap items-center gap-4">
                                    <button className="px-8 py-3 bg-primary hover:bg-primary-dark text-white rounded-2xl font-bold shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95">
                                        {t.hero?.participate || "참여하기"}
                                    </button>
                                    <button className="px-8 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl font-bold transition-all hover:bg-white/15">
                                        {t.hero?.learnMore || "자세히 보기"}
                                    </button>
                                </div>
                            </div>

                            {/* Right: Stacked Glass Cards Section */}
                            <div className="relative flex-shrink-0 w-[300px] h-[340px] flex items-center justify-center">
                                {/* Decorative Back Cards */}
                                <div className="absolute w-[240px] h-[280px] bg-white/5 backdrop-blur-xl rounded-[2.5rem] border border-white/10 rotate-[8deg] translate-x-12 translate-y-2 opacity-40 shadow-2xl"></div>
                                <div className="absolute w-[240px] h-[280px] bg-white/5 backdrop-blur-xl rounded-[2.5rem] border border-white/10 rotate-[-4deg] translate-x-4 translate-y-[-8px] opacity-60 shadow-2xl"></div>

                                {/* Main Glass Card */}
                                <div className="relative w-[260px] bg-white/10 backdrop-blur-3xl p-5 rounded-[2.5rem] border border-white/20 shadow-2xl group transition-all duration-700 hover:-translate-y-2">
                                    {/* Image with Featured Tag */}
                                    <div className="relative aspect-[1.1/1] rounded-[1.8rem] overflow-hidden mb-5">
                                        <div className="absolute top-3 right-3 z-20 bg-black/60 backdrop-blur-md border border-white/20 text-white text-[9px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">
                                            {t.hero?.featured || "FEATURED"}
                                        </div>
                                        <img
                                            src={slide.featuredImage}
                                            alt="Featured Project"
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                        />
                                    </div>

                                    {/* Card Info */}
                                    <div className="space-y-3">
                                        <h3 className="font-bold text-xl text-white tracking-tight">{slide.featuredTitle}</h3>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-7 h-7 rounded-full border border-white/20 overflow-hidden shadow-lg">
                                                    <img src={`https://ui-avatars.com/api/?name=${slide.featuredMaker}&background=random`} alt="Maker" className="w-full h-full object-cover" />
                                                </div>
                                                <span className="text-xs font-medium text-white/80">{slide.featuredMaker}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-white/50">
                                                <span className="material-icons-round text-base">visibility</span>
                                                <span className="text-[11px] font-medium">1.2k</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Navigation Dots */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-2.5 z-20">
                {slides.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => scrollToSlide(index)}
                        className={`w-2 h-2 rounded-full transition-all duration-500 ${currentSlide === index ? 'bg-primary w-10' : 'bg-white/20 hover:bg-white/40'
                            }`}
                    />
                ))}
            </div>
        </div>
    );
};

export default HeroSection;
