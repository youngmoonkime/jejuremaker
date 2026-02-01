import React from 'react';
import { Project } from '../types';
import { Language } from '../App';
import { User } from '@supabase/supabase-js';

interface ProfileProps {
    onNavigate: (view: 'discovery' | 'detail' | 'upload' | 'trending' | 'community' | 'profile') => void;
    onProjectSelect: (project: Project) => void;
    isDarkMode: boolean;
    toggleDarkMode: () => void;
    language: Language;
    toggleLanguage: () => void;
    user: User | null;
    onLoginClick: () => void;
    onLogout: () => void;
    userTokens: number;
    myProjects: Project[];
    onPublish: (projectId: string) => void;
    onDelete: (projectId: string) => void;
}

const TRANSLATIONS = {
    ko: {
        title: '내 정보',
        myLibrary: '내 서재',
        tokens: '보유 토큰',
        noProjects: '아직 프로젝트가 없습니다',
        createFirst: 'AI 분석으로 첫 프로젝트를 만들어보세요!',
        publish: '공개하기',
        delete: '삭제',
        published: '공개됨',
        private: '비공개',
        backToDiscovery: '탐색으로 돌아가기',
        confirmDelete: '정말 삭제하시겠습니까?',
        confirmPublish: '이 프로젝트를 공개하시겠습니까?',
        difficulty: {
            Easy: '쉬움',
            Medium: '보통',
            Hard: '어려움'
        }
    },
    en: {
        title: 'My Profile',
        myLibrary: 'My Library',
        tokens: 'Tokens',
        noProjects: 'No projects yet',
        createFirst: 'Create your first project with AI analysis!',
        publish: 'Publish',
        delete: 'Delete',
        published: 'Published',
        private: 'Private',
        backToDiscovery: 'Back to Discovery',
        confirmDelete: 'Are you sure you want to delete this project?',
        confirmPublish: 'Publish this project to the community?',
        difficulty: {
            Easy: 'Easy',
            Medium: 'Medium',
            Hard: 'Hard'
        }
    }
};

