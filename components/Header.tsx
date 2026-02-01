import React, { useState } from 'react';
import { User } from '@supabase/supabase-js';
import { TRANSLATIONS } from '../constants/translations';
import { Language } from '../App';

interface HeaderProps {
    user: User | null;
    userTokens: number;
    language: Language;
    toggleLanguage: () => void;
    isDarkMode: boolean;
    toggleDarkMode: () => void;
    onLoginClick: (target?: any) => void;
    onNavigate: (view: any) => void;
    onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({
    user,
    userTokens,
    language,
    toggleLanguage,
    isDarkMode,
    toggleDarkMode,
    onLoginClick,
    onNavigate,
    onLogout
}) => {
    const t = TRANSLATIONS[language];
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);

    return (
        <header className="fixed top-0 w-full z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 h-16 transition-colors duration-300">
            <div className="max-w-[1600px] mx-auto px-6 h-full flex items-center justify-between">
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigate('discovery')}>
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
    );
};

export default Header;
