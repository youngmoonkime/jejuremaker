import React, { useState, useMemo } from 'react';
import { Language } from '../App';
import { User } from '@supabase/supabase-js';
import { Project } from '../types';

interface TrendingProps {
    onNavigate: (view: 'discovery' | 'detail' | 'workspace' | 'upload' | 'trending' | 'community') => void;
    onProjectSelect: (project: Project) => void;
    isDarkMode: boolean;
    toggleDarkMode: () => void;
    language: Language;
    toggleLanguage: () => void;
    user: User | null;
    onLoginClick: (target?: any) => void;
    onLogout: () => void;
    projects: Project[];
    onLikeToggle: (projectId: string) => void;
    likedProjects: Set<string>;
}

// Material icon mapping for categories
const CATEGORY_ICONS: Record<string, string> = {
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
    '직물': 'checkroom',
    '목재': 'forest',
    '3D 프린팅': 'view_in_ar',
    '3D Print': 'view_in_ar',
    'default': 'category'
};

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
        noProjects: '아직 프로젝트가 없습니다.',
        views: '조회',
        likes: '좋아요',
        hot: '인기',
        rising: '상승중',
        viewProject: '보기',
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
        noProjects: 'No projects yet.',
        views: 'views',
        likes: 'likes',
        hot: 'Hot',
        rising: 'Rising',
        viewProject: 'View',
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

type TimePeriod = 'week' | 'month' | 'all';

import { getOptimizedImageUrl } from '../utils/imageOptimizer';

