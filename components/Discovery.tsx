import React, { useState, useMemo } from 'react';
import { Project } from '../types';
import { Language } from '../App';
import { User } from '@supabase/supabase-js';
import { TRANSLATIONS } from '../constants/translations';
import HeroSection from './HeroSection';

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
      {/* Trending Slider */}
      <HeroSection
        t={t}
        handleAnalyzeClick={() => document.getElementById('image-upload-input')?.click()}
        handlePaste={(e) => {
          // Implement paste logic or stub
          console.log('Paste handled in HeroSection');
        }}
        isDragging={false} // Connect drag state if available or use local state
        handleDragOver={(e) => e.preventDefault()}
        handleDragLeave={(e) => e.preventDefault()}
        handleDrop={(e) => e.preventDefault()}
      />

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