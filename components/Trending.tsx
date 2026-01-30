import React from 'react';
import { Language } from '../App';
import { User } from '@supabase/supabase-js';

interface TrendingProps {
  onNavigate: (view: 'discovery' | 'detail' | 'workspace' | 'upload' | 'trending' | 'community') => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  language: Language;
  toggleLanguage: () => void;
  user: User | null;
  onLoginClick: (target?: any) => void;
  onLogout: () => void;
}

const TRANSLATIONS = {
  ko: {
    title: '제주 리메이커',
    searchPlaceholder: '아이디어, 재료, 메이커 검색...',
    create: '업로드',
    aiAnalysis: 'AI 분석',
    gotScrap: '폐자재가 있나요?',
    uploadPhoto: '사진을 업로드하면 AI가 업사이클링 프로젝트를 제안해드립니다.',
    analyzeNow: '지금 분석하기',
    communityImpact: '커뮤니티 영향력',
    carbonSaved: '탄소 절감',
    projects: '프로젝트',
    tonsWaste: '폐기물(톤)',
    discover: '탐색',
    trending: '인기 급상승',
    community: '커뮤니티',
    topMakers: '인기 메이커',
    viewAll: '모두 보기',
    login: '로그인',
    logout: '로그아웃',
    trendingNow: '현재 인기 급상승',
    thisWeek: '이번 주',
    thisMonth: '이번 달',
    allTime: '전체',
    allTrending: '전체 인기',
    textile: '직물',
    wood: '목재',
    print3d: '3D 프린팅',
    loadMore: '더 보기',
    joinMovement: '무브먼트에 참여하고 당신의 업사이클링 작품을 공유하세요.',
    viewGuidelines: '가이드라인 보기',
    hero: {
        tag: '인기 #1',
        material: '유리 & 플라스틱',
        demand: '높은 수요',
        title: '재활용 해양 플라스틱 램프',
        desc: '해안가에서 수거한 플라스틱과 유리병으로 만든 멋진 지오데식 조명입니다. 이 프로젝트로 4.2kg의 해양 쓰레기를 줄였습니다.',
        viewDetails: '프로젝트 상세 보기',
        views: '오늘 12.5k 조회',
        likes: '이번 주 +840 좋아요'
    }
  },
  en: {
    title: 'Jeju Re-Maker',
    searchPlaceholder: 'Search ideas, materials, or makers...',
    create: 'Upload',
    aiAnalysis: 'AI Analysis',
    gotScrap: 'Got scrap material?',
    uploadPhoto: 'Upload a photo and let AI suggest upcycling projects.',
    analyzeNow: 'Analyze Now',
    communityImpact: 'Community Impact',
    carbonSaved: 'Carbon Saved',
    projects: 'Projects',
    tonsWaste: 'Tons Waste',
    discover: 'Discover',
    trending: 'Trending',
    community: 'Community',
    topMakers: 'Top Makers',
    viewAll: 'View All',
    login: 'Login',
    logout: 'Logout',
    trendingNow: 'Trending Now',
    thisWeek: 'This Week',
    thisMonth: 'This Month',
    allTime: 'All Time',
    allTrending: 'All Trending',
    textile: 'Textile',
    wood: 'Wood',
    print3d: '3D Print',
    loadMore: 'Load more',
    joinMovement: 'Join the movement and start sharing your upcycled creations.',
    viewGuidelines: 'View Guidelines',
    hero: {
        tag: 'Trending #1',
        material: 'Glass & Plastic',
        demand: 'High Demand',
        title: 'Recycled Ocean Plastic Lamp',
        desc: 'A stunning geodesic light fixture made entirely from reclaimed shoreline plastics and glass bottles. This project saved 4.2kg of ocean waste.',
        viewDetails: 'View Project Details',
        views: '12.5k views today',
        likes: '+840 likes this week'
    }
  }
};

