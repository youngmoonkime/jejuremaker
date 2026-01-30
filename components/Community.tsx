import React from 'react';
import { Language } from '../App';
import { User } from '@supabase/supabase-js';

interface CommunityProps {
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
        hubTitle: '커뮤니티 허브',
        hubSubtitle: '업사이클링 여정을 공유하고 다른 사람들에게 영감을 주세요.',
        postCreation: '작품 올리기',
        activeChallenges: '진행 중인 챌린지',
        joinMovement: '무브먼트에 참여하고 당신의 업사이클링 작품을 공유하세요.',
        viewGuidelines: '가이드라인 보기',
        challenges: {
            kitchen: {
                title: '제로 웨이스트 주방 주간',
                desc: '주방 쓰레기와 포장재를 기능적인 도구로 재탄생시켜보세요.',
                ending: '2일 후 종료',
                join: '참여하기'
            },
            beach: {
                title: '제주 해변 플라스틱 챌린지',
                desc: '해안가 플라스틱을 예술이나 도구로 바꿔보세요. 함께 해변을 청소해요!',
                tag: 'NEW',
                join: '참여하기'
            }
        },
        loadMore: '더 보기'
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
        hubTitle: 'Community Hub',
        hubSubtitle: 'Share your upcycled journey and inspire others.',
        postCreation: 'Post a Creation',
        activeChallenges: 'Active Challenges',
        joinMovement: 'Join the movement and start sharing your upcycled creations.',
        viewGuidelines: 'View Guidelines',
        challenges: {
            kitchen: {
                title: 'Zero-Waste Kitchen Week',
                desc: 'Reimagine your kitchen scraps and packaging into functional tools.',
                ending: 'Ending in 2 days',
                join: 'Join'
            },
            beach: {
                title: 'Jeju Beach Plastic Challenge',
                desc: 'Turn washed-up plastics into art or utility. Let\'s clean the coast!',
                tag: 'New',
                join: 'Join'
            }
        },
        loadMore: 'Load more'
    }
};

