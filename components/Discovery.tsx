import React, { useState, useRef, useMemo } from 'react';
import { Project, Maker } from '../types';
import { Language } from '../App';
import { User } from '@supabase/supabase-js';
import WizardModal from './WizardModal';

interface DiscoveryProps {
  onNavigate: (view: 'discovery' | 'detail' | 'upload' | 'trending' | 'community' | 'profile') => void;
  onProjectSelect: (project: Project) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  language: Language;
  toggleLanguage: () => void;
  projects: Project[];
  user: User | null;
  onLoginClick: (target?: any) => void;
  onLogout: () => void;
  userTokens: number;
  setUserTokens: (tokens: number | ((prev: number) => number)) => void;
  onAddProject: (project: Project) => void;
  onLikeToggle: (projectId: string) => void;
  likedProjects: Set<string>;
}

// Material icon mapping for better UX
const MATERIAL_ICONS: Record<string, string> = {
  '플라스틱': 'local_drink',
  'Plastic': 'local_drink',
  '종이': 'description',
  'Paper': 'description',
  '유리': 'wine_bar',
  'Glass': 'wine_bar',
  '나무': 'forest',
  'Wood': 'forest',
  '금속': 'construction',
  'Metal': 'construction',
  '천': 'checkroom',
  'Textile': 'checkroom',
  '병뚜껑': 'radio_button_checked',
  'Bottle Cap': 'radio_button_checked',
  'default': 'category'
};

// Translations
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
    heroTitle: '폐기물의 재발견. 새로운 가치를 창조하세요.',
    heroSubtitle: '수천 명의 메이커들과 함께 쓰레기를 보물로 바꿔보세요.',
    heroPlaceholder: '이미지를 붙여넣거나 만들고 싶은 것을 설명해주세요...',
    allProjects: '모든 프로젝트',
    beginner: '초보자 추천',
    woodworking: '목공',
    printing3d: '3D 프린팅',
    sortBy: '정렬:',
    popular: '인기순',
    newest: '최신순',
    topRated: '평점순',
    loadMore: '더 보기',
    login: '로그인',
    logout: '로그아웃',
    myProfile: '내 정보',
    insufficientTokens: '토큰이 부족합니다',
    wizardStep1: '재료 분석 중...',
    wizardStep2: '무엇을 만들고 싶으세요?',
    wizardStep3: '최종 생성',
    wizardNext: '다음',
    wizardGenerate: '생성하기',
    wizardClose: '닫기',
    difficulty: {
      Easy: '쉬움',
      Medium: '보통',
      Hard: '어려움'
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
    heroTitle: 'Reimagine Waste. Create Value.',
    heroSubtitle: 'Join thousands of makers turning trash into treasure.',
    heroPlaceholder: 'Paste an image or describe what you want to make...',
    allProjects: 'All Projects',
    beginner: 'Beginner Friendly',
    woodworking: 'Woodworking',
    printing3d: '3D Printed',
    sortBy: 'Sort by:',
    popular: 'Popular',
    newest: 'Newest',
    topRated: 'Top Rated',
    loadMore: 'Load more projects',
    login: 'Login',
    logout: 'Logout',
    difficulty: {
      Easy: 'Easy',
      Medium: 'Medium',
      Hard: 'Hard'
    }
  }
};

