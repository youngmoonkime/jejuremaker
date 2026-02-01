import React, { useState, useMemo } from 'react';
import { Project } from '../types';
import { Language } from '../App';
import { User } from '@supabase/supabase-js';
import { TRANSLATIONS } from '../constants/translations';

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

const Discovery: React.FC<DiscoveryProps> = ({
  onNavigate,
  onProjectSelect,
  language,
  projects,
  onLikeToggle,
  likedProjects
}) => {
  const t = TRANSLATIONS[language];
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

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

  const getMaterialIcon = (material: string) => {
    return MATERIAL_ICONS[material] || MATERIAL_ICONS['default'];
  };

  return (
    <>
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

              {project.isAiRemix || project.isAiIdea ? (
                <div className="absolute top-3 right-3 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-bold text-primary flex items-center gap-1 shadow-sm border border-white/50 dark:border-gray-700">
                  <span className="material-icons-round text-sm">auto_awesome</span>
                  {project.isAiRemix ? (language === 'ko' ? 'AI 리믹스' : 'AI Remix') : (language === 'ko' ? 'AI 아이디어' : 'AI Idea')}
                </div>
              ) : (
                <div className="absolute top-3 right-3 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-bold text-gray-700 dark:text-gray-200 flex items-center gap-1 shadow-sm border border-white/50 dark:border-gray-700">
                  <span className="material-icons-round text-sm">front_hand</span>
                  {t.handmade}
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
    </>
  );
};

export default Discovery;