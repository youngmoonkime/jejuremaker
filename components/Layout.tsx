import React from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import { User } from '@supabase/supabase-js';
import { Language } from '../App';
import { Maker, Project } from '../types';
import WizardModal from './WizardModal';

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
    currentView
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
                />
            )}

            <div className={currentView === 'upload' ? 'w-full h-screen' : "max-w-[1600px] mx-auto pt-24 pb-12 px-6 flex gap-10"}>
                {currentView !== 'upload' && (
                    <Sidebar
                        language={language}
                        onNavigate={onNavigate}
                        makers={makers}
                        onAnalyzeClick={onAnalyzeClick}
                        currentView={currentView}
                    />
                )}

                <main className={currentView === 'upload' ? 'w-full h-full' : "flex-1 min-w-0"}>
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
            />
        </div>
    );
};

export default Layout;
