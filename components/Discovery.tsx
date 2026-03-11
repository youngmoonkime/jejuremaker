import React, { useState, useMemo, useRef } from 'react';
import { Project } from '../types';
import { Language } from '../contexts/ThemeContext';
import { User } from '@supabase/supabase-js';
import { TRANSLATIONS } from '../constants/translations';
import HeroSection from './HeroSection';
import { getOptimizedImageUrl } from '../utils/imageOptimizer';

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
  onAnalyzeClick: () => void;
  // ✅ 서버 페이지네이션 props
  onLoadMore: () => void;
  hasMore: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;
  allMaterials?: string[];
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
  '골판지': 'inventory_2',
  'Cardboard': 'inventory_2',
  '가구': 'weekend',
  'Furniture': 'weekend',
  '조명': 'lightbulb',
  'Lighting': 'lightbulb',
  'lighting': 'lightbulb',
  '조명 (Lighting)': 'lightbulb',
  '인테리어': 'home',
  'Interior': 'home',
  'interior': 'home',
  '홈 데코 (Home Decor)': 'home',
  'home_decor': 'home',
  '가구 (Furniture)': 'weekend',
  'furniture': 'weekend',
  '주방 (Kitchen)': 'kitchen',
  'kitchen': 'kitchen',
  '패션 (Fashion)': 'checkroom',
  'fashion': 'checkroom',
  '예술 (Art)': 'palette',
  'art': 'palette',
  '문구 (Stationery)': 'edit_note',
  'stationery': 'edit_note',
  '기타 (Others)': 'more_horiz',
  'others': 'more_horiz',
  'default': 'category'
};

// Bilingual mapping for unification
const MATERIAL_MAP: Record<string, { ko: string; en: string }> = {
  '골판지': { ko: '골판지', en: 'Cardboard' },
  'Cardboard': { ko: '골판지', en: 'Cardboard' },
  '플라스틱': { ko: '플라스틱', en: 'Plastic' },
  'Plastic': { ko: '플라스틱', en: 'Plastic' },
  '종이': { ko: '종이', en: 'Paper' },
  'Paper': { ko: '종이', en: 'Paper' },
  '나무': { ko: '나무', en: 'Wood' },
  'Wood': { ko: '나무', en: 'Wood' },
  '유리': { ko: '유리', en: 'Glass' },
  'Glass': { ko: '유리', en: 'Glass' },
  '금속': { ko: '금속', en: 'Metal' },
  'Metal': { ko: '금속', en: 'Metal' },
  '천': { ko: '천', en: 'Textile' },
  'Textile': { ko: '천', en: 'Textile' },
  '가구': { ko: '가구', en: 'Furniture' },
  'Furniture': { ko: '가구', en: 'Furniture' },
  '조명': { ko: '조명', en: 'Lighting' },
  'Lighting': { ko: '조명', en: 'Lighting' },
  'lighting': { ko: '조명', en: 'Lighting' },
  '조명 (Lighting)': { ko: '조명', en: 'Lighting' },
  '인테리어': { ko: '인테리어', en: 'Interior' },
  'Interior': { ko: '인테리어', en: 'Interior' },
  'interior': { ko: '인테리어', en: 'Interior' },
  '홈 데코 (Home Decor)': { ko: '홈 데코', en: 'Home Decor' },
  '가구 (Furniture)': { ko: '가구', en: 'Furniture' },
  'furniture': { ko: '가구', en: 'Furniture' },
  '주방 (Kitchen)': { ko: '주방', en: 'Kitchen' },
  'kitchen': { ko: '주방', en: 'Kitchen' },
  '패션 (Fashion)': { ko: '패션', en: 'Fashion' },
  'fashion': { ko: '패션', en: 'Fashion' },
  '예술 (Art)': { ko: '예술', en: 'Art' },
  'art': { ko: '예술', en: 'Art' },
  'home_decor': { ko: '인테리어', en: 'Home Decor' },
  '문구 (Stationery)': { ko: '문구', en: 'Stationery' },
  'stationery': { ko: '문구', en: 'Stationery' },
  '기타 (Others)': { ko: '기타', en: 'Others' },
  'others': { ko: '기타', en: 'Others' }
};

