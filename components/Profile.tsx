import React, { useState, useRef, useEffect } from 'react';
import { Project } from '../types';
import { Language } from '../App';
import { User, createClient } from '@supabase/supabase-js';
import { getOptimizedImageUrl } from '../utils/imageOptimizer';
import { uploadToR2 } from '../services/r2Storage';
import { config } from '../services/config';

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
        logout: '로그아웃'
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
        logout: 'Log Out'
    }
};

const supabase = createClient(config.supabase.url, config.supabase.anonKey);

const Profile: React.FC<ProfileProps> = ({
    onNavigate,
    onProjectSelect,
    isDarkMode,
    language,
    user,
    onLogout,
    userTokens,
    myProjects,
    onPublish,
    onDelete
}) => {
    const t = TRANSLATIONS[language];

    // Edit Mode State
    const [isEditing, setIsEditing] = useState(false);
    const [displayName, setDisplayName] = useState(user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Maker');
    const [avatarUrl, setAvatarUrl] = useState(user?.user_metadata?.avatar_url || '');
    const [isUploading, setIsUploading] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Sync state with user prop
    useEffect(() => {
        if (user) {
            setDisplayName(user.user_metadata?.full_name || user.email?.split('@')[0] || 'Maker');
            setAvatarUrl(user.user_metadata?.avatar_url || '');
        }
    }, [user]);

    const handleAvatarClick = () => {
        if (isEditing) {
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
            alert('Failed to upload image. Please try again.');
        } finally {
            setIsUploading(false);
        }
    };

    const handleSaveProfile = async () => {
        if (!user) return;

        try {
            // 1. Update Auth User Metadata
            const { error: authError } = await supabase.auth.updateUser({
                data: {
                    full_name: displayName, // Store "Nickname" as full_name
                    avatar_url: avatarUrl
                }
            });

            if (authError) throw authError;

            // 2. Sync changes to all historical posts in 'items' table
            // We need to update 'maker' column and 'metadata.maker_avatar_url'
            // Since we can't easily partial update JSONB for all rows without a function,
            // we will primarily update the 'maker' column which is the source of truth for name.
            // For avatar, we will attempt to update it if the column exists or in metadata.

            // Fetch all items by this user to update their metadata efficiently
            const { data: userItems, error: fetchError } = await supabase
                .from('items')
                .select('id, metadata')
                .eq('owner_id', user.id);

            if (!fetchError && userItems) {
                const updates = userItems.map(item => ({
                    id: item.id,
                    maker: displayName, // Update top-level maker column
                    metadata: {
                        ...item.metadata,
                        maker_avatar_url: avatarUrl // Sync avatar to metadata
                    }
                }));

                // Batch execute updates? Supabase JS doesn't support bulk update with different values easily yet.
                // But here all values are the same (except preserving existing metadata).
                // Actually, we can use a loop or Promise.all. For 100 items it's fine.
                // Optimization: We can just run one UPDATE query if we don't care about preserving *unique* unknown metadata keys,
                // BUT we DO care. So we must preserve existing metadata.

                // Better approach: Use SQL function or just loop. 
                // Let's loop for now, it's safer for preserving data integrity.
                await Promise.all(updates.map(update =>
                    supabase
                        .from('items')
                        .update({
                            maker: update.maker,
                            metadata: update.metadata
                        })
                        .eq('id', update.id)
                ));
            }

            setIsEditing(false);
            // Optional: Force reload or notify parent to refresh
            window.location.reload(); // Simple way to refresh all components with new data
        } catch (error) {
            console.error('Failed to update profile:', error);
            alert('Failed to save profile. Please try again.');
        }
    };

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fade-in-up">
            {/* Minimal Header with Back Navigation */}
            <div className="flex justify-between items-center mb-12">
                <button
                    onClick={() => onNavigate('discovery')}
                    className="group flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
                >
                    <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center group-hover:bg-gray-200 dark:group-hover:bg-gray-700 transition-colors">
                        <span className="material-icons-round text-sm">arrow_back</span>
                    </div>
                    <span className="font-medium text-sm">{t.backToDiscovery}</span>
                </button>

                <button
                    onClick={onLogout}
                    className="text-sm font-medium text-red-500 hover:text-red-600 transition-colors"
                >
                    {t.logout}
                </button>
            </div>

            {/* Apple-style Identity Card */}
            <div className="flex flex-col items-center mb-16 relative">
                <div className="relative group">
                    <div
                        className={`w-32 h-32 rounded-full overflow-hidden border-4 border-white dark:border-gray-900 shadow-2xl ${isEditing ? 'cursor-pointer ring-4 ring-blue-500/30' : ''}`}
                        onClick={handleAvatarClick}
                    >
                        {avatarUrl ? (
                            <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-4xl text-white font-bold">
                                {displayName.charAt(0).toUpperCase()}
                            </div>
                        )}

                        {/* Edit Overlay */}
                        {isEditing && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[2px] transition-opacity">
                                <span className="material-icons-round text-white text-3xl">camera_alt</span>
                            </div>
                        )}
                    </div>

                    {/* Status Indicator */}
                    {!isEditing && (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="absolute bottom-1 right-1 w-8 h-8 bg-black dark:bg-white rounded-full flex items-center justify-center text-white dark:text-black shadow-lg hover:scale-110 transition-transform"
                        >
                            <span className="material-icons-round text-sm">edit</span>
                        </button>
                    )}
                </div>

                <div className="mt-6 text-center">
                    {isEditing ? (
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
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{displayName}</h1>
                            <div className="flex items-center justify-center gap-6 text-gray-500 dark:text-gray-400 text-sm font-medium">
                                <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full">
                                    {userTokens} Tokens
                                </span>
                                <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full">
                                    {myProjects.length} Projects
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
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t.myLibrary}</h2>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {/* Add New Project Card */}
                    <button
                        onClick={() => onNavigate('discovery')}
                        className="group aspect-square rounded-3xl bg-gray-50 dark:bg-gray-800/50 border-2 border-dashed border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-300"
                    >
                        <div className="w-12 h-12 rounded-full bg-white dark:bg-gray-700 shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                            <span className="material-icons-round text-2xl text-gray-400 dark:text-gray-300 group-hover:text-primary">add</span>
                        </div>
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">New Project</span>
                    </button>

                    {/* Project Items */}
                    {myProjects.map((project) => (
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

                            {/* Minimal Action Menu (Visible on Hover/Edit) */}
                            <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                                {!project.isPublic && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handlePublish(project.id); }}
                                        className="w-8 h-8 rounded-full bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm flex items-center justify-center text-black dark:text-white shadow-lg hover:bg-green-500 hover:text-white transition-colors"
                                        title={t.publish}
                                    >
                                        <span className="material-icons-round text-sm">public</span>
                                    </button>
                                )}
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleDelete(project.id); }}
                                    className="w-8 h-8 rounded-full bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm flex items-center justify-center text-black dark:text-white shadow-lg hover:bg-red-500 hover:text-white transition-colors"
                                    title={t.delete}
                                >
                                    <span className="material-icons-round text-sm">delete</span>
                                </button>
                            </div>

                            {/* Status Badges (Always Visible if needed, minimal style) */}
                            <div className="absolute top-3 left-3 flex gap-2">
                                {(project.isAiRemix || project.isAiIdea) && (
                                    <div className="w-6 h-6 rounded-full bg-white/30 backdrop-blur-md flex items-center justify-center border border-white/50 shadow-sm">
                                        <span className="material-icons-round text-white text-[10px]">auto_awesome</span>
                                    </div>
                                )}
                                {!project.isPublic && (
                                    <div className="w-6 h-6 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-sm">
                                        <span className="material-icons-round text-white text-[10px]">lock</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Profile;
