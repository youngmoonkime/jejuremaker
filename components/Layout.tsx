import React from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import { User } from '@supabase/supabase-js';
import { Language } from '../App';
import { Maker, Project } from '../types';
import WizardModal from './WizardModal';
import { config } from '../services/config';

interface LayoutProps {
    children: React.ReactNode;
    user: User | null;
    userTokens: number;
    language: Language;
    toggleLanguage: () => void;
    isDarkMode: boolean;
    toggleDarkMode: () => void;
    onLoginClick: (target?: any) => void;
    onNavigate: (view: any) => void;
    onLogout: () => void;
    makers: Maker[];
    onAnalyzeClick: () => void;
    showWizard: boolean;
    setShowWizard: (show: boolean) => void;
    // Wizard props
    setUserTokens: (tokens: number) => void;
    onAddProject: (project: Project) => void;
    currentView: string;
    onSearch?: (term: string) => void;
    onCancel?: () => void;
}

const Layout: React.FC<LayoutProps> = ({
    children,
    user,
    userTokens,
    language,
    toggleLanguage,
    isDarkMode,
    toggleDarkMode,
    onLoginClick,
    onNavigate,
    onLogout,
    makers,
    onAnalyzeClick,
    showWizard,
    setShowWizard,
    setUserTokens,
    onAddProject,
    currentView,
    onSearch,
    onCancel
}) => {
    return (
        <div className={`min-h-screen text-gray-800 dark:text-gray-100 bg-background-light dark:bg-background-dark transition-colors duration-300`}>
            {currentView !== 'upload' && (
                <Header
                    user={user}
                    userTokens={userTokens}
                    language={language}
                    toggleLanguage={toggleLanguage}
                    isDarkMode={isDarkMode}
                    toggleDarkMode={toggleDarkMode}
                    onLoginClick={onLoginClick}
                    onNavigate={onNavigate}
                    onLogout={onLogout}
                    onSearch={onSearch}
                    currentView={currentView}
                />
            )}

            <div className={(currentView === 'upload' || currentView === 'lab') ? 'w-full h-screen' : "max-w-[1600px] mx-auto pt-20 lg:pt-24 pb-24 lg:pb-12 px-4 lg:px-6 flex flex-col lg:flex-row lg:gap-10"}>
                {(currentView !== 'upload' && currentView !== 'lab') && (
                    <>
                        {/* Desktop Sidebar */}
                        <Sidebar
                            language={language}
                            onNavigate={onNavigate}
                            makers={makers}
                            onAnalyzeClick={onAnalyzeClick}
                            currentView={currentView}
                        />

                        {/* Mobile Bottom Navigation */}
                        <div className="fixed bottom-0 left-0 w-full bg-white dark:bg-[#1a1c1e] border-t border-gray-200 dark:border-gray-800 flex justify-around items-center p-3 z-40 lg:hidden pb-safe">
                            <button
                                onClick={() => onNavigate('discovery')}
                                className={`flex flex-col items-center gap-1 ${currentView === 'discovery' ? 'text-primary' : 'text-gray-400'}`}
                            >
                                <span className="material-icons-round text-2xl">explore</span>
                                <span className="text-[10px] font-medium">{language === 'ko' ? '탐색' : 'Discover'}</span>
                            </button>
                            <button
                                onClick={() => onNavigate('trending')}
                                className={`flex flex-col items-center gap-1 ${currentView === 'trending' ? 'text-primary' : 'text-gray-400'}`}
                            >
                                <span className="material-icons-round text-2xl">trending_up</span>
                                <span className="text-[10px] font-medium">{language === 'ko' ? '인기' : 'Trending'}</span>
                            </button>
                            <div className="relative -top-5">
                                <button
                                    onClick={onAnalyzeClick}
                                    className="w-14 h-14 bg-primary text-white rounded-full shadow-lg shadow-primary/30 flex items-center justify-center transform transition-transform active:scale-95"
                                >
                                    <span className="material-icons-round text-2xl">auto_awesome</span>
                                </button>
                            </div>
                            <button
                                onClick={() => onNavigate('community')}
                                className={`flex flex-col items-center gap-1 ${currentView === 'community' ? 'text-primary' : 'text-gray-400'}`}
                            >
                                <span className="material-icons-round text-2xl">people</span>
                                <span className="text-[10px] font-medium">{language === 'ko' ? '커뮤니티' : 'Community'}</span>
                            </button>
                            {config.app.labUrl ? (
                                <a
                                    href={config.app.labUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex flex-col items-center gap-1 text-gray-400"
                                >
                                    <span className="material-icons-round text-2xl">science</span>
                                    <span className="text-[10px] font-medium">{language === 'ko' ? '리메이크 랩' : 'Remake Lab'}</span>
                                </a>
                            ) : (
                                <a
                                    href="/?view=lab"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`flex flex-col items-center gap-1 ${currentView === 'lab' ? 'text-primary' : 'text-gray-400'}`}
                                >
                                    <span className="material-icons-round text-2xl">science</span>
                                    <span className="text-[10px] font-medium">{language === 'ko' ? '리메이크 랩' : 'Remake Lab'}</span>
                                </a>
                            )}
                            <button
                                onClick={() => onNavigate('profile')}
                                className={`flex flex-col items-center gap-1 ${currentView === 'profile' ? 'text-primary' : 'text-gray-400'}`}
                            >
                                <span className="material-icons-round text-2xl">person</span>
                                <span className="text-[10px] font-medium">{language === 'ko' ? '내 정보' : 'Profile'}</span>
                            </button>
                        </div>
                    </>
                )}

                <main className={(currentView === 'upload' || currentView === 'lab') ? 'w-full h-full' : "flex-1 min-w-0"}>
                    {children}
                </main>
            </div>

            {/* Global Wizard Modal */}
            <WizardModal
                isOpen={showWizard}
                onClose={() => setShowWizard(false)}
                language={language}
                userTokens={userTokens}
                setUserTokens={setUserTokens}
                onAddProject={onAddProject}
                user={user}
                onCancel={onCancel}
            />
        </div>
    );
};

export default Layout;