const Profile: React.FC<ProfileProps> = ({
    onNavigate,
    onProjectSelect,
    isDarkMode,
    toggleDarkMode,
    language,
    toggleLanguage,
    user,
    onLoginClick,
    onLogout,
    userTokens,
    myProjects,
    onPublish,
    onDelete
}) => {
    const t = TRANSLATIONS[language];

    const handlePublish = (projectId: string) => {
        if (window.confirm(t.confirmPublish)) {
            onPublish(projectId);
        }
    };

    const handleDelete = (projectId: string) => {
        if (window.confirm(t.confirmDelete)) {
            onDelete(projectId);
        }
    };

    return (
        <div className={`min-h-screen text-gray-800 dark:text-gray-100 bg-background-light dark:bg-background-dark transition-colors duration-300`}>
            {/* Header */}
            <header className="fixed top-0 w-full z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 h-16 transition-colors duration-300">
                <div className="max-w-[1600px] mx-auto px-6 h-full flex items-center justify-between">
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigate('discovery')}>
                        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white shadow-lg shadow-primary/30">
                            <span className="material-icons-round text-xl">recycling</span>
                        </div>
                        <span className="font-bold text-xl tracking-tight text-gray-900 dark:text-white">Jeju <span className="text-primary">Re-Maker</span></span>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Token Display */}
                        {user && (
                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/30 dark:to-blue-900/30 rounded-full border border-indigo-100 dark:border-indigo-800/50">
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

                        {user && (
                            <div
                                onClick={onLogout}
                                className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-400 to-purple-400 overflow-hidden border-2 border-white dark:border-gray-700 cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                            >
                                <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuAQyyDiuuKUO7-48MXIFPjnexxedhZVHEg5bLuAfgHROaZsbytCEGez7ZIXFwYjO7H0n-l9dOkw4COHYrcofMglRTN3eCjKz9imRZERODcpiZMHvmA375rRKibsmRiaev4dbcIfJShQP2b6z5fq637Tc09U2y5H0qaavl6DdKbBt-tQj5H3OY3EjQDJEpKoEstwMBcTO32zdio882CcbV9WotiISEBt_WQls7w_h3eoXRbVzBGRCA7ziLjSCfksoUdmw3FLUHE6mDs" alt="User" className="w-full h-full object-cover" />
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <div className="max-w-[1600px] mx-auto pt-24 pb-12 px-6">
                {/* Back Button */}
                <button
                    onClick={() => onNavigate('discovery')}
                    className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary mb-6 transition-colors"
                >
                    <span className="material-icons-round">arrow_back</span>
                    <span className="font-medium">{t.backToDiscovery}</span>
                </button>

                {/* Profile Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">{t.title}</h1>
                    <div className="flex items-center gap-6 text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-2">
                            <span className="material-icons-round text-primary">folder</span>
                            <span className="font-medium">{myProjects.length} {language === 'ko' ? '프로젝트' : 'Projects'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-lg">💎</span>
                            <span className="font-medium">{userTokens} {t.tokens}</span>
                        </div>
                    </div>
                </div>

                {/* My Library Section */}
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{t.myLibrary}</h2>

                    {myProjects.length === 0 ? (
                        <div className="text-center py-20">
                            <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="material-icons-round text-5xl text-gray-400">inventory_2</span>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">{t.noProjects}</h3>
                            <p className="text-gray-500 dark:text-gray-400 mb-6">{t.createFirst}</p>
                            <button
                                onClick={() => onNavigate('discovery')}
                                className="px-6 py-3 bg-primary hover:bg-primary-dark text-white rounded-xl font-medium transition-colors shadow-lg shadow-primary/20"
                            >
                                {language === 'ko' ? 'AI 분석 시작하기' : 'Start AI Analysis'}
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                            {myProjects.map((project) => (
                                <div
                                    key={project.id}
                                    className="group flex flex-col gap-3"
                                >
                                    <div className="relative aspect-[4/3] rounded-3xl overflow-hidden bg-gray-100 dark:bg-gray-800 shadow-sm group-hover:shadow-xl transition-all duration-300">
                                        <img
                                            src={project.image}
                                            alt={project.title}
                                            className="w-full h-full object-cover cursor-pointer transition-transform duration-500 group-hover:scale-110"
                                            onClick={() => onProjectSelect(project)}
                                        />

                                        {/* Public/Private Badge */}
                                        <div className={`absolute top-3 left-3 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 shadow-sm border ${project.isPublic
                                                ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800'
                                                : 'bg-gray-100 dark:bg-gray-800/90 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700'
                                            }`}>
                                            <span className="material-icons-round text-sm">{project.isPublic ? 'public' : 'lock'}</span>
                                            {project.isPublic ? t.published : t.private}
                                        </div>

                                        {(project.isAiRemix || project.isAiIdea) && (
                                            <div className="absolute top-3 right-3 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-bold text-primary flex items-center gap-1 shadow-sm border border-white/50 dark:border-gray-700">
                                                <span className="material-icons-round text-sm">auto_awesome</span>
                                                AI
                                            </div>
                                        )}
                                    </div>

                                    <div className="px-1">
                                        <div className="flex justify-between items-start mb-1">
                                            <h3
                                                className="font-bold text-lg text-gray-900 dark:text-gray-100 leading-snug cursor-pointer hover:text-primary transition-colors"
                                                onClick={() => onProjectSelect(project)}
                                            >
                                                {project.title}
                                            </h3>
                                            <span className={`text-xs px-2.5 py-1 rounded-md font-medium border
                        ${project.difficulty === 'Easy' ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-100 dark:border-green-800' :
                                                    project.difficulty === 'Medium' ? 'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-100 dark:border-yellow-800' :
                                                        'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-100 dark:border-red-800'}`}>
                                                {t.difficulty[project.difficulty]}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                                                <span className="material-icons-round text-sm">category</span>
                                                {project.category}
                                            </div>
                                            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                                                <span className="material-icons-round text-sm">schedule</span>
                                                {project.time}
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex gap-2">
                                            {!project.isPublic && (
                                                <button
                                                    onClick={() => handlePublish(project.id)}
                                                    className="flex-1 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl text-sm font-medium transition-colors shadow-md shadow-primary/20 flex items-center justify-center gap-1"
                                                >
                                                    <span className="material-icons-round text-sm">public</span>
                                                    {t.publish}
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleDelete(project.id)}
                                                className="px-4 py-2 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 rounded-xl text-sm font-medium transition-colors border border-red-100 dark:border-red-800 flex items-center justify-center gap-1"
                                            >
                                                <span className="material-icons-round text-sm">delete</span>
                                                {t.delete}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Profile;
