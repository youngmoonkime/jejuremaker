import React, { useState, useMemo } from 'react';
import { User } from '@supabase/supabase-js';
import { TRANSLATIONS } from '../constants/translations';
import { Language } from '../App';
import { Project } from '../types';

interface HeaderProps {
    user: User | null;
    userProfile?: { nickname: string; avatarUrl: string } | null;
    userTokens: number;
    language: Language;
    toggleLanguage: () => void;
    isDarkMode: boolean;
    toggleDarkMode: () => void;
    onLoginClick: (target?: any) => void;
    onNavigate: (view: any) => void;
    onLogout: () => void;
    onSearch?: (term: string) => void;
    currentView?: string; // Optional for backward compatibility, but recommended
    notifications?: any[];
    onNotificationClick?: (projectId: string, notifId: string) => void;
    onDeleteNotification?: (notifId: string) => void;
    projects?: Project[];
}

const Header: React.FC<HeaderProps> = ({
    user,
    userProfile,
    userTokens,
    language,
    toggleLanguage,
    isDarkMode,
    toggleDarkMode,
    onLoginClick,
    onNavigate,
    onLogout,

    onSearch,
    currentView,
    notifications,
    onNotificationClick,
    onDeleteNotification,
    projects = []
}) => {
    const t = TRANSLATIONS[language];
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    const hasUnread = notifications?.some(n => !n.read);

    const handleSearch = (term: string) => {
        if (onSearch) {
            onSearch(term);
            setIsSearchFocused(false);
            setSearchTerm(term); // Keep term
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch(searchTerm);
        }
    };

    // Dynamically calculate popular topics based on project tags and categories
    const { popularTopics, recommendedTopics } = useMemo(() => {
        const tagCounts: Record<string, number> = {};
        
        projects.forEach(p => {
            if (p.tags && Array.isArray(p.tags)) {
                p.tags.forEach(t => {
                    tagCounts[t] = (tagCounts[t] || 0) + 1;
                });
            }
        });

        // Filter out purely English tags or known generic/mock categories like "Wood", "Metal", "lighting"
        const isJejuRelevant = (t: string) => {
            const lower = t.toLowerCase();
            const genericTerms = ['wood', 'metal', 'glass', 'concrete', 'textile', '3d print', 'lighting', 'furniture', 'interior'];
            if (genericTerms.includes(lower)) return false;
            // Retain Korean tags or anything that doesn't look like our mock DB tags
            return /[가-힣]/.test(t) || !/^[a-zA-Z\s]+$/.test(t);
        };

        const sortedTags = Object.entries(tagCounts)
            .sort((a, b) => b[1] - a[1])
            .map(entry => entry[0])
            .filter(isJejuRelevant);

        const pop = sortedTags.slice(0, 7).map((t, idx) => ({
            rank: idx + 1,
            text: t,
            isHot: idx < 3
        }));

        const catCounts: Record<string, number> = {};
        projects.forEach(p => {
            if (p.category) {
                catCounts[p.category] = (catCounts[p.category] || 0) + 1;
            }
        });
        
        const sortedCats = Object.entries(catCounts)
            .sort((a, b) => b[1] - a[1])
            .map(entry => entry[0])
            .filter(isJejuRelevant);

        const remainingTags = sortedTags.slice(7);
        const combined = Array.from(new Set([...sortedCats, ...remainingTags])).slice(0, 8);

        const rec = combined.map((t, idx) => ({
            rank: idx + 1,
            text: t
        }));



        return { popularTopics: pop, recommendedTopics: rec };
    }, [projects]);

    const isLabView = currentView === 'lab';

    const headerAvatarUrl = userProfile?.avatarUrl || user?.user_metadata?.avatar_url;
    const headerDisplayName = userProfile?.nickname || user?.user_metadata?.full_name || user?.email || 'U';

    return (
        <header className="fixed top-0 w-full z-50 bg-white/80 dark:bg-[#121212]/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 h-16 transition-colors duration-300">
            <div className="max-w-[1600px] mx-auto px-4 md:px-6 h-full flex items-center justify-between relative">
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigate('discovery')}>
                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white shadow-lg shadow-primary/30 flex-shrink-0">
                        <span className="material-icons-round text-xl">recycling</span>
                    </div>
                    {isLabView ? (
                        <span className="font-bold text-lg md:text-xl tracking-tight text-gray-900 dark:text-white whitespace-nowrap">Jeju <span className="text-primary">Remake Lab</span></span>
                    ) : (
                        <span className="font-bold text-lg md:text-xl tracking-tight text-gray-900 dark:text-white whitespace-nowrap">Jeju <span className="text-primary">Re-Maker Hub</span></span>
                    )}
                </div>

                {/* Search Input Container - Hidden in Lab View */}
                {!isLabView && (
                    <div className="hidden md:flex flex-1 mx-8 justify-center relative z-50">
                        <div className={`relative w-full transition-all duration-300 ${isSearchFocused ? 'max-w-2xl' : 'max-w-lg'}`}>
                            <div className="bg-gray-100 dark:bg-[#1e1e1e] px-4 py-1.5 rounded-full flex items-center w-full border border-transparent focus-within:bg-white dark:focus-within:bg-[#252525] focus-within:shadow-[0_0_20px_rgba(16,183,127,0.15)] focus-within:border-primary/30 transition-all duration-300">
                                <div
                                    className={`mr-3 transition-colors duration-300 ${isSearchFocused ? 'text-primary cursor-pointer' : 'text-gray-400'}`}
                                    onClick={() => handleSearch(searchTerm)}
                                >
                                    <span className="material-icons-round text-xl">search</span>
                                </div>
                                <input
                                    type="text"
                                    placeholder={t.heroPlaceholder || "모델, 사용자, 컬렉션 및 게시물 검색"}
                                    className="flex-1 bg-transparent border-none outline-none focus:outline-none focus:ring-0 text-gray-800 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-500 text-sm h-full py-1"
                                    onFocus={() => setIsSearchFocused(true)}
                                    onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)} // Delay to allow clicks
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                />
                            </div>

                            {/* Search Dropdown (Popular Topics) */}
                            {isSearchFocused && (
                                <div className="absolute top-full left-0 w-full mt-2 bg-white dark:bg-[#1e1e1e] rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden p-6 animate-in fade-in zoom-in-95 duration-200">
                                    <div className="grid grid-cols-2 gap-8">
                                        {/* Column 1: Popular Topics */}
                                        <div>
                                            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-200 mb-4">인기 주제</h3>
                                            <div className="flex items-center gap-2 mb-3 text-sm text-[#ff4c4c] font-medium">
                                                <span className="material-icons-round text-base">trending_up</span>
                                                <span>제주 업사이클링</span>
                                            </div>
                                            <ul className="space-y-2.5">
                                                {popularTopics.map((topic) => (
                                                    <li
                                                        key={topic.rank}
                                                        className="flex items-center gap-3 text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 p-1 rounded-md transition-colors"
                                                        onClick={() => handleSearch(topic.text)}
                                                    >
                                                        <span className={`font-bold w-4 text-center ${topic.rank <= 3 ? 'text-[#ff4c4c]' : 'text-gray-400'}`}>{topic.rank}</span>
                                                        <span className="text-gray-700 dark:text-gray-300">{topic.text}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>

                                        {/* Column 2: Recommended (Jeju Collections) */}
                                        <div>
                                            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-200 mb-4">제주 컬렉션</h3>
                                            <ul className="space-y-2.5">
                                                {recommendedTopics.map((topic) => (
                                                    <li
                                                        key={topic.rank}
                                                        className="flex items-center gap-3 text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 p-1 rounded-md transition-colors"
                                                        onClick={() => handleSearch(topic.text)}
                                                    >
                                                        <span className={`font-bold w-4 text-center ${topic.rank <= 3 ? 'text-primary' : 'text-gray-400'}`}>{topic.rank}</span>
                                                        <span className="text-gray-700 dark:text-gray-300">{topic.text}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <div className="flex items-center gap-1.5 md:gap-4">

                    {/* Token Display (If User) */}
                    {user && (
                        <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-900/30 rounded-full border border-emerald-100 dark:border-emerald-800/50 shadow-sm">
                            <span className="material-icons-round text-emerald-500 text-base">recycling</span>
                            <span className="text-sm font-bold text-emerald-900 dark:text-emerald-100">{userTokens}</span>
                        </div>
                    )}

                    {/* Language Toggle - Hidden on very small screens if needed, but keeping for now with smaller padding */}
                    <button
                        onClick={toggleLanguage}
                        className="px-2 md:px-3 py-1.5 rounded-lg font-bold text-[10px] md:text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                        {language === 'ko' ? 'EN' : '한국어'}
                    </button>

                    {/* Dark Mode Toggle */}
                    <button
                        onClick={toggleDarkMode}
                        className="p-1.5 md:p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                    >
                        <span className="material-icons-round text-xl md:text-2xl">{isDarkMode ? 'light_mode' : 'dark_mode'}</span>
                    </button>

                    <div className="relative hidden sm:block">
                        <button 
                            onClick={() => setShowNotifications(!showNotifications)}
                            className={`p-2 rounded-full transition-colors relative ${showNotifications ? 'bg-gray-200 dark:bg-gray-700 text-primary' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                        >
                            <span className="material-icons-round">notifications_none</span>
                            {hasUnread && (
                                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-[#121212]"></span>
                            )}
                        </button>
                        
                        {showNotifications && (
                            <div className="absolute right-0 mt-3 w-[340px] bg-white dark:bg-[#1a1c1e] rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 overflow-hidden z-[100] transform transition-all duration-200 origin-top-right">
                                <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-[#151718]">
                                    <h3 className="font-bold text-gray-800 dark:text-white text-base">알림 (Notifications)</h3>
                                </div>
                                <div className="max-h-96 overflow-y-auto">
                                    {(notifications && notifications.length > 0) ? (
                                        notifications.map((notif: any) => (
                                            <div 
                                                key={notif.id} 
                                                onClick={() => {
                                                    setShowNotifications(false);
                                                    if (onNotificationClick) onNotificationClick(notif.projectId, notif.id);
                                                }}
                                                className={`p-4 border-b border-gray-100 dark:border-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-[#202224] transition-colors ${!notif.read ? 'bg-primary/5 dark:bg-primary/10' : ''}`}
                                            >
                                                <div className="flex gap-3">
                                                    <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border border-gray-200 dark:border-gray-700 bg-gray-100 mt-1">
                                                       {notif.senderAvatar && notif.senderAvatar.startsWith('http') ? (
                                                          <img src={notif.senderAvatar} alt={notif.sender} className="w-full h-full object-cover" />
                                                       ) : (
                                                          <div className="w-full h-full flex items-center justify-center bg-primary/20 text-primary font-bold">{notif.sender?.charAt(0) || 'U'}</div>
                                                       )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm text-gray-800 dark:text-gray-200 mb-1 leading-tight">
                                                            <span className="font-bold">{notif.sender}</span> in <span className="font-bold text-primary truncate max-w-[120px] inline-block align-bottom">{notif.projectTitle}</span>
                                                        </p>
                                                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{notif.message}</p>
                                                        <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1.5 font-medium">{new Date(notif.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                                    </div>
                                                    <div className="flex flex-col items-center gap-2">
                                                        {!notif.read && <div className="w-2 h-2 rounded-full bg-primary mb-1"></div>}
                                                        {notif.read && (
                                                            <button 
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    if (onDeleteNotification) onDeleteNotification(notif.id);
                                                                }}
                                                                className="text-gray-400 hover:text-red-500 p-1 rounded-md transition-colors"
                                                                title="Delete notification"
                                                            >
                                                                <span className="material-icons-round text-sm">close</span>
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-10 text-center flex flex-col items-center">
                                            <span className="material-icons-round text-5xl text-gray-300 dark:text-gray-700 mb-3">notifications_off</span>
                                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">도착한 새로운 메시지가 없습니다.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                    {!isLabView && (
                        <button
                            onClick={() => user ? onNavigate('upload') : onLoginClick('upload')}
                            className="flex items-center gap-2 pl-3 pr-1 py-1 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors group">
                            <span className="text-sm font-medium text-gray-800 dark:text-gray-200 hidden sm:inline">{t.create}</span>
                            <div className="w-7 h-7 bg-primary group-hover:bg-primary-dark rounded-full flex items-center justify-center text-white transition-colors">
                                <span className="material-icons-round text-sm">upload</span>
                            </div>
                        </button>
                    )}

                    {user ? (
                        <div className="relative">
                            <div
                                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                                className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-400 to-purple-400 overflow-hidden border-2 border-white dark:border-gray-700 cursor-pointer hover:ring-2 hover:ring-primary transition-all relative group flex items-center justify-center"
                                title={t.logout}
                            >
                                {headerAvatarUrl ? (
                                    <img src={headerAvatarUrl} alt="User" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-white font-bold text-sm">
                                        {headerDisplayName.charAt(0).toUpperCase()}
                                    </span>
                                )}
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
        </header >
    );
};

export default Header;
