import React, { useState, useEffect } from 'react';
import { createClient, User } from '@supabase/supabase-js';
import Discovery from './components/Discovery';
import ProjectDetail from './components/ProjectDetail';
import Workspace from './components/Workspace';
import AdminUpload from './components/AdminUpload';
import Trending from './components/Trending';
import Community from './components/Community';
import AuthModal from './components/AuthModal';
import Profile from './components/Profile';
import { Project } from './types';

// Supabase Configuration
const supabaseUrl = 'https://jbkfsvinitavzyflcuwg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impia2ZzdmluaXRhdnp5ZmxjdXdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0MDAxOTUsImV4cCI6MjA4NDk3NjE5NX0.Nn3_-8Oky-yZ7VwFiiWbhxKdWfqOSz1ddj93fztfMak';
const supabase = createClient(supabaseUrl, supabaseKey);

type ViewState = 'discovery' | 'detail' | 'workspace' | 'upload' | 'trending' | 'community' | 'profile';
export type Language = 'ko' | 'en';

const INITIAL_PROJECTS: Project[] = [
  { id: 'static-1', title: 'Woven Denim Lounge Chair', maker: 'Sarah Jenkins', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCtuenibBf4tw0iA0QWK8b6MCSPdrIgd9OKyJFEM3Q1RZjfbdUV5IdvWoTr3iwlxvRv7B2cLyEVdYNtgm8ddX8ATCWblrjXyz3i8jkgVPeyDK4fkz9iYlwxoRL87lbw1aWnJ2Mr3Vjee0NQTCLC5wOSWUN7uQAMVoJW4DUQUaC5ogiHbuKIjW9T0dMbLTnY2OeYVTLb0dFN0S_QSbmDHLoc2-8Htk-PBcoWvLEaXmuMvLddz3lhrEALUEfbgz0Bf79PtYDSrLIc84U', category: 'Textile', time: '4h 30m', difficulty: 'Easy', isAiRemix: true, description: 'An ergonomic lounge chair woven from discarded denim strips.', steps: [{ title: 'Frame', desc: 'Build frame from wood.' }, { title: 'Weaving', desc: 'Weave denim strips.' }], likes: 620, views: 3200, createdAt: '2026-01-28T10:00:00Z' },
  { id: 'static-2', title: 'Minimalist Pallet Coffee Table', maker: 'WoodWorkStudio', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDtfkCp1u6RQE75IVa1qBK32C6pkRhi_PH7cCop_nLGn1AJzuIT2NqbxN3xYFzGlSG5iMaECKw8rR-g-rwEfhmKPElX1u7y9pUVSXtX2Mm6SGUOmqXZXzz0jmRzh7-t5REfwx67KwSY-8O35EhrDKkvFoeG_cFfhiPg5T1_G0wQ-I62haamEoI0pimhPN_dipCKopy86n4sjsWh610Q3OQaytpYR4o_dxHMh9XGT9FbwxYW17UmqN_HwBJ75w2Sr7jj-o43G4eec6I', category: 'Wood', time: '12h', difficulty: 'Medium', description: 'Simple coffee table made from reclaimed pallets.', likes: 340, views: 1850, createdAt: '2026-01-26T14:30:00Z' },
  { id: 'static-3', title: 'Geometric Glass Bottle Lamp', maker: 'EcoLightz', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAlS4kFqDJmMraQ5iv0a245PyOXT8XYd8MBlFFLxPJtdrqUn0u9yxkKxvyyNEdCK6sw0qi0Fdj8KvbWO1W6eYKENQoUuZ7R_PyP-FnTHwQQ1DGW23HkSA-3NeRWPI9u_wt6EPThHJdVowcxji27rda8BeClTySETj_QVB7Tk6dHVnNktPdhJAJgowciBu-oL8alTxfx51rcqoM8sUGo-bbFebqRgQITmWy5eXs9X0QHF40H5VidAwilMdOawkCfpDg5JjhzrI1hXro', category: 'Glass', time: '6h 15m', difficulty: 'Hard', isAiIdea: true, likes: 840, views: 12500, createdAt: '2026-01-30T08:00:00Z' },
  { id: 'static-4', title: 'PLA Recycled Vase - Voronoi', maker: 'PrintMaster', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCVQHmmS6kEqwz9kbWlPRhdyy0rta4aHB3GAgK5Rm_Qn8cb3YVvFE_AFKoQxAy6eIUhnKcvD0ObXAigxK1BXehW9yFwrQTZyEDYslhE6bU6NnjaEr1HEeUwZ0raaBM2qGGcSGpOm3sTBZmH3Fv14XlpRwZkMJ6kOdSxOkearaFWYepnSc8NbJOpnhPBFGTwpju8j0-Ya9eTYL7vBbJekMVO1pl53Yp0dc0jlW6Wph2dNUDIQPVdyr5HGMvKYU0l4ZUuLaHpHLFQHjI', category: '3D Print', time: '8h', difficulty: 'Easy', likes: 410, views: 2800, createdAt: '2026-01-27T16:00:00Z' },
  { id: 'static-5', title: 'Upcycled Mold Concrete Planters', maker: 'UrbanJungle', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBb0TA0SOf0Uqj3J-p97g6i8C8z3O_0HdMCVan6SsH2SyoTgZzI6LaxF_7LO9qAAaZBZfalY7ilHXKsBfofkNIERYAFM2CAcgUirkA3GBJJ7T9JlAaDJ1aCz8GWGOUVEfs8VyyErsFOT-bkXyoOSmdyi_w1_YfCkprIPFY7-exWQDDvYlNqjboJDdoNjK5MX6XhoXAPlH1e5OoxeqDbPfVfTWUuxSTaD4QsIY4KRo1QpflpBRCqALG9THR1Fy-fTon6zft8CyjiiV4', category: 'Concrete', time: '24h', difficulty: 'Medium', likes: 195, views: 980, createdAt: '2026-01-25T12:00:00Z' },
  { id: 'static-6', title: 'Floating Pipe Bookshelves', maker: 'IndustrialChic', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB7ocu_BWmKGyU8AtIO6vbX0pwjEFsRYpFZHC1NMf3qHUjpB_Bop6bu4OmI0RJzUwWwF7aunaTQvgHSa7SMrAbU2P43_55-IhbPRNPVf4wSHgYEgkT5JpDAfhEKcorGuIKgTehD4tE5hT4PPH-MfgL6LfB_03cpMyTpoPs8kNOYNo5et5VZ87v8L5MlUy-vXYtVLg0jMZ9TyArh2gpfvBjuRuDqUw_wqyX2_xuGzz_Oc1RXxMJwkA2rzJTSiEpkfNF7kTkQ0FRysbM', category: 'Metal', time: '2h', difficulty: 'Medium', isAiRemix: true, description: 'An industrial style bookshelf made from recycled plumbing pipes.', steps: [{ title: 'Preparation', desc: 'Clean pipes.' }, { title: 'Assembly', desc: 'Connect pipes.' }], likes: 520, views: 4100, createdAt: '2026-01-29T09:30:00Z' },
];

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('discovery');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [language, setLanguage] = useState<Language>('ko');
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Authentication & Token State
  const [user, setUser] = useState<User | null>(null);
  const [userTokens, setUserTokens] = useState<number>(25); // Will be loaded from database
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authTargetView, setAuthTargetView] = useState<ViewState | null>(null);
  const [myProjects, setMyProjects] = useState<Project[]>([]); // User's private projects
  const [likedProjects, setLikedProjects] = useState<Set<string>>(new Set()); // Track liked projects

  // Apply dark mode class to html element
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Auth Listener & Projects Fetch
  useEffect(() => {
    // 1. Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // 2. Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        // Close modal on successful login
        setShowAuthModal(false);
        // Redirect if there was a pending target
        if (authTargetView) {
          setCurrentView(authTargetView);
          setAuthTargetView(null);
        }
      }
    });

    // 3. Fetch Projects using Supabase SDK
    const fetchProjects = async () => {
      try {
        const { data, error } = await supabase
          .from('items')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          throw error;
        }

        if (data) {
          // Map DB items to Project type
          const mappedProjects: Project[] = data.map((item: any) => ({
            id: item.id.toString(),
            title: item.title,
            maker: 'Master Kim', // Default maker for new uploads
            image: item.image_url || 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80', // Fallback for missing images
            images: item.metadata?.images || [], // 여러 이미지 지원
            category: item.category,
            time: item.estimated_time || '2h',
            difficulty: (item.difficulty as 'Easy' | 'Medium' | 'Hard') || 'Medium',
            isAiRemix: item.is_ai_generated,
            description: item.title + ' - Custom project', // Simplified fallback
            steps: item.metadata?.fabrication_guide || [],
            downloadUrl: item.metadata?.download_url || '', // Map the download link
            modelFiles: item.metadata?.model_files || [], // 여러 파일 지원
            isPublic: item.is_public ?? true, // Default to public for existing items
            ownerId: item.owner_id,
            likes: item.likes || 0, // Add likes
            views: item.views || 0, // Add views
            createdAt: item.created_at // Add createdAt
          }));

          // Filter only public projects for Discovery
          const publicProjects = mappedProjects.filter(p => p.isPublic !== false);
          setProjects([...publicProjects, ...INITIAL_PROJECTS]);
        }
      } catch (error) {
        console.error("Failed to fetch projects:", error);
      }
    };

    fetchProjects();

    return () => subscription.unsubscribe();
  }, [authTargetView]);

  // Fetch user's private projects
  useEffect(() => {
    const fetchMyProjects = async () => {
      console.log('=== fetchMyProjects called ===');
      console.log('User:', user?.id);

      if (!user) {
        console.log('No user, clearing myProjects');
        setMyProjects([]);
        return;
      }

      try {
        console.log('Fetching projects for user:', user.id);
        const { data, error } = await supabase
          .from('items')
          .select('*')
          .eq('owner_id', user.id)
          .order('created_at', { ascending: false });

        console.log('Supabase response - data:', data, 'error:', error);

        if (error) {
          console.error('Supabase error fetching projects:', error);
          throw error;
        }

        if (data) {
          console.log('Found', data.length, 'projects');
          const mappedProjects: Project[] = data.map((item: any) => ({
            id: item.id.toString(),
            title: item.title,
            maker: user.email || 'Me',
            image: item.image_url || 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80',
            images: item.metadata?.images || [],
            category: item.category,
            time: item.estimated_time || '2h',
            difficulty: (item.difficulty as 'Easy' | 'Medium' | 'Hard') || 'Medium',
            isAiRemix: item.is_ai_generated,
            description: item.title + ' - Custom project',
            steps: item.metadata?.fabrication_guide || [],
            downloadUrl: item.metadata?.download_url || '',
            modelFiles: item.metadata?.model_files || [],
            isPublic: item.is_public ?? false,
            ownerId: item.owner_id,
            likes: item.likes || 0,
            views: item.views || 0,
            createdAt: item.created_at
          }));

          console.log('Setting myProjects:', mappedProjects);
          setMyProjects(mappedProjects);
        }
      } catch (error) {
        console.error('Failed to fetch my projects:', error);
      }
    };

    fetchMyProjects();
  }, [user]);

  // Fetch and manage user tokens from database
  useEffect(() => {
    const fetchUserTokens = async () => {
      console.log('=== fetchUserTokens called ===');
      console.log('User:', user?.id);

      if (!user) {
        console.log('No user, setting default tokens');
        setUserTokens(25); // Default for logged out users
        return;
      }

      try {
        console.log('Fetching tokens for user:', user.id);
        // Check if user has token record
        const { data, error } = await supabase
          .from('user_tokens')
          .select('*')
          .eq('user_id', user.id)
          .single();

        console.log('Supabase response - data:', data, 'error:', error);

        if (error && error.code === 'PGRST116') {
          // No record exists, create one
          console.log('Creating new token record for user');
          const { data: newRecord, error: insertError } = await supabase
            .from('user_tokens')
            .insert({
              user_id: user.id,
              tokens_remaining: 25,
              tokens_used: 0,
              signup_date: new Date().toISOString(),
              last_reset_at: new Date().toISOString(),
              next_reset_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            })
            .select()
            .single();

          if (insertError) {
            console.error('Failed to create token record:', insertError);
            setUserTokens(25); // Fallback
          } else {
            setUserTokens(newRecord.tokens_remaining);
          }
        } else if (data) {
          // Check if reset is needed (30 days passed)
          const nextReset = new Date(data.next_reset_at);
          const now = new Date();

          if (now >= nextReset) {
            console.log('Token reset needed, resetting to 25');
            // Reset tokens
            const { data: resetData, error: resetError } = await supabase
              .from('user_tokens')
              .update({
                tokens_remaining: 25,
                tokens_used: 0,
                last_reset_at: now.toISOString(),
                next_reset_at: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
              })
              .eq('user_id', user.id)
              .select()
              .single();

            if (resetError) {
              console.error('Failed to reset tokens:', resetError);
              setUserTokens(data.tokens_remaining);
            } else {
              setUserTokens(resetData.tokens_remaining);
            }
          } else {
            setUserTokens(data.tokens_remaining);
          }
        }
      } catch (error) {
        console.error('Failed to fetch user tokens:', error);
        setUserTokens(25); // Fallback
      }
    };

    fetchUserTokens();
  }, [user]);

  // Load liked projects from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('jejuremaker_liked_projects');
      if (stored) {
        setLikedProjects(new Set(JSON.parse(stored)));
      }
    } catch (error) {
      console.error('Failed to load liked projects:', error);
    }
  }, []);

  // Handler: Toggle like on a project
  const handleLikeToggle = async (projectId: string) => {
    const isLiked = likedProjects.has(projectId);
    const newLikedProjects = new Set(likedProjects);

    if (isLiked) {
      newLikedProjects.delete(projectId);
    } else {
      newLikedProjects.add(projectId);
    }

    // Update local state immediately (optimistic update)
    setLikedProjects(newLikedProjects);
    localStorage.setItem('jejuremaker_liked_projects', JSON.stringify(Array.from(newLikedProjects)));

    // Update projects state
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        return { ...p, likes: (p.likes || 0) + (isLiked ? -1 : 1) };
      }
      return p;
    }));

    // Update database
    try {
      const project = projects.find(p => p.id === projectId);
      if (!project) return;

      // Only update database projects (not static ones)
      if (!projectId.startsWith('static-')) {
        const newLikes = (project.likes || 0) + (isLiked ? -1 : 1);
        const { error } = await supabase
          .from('items')
          .update({ likes: Math.max(0, newLikes) })
          .eq('id', parseInt(projectId));

        if (error) {
          console.error('Failed to update likes:', error);
          // Revert optimistic update on error
          setLikedProjects(likedProjects);
          setProjects(prev => prev.map(p => {
            if (p.id === projectId) {
              return { ...p, likes: (p.likes || 0) + (isLiked ? 1 : -1) };
            }
            return p;
          }));
        }
      }
    } catch (error) {
      console.error('Error updating like:', error);
    }
  };

  // Handler: Increment view count
  const handleViewIncrement = async (projectId: string) => {
    // Check if already viewed in this session
    const sessionKey = 'jejuremaker_viewed_projects';
    try {
      const viewed = sessionStorage.getItem(sessionKey);
      const viewedSet = viewed ? new Set(JSON.parse(viewed)) : new Set<string>();

      if (viewedSet.has(projectId)) {
        return; // Already viewed in this session
      }

      viewedSet.add(projectId);
      sessionStorage.setItem(sessionKey, JSON.stringify(Array.from(viewedSet)));

      // Update local state
      setProjects(prev => prev.map(p => {
        if (p.id === projectId) {
          return { ...p, views: (p.views || 0) + 1 };
        }
        return p;
      }));

      // Update database for non-static projects
      if (!projectId.startsWith('static-')) {
        const project = projects.find(p => p.id === projectId);
        if (project) {
          const newViews = (project.views || 0) + 1;
          const { error } = await supabase
            .from('items')
            .update({ views: newViews })
            .eq('id', parseInt(projectId));

          if (error) {
            console.error('Failed to update views:', error);
          }
        }
      }
    } catch (error) {
      console.error('Error incrementing view:', error);
    }
  };

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);
  const toggleLanguage = () => setLanguage(prev => prev === 'ko' ? 'en' : 'ko');

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    alert(language === 'ko' ? '로그아웃 되었습니다.' : 'Logged out successfully.');
    setCurrentView('discovery');
  };

  const handleLoginClick = (targetView?: ViewState) => {
    if (targetView) {
      setAuthTargetView(targetView);
    }
    setShowAuthModal(true);
  };

  const handleUploadComplete = (newProject: Project) => {
    setProjects(prev => [newProject, ...prev]);
    setCurrentView('discovery');
  };

  const handleAddProject = (newProject: Project) => {
    // Add to user's private library
    setMyProjects(prev => [newProject, ...prev]);
  };

  // Update tokens with database sync
  const updateUserTokens = async (newTokenCount: number) => {
    console.log('updateUserTokens called with:', newTokenCount);

    // Update local state immediately
    setUserTokens(newTokenCount);

    if (!user) {
      console.log('No user, skipping database update');
      return;
    }

    try {
      // Ensure non-negative values
      const safeTokenCount = Math.max(0, newTokenCount);
      const tokensUsed = Math.max(0, 25 - safeTokenCount);

      console.log('Updating database - tokens_remaining:', safeTokenCount, 'tokens_used:', tokensUsed);

      const { error } = await supabase
        .from('user_tokens')
        .update({
          tokens_remaining: safeTokenCount,
          tokens_used: tokensUsed
        })
        .eq('user_id', user.id);

      if (error) {
        console.error('Failed to update tokens in database:', JSON.stringify(error, null, 2));
      } else {
        console.log('Tokens updated successfully in database');
      }
    } catch (error) {
      console.error('Error updating tokens:', JSON.stringify(error, null, 2));
    }
  };

  const handlePublish = async (projectId: string) => {
    console.log('Publishing project:', projectId);
    try {
      // Use the projectId directly (works for both UUID and integer strings)
      const { error } = await supabase
        .from('items')
        .update({ is_public: true })
        .eq('id', projectId);

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      // Update local state
      setMyProjects(prev =>
        prev.map(p => p.id === projectId ? { ...p, isPublic: true } : p)
      );

      // Add to public projects
      const publishedProject = myProjects.find(p => p.id === projectId);
      if (publishedProject) {
        setProjects(prev => [{ ...publishedProject, isPublic: true }, ...prev]);
      }

      console.log('Project published successfully');
      alert(language === 'ko' ? '프로젝트가 공개되었습니다!' : 'Project published successfully!');
    } catch (error) {
      console.error('Failed to publish project:', error);
      alert(language === 'ko' ? `공개 실패: ${error}` : `Failed to publish: ${error}`);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    console.log('Deleting project:', projectId);
    try {
      // Use the projectId directly (works for both UUID and integer strings)
      const { error } = await supabase
        .from('items')
        .delete()
        .eq('id', projectId);

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      // Update local state
      setMyProjects(prev => prev.filter(p => p.id !== projectId));
      setProjects(prev => prev.filter(p => p.id !== projectId));

      console.log('Project deleted successfully');
      alert(language === 'ko' ? '프로젝트가 삭제되었습니다.' : 'Project deleted successfully.');
    } catch (error) {
      console.error('Failed to delete project:', error);
      alert(language === 'ko' ? `삭제 실패: ${error}` : `Failed to delete: ${error}`);
    }
  };

  const handleProjectSelect = (project: Project) => {
    setSelectedProject(project);
    setCurrentView('detail');
  };

  const renderView = () => {
    switch (currentView) {
      case 'discovery':
        return (
          <Discovery
            onNavigate={(view: any) => setCurrentView(view)}
            onProjectSelect={handleProjectSelect}
            isDarkMode={isDarkMode}
            toggleDarkMode={toggleDarkMode}
            language={language}
            toggleLanguage={toggleLanguage}
            projects={projects}
            user={user}
            onLoginClick={handleLoginClick}
            onLogout={handleLogout}
            userTokens={userTokens}
            setUserTokens={updateUserTokens}
            onAddProject={handleAddProject}
            onLikeToggle={handleLikeToggle}
            likedProjects={likedProjects}
          />
        );
      case 'detail':
        return (
          <ProjectDetail
            project={selectedProject}
            onBack={() => setCurrentView('discovery')}
            onOpenWorkspace={() => setCurrentView('workspace')}
            isDarkMode={isDarkMode}
            toggleDarkMode={toggleDarkMode}
            language={language}
            toggleLanguage={toggleLanguage}
            user={user}
            onLoginClick={handleLoginClick}
            onNavigate={(view: any) => setCurrentView(view)}
            onLikeToggle={handleLikeToggle}
            onViewIncrement={handleViewIncrement}
            likedProjects={likedProjects}
          />
        );
      case 'workspace':
        // Check if the selected project is an AI remix or idea
        const isAi = !!(selectedProject?.isAiRemix || selectedProject?.isAiIdea);
        return (
          <Workspace
            onExit={() => setCurrentView('detail')}
            language={language}
            userTokens={userTokens}
            setUserTokens={updateUserTokens}
            initialMode={isAi ? 'ai' : 'human'}
            isAiProject={isAi}
          />
        );
      case 'upload':
        return (
          <AdminUpload
            supabase={supabase}
            onBack={() => setCurrentView('discovery')}
            onUploadComplete={handleUploadComplete}
            language={language}
            user={user}
          />
        );
      case 'trending':
        return (
          <Trending
            onNavigate={(view: any) => setCurrentView(view)}
            onProjectSelect={handleProjectSelect}
            isDarkMode={isDarkMode}
            toggleDarkMode={toggleDarkMode}
            language={language}
            toggleLanguage={toggleLanguage}
            user={user}
            onLoginClick={handleLoginClick}
            onLogout={handleLogout}
            projects={projects}
            onLikeToggle={handleLikeToggle}
            likedProjects={likedProjects}
          />
        );
      case 'community':
        return (
          <Community
            onNavigate={(view: any) => setCurrentView(view)}
            isDarkMode={isDarkMode}
            toggleDarkMode={toggleDarkMode}
            language={language}
            toggleLanguage={toggleLanguage}
            user={user}
            onLoginClick={handleLoginClick}
            onLogout={handleLogout}
          />
        );
      case 'profile':
        return (
          <Profile
            onNavigate={(view: any) => setCurrentView(view)}
            onProjectSelect={handleProjectSelect}
            isDarkMode={isDarkMode}
            toggleDarkMode={toggleDarkMode}
            language={language}
            toggleLanguage={toggleLanguage}
            user={user}
            onLoginClick={handleLoginClick}
            onLogout={handleLogout}
            userTokens={userTokens}
            myProjects={myProjects}
            onPublish={handlePublish}
            onDelete={handleDeleteProject}
          />
        );
      default:
        return (
          <Discovery
            onNavigate={(view: any) => setCurrentView(view)}
            onProjectSelect={handleProjectSelect}
            isDarkMode={isDarkMode}
            toggleDarkMode={toggleDarkMode}
            language={language}
            toggleLanguage={toggleLanguage}
            projects={projects}
            user={user}
            onLoginClick={handleLoginClick}
            onLogout={handleLogout}
            userTokens={userTokens}
          />
        );
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'dark bg-background-dark' : 'bg-background-light'}`}>
      {renderView()}

      {/* Global Auth Modal */}
      {showAuthModal && (
        <AuthModal
          supabase={supabase}
          onClose={() => setShowAuthModal(false)}
          currentView={authTargetView || undefined}
        />
      )}
    </div>
  );
};

export default App;