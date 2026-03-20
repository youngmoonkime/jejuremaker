import React, { useState, useRef, useEffect } from 'react';
import { Project } from '../types';
import { Language } from '../contexts/ThemeContext';
import { User } from '@supabase/supabase-js';
import { getOptimizedImageUrl } from '../utils/imageOptimizer';
import { uploadToR2 } from '../services/r2Storage';
import { supabase } from '../services/supabase';
import { useToast } from '../contexts/ToastContext';

interface ProfileProps {
    onNavigate: (view: 'discovery' | 'detail' | 'upload' | 'trending' | 'community' | 'profile') => void;
    onProjectSelect: (project: Project) => void;
    isDarkMode: boolean;
    toggleDarkMode?: () => void;
    language: Language;
    toggleLanguage?: () => void;
    user: User | null;
    onLoginClick: () => void;
    onLogout: () => void;
    userTokens: number;
    myProjects: Project[];
    onPublish: (projectId: string) => void;
    onDelete: (projectId: string) => void;
    onEdit: (project: Project) => void;
    targetUserId?: string;
    onProfileUpdate?: () => void;
}

const TRANSLATIONS = {
    ko: {
        title: '내 정보',
        myLibrary: '내 서재',
        tokens: '보유 토큰',
        noProjects: '새로운 프로젝트를 시작해보세요',
        createFirst: '+',
        publish: '공개하기',
        delete: '삭제',
        published: '공개됨',
        private: '비공개',
        backToDiscovery: '돌아가기',
        confirmDelete: '정말 삭제하시겠습니까?',
        confirmPublish: '이 프로젝트를 커뮤니티에 공개하시겠습니까?',
        editProfile: '프로필 수정',
        save: '저장',
        cancel: '취소',
        changePhoto: '사진 변경',
        uploading: '업로드 중...',
        logout: '로그아웃',
        projects: '프로젝트',
        newProject: '새 프로젝트',
        searchingProjects: '해당 프로젝트를 찾고 있습니다...',
        noProjectsFound: '아직 공개된 프로젝트가 없습니다.'
    },
    en: {
        title: 'My Profile',
        myLibrary: 'Library',
        tokens: 'Tokens',
        noProjects: 'Start a new project',
        createFirst: '+',
        publish: 'Publish',
        delete: 'Delete',
        published: 'Public',
        private: 'Private',
        backToDiscovery: 'Back',
        confirmDelete: 'Are you sure you want to delete this project?',
        confirmPublish: 'Publish this project to the community?',
        editProfile: 'Edit Profile',
        save: 'Save',
        cancel: 'Cancel',
        changePhoto: 'Change Photo',
        uploading: 'Uploading...',
        logout: 'Log Out',
        projects: 'Projects',
        newProject: 'New Project',
        searchingProjects: 'Looking for projects...',
        noProjectsFound: 'No public projects yet.'
    }
};