const Trending: React.FC<TrendingProps> = ({ onNavigate, onProjectSelect, language, projects, onLikeToggle, likedProjects }) => {
    const t = TRANSLATIONS[language];
    const [timePeriod, setTimePeriod] = useState<TimePeriod>('week');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');


    const categories = useMemo(() => {
        const categoriesSet = new Set<string>();
        projects.forEach(project => {
            if (project.category) {
                categoriesSet.add(project.category);
            }
        });
        return Array.from(categoriesSet).sort();
    }, [projects]);

    // Sort projects by popularity (likes + views) and filter by category
    const trendingProjects = useMemo(() => {
        let filtered = [...projects];

        // Filter by category
        if (selectedCategory !== 'all') {
            filtered = filtered.filter(p => p.category === selectedCategory);
        }

        // Filter by time period (if createdAt exists)
        const now = new Date();
        if (timePeriod === 'week') {
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            filtered = filtered.filter(p => {
                if (!p.createdAt) return true;
                return new Date(p.createdAt) >= weekAgo;
            });
        } else if (timePeriod === 'month') {
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            filtered = filtered.filter(p => {
                if (!p.createdAt) return true;
                return new Date(p.createdAt) >= monthAgo;
            });
        }

        // Sort by popularity score (likes * 2 + views)
        return filtered.sort((a, b) => {
            const scoreA = ((a.likes || 0) * 2) + (a.views || 0);
            const scoreB = ((b.likes || 0) * 2) + (b.views || 0);
            return scoreB - scoreA;
        });
    }, [projects, selectedCategory, timePeriod]);

    // Get top project for hero section
    const topProject = trendingProjects[0];

    // Get icon for a category
    const getCategoryIcon = (category: string) => {
        return CATEGORY_ICONS[category] || CATEGORY_ICONS['default'];
    };

    // Format number with K suffix
    const formatNumber = (num: number | undefined) => {
        if (!num) return '0';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
        return num.toString();
    };

    return (
        <div className="mb-10">
            <div className="flex items-center justify-between mb-4 px-1">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <span className="material-icons-round text-orange-500">local_fire_department</span> {t.trendingNow}
                </h2>
            </div>

            {/* Hero Section - Top Project */}
            {topProject ? (
                <div
                    className="relative w-full h-[450px] rounded-[2rem] overflow-hidden group shadow-xl cursor-pointer"
                    onClick={() => onProjectSelect(topProject)}
                >
                    <img alt={topProject.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" src={topProject.image} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent"></div>
                    <div className="absolute top-6 left-6">
                        <div className="bg-primary text-white px-4 py-1.5 rounded-full font-bold text-sm flex items-center gap-1.5 shadow-lg backdrop-blur-md bg-opacity-95">
                            <span className="material-icons-round text-base">trending_up</span> {t.hero.tag}
                        </div>
                    </div>
                    <div className="absolute top-6 right-6 z-20">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onLikeToggle(topProject.id);
                            }}
                            className={`p-3 rounded-full backdrop-blur-md transition-all duration-300 ${likedProjects.has(topProject.id)
                                ? 'bg-red-500/90 text-white shadow-lg shadow-red-500/30'
                                : 'bg-white/10 text-white hover:bg-white/20'
                                }`}
                        >
                            <span className={`material-icons-round text-xl transform transition-transform ${likedProjects.has(topProject.id) ? 'scale-110' : 'scale-100'}`}>
                                {likedProjects.has(topProject.id) ? 'favorite' : 'favorite_border'}
                            </span>
                        </button>
                    </div>
                    <div className="absolute bottom-0 left-0 p-8 md:p-10 w-full md:max-w-3xl">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="bg-white/20 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-semibold border border-white/10 uppercase tracking-wide flex items-center gap-1">
                                <span className="material-icons-round text-sm">{getCategoryIcon(topProject.category)}</span>
                                {topProject.category}
                            </span>
                            {(topProject.likes || 0) > 100 && (
                                <span className="bg-red-500/80 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-semibold border border-white/10 flex items-center gap-1">
                                    <span className="material-icons-round text-[10px]">whatshot</span> {t.hot}
                                </span>
                            )}
                        </div>
                        <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 leading-tight">{topProject.title}</h1>
                        <p className="text-gray-200 mb-8 text-lg font-light leading-relaxed max-w-2xl">
                            {topProject.description || `${topProject.maker}님이 제작한 업사이클링 프로젝트입니다.`}
                        </p>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                            <button className="bg-white text-gray-900 hover:bg-gray-100 px-8 py-3 rounded-2xl font-bold text-sm transition-colors flex items-center gap-2 shadow-lg">
                                {t.hero.viewDetails}
                            </button>
                            <div className="flex items-center gap-6 text-white/90 text-sm font-medium">
                                <span className="flex items-center gap-1.5">
                                    <span className="material-icons-round text-primary text-lg">visibility</span>
                                    {formatNumber(topProject.views)} {t.views}
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <span className="material-icons-round text-red-400 text-lg">favorite</span>
                                    {formatNumber(topProject.likes)} {t.likes}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="relative w-full h-[300px] rounded-[2rem] overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <div className="text-center text-gray-500 dark:text-gray-400">
                        <span className="material-icons-round text-6xl mb-4">local_fire_department</span>
                        <p className="text-lg font-medium">{t.noProjects}</p>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4 border-b border-gray-100 dark:border-gray-800 pb-6 mt-8">
                {/* Time Period Filter */}
                <div className="flex gap-4 items-center">
                    <div className="flex bg-gray-100 dark:bg-surface-darker p-1 rounded-xl">
                        <button
                            onClick={() => setTimePeriod('week')}
                            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${timePeriod === 'week'
                                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                                : 'text-muted-light dark:text-muted-dark hover:text-gray-900 dark:hover:text-white'
                                }`}
                        >
                            {t.thisWeek}
                        </button>
                        <button
                            onClick={() => setTimePeriod('month')}
                            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${timePeriod === 'month'
                                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                                : 'text-muted-light dark:text-muted-dark hover:text-gray-900 dark:hover:text-white'
                                }`}
                        >
                            {t.thisMonth}
                        </button>
                        <button
                            onClick={() => setTimePeriod('all')}
                            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${timePeriod === 'all'
                                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                                : 'text-muted-light dark:text-muted-dark hover:text-gray-900 dark:hover:text-white'
                                }`}
                        >
                            {t.allTime}
                        </button>
                    </div>
                </div>

                {/* Category Filter */}
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 w-full md:w-auto">
                    <button
                        onClick={() => setSelectedCategory('all')}
                        className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${selectedCategory === 'all'
                            ? 'border border-primary/30 bg-primary/5 text-primary'
                            : 'border border-gray-200 dark:border-gray-700 hover:border-primary/50 text-text-light dark:text-text-dark bg-white dark:bg-surface-darker'
                            }`}
                    >
                        <span className="material-icons-round text-sm">apps</span>
                        {t.allTrending}
                    </button>
                    {categories.map((category) => (
                        <button
                            key={category}
                            onClick={() => setSelectedCategory(category)}
                            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${selectedCategory === category
                                ? 'border border-primary/30 bg-primary/5 text-primary'
                                : 'border border-gray-200 dark:border-gray-700 hover:border-primary/50 text-text-light dark:text-text-dark bg-white dark:bg-surface-darker'
                                }`}
                        >
                            <span className="material-icons-round text-sm">{getCategoryIcon(category)}</span>
                            {category}
                        </button>
                    ))}
                </div>
            </div>
            {/* Dynamic Project List */}
            <div className="flex flex-col bg-white dark:bg-surface-darker rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden divide-y divide-gray-100 dark:divide-gray-800">
                {trendingProjects.slice(1).map((project, index) => {
                    const rank = index + 2;
                    const score = ((project.likes || 0) * 2) + (project.views || 0);
                    const maxScore = trendingProjects[0] ? ((trendingProjects[0].likes || 0) * 2) + (trendingProjects[0].views || 0) : 100;
                    const scorePercent = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
                    const isHot = scorePercent >= 70;

                    return (
                        <div
                            key={project.id}
                            className="group relative flex items-center p-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-all duration-200 cursor-pointer"
                            onClick={() => onProjectSelect(project)}
                        >
                            <div className="w-10 sm:w-16 text-center text-lg sm:text-xl font-bold text-gray-400 dark:text-gray-600 group-hover:text-primary transition-colors font-display">
                                #{rank}
                            </div>
                            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden flex-shrink-0 shadow-sm relative ml-2 sm:ml-4">
                                <img
                                    alt={project.title}
                                    className="w-full h-full object-cover transform transition-transform duration-500 group-hover:scale-110"
                                    src={getOptimizedImageUrl(project.image, 300)}
                                    loading="lazy"
                                    decoding="async"
                                />
                            </div>
                            <div className="flex-1 ml-4 sm:ml-6 min-w-0 grid grid-cols-1 md:grid-cols-12 items-center gap-2 sm:gap-4">
                                <div className="md:col-span-4 lg:col-span-5 flex flex-col justify-center">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-bold text-base sm:text-lg text-gray-900 dark:text-white truncate group-hover:text-primary transition-colors">
                                            {project.title}
                                        </h3>
                                    </div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                                        By <span className="font-medium text-gray-700 dark:text-gray-300">{project.maker}</span>
                                    </p>
                                </div>
                                <div className="hidden md:flex md:col-span-5 lg:col-span-4 items-center gap-4 lg:gap-8">
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2 text-xs font-medium text-muted-light dark:text-muted-dark">
                                            <span className="flex items-center gap-1">
                                                <span className="material-icons-round text-sm">visibility</span> {formatNumber(project.views)}
                                            </span>
                                            <span className="text-gray-300">•</span>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onLikeToggle(project.id);
                                                }}
                                                className={`flex items-center gap-1 transition-colors ${likedProjects.has(project.id)
                                                    ? 'text-red-500 font-bold'
                                                    : 'text-green-600 dark:text-green-400 hover:text-red-500'
                                                    }`}
                                            >
                                                <span className="material-icons-round text-sm">
                                                    {likedProjects.has(project.id) ? 'favorite' : 'favorite'}
                                                </span>
                                                {formatNumber(project.likes)}
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${isHot
                                                ? 'text-orange-600 bg-orange-100 dark:bg-orange-900/30'
                                                : 'text-green-600 bg-green-100 dark:bg-green-900/30'
                                                }`}>
                                                <span className="material-icons-round text-[12px]">
                                                    {isHot ? 'local_fire_department' : 'trending_up'}
                                                </span>
                                                {isHot ? t.hot : t.rising}
                                            </span>
                                            <div className="h-1 w-20 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full ${isHot ? 'bg-orange-500' : 'bg-green-500'}`}
                                                    style={{ width: `${scorePercent}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>
                                    <span className="px-3 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-full whitespace-nowrap flex items-center gap-1">
                                        <span className="material-icons-round text-xs">{getCategoryIcon(project.category)}</span>
                                        {project.category}
                                    </span>
                                </div>
                                <div className="hidden md:flex md:col-span-3 lg:col-span-3 justify-end items-center pr-4">
                                    <button className="opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-300 flex items-center gap-2 px-5 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-primary hover:text-white dark:text-white rounded-full text-sm font-semibold shadow-sm">
                                        {t.viewProject}
                                        <span className="material-icons-round text-sm">arrow_forward</span>
                                    </button>
                                </div>
                            </div>
                            <button className="md:hidden ml-auto p-2 text-gray-400">
                                <span className="material-icons-round">chevron_right</span>
                            </button>
                        </div>
                    );
                })}

                {trendingProjects.length === 0 && (
                    <div className="p-12 text-center text-gray-500 dark:text-gray-400">
                        <span className="material-icons-round text-4xl mb-2">trending_up</span>
                        <p>{t.noProjects}</p>
                    </div>
                )}
            </div>
            <div className="mt-16 flex justify-center">
                <button className="px-8 py-3 bg-white dark:bg-surface-darker border border-gray-200 dark:border-gray-700 rounded-full text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 text-text-light dark:text-text-dark transition-colors shadow-sm flex items-center gap-2">
                    <span>{t.loadMore}</span>
                    <span className="material-icons-round text-sm">expand_more</span>
                </button>
            </div>
        </div>
    );
};

export default Trending;