const Community: React.FC<CommunityProps> = ({ onNavigate, isDarkMode, toggleDarkMode, language, toggleLanguage, user, onLoginClick, onLogout }) => {
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
                    <button onClick={() => onNavigate('community')} className="w-full flex items-center gap-3 px-4 py-3 bg-gray-100 dark:bg-surface-darker text-primary rounded-xl font-medium transition-colors shadow-sm">
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
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">{t.hubTitle}</h1>
                        <p className="text-lg text-muted-light dark:text-muted-dark font-light">{t.hubSubtitle}</p>
                    </div>
                    <button onClick={() => user ? onNavigate('upload') : onLoginClick('upload')} className="flex items-center gap-3 px-6 py-3.5 bg-primary hover:bg-primary-dark text-white rounded-2xl font-semibold shadow-lg shadow-emerald-500/20 transition-all duration-300 hover:scale-105 group">
                        <span className="material-icons-round text-xl group-hover:rotate-12 transition-transform">add_a_photo</span>
                        {t.postCreation}
                    </button>
                </div>
                <div className="mb-12">
                    <div className="flex items-center justify-between mb-4 px-1">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t.activeChallenges}</h2>
                        <div className="flex gap-2">
                            <button className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-700 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                <span className="material-icons-round text-muted-light">chevron_left</span>
                            </button>
                            <button className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-700 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                <span className="material-icons-round text-muted-light">chevron_right</span>
                            </button>
                        </div>
                    </div>
                    <div className="flex gap-6 overflow-x-auto pb-6 -mx-6 px-6 hide-scrollbar snap-x">
                        <div className="min-w-[340px] md:min-w-[400px] h-64 rounded-3xl relative overflow-hidden group snap-start cursor-pointer shadow-soft">
                            <img alt="Kitchen Challenge" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCApCDGbAHCEjCS_6QtOjIrDK6gXNFE80PgPbC-OFpipS8vgyPyBfuM4cyy0i_hiZ7lgxovLATSoj4HF6K7VNBSilJJQ2s9VhPvSHVNxmEsTfVTbZ4EFlK6zSO50JYPgsvPQyzXnrx8l92hZJY6K5nPxm8IPE2W90OKUDUY6RJ-w9Hxt3q_WAVO3MamPsVJAYEKEw35uS60fNtodlYREf_xj1coAplnJ-SCmKQzfY6kADsiab0wtcok3Ctu1SSXs1fJ9R9_XDirbdI"/>
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                            <div className="absolute top-4 left-4 bg-white/20 backdrop-blur-md border border-white/30 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                                {t.challenges.kitchen.ending}
                            </div>
                            <div className="absolute bottom-0 p-6 w-full">
                                <h3 className="text-2xl font-bold text-white mb-1">{t.challenges.kitchen.title}</h3>
                                <p className="text-gray-300 text-sm mb-4 line-clamp-2">{t.challenges.kitchen.desc}</p>
                                <div className="flex items-center justify-between">
                                    <div className="flex -space-x-2">
                                        <img className="w-8 h-8 rounded-full border-2 border-white" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCtuenibBf4tw0iA0QWK8b6MCSPdrIgd9OKyJFEM3Q1RZjfbdUV5IdvWoTr3iwlxvRv7B2cLyEVdYNtgm8ddX8ATCWblrjXyz3i8jkgVPeyDK4fkz9iYlwxoRL87lbw1aWnJ2Mr3Vjee0NQTCLC5wOSWUN7uQAMVoJW4DUQUaC5ogiHbuKIjW9T0dMbLTnY2OeYVTLb0dFN0S_QSbmDHLoc2-8Htk-PBcoWvLEaXmuMvLddz3lhrEALUEfbgz0Bf79PtYDSrLIc84U"/>
                                        <img className="w-8 h-8 rounded-full border-2 border-white" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDtfkCp1u6RQE75IVa1qBK32C6pkRhi_PH7cCop_nLGn1AJzuIT2NqbxN3xYFzGlSG5iMaECKw8rR-g-rwEfhmKPElX1u7y9pUVSXtX2Mm6SGUOmqXZXzz0jmRzh7-t5REfwx67KwSY-8O35EhrDKkvFoeG_cFfhiPg5T1_G0wQ-I62haamEoI0pimhPN_dipCKopy86n4sjsWh610Q3OQaytpYR4o_dxHMh9XGT9FbwxYW17UmqN_HwBJ75w2Sr7jj-o43G4eec6I"/>
                                        <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-800 text-white text-xs flex items-center justify-center font-bold">+42</div>
                                    </div>
                                    <span className="px-4 py-2 bg-white text-gray-900 rounded-xl text-sm font-bold group-hover:bg-primary group-hover:text-white transition-colors">{t.challenges.kitchen.join}</span>
                                </div>
                            </div>
                        </div>
                        <div className="min-w-[340px] md:min-w-[400px] h-64 rounded-3xl relative overflow-hidden group snap-start cursor-pointer shadow-soft">
                            <img alt="Beach Cleanup Challenge" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCVQHmmS6kEqwz9kbWlPRhdyy0rta4aHB3GAgK5Rm_Qn8cb3YVvFE_AFKoQxAy6eIUhnKcvD0ObXAigxK1BXehW9yFwrQTZyEDYslhE6bU6NnjaEr1HEeUwZ0raaBM2qGGcSGpOm3sTBZmH3Fv14XlpRwZkMJ6kOdSxOkearaFWYepnSc8NbJOpnhPBFGTwpju8j0-Ya9eTYL7vBbJekMVO1pl53Yp0dc0jlW6Wph2dNUDIQPVdyr5HGMvKYU0l4ZUuLaHpHLFQHjI"/>
                            <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/90 via-emerald-900/20 to-transparent"></div>
                            <div className="absolute top-4 left-4 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide shadow-lg">
                                {t.challenges.beach.tag}
                            </div>
                            <div className="absolute bottom-0 p-6 w-full">
                                <h3 className="text-2xl font-bold text-white mb-1">{t.challenges.beach.title}</h3>
                                <p className="text-emerald-100 text-sm mb-4 line-clamp-2">{t.challenges.beach.desc}</p>
                                <div className="flex items-center justify-between">
                                    <div className="flex -space-x-2">
                                        <img className="w-8 h-8 rounded-full border-2 border-white" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAlS4kFqDJmMraQ5iv0a245PyOXT8XYd8MBlFFLxPJtdrqUn0u9yxkKxvyyNEdCK6sw0qi0Fdj8KvbWO1W6eYKENQoUuZ7R_PyP-FnTHwQQ1DGW23HkSA-3NeRWPI9u_wt6EPThHJdVowcxji27rda8BeClTySETj_QVB7Tk6dHVnNktPdhJAJgowciBu-oL8alTxfx51rcqoM8sUGo-bbFebqRgQITmWy5eXs9X0QHF40H5VidAwilMdOawkCfpDg5JjhzrI1hXro"/>
                                        <img className="w-8 h-8 rounded-full border-2 border-white" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCVQHmmS6kEqwz9kbWlPRhdyy0rta4aHB3GAgK5Rm_Qn8cb3YVvFE_AFKoQxAy6eIUhnKcvD0ObXAigxK1BXehW9yFwrQTZyEDYslhE6bU6NnjaEr1HEeUwZ0raaBM2qGGcSGpOm3sTBZmH3Fv14XlpRwZkMJ6kOdSxOkearaFWYepnSc8NbJOpnhPBFGTwpju8j0-Ya9eTYL7vBbJekMVO1pl53Yp0dc0jlW6Wph2dNUDIQPVdyr5HGMvKYU0l4ZUuLaHpHLFQHjI"/>
                                        <div className="w-8 h-8 rounded-full border-2 border-white bg-emerald-800 text-white text-xs flex items-center justify-center font-bold">+128</div>
                                    </div>
                                    <span className="px-4 py-2 bg-white text-gray-900 rounded-xl text-sm font-bold group-hover:bg-emerald-500 group-hover:text-white transition-colors">{t.challenges.beach.join}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="max-w-4xl mx-auto space-y-8">
                    {/* Post 1 */}
                    <div className="bg-white dark:bg-surface-darker rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 p-6">
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-3">
                                <img alt="Sarah J." className="w-10 h-10 rounded-full object-cover border border-gray-100 dark:border-gray-700" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCtuenibBf4tw0iA0QWK8b6MCSPdrIgd9OKyJFEM3Q1RZjfbdUV5IdvWoTr3iwlxvRv7B2cLyEVdYNtgm8ddX8ATCWblrjXyz3i8jkgVPeyDK4fkz9iYlwxoRL87lbw1aWnJ2Mr3Vjee0NQTCLC5wOSWUN7uQAMVoJW4DUQUaC5ogiHbuKIjW9T0dMbLTnY2OeYVTLb0dFN0S_QSbmDHLoc2-8Htk-PBcoWvLEaXmuMvLddz3lhrEALUEfbgz0Bf79PtYDSrLIc84U"/>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-gray-900 dark:text-white">Sarah Jenkins</span>
                                        <span className="material-icons-round text-primary text-sm" title="Verified Maker">verified</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-muted-light dark:text-muted-dark">
                                        <span>@sarahj_makes</span>
                                        <span>•</span>
                                        <span>2h ago</span>
                                    </div>
                                </div>
                            </div>
                            <button className="text-muted-light hover:text-gray-900 dark:hover:text-white">
                                <span className="material-icons-round">more_horiz</span>
                            </button>
                        </div>
                        <div className="mb-4">
                            <p className="text-gray-800 dark:text-gray-200 text-base leading-relaxed mb-4">
                                Finally finished weaving this chair! Took me all weekend but saved 5 pairs of jeans from landfill. The texture is surprisingly comfortable and durable. 👖✨
                            </p>
                            <div className="rounded-2xl overflow-hidden mb-4">
                                <img alt="Denim Chair Project" className="w-full h-auto object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCtuenibBf4tw0iA0QWK8b6MCSPdrIgd9OKyJFEM3Q1RZjfbdUV5IdvWoTr3iwlxvRv7B2cLyEVdYNtgm8ddX8ATCWblrjXyz3i8jkgVPeyDK4fkz9iYlwxoRL87lbw1aWnJ2Mr3Vjee0NQTCLC5wOSWUN7uQAMVoJW4DUQUaC5ogiHbuKIjW9T0dMbLTnY2OeYVTLb0dFN0S_QSbmDHLoc2-8Htk-PBcoWvLEaXmuMvLddz3lhrEALUEfbgz0Bf79PtYDSrLIc84U"/>
                            </div>
                            <a className="flex items-center gap-4 bg-gray-50 dark:bg-background-dark rounded-xl p-3 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors border border-gray-100 dark:border-gray-700/50" href="#">
                                <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gray-200">
                                    <img alt="Original Design" className="w-full h-full object-cover opacity-80" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBb0TA0SOf0Uqj3J-p97g6i8C8z3O_0HdMCVan6SsH2SyoTgZzI6LaxF_7LO9qAAaZBZfalY7ilHXKsBfofkNIERYAFM2CAcgUirkA3GBJJ7T9JlAaDJ1aCz8GWGOUVEfs8VyyErsFOT-bkXyoOSmdyi_w1_YfCkprIPFY7-exWQDDvYlNqjboJDdoNjK5MX6XhoXAPlH1e5OoxeqDbPfVfTWUuxSTaD4QsIY4KRo1QpflpBRCqALG9THR1Fy-fTon6zft8CyjiiV4"/>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-xs font-semibold text-primary mb-0.5">REMIXED FROM</div>
                                    <h4 className="font-bold text-gray-900 dark:text-white text-sm truncate">Woven Denim Chair Blueprint</h4>
                                    <p className="text-xs text-muted-light dark:text-muted-dark truncate">Original design by ReCycle Studio</p>
                                </div>
                                <span className="material-icons-round text-muted-light">chevron_right</span>
                            </a>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
                            <div className="flex items-center gap-6">
                                <button className="flex items-center gap-2 text-muted-light hover:text-primary transition-colors group">
                                    <span className="material-icons-round group-hover:scale-110 transition-transform">spa</span>
                                    <span className="text-sm font-medium">245</span>
                                </button>
                                <button className="flex items-center gap-2 text-muted-light hover:text-blue-500 transition-colors group">
                                    <span className="material-icons-round group-hover:scale-110 transition-transform">chat_bubble_outline</span>
                                    <span className="text-sm font-medium">18</span>
                                </button>
                                <button className="flex items-center gap-2 text-muted-light hover:text-green-500 transition-colors group">
                                    <span className="material-icons-round group-hover:scale-110 transition-transform rotate-90">repeat</span>
                                    <span className="text-sm font-medium">12 Remixes</span>
                                </button>
                            </div>
                            <button className="text-muted-light hover:text-gray-900 dark:hover:text-white transition-colors">
                                <span className="material-icons-round">share</span>
                            </button>
                        </div>
                    </div>
                </div>
                <div className="mt-16 flex justify-center pb-12">
                    <div className="flex flex-col items-center gap-2">
                        <button className="w-12 h-12 rounded-full bg-white dark:bg-surface-darker border border-gray-200 dark:border-gray-700 flex items-center justify-center text-primary shadow-soft hover:scale-110 transition-transform">
                            <span className="material-icons-round animate-bounce">arrow_downward</span>
                        </button>
                        <span className="text-xs font-medium text-muted-light">{t.loadMore}</span>
                    </div>
                </div>
            </main>
        </div>
    </div>
  );
};

export default Community;