const Profile: React.FC<ProfileProps> = ({
    onNavigate,
    onProjectSelect,
    language,
    user,
    targetUserId,
    onLogout,
    userTokens,
    myProjects,
    onPublish,
    onDelete,
    onEdit,
    onProfileUpdate
}) => {
    const { showToast } = useToast();
    const t = TRANSLATIONS[language];
    const isGuestView = !!targetUserId && targetUserId !== user?.id;

    // Edit Mode State
    const [isEditing, setIsEditing] = useState(false);
    const [displayName, setDisplayName] = useState('Maker');
    const [avatarUrl, setAvatarUrl] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [isLoadingProfile, setIsLoadingProfile] = useState(true);
    const [guestProjects, setGuestProjects] = useState<Project[]>([]);
    const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null);
    const [publishingProjectId, setPublishingProjectId] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Fetch profile and projects
    useEffect(() => {
        const fetchData = async () => {
            const effectiveUserId = targetUserId || user?.id;
            if (!effectiveUserId) {
                setDisplayName('Maker');
                setAvatarUrl('');
                setIsLoadingProfile(false);
                return;
            }

            setIsLoadingProfile(true);
            try {
                // 1. Fetch Profile Info
                const { data: profile } = await supabase
                    .from('user_profiles')
                    .select('nickname, avatar_url')
                    .eq('user_id', effectiveUserId)
                    .maybeSingle();

                if (profile) {
                    setDisplayName(profile.nickname || (effectiveUserId === user?.id ? (user?.user_metadata?.full_name || user?.email?.split('@')[0]) : 'Maker'));
                    setAvatarUrl(profile.avatar_url || (effectiveUserId === user?.id ? (user?.user_metadata?.avatar_url) : ''));
                } else if (effectiveUserId === user?.id) {
                    setDisplayName(user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Maker');
                    setAvatarUrl(user?.user_metadata?.avatar_url || '');
                } else {
                    // For guest view if no profile in DB, fallback to generic or empty
                    setDisplayName('Maker');
                    setAvatarUrl('');
                }

                // 2. Fetch Projects (If Guest View, fetch target user's public projects)
                if (isGuestView) {
                    const { data: items } = await supabase
                        .from('items')
                        .select('*')
                        .eq('owner_id', effectiveUserId)
                        .eq('is_public', true)
                        .neq('category', 'Social') // Filter out community posts
                        .order('created_at', { ascending: false });

                    if (items) {
                        const mapped: Project[] = items.map(item => ({
                            id: item.id.toString(),
                            title: item.title,
                            maker: item.maker || displayName,
                            makerAvatarUrl: avatarUrl,
                            image: item.image_url || 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80',
                            images: item.metadata?.images || [],
                            category: item.category,
                            time: item.estimated_time || '2h',
                            difficulty: item.difficulty || 'Medium',
                            isAiRemix: item.is_ai_generated,
                            description: item.metadata?.description || item.description,
                            ownerId: item.owner_id,
                            isPublic: item.is_public,
                            likes: item.likes || 0,
                            views: item.views || 0,
                            createdAt: item.created_at
                        }));
                        setGuestProjects(mapped);
                    } else {
                        setGuestProjects([]);
                    }
                }
            } catch (err) {
                console.error('Failed to fetch data:', err);
            } finally {
                setIsLoadingProfile(false);
            }
        };

        fetchData();
    }, [user, targetUserId, isGuestView]);

    const displayProjects = isGuestView ? guestProjects : myProjects;
    const displayTitle = isGuestView 
        ? (language === 'ko' ? `${displayName} 메이커` : `${displayName}'s Space`)
        : t.title;
    const displayLibrary = isGuestView
        ? (language === 'ko' ? '공개 프로젝트' : 'Public Projects')
        : t.myLibrary;

    const handleAvatarClick = () => {
        if (isEditing && !isGuestView) {
            fileInputRef.current?.click();
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const url = await uploadToR2(file, 'avatars');
            setAvatarUrl(url);
        } catch (error) {
            console.error('Failed to upload avatar:', error);
            showToast('Failed to upload image. Please try again.', 'error');
        } finally {
            setIsUploading(false);
        }
    };

    const handleSaveProfile = async () => {
        if (!user || isGuestView) return;

        try {
            // 1. PRIMARY SOURCE OF TRUTH (Database)
            const { error: profileError } = await supabase
                .from('user_profiles')
                .upsert({
                    user_id: user.id,
                    nickname: displayName,
                    avatar_url: avatarUrl
                }, {
                    onConflict: 'user_id'
                });

            if (profileError) {
                console.error('Error saving to user_profiles:', profileError);
                throw profileError;
            }

            // 2. Auth Metadata (for Header/Auth states)
            await supabase.auth.updateUser({
                data: {
                    full_name: displayName,
                    avatar_url: avatarUrl
                }
            });

            // 3. IMMEDIATE UI FEEDBACK
            // Signal App.tsx to refresh global user information (Sidebar/Header)
            if (onProfileUpdate) {
                onProfileUpdate();
            }
            
            setIsEditing(false);
            showToast(language === 'ko' ? '프로필이 저장되었습니다!' : 'Profile saved successfully!', 'success');

            // 4. BACKGROUND TASK: Sync historical posts
            // We do this without 'awaiting' to ensure the UI isn't blocked by O(N) database operations
            (async () => {
                const { data: userItems, error: fetchError } = await supabase
                    .from('items')
                    .select('id, metadata')
                    .eq('owner_id', user.id);

                if (!fetchError && userItems && userItems.length > 0) {
                    const updates = userItems.map(item => ({
                        id: item.id,
                        maker: displayName,
                        metadata: {
                            ...(item.metadata || {}),
                            maker_name: displayName,
                            maker_avatar_url: avatarUrl
                        }
                    }));

                    // Process in chunks or individually in background
                    await Promise.allSettled(updates.map(update =>
                        supabase
                            .from('items')
                            .update({
                                maker: update.maker,
                                metadata: update.metadata
                            })
                            .eq('id', update.id)
                    ));
                    console.log('Background profile sync completed for', userItems.length, 'items');
                }
            })().catch(err => console.error('Background profile sync error:', err));

        } catch (error) {
            console.error('Failed to update profile:', error);
            showToast('Failed to save profile. Please try again.', 'error');
        }
    };

    const handlePublish = async (projectId: string) => {
        if (window.confirm(t.confirmPublish)) {
            setPublishingProjectId(projectId);
            try {
                await onPublish(projectId);
            } finally {
                setPublishingProjectId(null);
            }
        }
    };

    const handleDelete = async (projectId: string) => {
        if (window.confirm(t.confirmDelete)) {
            setDeletingProjectId(projectId);
            try {
                await onDelete(projectId);
            } finally {
                setDeletingProjectId(null);
            }
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fade-in-up">
            {/* Minimal Header with Back Navigation */}
            <div className="flex justify-between items-center mb-12">
                <button
                    onClick={() => onNavigate('discovery', null)}
                    className="group flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
                >
                    <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center group-hover:bg-gray-200 dark:group-hover:bg-gray-700 transition-colors">
                        <span className="material-icons-round text-sm">arrow_back</span>
                    </div>
                    <span className="font-medium text-sm">{t.backToDiscovery}</span>
                </button>

                {!isGuestView && (
                    <button
                        onClick={onLogout}
                        className="text-sm font-medium text-red-500 hover:text-red-600 transition-colors"
                    >
                        {t.logout}
                    </button>
                )}
            </div>

            {/* Apple-style Identity Card */}
            <div className="flex flex-col items-center mb-16 relative">
                <div className="relative group">
                    <div
                        className={`w-32 h-32 rounded-full overflow-hidden border-4 border-white dark:border-gray-900 shadow-2xl ${isEditing && !isGuestView ? 'cursor-pointer ring-4 ring-blue-500/30' : ''} ${!avatarUrl ? 'bg-gradient-to-br from-blue-500 to-purple-600' : ''}`}
                        onClick={handleAvatarClick}
                    >
                        {avatarUrl ? (
                            <img 
                                src={avatarUrl} 
                                alt="Avatar" 
                                className="w-full h-full object-cover" 
                                onError={(e) => {
                                    const img = e.target as HTMLImageElement;
                                    img.style.display = 'none';
                                    const parent = img.parentElement;
                                    if (parent) {
                                        parent.classList.add('profile-avatar-fallback');
                                        parent.classList.add('bg-gradient-to-br', 'from-blue-500', 'to-purple-600');
                                    }
                                }}
                            />
                        ) : null}
                        <div className="absolute inset-0 items-center justify-center hidden [.profile-avatar-fallback_&]:flex">
                             <span className="text-4xl text-white font-bold">{displayName.charAt(0).toUpperCase()}</span>
                        </div>
                        {!avatarUrl && (
                            <div className="w-full h-full flex items-center justify-center text-4xl text-white font-bold">
                                {displayName.charAt(0).toUpperCase()}
                            </div>
                        )}

                        {/* Edit Overlay */}
                        {isEditing && !isGuestView && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[2px] transition-opacity">
                                <span className="material-icons-round text-white text-3xl">camera_alt</span>
                            </div>
                        )}
                    </div>

                    {/* Edit Button (Only for own profile) */}
                    {!isEditing && !isGuestView && (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="absolute bottom-1 right-1 w-8 h-8 bg-black dark:bg-white rounded-full flex items-center justify-center text-white dark:text-black shadow-lg hover:scale-110 transition-transform"
                        >
                            <span className="material-icons-round text-sm">edit</span>
                        </button>
                    )}
                </div>

                <div className="mt-6 text-center">
                    {isEditing && !isGuestView ? (
                        <div className="flex flex-col items-center gap-4 animate-fade-in">
                            <input
                                type="text"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                className="text-3xl font-bold text-center bg-transparent border-b-2 border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:outline-none pb-1 w-64 text-gray-900 dark:text-white"
                                placeholder="Nickname"
                                autoFocus
                            />
                            <div className="flex gap-3 mt-2">
                                <button
                                    onClick={() => {
                                        setIsEditing(false);
                                        setDisplayName(user?.user_metadata?.full_name || 'Maker');
                                    }}
                                    className="px-6 py-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-medium text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                >
                                    {t.cancel}
                                </button>
                                <button
                                    onClick={handleSaveProfile}
                                    disabled={isUploading || !displayName.trim()}
                                    className="px-6 py-2 rounded-full bg-black dark:bg-white text-white dark:text-black font-medium text-sm hover:scale-105 active:scale-95 transition-all shadow-lg"
                                >
                                    {isUploading ? t.uploading : t.save}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="animate-fade-in">
                            <div className="flex items-center justify-center gap-2 mb-2">
                                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{displayName}</h1>
                                {isGuestView && (
                                    <span className="material-icons-round text-primary text-xl">verified</span>
                                )}
                            </div>
                            <div className="flex items-center justify-center gap-6 text-gray-500 dark:text-gray-400 text-sm font-medium">
                                {!isGuestView && (
                                    <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center gap-1.5 border border-emerald-100 dark:border-emerald-800/50">
                                        <span className="material-icons-round text-sm">recycling</span>
                                        {userTokens}
                                    </span>
                                )}
                                <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full">
                                    {displayProjects.length}{t.projects}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                />
            </div>

            {/* Content Divider */}
            <div className="w-full border-t border-gray-100 dark:border-gray-800 mb-12"></div>

            {/* Minimal Library Grid */}
            <div>
                <div className="flex items-baseline justify-between mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{displayLibrary}</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {/* Render Loading State */}
                    {isLoadingProfile && isGuestView && (
                        <div className="col-span-full py-20 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 gap-4">
                            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                            <p className="font-medium">{t.searchingProjects}</p>
                        </div>
                    )}

                    {/* Render Empty State */}
                    {!isLoadingProfile && displayProjects.length === 0 && (
                        <div className="col-span-full py-20 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 gap-4 bg-gray-50 dark:bg-gray-800/50 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                            <span className="material-icons-round text-5xl opacity-20">folder_open</span>
                            <p className="font-medium">{t.noProjectsFound}</p>
                        </div>
                    )}

                    {/* New Project Card (Only for own profile) */}
                    {!isGuestView && !isLoadingProfile && (
                        <div
                            onClick={() => onNavigate('upload')}
                            className="aspect-[4/3] bg-white dark:bg-gray-800 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-primary/50 hover:bg-primary/5 transition-all flex flex-col items-center justify-center gap-4 cursor-pointer group"
                        >
                            <div className="w-14 h-14 rounded-2xl bg-gray-50 dark:bg-gray-700 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                                <span className="material-icons-round text-3xl">{t.createFirst}</span>
                            </div>
                            <span className="font-bold text-gray-500 dark:text-gray-400 group-hover:text-primary">{t.newProject}</span>
                        </div>
                    )}

                    {/* Project Items */}
                    {!isLoadingProfile && displayProjects.map((project) => (
                        <div key={project.id} className="group relative aspect-square">
                            <div
                                className="w-full h-full rounded-3xl overflow-hidden bg-gray-100 dark:bg-gray-800 shadow-sm transition-all duration-500 hover:shadow-xl cursor-pointer"
                                onClick={() => onProjectSelect(project)}
                            >
                                <img
                                    src={getOptimizedImageUrl(project.image, 400)}
                                    alt={project.title}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    loading="lazy"
                                />

                                {/* Hover Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-5">
                                    <h3 className="text-white font-bold truncate text-lg">{project.title}</h3>
                                    <p className="text-white/80 text-xs">{project.category} • {project.time}</p>
                                </div>
                            </div>

                            {/* Management Buttons (Only for own profile) */}
                            {!isGuestView && (
                                <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                                    {(deletingProjectId === project.id || publishingProjectId === project.id) ? (
                                        <div className="w-8 h-8 rounded-full bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm flex items-center justify-center">
                                            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                        </div>
                                    ) : (
                                        <>
                                            {!project.isPublic && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handlePublish(project.id); }}
                                                    className="h-8 px-3 rounded-full bg-primary text-white shadow-lg hover:scale-105 transition-all flex items-center gap-1.5 font-bold text-xs"
                                                    title={t.publish}
                                                >
                                                    <span className="material-icons-round text-sm">public</span>
                                                    {t.publish}
                                                </button>
                                            )}
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDelete(project.id); }}
                                                className="w-8 h-8 rounded-full bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm flex items-center justify-center text-black dark:text-white shadow-lg hover:bg-red-500 hover:text-white transition-colors"
                                                title={t.delete}
                                            >
                                                <span className="material-icons-round text-sm">delete</span>
                                            </button>
                                        </>
                                    )}
                                </div>
                            )}

                            {/* Status Badges */}
                            <div className="absolute top-3 left-3 flex gap-2">
                                {(project.isAiRemix || project.isAiIdea) && (
                                    <div className="w-6 h-6 rounded-full bg-white/30 backdrop-blur-md flex items-center justify-center border border-white/50 shadow-sm">
                                        <span className="material-icons-round text-white text-[10px]">auto_awesome</span>
                                    </div>
                                )}
                                {!project.isPublic && !isGuestView && (
                                    <div className="w-6 h-6 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-sm">
                                        <span className="material-icons-round text-white text-[10px]">lock</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    
                    {displayProjects.length === 0 && isGuestView && (
                        <div className="col-span-full py-12 text-center text-gray-500 dark:text-gray-400 italic">
                            {language === 'ko' ? '아직 공개된 프로젝트가 없습니다.' : 'No public projects yet.'}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Profile;