const Discovery: React.FC<DiscoveryProps> = ({
  onNavigate,
  onProjectSelect,
  language,
  projects,
  user,
  onLoginClick,
  onLikeToggle,
  likedProjects,
  onAnalyzeClick,
  // ✅ 서버 페이지네이션 props
  onLoadMore,
  hasMore,
  isLoading,
  isLoadingMore,
  allMaterials = []
}) => {
  const t = TRANSLATIONS[language];
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortOption, setSortOption] = useState<'popular' | 'newest'>('newest');

  const materialCategories = useMemo(() => {
    const PRODUCT_TYPES = ['furniture', 'lighting', 'home_decor', 'stationery', 'fashion', 'kitchen', 'art', 'others'];
    
    // We only want to show product categories in the top filter bar.
    // Map the internal keys to the localized strings.
    const categoriesSet = new Set<string>();
    
    PRODUCT_TYPES.forEach(type => {
      const mapping = MATERIAL_MAP[type];
      if (mapping) {
        categoriesSet.add(mapping[language]);
      }
    });

    // Also include any unique categories that might not be in the hardcoded list but are valid categories in DB
    // This handles legacy categories or dynamic ones nicely, as long as they aren't junk/materials
    const rawCategories = projects.map(p => p.category).filter(Boolean);
    const JUNK_CATEGORIES = new Set(['부드러운 구형 모듈', '재활용 예술 재료', 'Unknown Material', 'Social', 'test', 'Test']);
    
    rawCategories.forEach(cat => {
        if (JUNK_CATEGORIES.has(cat)) return;
        const mapping = MATERIAL_MAP[cat];
        if (mapping) {
            categoriesSet.add(mapping[language]);
        } else {
            // Only add fallback if it's not clearly a material
             const isMaterialString = ['플라스틱', 'Plastic', '나무', 'Wood', '종이', 'Paper', '유리', 'Glass', '금속', 'Metal', '천', 'Textile', '골판지', 'Cardboard', '병뚜껑', 'Bottle Cap'].some(m => cat.includes(m));
             if (!isMaterialString) {
                  categoriesSet.add(cat);
             }
        }
    });

    return Array.from(categoriesSet);
  }, [projects, language]);

  // Filter & Sort projects (클라이언트 사이드 필터링 유지)
  const filteredProjects = useMemo(() => {
    let result = projects;

    // 1. Filter by Category
    if (selectedCategory !== 'all') {
      result = result.filter(project => {
        const projCategory = project.category;
        const projMaterial = (project as any).material;

        // Check if selectedCategory matches either the category or the material
        const matchCategory = projCategory === selectedCategory || 
                              MATERIAL_MAP[projCategory]?.ko === selectedCategory || 
                              MATERIAL_MAP[projCategory]?.en === selectedCategory;

        const matchMaterial = projMaterial === selectedCategory || 
                              MATERIAL_MAP[projMaterial]?.ko === selectedCategory || 
                              MATERIAL_MAP[projMaterial]?.en === selectedCategory;

        return matchCategory || matchMaterial;
      });
    }

    // 2. Sort
    return [...result].sort((a, b) => {
      if (sortOption === 'popular') {
        const likesA = Number(a.likes || 0);
        const likesB = Number(b.likes || 0);
        const viewsA = Number(a.views || 0);
        const viewsB = Number(b.views || 0);
        const scoreA = likesA + viewsA * 0.1;
        const scoreB = likesB + viewsB * 0.1;
        return scoreB - scoreA;
      } else {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateB - dateA;
      }
    });
  }, [projects, selectedCategory, sortOption]);

  const getMaterialIcon = (material: string) => {
    return MATERIAL_ICONS[material] || MATERIAL_ICONS['default'];
  };

  // Helper to remove "(including 3D printing time)" etc.
  const cleanTime = (time: string) => {
    if (!time) return '';
    return time.replace(/\s?\(.*(printing|프린팅).*\)/i, '').trim();
  };

  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  return (
    <>
      {/* Trending Slider */}
      <HeroSection
        t={t}
        handleAnalyzeClick={onAnalyzeClick}
        handlePaste={(e) => {
          console.log('Paste handled in HeroSection');
        }}
        isDragging={false}
        handleDragOver={(e) => e.preventDefault()}
        handleDragLeave={(e) => e.preventDefault()}
        handleDrop={(e) => e.preventDefault()}
      />

      {/* Filters - Dynamic Material Categories */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4 px-4 sm:px-0">
        <div 
          ref={scrollRef}
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeave}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
          className={`flex gap-2 overflow-x-auto pb-2 w-full sm:w-auto scrollbar-hide select-none transition-all ${isDragging ? 'cursor-grabbing scale-[0.99]' : 'cursor-grab'}`}
          style={{ scrollBehavior: isDragging ? 'auto' : 'smooth' }}
        >
          {/* All Projects Button */}
          <button
            onClick={() => !isDragging && setSelectedCategory('all')}
            className={`px-6 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all flex items-center gap-2 pointer-events-auto ${selectedCategory === 'all'
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
              onClick={() => !isDragging && setSelectedCategory(material)}
              className={`px-6 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all flex items-center gap-2 pointer-events-auto ${selectedCategory === material
                ? 'bg-gray-900 dark:bg-white dark:text-gray-900 text-white shadow-md'
                : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
            >
              <span className="material-icons-round text-sm">{getMaterialIcon(material)}</span>
              {material}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 ml-auto sm:ml-4 bg-white dark:bg-gray-800 px-3 py-1.5 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm whitespace-nowrap">
          <span>{t.sortBy}</span>
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value as 'popular' | 'newest')}
            className="bg-transparent border-none font-medium text-gray-800 dark:text-gray-200 focus:ring-0 cursor-pointer p-0 pr-6 text-sm"
          >
            <option value="popular">{t.popular}</option>
            <option value="newest">{t.newest}</option>
          </select>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 pb-6 px-4 sm:px-0">
        {isLoading && projects.length === 0 ? (
          // Skeleton Cards
          Array.from({ length: 6 }).map((_, i) => (
            <div key={`skeleton-${i}`} className="flex flex-col gap-3 animate-pulse">
              <div className="aspect-[4/3] rounded-3xl bg-gray-200 dark:bg-gray-800"></div>
              <div className="h-6 w-3/4 bg-gray-200 dark:bg-gray-800 rounded-lg"></div>
              <div className="h-4 w-1/2 bg-gray-100 dark:bg-gray-800/50 rounded-lg"></div>
              <div className="flex gap-2">
                 <div className="h-6 w-16 bg-gray-100 dark:bg-gray-800/50 rounded"></div>
                 <div className="h-6 w-16 bg-gray-100 dark:bg-gray-800/50 rounded"></div>
              </div>
            </div>
          ))
        ) : (
          filteredProjects.map((project) => (
            <div
              key={project.id}
              className="group flex flex-col gap-3 cursor-pointer"
              onClick={() => onProjectSelect(project)}
            >
              <div className="relative aspect-[4/3] rounded-3xl overflow-hidden bg-gray-100 dark:bg-gray-800 shadow-sm group-hover:shadow-xl transition-all duration-300">
                <img
                  src={getOptimizedImageUrl(project.image, 600)}
                  alt={project.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  loading="lazy"
                  decoding="async"
                />

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
                    <span className="material-icons-round text-sm text-gray-400">schedule</span> {cleanTime(project.time)}
                  </div>
                  {(project.views || 0) > 0 && (
                    <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                      <span className="material-icons-round text-sm text-gray-400">visibility</span> {(project.views || 0).toLocaleString()}
                    </div>
                  )}
                  <button 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      if (!user) {
                        onLoginClick('discovery');
                      } else {
                        onLikeToggle(project.id); 
                      }
                    }}
                    className={`flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${likedProjects.has(project.id) ? 'text-red-500' : 'text-gray-500'}`}
                  >
                    <span className={`material-icons-round text-sm ${likedProjects.has(project.id) ? 'text-red-500' : 'text-gray-400'}`}>
                      {likedProjects.has(project.id) ? 'favorite' : 'favorite_border'}
                    </span> 
                    {(project.likes || 0).toLocaleString()}
                  </button>
                  {project.material && (
                    <div className="flex items-center gap-1.5 bg-[#10b77f]/10 dark:bg-[#10b77f]/20 text-[#10b77f] px-2 py-1 rounded font-bold">
                      <span className="material-icons-round text-sm text-[#10b77f]">inventory_2</span>
                      {MATERIAL_MAP[project.material]?.[language] || project.material}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ✅ "더 보기" 버튼 (기존 UX 유지) */}
      <div className="flex justify-center py-8 pb-12">
        {isLoadingMore ? (
          <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm font-medium">
              {language === 'ko' ? '불러오는 중...' : 'Loading...'}
            </span>
          </div>
        ) : hasMore ? (
          <button
            onClick={onLoadMore}
            className="px-8 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition-colors shadow-sm hover:shadow"
          >
            {t.loadMore}
          </button>
        ) : projects.length > 0 ? (
          <div className="text-center text-gray-400 dark:text-gray-500 text-sm">
            <span className="material-icons-round text-2xl mb-2 block">check_circle</span>
            {language === 'ko' ? '모든 프로젝트를 불러왔습니다' : 'All projects loaded'}
          </div>
        ) : (
          <div className="text-center text-gray-400 dark:text-gray-500 py-12">
            <span className="material-icons-round text-4xl mb-3 block">inventory_2</span>
            <p className="text-lg font-medium">
              {language === 'ko' ? '프로젝트가 없습니다' : 'No projects yet'}
            </p>
          </div>
        )}
      </div>
    </>
  );
};

export default Discovery;