const MAKERS: Maker[] = [
  { name: 'Sarah Jenkins', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCtuenibBf4tw0iA0QWK8b6MCSPdrIgd9OKyJFEM3Q1RZjfbdUV5IdvWoTr3iwlxvRv7B2cLyEVdYNtgm8ddX8ATCWblrjXyz3i8jkgVPeyDK4fkz9iYlwxoRL87lbw1aWnJ2Mr3Vjee0NQTCLC5wOSWUN7uQAMVoJW4DUQUaC5ogiHbuKIjW9T0dMbLTnY2OeYVTLb0dFN0S_QSbmDHLoc2-8Htk-PBcoWvLEaXmuMvLddz3lhrEALUEfbgz0Bf79PtYDSrLIc84U', projects: 124, likes: '8k', rank: 1 },
  { name: 'WoodWorkStudio', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDtfkCp1u6RQE75IVa1qBK32C6pkRhi_PH7cCop_nLGn1AJzuIT2NqbxN3xYFzGlSG5iMaECKw8rR-g-rwEfhmKPElX1u7y9pUVSXtX2Mm6SGUOmqXZXzz0jmRzh7-t5REfwx67KwSY-8O35EhrDKkvFoeG_cFfhiPg5T1_G0wQ-I62haamEoI0pimhPN_dipCKopy86n4sjsWh610Q3OQaytpYR4o_dxHMh9XGT9FbwxYW17UmqN_HwBJ75w2Sr7jj-o43G4eec6I', projects: 98, likes: '5.2k', rank: 2 },
  { name: 'EcoLightz', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAlS4kFqDJmMraQ5iv0a245PyOXT8XYd8MBlFFLxPJtdrqUn0u9yxkKxvyyNEdCK6sw0qi0Fdj8KvbWO1W6eYKENQoUuZ7R_PyP-FnTHwQQ1DGW23HkSA-3NeRWPI9u_wt6EPThHJdVowcxji27rda8BeClTySETj_QVB7Tk6dHVnNktPdhJAJgowciBu-oL8alTxfx51rcqoM8sUGo-bbFebqRgQITmWy5eXs9X0QHF40H5VidAwilMdOawkCfpDg5JjhzrI1hXro', projects: 86, likes: '4.1k', rank: 3 },
  { name: 'PrintMaster', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCVQHmmS6kEqwz9kbWlPRhdyy0rta4aHB3GAgK5Rm_Qn8cb3YVvFE_AFKoQxAy6eIUhnKcvD0ObXAigxK1BXehW9yFwrQTZyEDYslhE6bU6NnjaEr1HEeUwZ0raaBM2qGGcSGpOm3sTBZmH3Fv14XlpRwZkMJ6kOdSxOkearaFWYepnSc8NbJOpnhPBFGTwpju8j0-Ya9eTYL7vBbJekMVO1pl53Yp0dc0jlW6Wph2dNUDIQPVdyr5HGMvKYU0l4ZUuLaHpHLFQHjI', projects: 65, likes: '2.9k' },
];

const Discovery: React.FC<DiscoveryProps> = ({ onNavigate, onProjectSelect, isDarkMode, toggleDarkMode, language, toggleLanguage, projects, user, onLoginClick, onLogout, userTokens, setUserTokens, onAddProject, onLikeToggle, likedProjects }) => {
  const t = TRANSLATIONS[language];
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Extract unique materials from projects to create dynamic categories
  const materialCategories = useMemo(() => {
    const materialsSet = new Set<string>();
    projects.forEach(project => {
      // Check both material and category fields
      const material = (project as any).material || project.category;
      if (material) {
        materialsSet.add(material);
      }
    });
    return Array.from(materialsSet).sort();
  }, [projects]);

  // Filter projects based on selected category
  const filteredProjects = useMemo(() => {
    if (selectedCategory === 'all') {
      return projects;
    }
    return projects.filter(project => {
      const material = (project as any).material || project.category;
      return material === selectedCategory;
    });
  }, [projects, selectedCategory]);

  // Get icon for a material
  const getMaterialIcon = (material: string) => {
    return MATERIAL_ICONS[material] || MATERIAL_ICONS['default'];
  };

  return (
    <div className={`min-h-screen text-gray-800 dark:text-gray-100 bg-background-light dark:bg-background-dark transition-colors duration-300`}>
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 h-16 transition-colors duration-300">
        <div className="max-w-[1600px] mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.location.reload()}>
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white shadow-lg shadow-primary/30">
              <span className="material-icons-round text-xl">recycling</span>
            </div>
            <span className="font-bold text-xl tracking-tight text-gray-900 dark:text-white">Jeju <span className="text-primary">Re-Maker</span></span>
          </div>

          {/* Search Input */}
          <div className="hidden md:flex flex-1 mx-8 max-w-2xl">
            <div className="bg-white dark:bg-gray-800 p-2 rounded-full shadow-lg flex items-center w-full transition-all duration-300 focus-within:shadow-xl border border-gray-200 dark:border-gray-700">
              <div className="pl-4 pr-2 text-gray-400">
                <span className="material-icons-round">search</span>
              </div>
              <input
                type="text"
                placeholder={t.heroPlaceholder}
                className="flex-1 bg-transparent border-none focus:ring-0 text-gray-800 dark:text-white placeholder-gray-400 text-sm"
              />
              <button className="bg-primary hover:bg-primary-dark text-white rounded-full p-2.5 transition-colors shadow-lg shadow-primary/30">
                <span className="material-icons-round text-sm">arrow_forward</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4">

            {/* Token Display (If User) */}
            {user && (
              <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/30 dark:to-blue-900/30 rounded-full border border-indigo-100 dark:border-indigo-800/50">
                <span className="text-base">💎</span>
                <span className="text-sm font-bold text-indigo-900 dark:text-indigo-200">{userTokens}</span>
              </div>
            )}

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

            <button className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors relative">
              <span className="material-icons-round">notifications_none</span>
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <button
              onClick={() => user ? onNavigate('upload') : onLoginClick('upload')}
              className="flex items-center gap-2 pl-3 pr-1 py-1 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors group">
              <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{t.create}</span>
              <div className="w-7 h-7 bg-primary group-hover:bg-primary-dark rounded-full flex items-center justify-center text-white transition-colors">
                <span className="material-icons-round text-sm">upload</span>
              </div>
            </button>

            {user ? (
              <div className="relative">
                <div
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                  className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-400 to-purple-400 overflow-hidden border-2 border-white dark:border-gray-700 cursor-pointer hover:ring-2 hover:ring-primary transition-all relative group"
                  title={t.logout}
                >
                  <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuAQyyDiuuKUO7-48MXIFPjnexxedhZVHEg5bLuAfgHROaZsbytCEGez7ZIXFwYjO7H0n-l9dOkw4COHYrcofMglRTN3eCjKz9imRZERODcpiZMHvmA375rRKibsmRiaev4dbcIfJShQP2b6z5fq637Tc09U2y5H0qaavl6DdKbBt-tQj5H3OY3EjQDJEpKoEstwMBcTO32zdio882CcbV9WotiISEBt_WQls7w_h3eoXRbVzBGRCA7ziLjSCfksoUdmw3FLUHE6mDs" alt="User" className="w-full h-full object-cover" />
                </div>

                {showProfileDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden z-50">
                    <button
                      onClick={() => {
                        setShowProfileDropdown(false);
                        onNavigate('profile');
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 text-gray-700 dark:text-gray-200"
                    >
                      <span className="material-icons-round text-primary">person</span>
                      <span className="font-medium">{t.myProfile}</span>
                    </button>
                    <div className="border-t border-gray-100 dark:border-gray-700"></div>
                    <button
                      onClick={() => {
                        setShowProfileDropdown(false);
                        onLogout();
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 text-red-600 dark:text-red-400"
                    >
                      <span className="material-icons-round">logout</span>
                      <span className="font-medium">{t.logout}</span>
                    </button>
                  </div>
                )}
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
        {/* Sidebar */}
        <aside className="w-72 flex-shrink-0 hidden lg:flex flex-col gap-6 sticky top-24 h-[calc(100vh-8rem)] overflow-y-auto pr-2 scrollbar-hide">
          <div className="p-5 rounded-3xl bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm relative overflow-hidden group cursor-pointer hover:shadow-md transition-all">
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
                onClick={() => setShowWizard(true)}
                className="w-full py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl text-sm font-medium shadow-lg shadow-primary/20 transition-all duration-300 flex items-center justify-center gap-2"
              >
                <span>{t.analyzeNow}</span>
              </button>
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-icons-round text-primary text-xl">eco</span>
              <h3 className="font-bold text-base text-gray-900 dark:text-white">{t.communityImpact}</h3>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md uppercase tracking-wide">{t.carbonSaved}</span>
              <span className="text-sm font-bold text-primary">14,230kg</span>
            </div>
            <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mb-5">
              <div className="h-full bg-primary w-[70%] rounded-full"></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 text-center">
                <div className="text-xl font-bold text-gray-900 dark:text-white">8.5k</div>
                <div className="text-[10px] uppercase font-semibold text-gray-400 tracking-wide">{t.projects}</div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 text-center">
                <div className="text-xl font-bold text-gray-900 dark:text-white">420</div>
                <div className="text-[10px] uppercase font-semibold text-gray-400 tracking-wide">{t.tonsWaste}</div>
              </div>
            </div>
          </div>

          <nav className="space-y-1">
            <button onClick={() => onNavigate('discovery')} className="w-full flex items-center gap-3 px-4 py-3 bg-gray-100 dark:bg-gray-800 text-primary rounded-xl font-medium transition-colors">
              <span className="material-icons-round">explore</span>
              {t.discover}
            </button>
            <button onClick={() => onNavigate('trending')} className="w-full flex items-center gap-3 px-4 py-3 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white rounded-xl font-medium transition-colors">
              <span className="material-icons-round">trending_up</span>
              {t.trending}
            </button>
            <button onClick={() => onNavigate('community')} className="w-full flex items-center gap-3 px-4 py-3 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white rounded-xl font-medium transition-colors">
              <span className="material-icons-round">people</span>
              {t.community}
            </button>
          </nav>

          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <h3 className="font-bold text-base text-gray-900 dark:text-white">{t.topMakers}</h3>
              <a href="#" className="text-xs font-medium text-primary hover:text-primary-dark transition-colors">{t.viewAll}</a>
            </div>
            <div className="space-y-4">
              {MAKERS.map((maker, idx) => (
                <div key={idx} className="flex items-center gap-3 group cursor-pointer p-2 hover:bg-white dark:hover:bg-gray-800 rounded-xl transition-all">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden ring-2 ring-transparent group-hover:ring-primary/20 transition-all">
                      <img src={maker.avatar} alt={maker.name} className="w-full h-full object-cover" />
                    </div>
                    {maker.rank && (
                      <div className={`absolute -top-1 -right-1 w-4 h-4 text-white text-[10px] font-bold flex items-center justify-center rounded-full border border-white dark:border-gray-900
                        ${maker.rank === 1 ? 'bg-yellow-400' : maker.rank === 2 ? 'bg-gray-300' : 'bg-orange-700'}`}>
                        {maker.rank}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate group-hover:text-primary transition-colors">{maker.name}</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{maker.projects} Projects • {maker.likes} Likes</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          {/* Trending Slider */}
          <div className="mb-12 relative rounded-3xl overflow-hidden h-80 bg-gradient-to-br from-gray-900 to-gray-800 shadow-xl">
            <div className="relative h-full">
              {/* Slider Content */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-full max-w-5xl px-8">
                  <div className="grid md:grid-cols-2 gap-8 items-center">
                    {/* Left: Campaign Info */}
                    <div className="text-white space-y-4">
                      <div className="inline-flex items-center gap-2 bg-primary/20 backdrop-blur-sm px-4 py-2 rounded-full border border-primary/30">
                        <span className="material-icons-round text-sm text-primary">campaign</span>
                        <span className="text-sm font-bold text-primary">이달의 캠페인</span>
                      </div>
                      <h2 className="text-4xl md:text-5xl font-bold leading-tight">
                        제주 바다를 지키는
                        <br />
                        <span className="text-primary">업사이클링 챌린지</span>
                      </h2>
                      <p className="text-gray-300 text-lg">
                        해양 폐기물을 활용한 창작물을 만들고 공유해보세요. 우수작에게는 특별한 혜택이 제공됩니다.
                      </p>
                      <div className="flex items-center gap-4 pt-2">
                        <button className="px-6 py-3 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold transition-all shadow-lg shadow-primary/30 hover:scale-105">
                          참여하기
                        </button>
                        <button className="px-6 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white rounded-xl font-bold transition-all border border-white/20">
                          자세히 보기
                        </button>
                      </div>
                    </div>

                    {/* Right: Featured Projects */}
                    <div className="hidden md:grid grid-cols-2 gap-4">
                      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 hover:bg-white/20 transition-all cursor-pointer group">
                        <div className="aspect-square bg-gradient-to-br from-blue-400 to-purple-500 rounded-xl mb-3 overflow-hidden">
                          <img src="https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?auto=format&fit=crop&w=400&q=80" alt="Project" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        </div>
                        <h4 className="text-white font-bold text-sm mb-1">해양 폐플라스틱 조명</h4>
                        <p className="text-gray-400 text-xs">by EcoMaker</p>
                      </div>
                      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 hover:bg-white/20 transition-all cursor-pointer group mt-8">
                        <div className="aspect-square bg-gradient-to-br from-green-400 to-teal-500 rounded-xl mb-3 overflow-hidden">
                          <img src="https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=400&q=80" alt="Project" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        </div>
                        <h4 className="text-white font-bold text-sm mb-1">폐어망 바구니</h4>
                        <p className="text-gray-400 text-xs">by SeaCraft</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation Dots */}
              <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-2">
                <button className="w-2 h-2 rounded-full bg-primary"></button>
                <button className="w-2 h-2 rounded-full bg-white/30 hover:bg-white/50 transition-colors"></button>
                <button className="w-2 h-2 rounded-full bg-white/30 hover:bg-white/50 transition-colors"></button>
              </div>
            </div>
          </div>

          {/* Filters - Dynamic Material Categories */}
          <div className="flex items-center justify-between mb-8 overflow-x-auto pb-2 scrollbar-hide">
            <div className="flex gap-3">
              {/* All Projects Button */}
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-6 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all flex items-center gap-2 ${selectedCategory === 'all'
                  ? 'bg-gray-900 dark:bg-white dark:text-gray-900 text-white shadow-md'
                  : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
              >
                <span className="material-icons-round text-sm">apps</span>
                {t.allProjects}
              </button>

              {/* Dynamic Material Categories */}
              {materialCategories.map((material) => (
                <button
                  key={material}
                  onClick={() => setSelectedCategory(material)}
                  className={`px-6 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all flex items-center gap-2 ${selectedCategory === material
                    ? 'bg-gray-900 dark:bg-white dark:text-gray-900 text-white shadow-md'
                    : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                >
                  <span className="material-icons-round text-sm">{getMaterialIcon(material)}</span>
                  {material}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 ml-4 bg-white dark:bg-gray-800 px-3 py-1.5 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm">
              <span>{t.sortBy}</span>
              <select className="bg-transparent border-none font-medium text-gray-800 dark:text-gray-200 focus:ring-0 cursor-pointer p-0 pr-6 text-sm">
                <option>{t.popular}</option>
                <option>{t.newest}</option>
                <option>{t.topRated}</option>
              </select>
            </div>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 pb-12">
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                className="group flex flex-col gap-3 cursor-pointer"
                onClick={() => onProjectSelect(project)}
              >
                <div className="relative aspect-[4/3] rounded-3xl overflow-hidden bg-gray-100 dark:bg-gray-800 shadow-sm group-hover:shadow-xl transition-all duration-300">
                  <img src={project.image} alt={project.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />

                  {(project.isAiRemix || project.isAiIdea) && (
                    <div className="absolute top-3 right-3 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-bold text-primary flex items-center gap-1 shadow-sm border border-white/50 dark:border-gray-700">
                      <span className="material-icons-round text-sm">auto_awesome</span>
                      {project.isAiRemix ? (language === 'ko' ? 'AI 리믹스' : 'AI Remix') : (language === 'ko' ? 'AI 아이디어' : 'AI Idea')}
                    </div>
                  )}

                  <button
                    className={`absolute bottom-3 right-3 w-10 h-10 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-md transition-all duration-300 ${likedProjects.has(project.id)
                        ? 'text-red-500 translate-y-0 opacity-100'
                        : 'text-gray-400 hover:text-red-500 translate-y-12 opacity-0 group-hover:translate-y-0 group-hover:opacity-100'
                      }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onLikeToggle(project.id);
                    }}
                  >
                    <span className="material-icons-round">{likedProjects.has(project.id) ? 'favorite' : 'favorite_border'}</span>
                  </button>

                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300"></div>
                </div>

                <div className="px-1">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 leading-snug group-hover:text-primary transition-colors">{project.title}</h3>
                    <span className={`text-xs px-2.5 py-1 rounded-md font-medium border
                      ${project.difficulty === 'Easy' ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-100 dark:border-green-800' :
                        project.difficulty === 'Medium' ? 'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-100 dark:border-yellow-800' :
                          'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-100 dark:border-red-800'}`}>
                      {t.difficulty[project.difficulty]}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">By <span className="text-gray-900 dark:text-gray-200 font-medium hover:underline">{project.maker}</span></p>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400 font-medium">
                    <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                      <span className="material-icons-round text-sm text-gray-400">category</span> {project.category}
                    </div>
                    <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                      <span className="material-icons-round text-sm text-gray-400">schedule</span> {project.time}
                    </div>
                    {(project.views || 0) > 0 && (
                      <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                        <span className="material-icons-round text-sm text-gray-400">visibility</span> {(project.views || 0).toLocaleString()}
                      </div>
                    )}
                    {(project.likes || 0) > 0 && (
                      <div className={`flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded ${likedProjects.has(project.id) ? 'text-red-500' : ''}`}>
                        <span className={`material-icons-round text-sm ${likedProjects.has(project.id) ? 'text-red-500' : 'text-gray-400'}`}>favorite</span> {(project.likes || 0).toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-center pb-12">
            <button className="px-8 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition-colors shadow-sm hover:shadow">
              {t.loadMore}
            </button>
          </div>
        </main>
      </div>

      {/* Wizard Modal */}
      <WizardModal
        isOpen={showWizard}
        onClose={() => setShowWizard(false)}
        language={language}
        userTokens={userTokens}
        setUserTokens={setUserTokens}
        onAddProject={onAddProject}
        user={user}
      />
    </div>
  );
};

export default Discovery;