const Trending: React.FC<TrendingProps> = ({ onNavigate, isDarkMode, toggleDarkMode, language, toggleLanguage, user, onLoginClick, onLogout }) => {
  const t = TRANSLATIONS[language];

  return (
    <div className="bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark font-display transition-colors duration-300 min-h-screen">
        <header className="fixed top-0 w-full z-50 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 h-16 transition-colors duration-300">
            <div className="max-w-[1600px] mx-auto px-6 h-full flex items-center justify-between">
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigate('discovery')}>
                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white">
                        <span className="material-icons-round text-xl">recycling</span>
                    </div>
                    <span className="font-bold text-xl tracking-tight text-gray-900 dark:text-white">Jeju <span className="text-primary">Re-Maker</span></span>
                </div>
                <div className="hidden md:flex flex-1 max-w-md mx-8 relative">
                    <span className="material-icons-round absolute left-3 top-2.5 text-muted-light dark:text-muted-dark text-xl">search</span>
                    <input className="w-full bg-gray-100 dark:bg-surface-darker border-transparent focus:border-primary focus:ring-0 rounded-full py-2.5 pl-10 pr-4 text-sm transition-all duration-300 placeholder-muted-light dark:placeholder-muted-dark text-text-light dark:text-text-dark outline-none" placeholder={t.searchPlaceholder} type="text"/>
                </div>
                <div className="flex items-center gap-4">
                     {/* Language Toggle */}
                    <button 
                        onClick={toggleLanguage}
                        className="px-3 py-1.5 rounded-lg font-bold text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                        {language === 'ko' ? 'EN' : '한국어'}
                    </button>

                     {/* Dark Mode Toggle */}
                    <button 
                    onClick={toggleDarkMode}
                    className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                    >
                    <span className="material-icons-round">{isDarkMode ? 'light_mode' : 'dark_mode'}</span>
                    </button>

                    <button className="p-2 text-muted-light dark:text-muted-dark hover:bg-gray-100 dark:hover:bg-surface-darker rounded-full transition-colors">
                        <span className="material-icons-round">notifications_none</span>
                    </button>
                    <button onClick={() => user ? onNavigate('upload') : onLoginClick('upload')} className="flex items-center gap-2 pl-2 pr-1 py-1 bg-gray-100 dark:bg-surface-darker rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                        <span className="text-sm font-medium px-2">{t.create}</span>
                        <div className="w-7 h-7 bg-primary rounded-full flex items-center justify-center text-white">
                            <span className="material-icons-round text-sm">add</span>
                        </div>
                    </button>
                    
                    {user ? (
                        <div 
                            onClick={onLogout}
                            className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-400 to-purple-400 overflow-hidden border-2 border-white dark:border-gray-800 cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                            title={t.logout}
                        >
                            <img alt="User profile" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAQyyDiuuKUO7-48MXIFPjnexxedhZVHEg5bLuAfgHROaZsbytCEGez7ZIXFwYjO7H0n-l9dOkw4COHYrcofMglRTN3eCjKz9imRZERODcpiZMHvmA375rRKibsmRiaev4dbcIfJShQP2b6z5fq637Tc09U2y5H0qaavl6DdKbBt-tQj5H3OY3EjQDJEpKoEstwMBcTO32zdio882CcbV9WotiISEBt_WQls7w_h3eoXRbVzBGRCA7ziLjSCfksoUdmw3FLUHE6mDs"/>
                        </div>
                    ) : (
                        <button 
                            onClick={() => onLoginClick()}
                            className="px-4 py-2 text-sm font-bold text-white bg-primary hover:bg-primary-dark rounded-xl transition-colors shadow-lg shadow-primary/20"
                        >
                            {t.login}
                        </button>
                    )}
                </div>
            </div>
        </header>

        <div className="max-w-[1600px] mx-auto pt-24 pb-12 px-6 flex gap-10">
            <aside className="w-72 flex-shrink-0 hidden lg:flex flex-col gap-6 sticky top-24 h-[calc(100vh-8rem)] overflow-y-auto pr-2 no-scrollbar">
                <div className="p-5 rounded-3xl bg-gradient-to-br from-gray-50 to-white dark:from-surface-darker dark:to-background-dark border border-gray-100 dark:border-gray-800 shadow-soft relative overflow-hidden group">
                    <div className="absolute inset-0 bg-primary/5 dark:bg-primary/10 group-hover:bg-primary/10 transition-colors duration-500"></div>
                    <div className="absolute -right-4 -top-4 w-20 h-20 bg-primary/20 rounded-full blur-2xl"></div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-2 text-primary font-semibold">
                            <span className="material-icons-round text-sm">auto_awesome</span>
                            <span className="text-xs uppercase tracking-wider">{t.aiAnalysis}</span>
                        </div>
                        <h3 className="font-bold text-lg mb-2 leading-tight">{t.gotScrap}</h3>
                        <p className="text-sm text-muted-light dark:text-muted-dark mb-4">{t.uploadPhoto}</p>
                        <button className="w-full py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl text-sm font-medium shadow-glow transition-all duration-300 flex items-center justify-center gap-2">
                            <span>{t.analyzeNow}</span>
                        </button>
                    </div>
                </div>
                <div className="p-5 rounded-3xl bg-white dark:bg-surface-darker border border-gray-100 dark:border-gray-800 shadow-soft">
                    <div className="flex items-center gap-2 mb-4">
                        <span className="material-icons-round text-primary text-xl">eco</span>
                        <h3 className="font-bold text-base text-gray-900 dark:text-white">{t.communityImpact}</h3>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md uppercase tracking-wide">{t.carbonSaved}</span>
                        <span className="text-sm font-bold text-primary">14,230kg</span>
                    </div>
                    <div className="h-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden mb-5">
                        <div className="h-full bg-primary w-[70%] rounded-full"></div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-gray-50 dark:bg-background-dark rounded-xl p-3 text-center">
                            <div className="text-xl font-bold text-gray-900 dark:text-white">8.5k</div>
                            <div className="text-[10px] uppercase font-semibold text-muted-light dark:text-muted-dark tracking-wide">{t.projects}</div>
                        </div>
                        <div className="bg-gray-50 dark:bg-background-dark rounded-xl p-3 text-center">
                            <div className="text-xl font-bold text-gray-900 dark:text-white">420</div>
                            <div className="text-[10px] uppercase font-semibold text-muted-light dark:text-muted-dark tracking-wide">{t.tonsWaste}</div>
                        </div>
                    </div>
                </div>
                <nav className="space-y-1">
                    <button onClick={() => onNavigate('discovery')} className="w-full flex items-center gap-3 px-4 py-3 text-muted-light dark:text-muted-dark hover:bg-gray-50 dark:hover:bg-surface-darker/50 hover:text-text-light dark:hover:text-text-dark rounded-xl font-medium transition-colors">
                        <span className="material-icons-round">explore</span>
                        {t.discover}
                    </button>
                    <button onClick={() => onNavigate('trending')} className="w-full flex items-center gap-3 px-4 py-3 text-muted-light dark:text-muted-dark hover:bg-gray-50 dark:hover:bg-surface-darker/50 hover:text-text-light dark:hover:text-text-dark rounded-xl font-medium transition-colors">
                        <span className="material-icons-round">trending_up</span>
                        {t.trending}
                    </button>
                    <button onClick={() => onNavigate('community')} className="w-full flex items-center gap-3 px-4 py-3 text-muted-light dark:text-muted-dark hover:bg-gray-50 dark:hover:bg-surface-darker/50 hover:text-text-light dark:hover:text-text-dark rounded-xl font-medium transition-colors">
                        <span className="material-icons-round">people</span>
                        {t.community}
                    </button>
                </nav>
                <div>
                    <div className="flex items-center justify-between mb-3 px-1">
                        <h3 className="font-bold text-base text-gray-900 dark:text-white">{t.topMakers}</h3>
                        <a className="text-xs font-medium text-primary hover:text-primary-dark transition-colors" href="#">{t.viewAll}</a>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 group cursor-pointer">
                            <div className="relative">
                                <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                                    <img alt="Sarah Jenkins" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCtuenibBf4tw0iA0QWK8b6MCSPdrIgd9OKyJFEM3Q1RZjfbdUV5IdvWoTr3iwlxvRv7B2cLyEVdYNtgm8ddX8ATCWblrjXyz3i8jkgVPeyDK4fkz9iYlwxoRL87lbw1aWnJ2Mr3Vjee0NQTCLC5wOSWUN7uQAMVoJW4DUQUaC5ogiHbuKIjW9T0dMbLTnY2OeYVTLb0dFN0S_QSbmDHLoc2-8Htk-PBcoWvLEaXmuMvLddz3lhrEALUEfbgz0Bf79PtYDSrLIc84U"/>
                                </div>
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 text-white text-[10px] font-bold flex items-center justify-center rounded-full border border-white dark:border-background-dark">1</div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate group-hover:text-primary transition-colors">Sarah Jenkins</h4>
                                <p className="text-xs text-muted-light dark:text-muted-dark truncate">124 Projects • 8k Likes</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 group cursor-pointer">
                            <div className="relative">
                                <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                                    <img alt="WoodWorkStudio" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDtfkCp1u6RQE75IVa1qBK32C6pkRhi_PH7cCop_nLGn1AJzuIT2NqbxN3xYFzGlSG5iMaECKw8rR-g-rwEfhmKPElX1u7y9pUVSXtX2Mm6SGUOmqXZXzz0jmRzh7-t5REfwx67KwSY-8O35EhrDKkvFoeG_cFfhiPg5T1_G0wQ-I62haamEoI0pimhPN_dipCKopy86n4sjsWh610Q3OQaytpYR4o_dxHMh9XGT9FbwxYW17UmqN_HwBJ75w2Sr7jj-o43G4eec6I"/>
                                </div>
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-gray-300 text-white text-[10px] font-bold flex items-center justify-center rounded-full border border-white dark:border-background-dark">2</div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate group-hover:text-primary transition-colors">WoodWorkStudio</h4>
                                <p className="text-xs text-muted-light dark:text-muted-dark truncate">98 Projects • 5.2k Likes</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 group cursor-pointer">
                            <div className="relative">
                                <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                                    <img alt="EcoLightz" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAlS4kFqDJmMraQ5iv0a245PyOXT8XYd8MBlFFLxPJtdrqUn0u9yxkKxvyyNEdCK6sw0qi0Fdj8KvbWO1W6eYKENQoUuZ7R_PyP-FnTHwQQ1DGW23HkSA-3NeRWPI9u_wt6EPThHJdVowcxji27rda8BeClTySETj_QVB7Tk6dHVnNktPdhJAJgowciBu-oL8alTxfx51rcqoM8sUGo-bbFebqRgQITmWy5eXs9X0QHF40H5VidAwilMdOawkCfpDg5JjhzrI1hXro"/>
                                </div>
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-orange-700 text-white text-[10px] font-bold flex items-center justify-center rounded-full border border-white dark:border-background-dark">3</div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate group-hover:text-primary transition-colors">EcoLightz</h4>
                                <p className="text-xs text-muted-light dark:text-muted-dark truncate">86 Projects • 4.1k Likes</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 group cursor-pointer">
                            <div className="relative">
                                <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                                    <img alt="PrintMaster" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCVQHmmS6kEqwz9kbWlPRhdyy0rta4aHB3GAgK5Rm_Qn8cb3YVvFE_AFKoQxAy6eIUhnKcvD0ObXAigxK1BXehW9yFwrQTZyEDYslhE6bU6NnjaEr1HEeUwZ0raaBM2qGGcSGpOm3sTBZmH3Fv14XlpRwZkMJ6kOdSxOkearaFWYepnSc8NbJOpnhPBFGTwpju8j0-Ya9eTYL7vBbJekMVO1pl53Yp0dc0jlW6Wph2dNUDIQPVdyr5HGMvKYU0l4ZUuLaHpHLFQHjI"/>
                                </div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate group-hover:text-primary transition-colors">PrintMaster</h4>
                                <p className="text-xs text-muted-light dark:text-muted-dark truncate">65 Projects • 2.9k Likes</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 text-center">
                    <p className="text-xs text-muted-light dark:text-muted-dark mb-3 px-2">{t.joinMovement}</p>
                    <button className="w-full py-2 bg-white dark:bg-surface-darker border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-text-light dark:text-text-dark rounded-xl text-xs font-semibold transition-colors">
                        {t.viewGuidelines}
                    </button>
                </div>
            </aside>
            <main className="flex-1 min-w-0">
                <div className="mb-10">
                    <div className="flex items-center justify-between mb-4 px-1">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <span className="material-icons-round text-orange-500">local_fire_department</span> {t.trendingNow}
                        </h2>
                        <div className="flex gap-2">
                            <button className="w-9 h-9 rounded-full border border-gray-200 dark:border-gray-700 flex items-center justify-center text-muted-light hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                <span className="material-icons-round text-lg">arrow_back</span>
                            </button>
                            <button className="w-9 h-9 rounded-full border border-gray-200 dark:border-gray-700 flex items-center justify-center text-muted-light hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                <span className="material-icons-round text-lg">arrow_forward</span>
                            </button>
                        </div>
                    </div>
                    <div className="relative w-full h-[450px] rounded-[2rem] overflow-hidden group shadow-xl">
                        <img alt="Trending Hero" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAlS4kFqDJmMraQ5iv0a245PyOXT8XYd8MBlFFLxPJtdrqUn0u9yxkKxvyyNEdCK6sw0qi0Fdj8KvbWO1W6eYKENQoUuZ7R_PyP-FnTHwQQ1DGW23HkSA-3NeRWPI9u_wt6EPThHJdVowcxji27rda8BeClTySETj_QVB7Tk6dHVnNktPdhJAJgowciBu-oL8alTxfx51rcqoM8sUGo-bbFebqRgQITmWy5eXs9X0QHF40H5VidAwilMdOawkCfpDg5JjhzrI1hXro"/>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent"></div>
                        <div className="absolute top-6 left-6">
                            <div className="bg-primary text-white px-4 py-1.5 rounded-full font-bold text-sm flex items-center gap-1.5 shadow-lg backdrop-blur-md bg-opacity-95">
                                <span className="material-icons-round text-base">trending_up</span> {t.hero.tag}
                            </div>
                        </div>
                        <div className="absolute bottom-0 left-0 p-8 md:p-10 w-full md:max-w-3xl">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="bg-white/20 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-semibold border border-white/10 uppercase tracking-wide">{t.hero.material}</span>
                                <span className="bg-red-500/80 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-semibold border border-white/10 flex items-center gap-1">
                                    <span className="material-icons-round text-[10px]">whatshot</span> {t.hero.demand}
                                </span>
                            </div>
                            <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 leading-tight">{t.hero.title}</h1>
                            <p className="text-gray-200 mb-8 text-lg font-light leading-relaxed max-w-2xl">{t.hero.desc}</p>
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                                <button className="bg-white text-gray-900 hover:bg-gray-100 px-8 py-3 rounded-2xl font-bold text-sm transition-colors flex items-center gap-2 shadow-lg">
                                    {t.hero.viewDetails}
                                </button>
                                <div className="flex items-center gap-6 text-white/90 text-sm font-medium">
                                    <span className="flex items-center gap-1.5"><span className="material-icons-round text-primary text-lg">visibility</span> {t.hero.views}</span>
                                    <span className="flex items-center gap-1.5"><span className="material-icons-round text-red-400 text-lg">favorite</span> {t.hero.likes}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4 border-b border-gray-100 dark:border-gray-800 pb-6 mt-8">
                        <div className="flex gap-4 items-center">
                            <div className="flex bg-gray-100 dark:bg-surface-darker p-1 rounded-xl">
                                <button className="px-5 py-2 bg-white dark:bg-gray-600 text-gray-900 dark:text-white rounded-lg shadow-sm text-sm font-semibold transition-all">{t.thisWeek}</button>
                                <button className="px-5 py-2 text-muted-light dark:text-muted-dark hover:text-gray-900 dark:hover:text-white text-sm font-medium transition-colors">{t.thisMonth}</button>
                                <button className="px-5 py-2 text-muted-light dark:text-muted-dark hover:text-gray-900 dark:hover:text-white text-sm font-medium transition-colors">{t.allTime}</button>
                            </div>
                        </div>
                        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 w-full md:w-auto">
                            <button className="px-4 py-2 border border-primary/30 bg-primary/5 text-primary rounded-full text-sm font-medium whitespace-nowrap">{t.allTrending}</button>
                            <button className="px-4 py-2 border border-gray-200 dark:border-gray-700 hover:border-primary/50 text-text-light dark:text-text-dark bg-white dark:bg-surface-darker rounded-full text-sm font-medium whitespace-nowrap transition-colors">{t.textile}</button>
                            <button className="px-4 py-2 border border-gray-200 dark:border-gray-700 hover:border-primary/50 text-text-light dark:text-text-dark bg-white dark:bg-surface-darker rounded-full text-sm font-medium whitespace-nowrap transition-colors">{t.wood}</button>
                            <button className="px-4 py-2 border border-gray-200 dark:border-gray-700 hover:border-primary/50 text-text-light dark:text-text-dark bg-white dark:bg-surface-darker rounded-full text-sm font-medium whitespace-nowrap transition-colors">{t.print3d}</button>
                        </div>
                    </div>
                    <div className="flex flex-col bg-white dark:bg-surface-darker rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden divide-y divide-gray-100 dark:divide-gray-800">
                        {/* List Item 1 */}
                        <div className="group relative flex items-center p-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-all duration-200">
                            <div className="w-10 sm:w-16 text-center text-lg sm:text-xl font-bold text-gray-400 dark:text-gray-600 group-hover:text-primary transition-colors font-display">#2</div>
                            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden flex-shrink-0 shadow-sm relative ml-2 sm:ml-4">
                                <img alt="Upcycled Denim Bag" className="w-full h-full object-cover transform transition-transform duration-500 group-hover:scale-110" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCtuenibBf4tw0iA0QWK8b6MCSPdrIgd9OKyJFEM3Q1RZjfbdUV5IdvWoTr3iwlxvRv7B2cLyEVdYNtgm8ddX8ATCWblrjXyz3i8jkgVPeyDK4fkz9iYlwxoRL87lbw1aWnJ2Mr3Vjee0NQTCLC5wOSWUN7uQAMVoJW4DUQUaC5ogiHbuKIjW9T0dMbLTnY2OeYVTLb0dFN0S_QSbmDHLoc2-8Htk-PBcoWvLEaXmuMvLddz3lhrEALUEfbgz0Bf79PtYDSrLIc84U"/>
                            </div>
                            <div className="flex-1 ml-4 sm:ml-6 min-w-0 grid grid-cols-1 md:grid-cols-12 items-center gap-2 sm:gap-4">
                                <div className="md:col-span-4 lg:col-span-5 flex flex-col justify-center">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-bold text-base sm:text-lg text-gray-900 dark:text-white truncate group-hover:text-primary transition-colors">Upcycled Denim Bag</h3>
                                    </div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                                        By <span className="font-medium text-gray-700 dark:text-gray-300">Sarah Jenkins</span>
                                        <span className="material-icons-round text-blue-500 text-[14px]">verified</span>
                                    </p>
                                </div>
                                <div className="hidden md:flex md:col-span-5 lg:col-span-4 items-center gap-4 lg:gap-8">
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2 text-xs font-medium text-muted-light dark:text-muted-dark">
                                            <span className="flex items-center gap-1"><span className="material-icons-round text-sm">visibility</span> 3.2k</span>
                                            <span className="text-gray-300">•</span>
                                            <span className="flex items-center gap-1 text-green-600 dark:text-green-400"><span className="material-icons-round text-sm">favorite</span> +620</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="flex items-center gap-1 text-[10px] font-bold text-orange-600 bg-orange-100 dark:bg-orange-900/30 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                                <span className="material-icons-round text-[12px]">local_fire_department</span> Hot
                                            </span>
                                            <div className="h-1 w-20 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                                <div className="h-full bg-orange-500 w-[85%] rounded-full"></div>
                                            </div>
                                        </div>
                                    </div>
                                    <span className="px-3 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-full whitespace-nowrap">Textile</span>
                                </div>
                                <div className="hidden md:flex md:col-span-3 lg:col-span-3 justify-end items-center pr-4">
                                    <button className="opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-300 flex items-center gap-2 px-5 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-primary hover:text-white dark:text-white rounded-full text-sm font-semibold shadow-sm">
                                        View
                                        <span className="material-icons-round text-sm">arrow_forward</span>
                                    </button>
                                </div>
                            </div>
                            <button className="md:hidden ml-auto p-2 text-gray-400">
                                <span className="material-icons-round">chevron_right</span>
                            </button>
                        </div>
                        {/* List Item 2 */}
                        <div className="group relative flex items-center p-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-all duration-200">
                            <div className="w-10 sm:w-16 text-center text-lg sm:text-xl font-bold text-gray-400 dark:text-gray-600 group-hover:text-primary transition-colors font-display">#3</div>
                            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden flex-shrink-0 shadow-sm relative ml-2 sm:ml-4">
                                <img alt="PLA Recycled Vase" className="w-full h-full object-cover transform transition-transform duration-500 group-hover:scale-110" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCVQHmmS6kEqwz9kbWlPRhdyy0rta4aHB3GAgK5Rm_Qn8cb3YVvFE_AFKoQxAy6eIUhnKcvD0ObXAigxK1BXehW9yFwrQTZyEDYslhE6bU6NnjaEr1HEeUwZ0raaBM2qGGcSGpOm3sTBZmH3Fv14XlpRwZkMJ6kOdSxOkearaFWYepnSc8NbJOpnhPBFGTwpju8j0-Ya9eTYL7vBbJekMVO1pl53Yp0dc0jlW6Wph2dNUDIQPVdyr5HGMvKYU0l4ZUuLaHpHLFQHjI"/>
                            </div>
                            <div className="flex-1 ml-4 sm:ml-6 min-w-0 grid grid-cols-1 md:grid-cols-12 items-center gap-2 sm:gap-4">
                                <div className="md:col-span-4 lg:col-span-5 flex flex-col justify-center">
                                    <h3 className="font-bold text-base sm:text-lg text-gray-900 dark:text-white truncate group-hover:text-primary transition-colors">PLA Recycled Vase</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                                        By <span className="font-medium text-gray-700 dark:text-gray-300">PrintMaster</span>
                                    </p>
                                </div>
                                <div className="hidden md:flex md:col-span-5 lg:col-span-4 items-center gap-4 lg:gap-8">
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2 text-xs font-medium text-muted-light dark:text-muted-dark">
                                            <span className="flex items-center gap-1"><span className="material-icons-round text-sm">visibility</span> 2.8k</span>
                                            <span className="text-gray-300">•</span>
                                            <span className="flex items-center gap-1 text-green-600 dark:text-green-400"><span className="material-icons-round text-sm">favorite</span> +410</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                                <span className="material-icons-round text-[12px]">trending_up</span> Rising
                                            </span>
                                            <div className="h-1 w-20 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                                <div className="h-full bg-green-500 w-[60%] rounded-full"></div>
                                            </div>
                                        </div>
                                    </div>
                                    <span className="px-3 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-full whitespace-nowrap">3D Print</span>
                                </div>
                                <div className="hidden md:flex md:col-span-3 lg:col-span-3 justify-end items-center pr-4">
                                    <button className="opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-300 flex items-center gap-2 px-5 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-primary hover:text-white dark:text-white rounded-full text-sm font-semibold shadow-sm">
                                        View
                                        <span className="material-icons-round text-sm">arrow_forward</span>
                                    </button>
                                </div>
                            </div>
                            <button className="md:hidden ml-auto p-2 text-gray-400">
                                <span className="material-icons-round">chevron_right</span>
                            </button>
                        </div>
                    </div>
                    <div className="mt-16 flex justify-center">
                        <button className="px-8 py-3 bg-white dark:bg-surface-darker border border-gray-200 dark:border-gray-700 rounded-full text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 text-text-light dark:text-text-dark transition-colors shadow-sm flex items-center gap-2">
                            <span>{t.loadMore}</span>
                            <span className="material-icons-round text-sm">expand_more</span>
                        </button>
                    </div>
                </div>
            </main>
        </div>
    </div>
  );
};

export default Trending;