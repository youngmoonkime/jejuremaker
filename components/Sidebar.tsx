import React from 'react';
import { TRANSLATIONS } from '../constants/translations';
import { Maker, Project } from '../types';
import { ViewState } from '../App';
import { Language } from '../contexts/ThemeContext';
import { config } from '../services/config';
import PolicyModal, { PolicyType } from './PolicyModal';

interface SidebarProps {
    language: Language;
    onNavigate: (view: any, targetId?: string | null) => void;
    makers: Maker[];
    onAnalyzeClick: () => void;
    currentView: string;
    sendMessageToMaker: (maker: Maker) => void;
    challengeStats?: { 
        global_public_co2: number; 
        global_public_waste: number;
        user_private_co2: number;
        user_private_waste: number;
        global_public_count: number;
        user_private_count: number;
    } | null;
    isSuperAdmin?: boolean;
}

const useAnimatedNumber = (target: number, duration: number = 1000) => {
    const [count, setCount] = React.useState(target);
    const countRef = React.useRef(target);
    const requestRef = React.useRef<number>();
    const startTimeRef = React.useRef<number>();

    React.useEffect(() => {
        const startValue = countRef.current;
        const endValue = target;
        
        if (startValue === endValue) return;

        const animate = (time: number) => {
            if (!startTimeRef.current) startTimeRef.current = time;
            const progress = Math.min((time - startTimeRef.current) / duration, 1);
            const currentCount = startValue + (endValue - startValue) * (1 - Math.pow(1 - progress, 3)); // Ease out cubic
            
            setCount(currentCount);
            countRef.current = currentCount;

            if (progress < 1) {
                requestRef.current = requestAnimationFrame(animate);
            } else {
                startTimeRef.current = undefined;
            }
        };

        startTimeRef.current = undefined;
        requestRef.current = requestAnimationFrame(animate);
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [target, duration]);

    return count;
};

const Sidebar: React.FC<SidebarProps> = ({ 
    language, onNavigate, makers, onAnalyzeClick, currentView, 
    sendMessageToMaker, currentUserId, challengeStats, 
    isSuperAdmin 
}) => {
    const t = TRANSLATIONS[language];

    const [policyModalType, setPolicyModalType] = React.useState<PolicyType | null>(null);

    const handlePolicyClick = (e: React.MouseEvent, type: PolicyType) => {
        e.preventDefault();
        setPolicyModalType(type);
    };

    // Raw Values for Animation
    const stats = challengeStats;
    // Community Impact shows only PUBLIC contributions to ensure "Hide -> Decrease" rule
    const kgValue = React.useMemo(() => Math.abs(stats?.global_public_co2 || 0), [stats]);
    const wasteKgValue = React.useMemo(() => Math.abs(stats?.global_public_waste || 0), [stats]);
    const countValue = React.useMemo(() => (stats?.global_public_count || 0), [stats]);

    // Animated Values
    const animatedKg = useAnimatedNumber(kgValue);
    const animatedWaste = useAnimatedNumber(wasteKgValue);
    const animatedCount = useAnimatedNumber(countValue);

    const { totalKg, wasteDisplay, wasteUnit, progress, targetKg, totalProjects, isLoading } = React.useMemo(() => {
        const isLoading = !challengeStats;
        
        if (isLoading) {
            return {
                totalKg: '--',
                wasteDisplay: '--',
                wasteUnit: language === 'ko' ? '폐기물' : 'Waste',
                progress: 0,
                targetKg: '100',
                totalProjects: '--',
                isLoading: true
            };
        }

        const target = 100; 
        const percent = Math.min((kgValue / target) * 100, 100);
        
        return {
            totalKg: animatedKg.toLocaleString(undefined, { maximumFractionDigits: 1 }),
            wasteDisplay: animatedWaste >= 1000 
                ? (animatedWaste / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 })
                : animatedWaste.toLocaleString(undefined, { maximumFractionDigits: 1 }),
            wasteUnit: animatedWaste >= 1000 ? (language === 'ko' ? '폐기물(톤)' : 'Waste (t)') : (language === 'ko' ? '폐기물(kg)' : 'Waste (kg)'),
            progress: percent,
            targetKg: target.toLocaleString(),
            totalProjects: Math.floor(animatedCount).toLocaleString(),
            isLoading: false
        };
    }, [language, challengeStats, animatedKg, animatedWaste, animatedCount, kgValue]);

    return (
        <aside className="w-72 flex-shrink-0 hidden lg:flex flex-col sticky top-24 h-[calc(100vh-8rem)] pr-2">
            {/* Top sections container - Scrollable if content exceeds roughly 60% of height */}
            <div className="flex-shrink-0 flex flex-col gap-6 pr-2 max-h-[65%] overflow-y-auto scrollbar-hide">
                {/* AI Wizard Section */}
                <div className="flex-shrink-0 p-5 rounded-3xl bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm relative overflow-hidden group cursor-pointer hover:shadow-md transition-all">
                    <div className="absolute inset-0 bg-primary/5 group-hover:bg-primary/10 transition-colors duration-500"></div>
                    <div className="absolute -right-4 -top-4 w-20 h-20 bg-primary/20 rounded-full blur-2xl"></div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-2 text-primary font-semibold">
                            <span className="material-icons-round text-sm animate-pulse">auto_awesome</span>
                            <span className="text-xs uppercase tracking-wider">{t.aiAnalysis}</span>
                        </div>
                        <h3 className="font-bold text-lg mb-2 leading-tight dark:text-white">{t.gotScrap}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{t.uploadPhoto}</p>
                        <button
                            onClick={onAnalyzeClick}
                            className="w-full mt-2 py-3 bg-primary hover:bg-primary-dark text-white rounded-xl text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2"
                        >
                            <div className="flex items-center gap-2">
                                <span>{language === 'ko' ? 'AI 분석 시작하기 (20T)' : 'Start AI Wizard (20T)'}</span>
                                <div className="flex items-center gap-1 bg-white/20 px-2 py-0.5 rounded-full">
                                    <span className="material-icons-round text-[12px]">auto_awesome</span>
                                </div>
                            </div>
                        </button>
                    </div>
                </div>



                {/* Community Impact Section */}
                <div className="flex-shrink-0 p-5 rounded-3xl bg-white dark:bg-[#1e2333] border border-gray-100 dark:border-gray-800 shadow-sm relative overflow-hidden group">
                    <div className="flex items-center gap-2 mb-4 relative z-10">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <span className="material-icons-round text-primary text-xl">eco</span>
                        </div>
                        <h3 className="font-bold text-base text-gray-900 dark:text-white">{t.communityImpact}</h3>
                    </div>
                    
                    <div className="relative z-10 space-y-4">
                        <div className="flex justify-between items-end">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md uppercase tracking-wide w-fit mb-1">{t.carbonSaved}</span>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-2xl font-black text-primary tracking-tight">{totalKg}</span>
                                    <span className="text-[10px] font-bold text-primary/60 mt-2">kg CO₂</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">GOAL</span>
                                <span className="text-xs font-bold text-gray-500 dark:text-gray-400">{targetKg}kg CO₂</span>
                            </div>
                        </div>

                        {/* Premium Gauge UI with Reward Story */}
                        <div className="space-y-2">
                            <div className="relative h-3 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden border border-gray-200/50 dark:border-white/5">
                                {/* Glow effect */}
                                <div 
                                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-green-400 to-primary rounded-full transition-all duration-1000 ease-out shadow-[0_0_12px_rgba(23,207,99,0.4)]"
                                    style={{ width: `${progress}%` }}
                                >
                                    <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.15)_50%,rgba(255,255,255,0.15)_75%,transparent_75%,transparent)] bg-[length:20px_20px] animate-[shimmer_2s_linear_infinite] opacity-30"></div>
                                </div>
                            </div>
                            
                            {/* Reward & Story Text */}
                            <div className="flex items-center gap-2 px-1 py-2 bg-primary/5 rounded-xl border border-primary/10">
                                <span className="material-icons-round text-primary text-sm">celebration</span>
                                <p className="text-[10px] leading-tight font-bold text-primary/80 break-all">
                                    {language === 'ko' 
                                        ? "목표 달성 시 추첨 이벤트가 열려요! (소나무 15그루의 효과)" 
                                        : "Raffle event opens at 100kg CO₂! (Effect of 15 pine trees)"}
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-1">
                            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-3 border border-gray-100 dark:border-white/5 transition-transform hover:scale-[1.02]">
                                <div className="text-xl font-black text-gray-900 dark:text-white leading-none mb-1">{totalProjects}</div>
                                <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">{t.projects}</div>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-3 border border-gray-100 dark:border-white/5 transition-transform hover:scale-[1.02]">
                                <div className="text-xl font-black text-gray-900 dark:text-white leading-none mb-1">{wasteDisplay}</div>
                                <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">{wasteUnit}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Navigation Section */}
                <nav className="flex-shrink-0 space-y-1">
                    <button
                        onClick={() => onNavigate('discovery')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${currentView === 'discovery' || currentView === 'detail'
                            ? 'bg-gray-100 dark:bg-gray-800 text-primary'
                            : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                            }`}
                    >
                        <span className="material-icons-round">explore</span>
                        {t.discover}
                    </button>
                    <button
                        onClick={() => onNavigate('trending')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${currentView === 'trending'
                            ? 'bg-gray-100 dark:bg-gray-800 text-primary'
                            : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                            }`}
                    >
                        <span className="material-icons-round">trending_up</span>
                        {t.trending}
                    </button>
                    <button
                        onClick={() => onNavigate('community')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${currentView === 'community'
                            ? 'bg-gray-100 dark:bg-gray-800 text-primary'
                            : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                            }`}
                    >
                        <span className="material-icons-round">people</span>
                        {t.community}
                    </button>

                    {isSuperAdmin && (
                        config.app.labUrl ? (
                            <a
                                href={config.app.labUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
                            >
                                <span className="material-icons-round">science</span>
                                {language === 'ko' ? '제주 리메이크 랩' : 'Jeju Remake Lab'}
                                <span className="text-[9px] font-bold bg-amber-400 text-white px-1.5 py-0.5 rounded ml-auto">ADMIN</span>
                            </a>
                        ) : (
                            <a
                                href="/?view=lab"
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${currentView === 'lab'
                                    ? 'bg-gray-100 dark:bg-gray-800 text-primary'
                                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                                    }`}
                            >
                                <span className="material-icons-round">science</span>
                                {language === 'ko' ? '제주 리메이크 랩' : 'Jeju Remake Lab'}
                                <span className="text-[9px] font-bold bg-amber-400 text-white px-1.5 py-0.5 rounded ml-auto">ADMIN</span>
                            </a>
                        )
                    )}
                </nav>

            </div>

            {/* Active Makers Section - Fills remaining space, list scrolls independently */}
            <div className="flex-1 min-h-[200px] pt-4 border-t border-gray-100 dark:border-gray-800 mt-2 mb-2 flex flex-col">
                <div className="flex-shrink-0 flex items-center justify-between mb-3 px-1">
                    <h3 className="font-bold text-base text-gray-900 dark:text-white">{t.topMakers}</h3>
                    <a href="#" className="flex-shrink-0 text-xs font-medium text-primary hover:text-primary-dark transition-colors">{t.viewAll}</a>
                </div>
                <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
                    {makers
                        .filter(maker => maker.userId !== currentUserId)
                        .map((maker, idx) => (
                        <div key={idx} className="flex items-center gap-3 group p-2 hover:bg-white dark:hover:bg-gray-800 rounded-xl transition-all">
                            <div className="relative cursor-pointer" onClick={() => onNavigate('profile', maker.userId)}>
                                <div className={`w-10 h-10 rounded-full overflow-hidden ring-2 ring-transparent group-hover:ring-primary/20 transition-all flex items-center justify-center ${!maker.avatar ? 'bg-gradient-to-br from-primary/20 to-primary/5 dark:from-gray-700 dark:to-gray-800' : ''}`}>
                                    {maker.avatar ? (
                                        <img 
                                            src={maker.avatar} 
                                            alt={maker.name} 
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                const img = e.target as HTMLImageElement;
                                                img.style.display = 'none';
                                                const parent = img.parentElement;
                                                if (parent) {
                                                    parent.classList.add('fallback-active');
                                                    parent.classList.add('bg-gradient-to-br', 'from-primary/20', 'to-primary/5', 'dark:from-gray-700', 'dark:to-gray-800');
                                                }
                                            }}
                                        />
                                    ) : null}
                                    <div className="absolute inset-0 items-center justify-center hidden [.fallback-active_&]:flex group-hover:scale-110 transition-transform">
                                        <span className="text-xs font-bold text-primary dark:text-gray-400">
                                            {maker.name.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                    {!maker.avatar && (
                                        <span className="text-xs font-bold text-primary dark:text-gray-400 group-hover:scale-110 transition-transform">
                                            {maker.name.charAt(0).toUpperCase()}
                                        </span>
                                    )}
                                </div>
                                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-900 shadow-sm"></div>
                            </div>
                            <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onNavigate('profile', maker.userId)}>
                                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate group-hover:text-primary transition-colors">{maker.name}</h4>
                                <p className="text-xs text-green-500 font-medium truncate flex items-center gap-1">
                                    Active Now
                                </p>
                            </div>
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    sendMessageToMaker(maker);
                                }}
                                title={t.sendMessage}
                                className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-primary hover:text-white dark:hover:bg-primary dark:hover:text-white transition-all transform hover:scale-105 active:scale-95"
                            >
                                <span className="material-icons-round text-sm">send</span>
                            </button>
                        </div>
                    ))}
                    {makers.length === 0 && (
                        <div className="text-center py-4 text-sm text-gray-500 dark:text-gray-400">
                            {language === 'ko' ? '현재 접속 중인 메이커가 없습니다.' : 'No active makers currently.'}
                        </div>
                    )}
                </div>
            </div>

            {/* Sidebar Footer - Fixed at bottom */}
            <div className="flex-shrink-0 pt-6 pb-2 flex flex-col gap-5 bg-background-light dark:bg-background-dark z-10">
                {/* Social Links - Instagram, YouTube Only */}
                <div className="flex items-center gap-5 px-1">
                    <a href="https://www.instagram.com/jejuremaker/" target="_blank" rel="noopener noreferrer" className="w-5 h-5 text-gray-400 hover:text-primary transition-colors flex items-center justify-center">
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.332 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                    </a>
                    <a href="#" className="w-5 h-5 text-gray-400 hover:text-primary transition-colors flex items-center justify-center">
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505a3.017 3.017 0 00-2.122 2.136C0 8.055 0 12 0 12s0 3.945.501 5.814a3.017 3.017 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.945 24 12 24 12s0-3.945-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                    </a>
                </div>

                {/* Footer Links */}
                <div className="flex flex-col gap-1 px-1">
                    <div className="flex gap-4 text-[12px] font-bold text-gray-500 dark:text-gray-400">
                        <a href="#" onClick={(e) => handlePolicyClick(e, 'privacy')} className="hover:text-primary transition-colors">개인정보 처리방침</a>
                        <a href="#" onClick={(e) => handlePolicyClick(e, 'terms')} className="hover:text-primary transition-colors">이용 약관</a>
                    </div>
                    <div className="flex gap-4 text-[12px] font-bold text-gray-500 dark:text-gray-400">
                        <a href="#" onClick={(e) => handlePolicyClick(e, 'guidelines')} className="hover:text-primary transition-colors">커뮤니티 가이드라인</a>
                        <a href="#" onClick={(e) => handlePolicyClick(e, 'search')} className="hover:text-primary transition-colors">인기 검색어</a>
                    </div>
                    <div className="flex gap-4 text-[12px] font-bold text-gray-500 dark:text-gray-400">
                        <a href="#" onClick={(e) => handlePolicyClick(e, 'faq')} className="hover:text-primary transition-colors">자주 묻는 질문</a>
                        <a href="#" onClick={(e) => handlePolicyClick(e, 'cookies')} className="hover:text-primary transition-colors">쿠키 설정</a>
                    </div>
                </div>

                <div className="h-px bg-gray-100 dark:bg-gray-800 my-1"></div>

                {/* RISE Project Notice */}
                <div className="px-1 space-y-3">
                    <p className="text-[10px] leading-relaxed text-gray-400 dark:text-gray-500">
                        본 과제(결과물)는 2025년도 교육부 및 제주특별자치도의 재원으로 제주RISE센터의 지원을 받아 수행된 지역혁신중심 대학지원체계(RISE)의 결과입니다 (2025-RISE-17-001).
                    </p>
                    <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500">
                        © 2026 jejureMakerHub
                    </p>
                </div>
            </div>

            <PolicyModal 
                isOpen={!!policyModalType}
                onClose={() => setPolicyModalType(null)}
                type={policyModalType}
                language={language}
            />
        </aside>
    );
};

export default Sidebar;
