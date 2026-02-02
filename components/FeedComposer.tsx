import React, { useState, useRef } from 'react';
import { User } from '@supabase/supabase-js';
import { config } from '../services/config';
import { Project } from '../types';

interface FeedComposerProps {
    user: User | null;
    onPostCreated: (post: Project) => void;
    onLoginClick: () => void;
}

const FeedComposer: React.FC<FeedComposerProps> = ({ user, onPostCreated, onLoginClick }) => {
    const [text, setText] = useState('');
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>('');
    const [isPosting, setIsPosting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedImage(file);
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handlePost = async () => {
        if (!user) {
            onLoginClick();
            return;
        }
        if (!text.trim() && !selectedImage) return;

        setIsPosting(true);
        try {
            // Dynamic imports
            const { createClient } = await import('@supabase/supabase-js');
            const { uploadToR2 } = await import('../services/r2Storage');

            const supabase = createClient(config.supabase.url, config.supabase.anonKey);

            let imageUrl = '';
            // 1. Upload Image if exists
            if (selectedImage) {
                try {
                    imageUrl = await uploadToR2(selectedImage, 'community-uploads');
                } catch (e) {
                    console.error("Image upload failed", e);
                    alert("Image upload failed");
                    setIsPosting(false);
                    return;
                }
            }

            // 2. Create Post Payload (Map to DB snake_case columns)
            // Title is first 20 chars of text
            const title = text.length > 30 ? text.substring(0, 30) + '...' : text;

            // Note: We use 'any' here because the DB schema uses snake_case, but our Types use camelCase.
            const dbPayload = {
                title: title || 'Social Post',
                // description: text, // REMOVED
                maker: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Anonymous',
                image_url: imageUrl,
                category: 'Social',
                difficulty: 'Easy',
                estimated_time: '0h',
                material: 'Mixed',
                owner_id: user.id, // mapped from ownerId
                is_public: true,   // mapped from isPublic
                metadata: {
                    content: text,
                    type: 'social_post',
                    images: imageUrl ? [imageUrl] : []
                }
                // likes, views, comments_count usually default to 0 in DB
            };

            // 3. Save to Supabase
            const { data, error } = await supabase
                .from('items')
                .insert(dbPayload)
                .select()
                .single();

            if (error) {
                console.error("Supabase Insert Error Detail:", JSON.stringify(error, null, 2));
                throw error;
            }

            if (data) {
                // Determine the correct object shape based on the response and Project type
                const createdPost: Project = {
                    id: data.id,
                    title: data.title,
                    maker: data.maker || 'User',
                    image: data.image || '',
                    category: data.category,
                    time: data.time || '0h',
                    difficulty: 'Easy',
                    likes: data.likes || 0,
                    commentsCount: data.comments_count || 0,
                    description: data.description,
                    metadata: data.metadata,
                };

                onPostCreated(createdPost);

                // Reset form
                setText('');
                setSelectedImage(null);
                setImagePreview('');
            }

        } catch (error: any) {
            console.error('Post failed:', error);
            alert(`Failed to post: ${error.message || JSON.stringify(error)}`);
        } finally {
            setIsPosting(false);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 mb-8">
            <div className="flex gap-4">
                <div className="flex-shrink-0">
                    {user?.user_metadata?.avatar_url ? (
                        <img
                            src={user.user_metadata.avatar_url}
                            alt="User"
                            className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-gray-700"
                        />
                    ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500">
                            <span className="material-icons-round">person</span>
                        </div>
                    )}
                </div>
                <div className="flex-1">
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder={user ? "What's on your mind, Maker? Share your idea..." : "Login to share your ideas..."}
                        className="w-full bg-transparent border-none focus:ring-0 text-gray-900 dark:text-gray-100 text-lg placeholder-gray-400 resize-none min-h-[60px]"
                        disabled={!user || isPosting}
                    />

                    {imagePreview && (
                        <div className="relative mt-2 mb-4 w-fit group">
                            <img src={imagePreview} alt="Preview" className="h-48 rounded-xl object-cover border border-gray-200 dark:border-gray-700" />
                            <button
                                onClick={() => { setSelectedImage(null); setImagePreview(''); }}
                                className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors opacity-0 group-hover:opacity-100"
                            >
                                <span className="material-icons-round text-sm">close</span>
                            </button>
                        </div>
                    )}

                    <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800 mt-2">
                        <div className="flex gap-2">
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={!user || isPosting}
                                className="flex items-center gap-2 px-3 py-2 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors"
                            >
                                <span className="material-icons-round text-primary text-xl">image</span>
                                <span className="text-sm font-medium">Photo</span>
                            </button>
                        </div>
                        <button
                            onClick={handlePost}
                            disabled={!user || isPosting || (!text.trim() && !selectedImage)}
                            className="px-6 py-2 bg-primary hover:bg-primary-dark text-white rounded-full font-bold shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isPosting && <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>}
                            Post
                        </button>
                    </div>
                </div>
            </div>

            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleImageSelect}
            />
        </div>
    );
};

export default FeedComposer;
