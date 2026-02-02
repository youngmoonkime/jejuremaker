

import React, { useState, useEffect } from 'react';
import { Language } from '../App';
import { User, createClient } from '@supabase/supabase-js';
import { config } from '../services/config';
import { Project, SocialPost } from '../types';
import FeedComposer from './FeedComposer';

interface CommunityProps {
    onNavigate: (view: 'discovery' | 'detail' | 'workspace' | 'upload' | 'trending' | 'community') => void;
    isDarkMode: boolean;
    toggleDarkMode: () => void;
    language: Language;
    toggleLanguage: () => void;
    user: User | null;
    onLoginClick: (target?: any) => void;
    onLogout: () => void;
}

const TRANSLATIONS = {
    ko: {
        title: '제주 리메이커',
        hubTitle: '커뮤니티 허브',
        hubSubtitle: '업사이클링 여정을 공유하고 다른 사람들에게 영감을 주세요.',
        activeChallenges: '진행 중인 챌린지',
        loadMore: '더 보기',
        challenges: {
            kitchen: {
                title: '제로 웨이스트 주방 주간',
                desc: '주방 쓰레기와 포장재를 기능적인 도구로 재탄생시켜보세요.',
                ending: '2일 후 종료',
                join: '참여하기'
            },
            beach: {
                title: '제주 해변 플라스틱 챌린지',
                desc: '해안가 플라스틱을 예술이나 도구로 바꿔보세요. 함께 해변을 청소해요!',
                tag: 'NEW',
                join: '참여하기'
            }
        }
    },
    en: {
        title: 'Jeju Re-Maker',
        hubTitle: 'Community Hub',
        hubSubtitle: 'Share your upcycled journey and inspire others.',
        activeChallenges: 'Active Challenges',
        loadMore: 'Load more',
        challenges: {
            kitchen: {
                title: 'Zero-Waste Kitchen Week',
                desc: 'Reimagine your kitchen scraps and packaging into functional tools.',
                ending: 'Ending in 2 days',
                join: 'Join'
            },
            beach: {
                title: 'Jeju Beach Plastic Challenge',
                desc: 'Turn washed-up plastics into art or utility. Let\'s clean the coast!',
                tag: 'New',
                join: 'Join'
            }
        }
    }
};

