import React from 'react';
import { Project, Maker } from '../types';
import { Language } from '../App';

interface DiscoveryProps {
  onNavigate: (view: 'detail' | 'upload') => void;
  onProjectSelect: (project: Project) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  language: Language;
  toggleLanguage: () => void;
  projects: Project[];
}

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

const Discovery: React.FC<DiscoveryProps> = ({ onNavigate, onProjectSelect, isDarkMode, toggleDarkMode, language, toggleLanguage, projects }) => {
  const t = TRANSLATIONS[language];

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

          {/* Search bar removed from header as requested */}
          <div className="hidden md:flex flex-1 mx-8"></div>

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

            <button className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors relative">
              <span className="material-icons-round">notifications_none</span>
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <button 
              onClick={() => onNavigate('upload')}
              className="flex items-center gap-2 pl-3 pr-1 py-1 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors group">
              <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{t.create}</span>
              <div className="w-7 h-7 bg-primary group-hover:bg-primary-dark rounded-full flex items-center justify-center text-white transition-colors">
                <span className="material-icons-round text-sm">upload</span>
              </div>
            </button>
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-400 to-purple-400 overflow-hidden border-2 border-white dark:border-gray-700 cursor-pointer hover:ring-2 hover:ring-primary transition-all">
              <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuAQyyDiuuKUO7-48MXIFPjnexxedhZVHEg5bLuAfgHROaZsbytCEGez7ZIXFwYjO7H0n-l9dOkw4COHYrcofMglRTN3eCjKz9imRZERODcpiZMHvmA375rRKibsmRiaev4dbcIfJShQP2b6z5fq637Tc09U2y5H0qaavl6DdKbBt-tQj5H3OY3EjQDJEpKoEstwMBcTO32zdio882CcbV9WotiISEBt_WQls7w_h3eoXRbVzBGRCA7ziLjSCfksoUdmw3FLUHE6mDs" alt="User" className="w-full h-full object-cover" />
            </div>
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
              <button className="w-full py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl text-sm font-medium shadow-lg shadow-primary/20 transition-all duration-300 flex items-center justify-center gap-2">
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
            <a href="#" className="flex items-center gap-3 px-4 py-3 bg-gray-100 dark:bg-gray-800 text-primary rounded-xl font-medium transition-colors">
              <span className="material-icons-round">explore</span>
              {t.discover}
            </a>
            <a href="#" className="flex items-center gap-3 px-4 py-3 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white rounded-xl font-medium transition-colors">
              <span className="material-icons-round">trending_up</span>
              {t.trending}
            </a>
            <a href="#" className="flex items-center gap-3 px-4 py-3 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white rounded-xl font-medium transition-colors">
              <span className="material-icons-round">people</span>
              {t.community}
            </a>
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
          {/* Hero Banner */}
          <div className="mb-12 relative rounded-3xl overflow-hidden h-72 flex items-center justify-center bg-gray-900 shadow-xl group">
            <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuCApCDGbAHCEjCS_6QtOjIrDK6gXNFE80PgPbC-OFpipS8vgyPyBfuM4cyy0i_hiZ7lgxovLATSoj4HF6K7VNBSilJJQ2s9VhPvSHVNxmEsTfVTbZ4EFlK6zSO50JYPgsvPQyzXnrx8l92hZJY6K5nPxm8IPE2W90OKUDUY6RJ-w9Hxt3q_WAVO3MamPsVJAYEKEw35uS60fNtodlYREf_xj1coAplnJ-SCmKQzfY6kADsiab0wtcok3Ctu1SSXs1fJ9R9_XDirbdI" alt="Workshop" className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:scale-105 transition-transform duration-700" />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 to-transparent"></div>
            <div className="relative z-10 text-center w-full max-w-2xl px-4">
              <h1 className="text-3xl md:text-5xl font-bold text-white mb-3">{t.heroTitle}</h1>
              <p className="text-gray-300 mb-8 font-light text-lg">{t.heroSubtitle}</p>
              
              {/* Integrated Search Input */}
              <div className="bg-white dark:bg-gray-800 p-2 rounded-full shadow-2xl flex items-center transition-all duration-300 focus-within:scale-105 ring-4 ring-transparent focus-within:ring-primary/20">
                <div className="pl-4 pr-2 text-gray-400">
                  <span className="material-icons-round">search</span>
                </div>
                <input 
                  type="text" 
                  placeholder={t.heroPlaceholder}
                  className="flex-1 bg-transparent border-none focus:ring-0 text-gray-800 dark:text-white placeholder-gray-400 text-base" 
                />
                <button className="bg-primary hover:bg-primary-dark text-white rounded-full p-3 transition-colors shadow-lg shadow-primary/30">
                  <span className="material-icons-round block">arrow_forward</span>
                </button>
              </div>

            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center justify-between mb-8 overflow-x-auto pb-2 scrollbar-hide">
            <div className="flex gap-3">
              <button className="px-6 py-2.5 bg-gray-900 dark:bg-white dark:text-gray-900 text-white rounded-full text-sm font-medium whitespace-nowrap shadow-md">{t.allProjects}</button>
              <button className="px-6 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-full text-sm font-medium whitespace-nowrap transition-colors">{t.beginner}</button>
              <button className="px-6 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-full text-sm font-medium whitespace-nowrap transition-colors">{t.woodworking}</button>
              <button className="px-6 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-full text-sm font-medium whitespace-nowrap transition-colors">{t.printing3d}</button>
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
            {projects.map((project) => (
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

                  <button className="absolute bottom-3 right-3 w-10 h-10 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 shadow-md translate-y-12 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                    <span className="material-icons-round">favorite</span>
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
                  <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 font-medium">
                    <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                      <span className="material-icons-round text-sm text-gray-400">category</span> {project.category}
                    </div>
                    <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                      <span className="material-icons-round text-sm text-gray-400">schedule</span> {project.time}
                    </div>
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
    </div>
  );
};

export default Discovery;