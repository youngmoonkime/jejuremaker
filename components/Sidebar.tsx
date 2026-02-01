import React from 'react';
import { TRANSLATIONS } from '../constants/translations';
import { Language } from '../App';
import { Maker } from '../types';

interface SidebarProps {
    language: Language;
    onNavigate: (view: any) => void;
    makers: Maker[];
    onAnalyzeClick: () => void;
    currentView: string;
}

const Sidebar: React.FC<SidebarProps> = ({ language, onNavigate, makers, onAnalyzeClick, currentView }) => {
    const t = TRANSLATIONS[language];

    return (
        <aside className="w-72 flex-shrink-0 hidden lg:flex flex-col gap-6 sticky top-24 h-[calc(100vh-8rem)] overflow-y-auto pr-2 scrollbar-hide">
            {/* ... (AI Wizard and Community Impact sections remain unchanged) ... */}
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
                        onClick={onAnalyzeClick}
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
                <button
                    onClick={() => onNavigate('discovery')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${currentView === 'discovery' || currentView === 'detail'
                        ? 'bg-gray-100 dark:bg-gray-800 text-primary'
                        : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                        }`}
                >
                    <span className="material-icons-round">explore</span>
                    {t.discover}
                </button>
                <button
                    onClick={() => onNavigate('trending')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${currentView === 'trending'
                        ? 'bg-gray-100 dark:bg-gray-800 text-primary'
                        : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                        }`}
                >
                    <span className="material-icons-round">trending_up</span>
                    {t.trending}
                </button>
                <button
                    onClick={() => onNavigate('community')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${currentView === 'community'
                        ? 'bg-gray-100 dark:bg-gray-800 text-primary'
                        : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                        }`}
                >
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
                    {makers.map((maker, idx) => (
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
    );
};

export default Sidebar;