const Community: React.FC<CommunityProps> = ({ onNavigate, language, user, onLoginClick }) => {
    const t = TRANSLATIONS[language];
    const [feedItems, setFeedItems] = useState<SocialPost[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
    const [commentText, setCommentText] = useState<{ [key: string]: string }>({});
    const [isSubmittingComment, setIsSubmittingComment] = useState<string | null>(null);

    // Initial Fetch
    useEffect(() => {
        fetchFeed();
    }, []);

    const fetchFeed = async () => {
        setIsLoading(true);
        try {
            const supabase = createClient(config.supabase.url, config.supabase.anonKey);

            // Fetch items, sort by created_at desc
            const { data, error } = await supabase
                .from('items')
                .select('*')
                .eq('category', 'Social')
                .order('created_at', { ascending: false })
                .limit(20);

            if (data) {
                // Map to SocialPost type
                const posts: SocialPost[] = data.map(item => ({
                    id: item.id,
                    title: item.title,
                    maker: item.maker || 'User',
                    image: item.image_url || item.image || '',
                    category: item.category,
                    time: new Date(item.created_at).toLocaleDateString(),
                    difficulty: item.difficulty || 'Easy',
                    likes: item.likes || 0,
                    commentsCount: item.metadata?.comments?.length || 0, // Read length from metadata
                    description: item.description || item.metadata?.content || item.metadata?.description,
                    metadata: item.metadata || {}, // Ensure metadata exists
                    ownerId: item.owner_id
                }));
                setFeedItems(posts);
            }
        } catch (err) {
            console.error("Feed fetch error", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePostCreated = (newPost: SocialPost) => {
        setFeedItems([newPost, ...feedItems]);
    };

    const handleLike = async (postId: string, currentLikes: number) => {
        // Optimistic UI Update
        const updatedFeed = feedItems.map(item =>
            item.id === postId ? { ...item, likes: (item.likes || 0) + 1 } : item
        );
        setFeedItems(updatedFeed);

        // API Call (Fire and forget)
        const supabase = createClient(config.supabase.url, config.supabase.anonKey);
        await supabase.from('items').update({ likes: currentLikes + 1 }).eq('id', postId);
    };

    const toggleComments = (postId: string) => {
        const newSet = new Set(expandedComments);
        if (newSet.has(postId)) {
            newSet.delete(postId);
        } else {
            newSet.add(postId);
        }
        setExpandedComments(newSet);
    };

    const handleCommentChange = (postId: string, text: string) => {
        setCommentText({ ...commentText, [postId]: text });
    };

    const handleSubmitComment = async (postId: string) => {
        const text = commentText[postId]?.trim();
        if (!text || !user) return;

        setIsSubmittingComment(postId);
        try {
            // 1. Create Comment Object
            const newComment = {
                id: Date.now().toString(),
                userId: user.id,
                userName: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
                userAvatar: user.user_metadata?.avatar_url,
                text: text,
                createdAt: new Date().toISOString()
            };

            // 2. Find post and append comment locally
            const postIndex = feedItems.findIndex(p => p.id === postId);
            if (postIndex === -1) return;

            const post = feedItems[postIndex];
            const currentComments = post.metadata?.comments || [];
            const updatedComments = [...currentComments, newComment];
            const updatedMetadata = { ...post.metadata, comments: updatedComments };

            // 3. Optimistic Update
            const updatedFeed = [...feedItems];
            updatedFeed[postIndex] = {
                ...post,
                metadata: updatedMetadata,
                commentsCount: updatedComments.length
            };
            setFeedItems(updatedFeed);
            setCommentText({ ...commentText, [postId]: '' });

            // 4. Update Supabase
            const supabase = createClient(config.supabase.url, config.supabase.anonKey);
            const { error } = await supabase
                .from('items')
                .update({ metadata: updatedMetadata }) // Update the JSONB column
                .eq('id', postId);

            if (error) {
                console.error("Comment update failed", error);
                // Revert if needed, but for MVP we alert
                alert("Failed to save comment.");
            }

        } catch (e) {
            console.error("Comment error", e);
        } finally {
            setIsSubmittingComment(null);
        }
    };

    // Comment Editing State
    const [editingComment, setEditingComment] = useState<{ postId: string, commentId: string } | null>(null);
    const [editCommentContent, setEditCommentContent] = useState('');

    const startEditingComment = (postId: string, comment: any) => {
        setEditingComment({ postId, commentId: comment.id });
        setEditCommentContent(comment.text);
    };

    const cancelEditingComment = () => {
        setEditingComment(null);
        setEditCommentContent('');
    };

    const handleDeleteComment = async (postId: string, commentId: string) => {
        if (!window.confirm("Delete this comment?")) return;

        const postIndex = feedItems.findIndex(p => p.id === postId);
        if (postIndex === -1) return;

        const post = feedItems[postIndex];
        const updatedComments = (post.metadata?.comments || []).filter((c: any) => c.id !== commentId);
        const updatedMetadata = { ...post.metadata, comments: updatedComments };

        // Optimistic Update
        const updatedFeed = [...feedItems];
        updatedFeed[postIndex] = { ...post, metadata: updatedMetadata, commentsCount: updatedComments.length };
        setFeedItems(updatedFeed);

        const supabase = createClient(config.supabase.url, config.supabase.anonKey);
        const { error } = await supabase
            .from('items')
            .update({ metadata: updatedMetadata })
            .eq('id', postId);

        if (error) {
            console.error("Delete comment failed", error);
            alert("Failed to delete comment.");
            setFeedItems(feedItems); // Revert
        }
    };

    const handleUpdateComment = async (postId: string) => {
        if (!editingComment || !editCommentContent.trim()) return;

        const postIndex = feedItems.findIndex(p => p.id === postId);
        if (postIndex === -1) return;

        const post = feedItems[postIndex];
        const updatedComments = (post.metadata?.comments || []).map((c: any) => {
            if (c.id === editingComment.commentId) {
                return { ...c, text: editCommentContent };
            }
            return c;
        });
        const updatedMetadata = { ...post.metadata, comments: updatedComments };

        // Optimistic Update
        const updatedFeed = [...feedItems];
        updatedFeed[postIndex] = { ...post, metadata: updatedMetadata };
        setFeedItems(updatedFeed);

        setEditingComment(null);

        const supabase = createClient(config.supabase.url, config.supabase.anonKey);
        const { error } = await supabase
            .from('items')
            .update({ metadata: updatedMetadata })
            .eq('id', postId);

        if (error) {
            console.error("Update comment failed", error);
            alert("Failed to update comment.");
            // Revert
        }
    };

    // Edit/Delete State (Post)
    const [editingPostId, setEditingPostId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState('');
    const [actionMenuOpenId, setActionMenuOpenId] = useState<string | null>(null);

    const toggleActionMenu = (postId: string) => {
        if (actionMenuOpenId === postId) {
            setActionMenuOpenId(null);
        } else {
            setActionMenuOpenId(postId);
        }
    };

    const startEditing = (post: SocialPost) => {
        setEditingPostId(post.id);
        setEditContent(post.description || post.title || ''); // Use description as primary content
        setActionMenuOpenId(null);
    };

    const cancelEditing = () => {
        setEditingPostId(null);
        setEditContent('');
    };

    const handleDeletePost = async (postId: string) => {
        if (!window.confirm("Are you sure you want to delete this post?")) return;

        // Optimistic Update
        const previousFeed = [...feedItems];
        setFeedItems(feedItems.filter(p => p.id !== postId));

        const supabase = createClient(config.supabase.url, config.supabase.anonKey);
        const { error } = await supabase.from('items').delete().eq('id', postId);

        if (error) {
            console.error("Delete failed", error);
            alert("Failed to delete post.");
            setFeedItems(previousFeed); // Revert
        }
    };

    const handleUpdatePost = async (postId: string) => {
        if (!editContent.trim()) return;

        // Optimistic Update
        const previousFeed = [...feedItems];
        const updatedFeed = feedItems.map(p => {
            if (p.id === postId) {
                return { ...p, description: editContent, title: editContent }; // Update displayed content
            }
            return p;
        });
        setFeedItems(updatedFeed);
        setEditingPostId(null);

        const supabase = createClient(config.supabase.url, config.supabase.anonKey);

        // Fetch current metadata to preserve it
        const post = feedItems.find(p => p.id === postId);
        const currentMetadata = post?.metadata || {};

        const { error } = await supabase
            .from('items')
            .update({
                description: editContent,
                // Skip title update if it causes issues, or truncate safely
                title: editContent.substring(0, 50),
                metadata: { ...currentMetadata, content: editContent }
            })
            .eq('id', postId);

        if (error) {
            console.error("Update failed", error);
            alert(`Failed to update post: ${error.message || JSON.stringify(error)}`);
            setFeedItems(previousFeed); // Revert
        }
    };

    return (
        <div>
            {/* Header */}
            <div className="mb-10 text-center md:text-left">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">{t.hubTitle}</h1>
                <p className="text-lg text-muted-light dark:text-muted-dark font-light">{t.hubSubtitle}</p>
            </div>

            {/* Challenges Carousel */}
            <div className="mb-12">
                <div className="flex items-center justify-between mb-4 px-1">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t.activeChallenges}</h2>
                    {/* Navigation buttons... */}
                </div>
                <div className="flex gap-6 overflow-x-auto pb-6 -mx-6 px-6 hide-scrollbar snap-x">
                    {/* Static Challenge Cards for Demo */}
                    <div className="min-w-[340px] md:min-w-[400px] h-64 rounded-3xl relative overflow-hidden group snap-start cursor-pointer shadow-soft">
                        <img alt="Kitchen Challenge" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCApCDGbAHCEjCS_6QtOjIrDK6gXNFE80PgPbC-OFpipS8vgyPyBfuM4cyy0i_hiZ7lgxovLATSoj4HF6K7VNBSilJJQ2s9VhPvSHVNxmEsTfVTbZ4EFlK6zSO50JYPgsvPQyzXnrx8l92hZJY6K5nPxm8IPE2W90OKUDUY6RJ-w9Hxt3q_WAVO3MamPsVJAYEKEw35uS60fNtodlYREf_xj1coAplnJ-SCmKQzfY6kADsiab0wtcok3Ctu1SSXs1fJ9R9_XDirbdI" loading="lazy" decoding="async" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                        <div className="absolute top-4 left-4 bg-white/20 backdrop-blur-md border border-white/30 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                            {t.challenges.kitchen.ending}
                        </div>
                        <div className="absolute bottom-0 p-6 w-full">
                            <h3 className="text-2xl font-bold text-white mb-1">{t.challenges.kitchen.title}</h3>
                            <p className="text-gray-300 text-sm mb-4 line-clamp-2">{t.challenges.kitchen.desc}</p>
                            <span className="px-4 py-2 bg-white text-gray-900 rounded-xl text-sm font-bold group-hover:bg-primary group-hover:text-white transition-colors">{t.challenges.kitchen.join}</span>
                        </div>
                    </div>
                    <div className="min-w-[340px] md:min-w-[400px] h-64 rounded-3xl relative overflow-hidden group snap-start cursor-pointer shadow-soft">
                        <img alt="Beach Cleanup Challenge" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCVQHmmS6kEqwz9kbWlPRhdyy0rta4aHB3GAgK5Rm_Qn8cb3YVvFE_AFKoQxAy6eIUhnKcvD0ObXAigxK1BXehW9yFwrQTZyEDYslhE6bU6NnjaEr1HEeUwZ0raaBM2qGGcSGpOm3sTBZmH3Fv14XlpRwZkMJ6kOdSxOkearaFWYepnSc8NbJOpnhPBFGTwpju8j0-Ya9eTYL7vBbJekMVO1pl53Yp0dc0jlW6Wph2dNUDIQPVdyr5HGMvKYU0l4ZUuLaHpHLFQHjI" loading="lazy" decoding="async" />
                        <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/90 via-emerald-900/20 to-transparent"></div>
                        <div className="absolute top-4 left-4 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide shadow-lg">
                            {t.challenges.beach.tag}
                        </div>
                        <div className="absolute bottom-0 p-6 w-full">
                            <h3 className="text-2xl font-bold text-white mb-1">{t.challenges.beach.title}</h3>
                            <p className="text-emerald-100 text-sm mb-4 line-clamp-2">{t.challenges.beach.desc}</p>
                            <span className="px-4 py-2 bg-white text-gray-900 rounded-xl text-sm font-bold group-hover:bg-emerald-500 group-hover:text-white transition-colors">{t.challenges.beach.join}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Feed Layout */}
            <div className="max-w-4xl mx-auto">
                <FeedComposer user={user} onPostCreated={handlePostCreated} onLoginClick={onLoginClick} />

                <div className="space-y-8">
                    {isLoading && <div className="text-center py-10">Loading feed...</div>}

                    {feedItems.map((post) => (
                        <div key={post.id} className="bg-white dark:bg-surface-darker rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 relative">
                            <div className="flex justify-between items-center mb-4">
                                <div className="flex items-center gap-3">
                                    {post.metadata?.maker_avatar_url ? (
                                        <img
                                            src={post.metadata.maker_avatar_url}
                                            alt={post.maker}
                                            className="w-10 h-10 rounded-full object-cover border border-gray-100 dark:border-gray-700"
                                        />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                                            {post.maker.charAt(0)}
                                        </div>
                                    )}
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-gray-900 dark:text-white">{post.maker}</span>
                                            {post.metadata?.type === 'social_post' && <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">Community</span>}
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-muted-light dark:text-muted-dark">
                                            <span>{post.time}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Edit/Delete Menu - Only for Owner */}
                                {user && user.id === post.ownerId && (
                                    <div className="relative">
                                        <button
                                            onClick={() => toggleActionMenu(post.id)}
                                            className="text-muted-light hover:text-gray-900 dark:hover:text-white w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                        >
                                            <span className="material-icons-round">more_horiz</span>
                                        </button>

                                        {actionMenuOpenId === post.id && (
                                            <div className="absolute right-0 top-full mt-2 w-32 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 z-10 overflow-hidden animate-fade-in">
                                                <button
                                                    onClick={() => startEditing(post)}
                                                    className="w-full text-left px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                                                >
                                                    <span className="material-icons-round text-sm">edit</span>
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDeletePost(post.id)}
                                                    className="w-full text-left px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 flex items-center gap-2"
                                                >
                                                    <span className="material-icons-round text-sm">delete</span>
                                                    Delete
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="mb-4">
                                {editingPostId === post.id ? (
                                    <div className="animate-fade-in">
                                        <textarea
                                            value={editContent}
                                            onChange={(e) => setEditContent(e.target.value)}
                                            className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none text-base"
                                            rows={4}
                                            autoFocus
                                        />
                                        <div className="flex justify-end gap-2 mt-2">
                                            <button
                                                onClick={cancelEditing}
                                                className="px-3 py-1.5 text-xs font-bold text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={() => handleUpdatePost(post.id)}
                                                className="px-4 py-1.5 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary-dark transition-colors"
                                            >
                                                Save
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-gray-800 dark:text-gray-200 text-base leading-relaxed mb-4 whitespace-pre-wrap">
                                        {post.description || post.title}
                                    </p>
                                )}

                                {post.image && (
                                    <div className="rounded-2xl overflow-hidden mb-4 bg-gray-100 dark:bg-gray-800">
                                        <img alt={post.title} className="w-full h-auto max-h-[500px] object-cover" src={post.image} loading="lazy" />
                                    </div>
                                )}

                                {/* If it's a Project/Refurbish, show blueprint or remix data */}
                                {post.category !== 'Social' && post.metadata?.blueprint_url && (
                                    <div className="flex items-center gap-4 bg-gray-50 dark:bg-background-dark rounded-xl p-3 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors border border-gray-100 dark:border-gray-700/50 cursor-pointer">
                                        <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gray-200">
                                            <img alt="Blueprint" className="w-full h-full object-cover opacity-80" src={post.metadata.blueprint_url} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-xs font-semibold text-primary mb-0.5">PROJECT BLUEPRINT</div>
                                            <h4 className="font-bold text-gray-900 dark:text-white text-sm truncate">{post.title}</h4>
                                            <p className="text-xs text-muted-light dark:text-muted-dark truncate">View fabrication steps</p>
                                        </div>
                                        <span className="material-icons-round text-muted-light">chevron_right</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
                                <div className="flex items-center gap-6">
                                    <button
                                        onClick={() => handleLike(post.id, post.likes || 0)}
                                        className="flex items-center gap-2 text-muted-light hover:text-primary transition-colors group"
                                    >
                                        <span className="material-icons-round group-hover:scale-110 transition-transform">thumb_up</span>
                                        <span className="text-sm font-medium">{post.likes || 0}</span>
                                    </button>
                                    <button
                                        onClick={() => toggleComments(post.id)}
                                        className={`flex items-center gap-2 transition-colors group ${expandedComments.has(post.id) ? 'text-blue-500' : 'text-muted-light hover:text-blue-500'}`}
                                    >
                                        <span className="material-icons-round group-hover:scale-110 transition-transform">chat_bubble_outline</span>
                                        <span className="text-sm font-medium">{post.commentsCount || 0}</span>
                                    </button>
                                </div>
                                <button className="text-muted-light hover:text-gray-900 dark:hover:text-white transition-colors">
                                    <span className="material-icons-round">share</span>
                                </button>
                            </div>

                            {/* Comment Section */}
                            {expandedComments.has(post.id) && (
                                <div className="mt-4 pt-4 border-t border-gray-50 dark:border-gray-800/50">
                                    {/* List Comments */}
                                    {post.metadata?.comments && post.metadata.comments.length > 0 ? (
                                        <div className="space-y-4 mb-6">
                                            {post.metadata.comments.map((comment: any, idx: number) => (
                                                <div key={idx} className="flex gap-3 relative group">
                                                    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0 overflow-hidden">
                                                        {comment.userAvatar ? (
                                                            <img src={comment.userAvatar} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-500">{comment.userName?.charAt(0)}</div>
                                                        )}
                                                    </div>

                                                    <div className="flex-1 bg-gray-50 dark:bg-gray-800/50 rounded-2xl rounded-tl-none p-3">
                                                        <div className="flex justify-between items-baseline mb-1">
                                                            <span className="text-sm font-bold text-gray-900 dark:text-white">{comment.userName}</span>
                                                            <span className="text-[10px] text-gray-400">
                                                                {new Date(comment.createdAt).toLocaleDateString()}
                                                                {/* Edit/Delete for Comment Owner */}
                                                                {user && user.id === comment.userId && (
                                                                    <div className="inline-flex ml-2 gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                        <button
                                                                            onClick={() => startEditingComment(post.id, comment)}
                                                                            className="text-gray-400 hover:text-blue-500" title="Edit"
                                                                        >
                                                                            <span className="material-icons-round text-xs">edit</span>
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleDeleteComment(post.id, comment.id)}
                                                                            className="text-gray-400 hover:text-red-500" title="Delete"
                                                                        >
                                                                            <span className="material-icons-round text-xs">delete</span>
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </span>
                                                        </div>

                                                        {editingComment?.commentId === comment.id ? (
                                                            <div className="mt-1">
                                                                <input
                                                                    type="text"
                                                                    value={editCommentContent}
                                                                    onChange={(e) => setEditCommentContent(e.target.value)}
                                                                    className="w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1 text-sm focus:ring-2 focus:ring-primary/20"
                                                                    autoFocus
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === 'Enter') handleUpdateComment(post.id);
                                                                    }}
                                                                />
                                                                <div className="flex gap-2 mt-2 justify-end">
                                                                    <button
                                                                        onClick={cancelEditingComment}
                                                                        className="text-xs text-gray-500 hover:text-gray-700"
                                                                    >
                                                                        Cancel
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleUpdateComment(post.id)}
                                                                        className="text-xs bg-primary text-white px-2 py-1 rounded-md"
                                                                    >
                                                                        Save
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{comment.text}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-center text-gray-400 text-sm py-4">No comments yet. Be the first!</p>
                                    )}

                                    {/* Add Comment Input */}
                                    <div className="flex gap-3">
                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex-shrink-0 flex items-center justify-center text-primary font-bold text-xs">
                                            {user?.user_metadata?.full_name?.charAt(0) || 'Me'}
                                        </div>
                                        <div className="flex-1 relative">
                                            <input
                                                type="text"
                                                value={commentText[post.id] || ''}
                                                onChange={(e) => handleCommentChange(post.id, e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' && !e.shiftKey) {
                                                        e.preventDefault();
                                                        handleSubmitComment(post.id);
                                                    }
                                                }}
                                                placeholder={user ? "Write a comment..." : "Login to comment"}
                                                disabled={!user || isSubmittingComment === post.id}
                                                className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 transition-all pr-10"
                                            />
                                            <button
                                                onClick={() => handleSubmitComment(post.id)}
                                                disabled={!user || !commentText[post.id]?.trim() || isSubmittingComment === post.id}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 text-primary hover:text-primary-dark disabled:text-gray-300 transition-colors p-1"
                                            >
                                                <span className="material-icons-round text-lg">send</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <div className="mt-16 flex justify-center pb-12">
                    <button onClick={fetchFeed} className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 rounded-full bg-white dark:bg-surface-darker border border-gray-200 dark:border-gray-700 flex items-center justify-center text-primary shadow-soft hover:scale-110 transition-transform">
                            <span className="material-icons-round animate-bounce">arrow_downward</span>
                        </div>
                        <span className="text-xs font-medium text-muted-light">{t.loadMore}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Community;
