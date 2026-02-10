import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { User } from '@supabase/supabase-js';
import Discovery from './components/Discovery';
import ProjectDetail from './components/ProjectDetail';
import Layout from './components/Layout';
import AuthModal from './components/AuthModal';
import { Project, Maker } from './types';
import { supabase } from './services/supabase';

// Lazy-loaded components (code splitting)
const Workspace = React.lazy(() => import('./components/Workspace'));
const AdminUpload = React.lazy(() => import('./components/AdminUpload'));
const Trending = React.lazy(() => import('./components/Trending'));
const Community = React.lazy(() => import('./components/Community'));
const RemakeLab = React.lazy(() => import('./components/RemakeLab'));
const Profile = React.lazy(() => import('./components/Profile'));

// Loading fallback for lazy components
const LazyFallback = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="flex flex-col items-center gap-3">
      <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
      <span className="text-sm text-gray-500 dark:text-gray-400">Loading...</span>
    </div>
  </div>
);

export type ViewState = 'discovery' | 'detail' | 'workspace' | 'upload' | 'trending' | 'community' | 'profile' | 'lab';
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
  // Initialize ViewState from URL query parameter (for direct linking / new tab)
  const [currentView, setCurrentView] = useState<ViewState>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const viewParam = params.get('view') as ViewState;
      if (viewParam === 'lab') return 'lab';
    }
    return 'discovery';
  });
  // Persistent State Initialization
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('jejuremaker_theme') === 'dark';
    }
    return false;
  });
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('jejuremaker_language') as Language) || 'ko';
    }
    return 'ko';
  });
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>(''); // Search state

  // Authentication & Token State
  const [user, setUser] = useState<User | null>(null);
  const [userTokens, setUserTokens] = useState<number>(25); // Will be loaded from database
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authTargetView, setAuthTargetView] = useState<ViewState | null>(null);
  const [myProjects, setMyProjects] = useState<Project[]>([]); // User's private projects
  const [likedProjects, setLikedProjects] = useState<Set<string>>(new Set()); // Track liked projects

  // Wizard Modal State (Global)
  const [showWizard, setShowWizard] = useState(false);

  // Edit State
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);

  // Calculate Top Makers dynamically (Global Logic)
  const MAKERS = useMemo(() => {
    const makerStats: Record<string, { projects: number; likes: number; views: number; avatar: string }> = {};

    projects.forEach(p => {
      const makerName = p.maker || 'Unknown Maker';
      if (!makerStats[makerName]) {
        makerStats[makerName] = {
          projects: 0,
          likes: 0,
          views: 0,
          // Use a consistent avatar for 'Master Kim', or a random one for others if not available
          avatar: (user && (makerName === user.user_metadata?.full_name || makerName === user.email))
            ? (user.user_metadata?.avatar_url || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y')
            : (makerName === 'Master Kim'
              ? 'https://lh3.googleusercontent.com/aida-public/AB6AXuAQyyDiuuKUO7-48MXIFPjnexxedhZVHEg5bLuAfgHROaZsbytCEGez7ZIXFwYjO7H0n-l9dOkw4COHYrcofMglRTN3eCjKz9imRZERODcpiZMHvmA375rRKibsmRiaev4dbcIfJShQP2b6z5fq637Tc09U2y5H0qaavl6DdKbBt-tQj5H3OY3EjQDJEpKoEstwMBcTO32zdio882CcbV9WotiISEBt_WQls7w_h3eoXRbVzBGRCA7ziLjSCfksoUdmw3FLUHE6mDs'
              : 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y')
        };
      }
      makerStats[makerName].projects += 1;
      makerStats[makerName].likes += (p.likes || 0);
      makerStats[makerName].views += (p.views || 0);
    });

    const sortedMakers: Maker[] = Object.keys(makerStats)
      .map(name => ({
        name,
        avatar: makerStats[name].avatar,
        projects: makerStats[name].projects,
        // Format likes (e.g., 1200 -> 1.2k)
        likes: makerStats[name].likes >= 1000
          ? (makerStats[name].likes / 1000).toFixed(1) + 'k'
          : makerStats[name].likes.toString(),
        // Raw likes for sorting
        rawLikes: makerStats[name].likes,
        rank: 0 // Will assign later
      }))
      .sort((a, b) => (b as any).rawLikes - (a as any).rawLikes) // Sort by Total Likes DESC
      .slice(0, 5) // Top 5
      .map((m, index) => ({ ...m, rank: index + 1 }));

    return sortedMakers;
  }, [projects]);

  // Persist Theme and Language
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('jejuremaker_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('jejuremaker_theme', 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    localStorage.setItem('jejuremaker_language', language);
  }, [language]);

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
          .neq('category', 'Social') // Exclude community posts from main feed
          .order('created_at', { ascending: false });

        if (error) {
          throw error;
        }

        if (data) {
          // Map DB items to Project type
          const mappedProjects: Project[] = data.map((item: any) => ({
            id: item.id.toString(),
            title: item.title,
            maker: item.metadata?.maker_name || item.maker || 'Maker',
            image: item.image_url || 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80', // Fallback for missing images
            images: item.metadata?.images || [], // 여러 이미지 지원
            category: item.category,
            time: item.estimated_time || '2h',
            difficulty: (item.difficulty as 'Easy' | 'Medium' | 'Hard') || 'Medium',
            isAiRemix: item.is_ai_generated,
            description: item.metadata?.description || item.description || (item.title + ' - Custom project'),
            steps: item.metadata?.fabrication_guide || [],
            downloadUrl: item.metadata?.download_url || '', // Map the download link
            // metadata.model_3d_url이 있으면 modelFiles에 추가. fallback: model_url
            modelFiles: (item.metadata?.model_3d_url || item.metadata?.model_url)
              ? [{ name: '3d_model.glb', type: 'glb', size: 0, url: (item.metadata.model_3d_url || item.metadata.model_url) }, ...(item.metadata?.model_files || [])]
              : (item.metadata?.model_files || []),
            isPublic: item.is_public ?? true, // Default to public for existing items
            ownerId: item.owner_id,
            likes: item.likes || 0, // Add likes
            views: item.views || 0, // Add views
            createdAt: item.created_at, // Add createdAt
            tools: item.metadata?.tools || item.required_tools || '', // Map tools from metadata or fallback column
            material: item.material || item.metadata?.material || 'Unknown Material' // Map material
          }));

          // Filter only public projects for Discovery
          const publicProjects = mappedProjects.filter(p => p.isPublic !== false);
          setProjects(publicProjects);
        }
      } catch (error) {
        console.error("Failed to fetch projects:", error);
      }
    };

    // Seed initial data and then fetch
    const seedAndFetch = async () => {
      const isSeeded = localStorage.getItem('jejuremaker_initial_seeded_v1');

      if (!isSeeded) {
        console.log('Seeding initial data...');
        for (const p of INITIAL_PROJECTS) {
          const { data } = await supabase.from('items').select('id').eq('title', p.title).maybeSingle();
          if (!data) {
            await supabase.from('items').insert({
              title: p.title,
              image_url: p.image,
              category: p.category,
              estimated_time: p.time,
              difficulty: p.difficulty,
              is_ai_generated: p.isAiRemix || p.isAiIdea || false,
              is_public: true,
              likes: p.likes,
              views: p.views,
              metadata: {
                description: p.description || p.title,
                fabrication_guide: p.steps || [],
                maker_name: p.maker
              }
            });
          }
        }
        localStorage.setItem('jejuremaker_initial_seeded_v1', 'true');
      }

      fetchProjects();
    };

    seedAndFetch();

    return () => subscription.unsubscribe();
  }, [authTargetView]);

  // Extracted fetch function
  const fetchMyProjects = async () => {
    if (!user) {
      setMyProjects([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });


      if (error) {
        console.error('Supabase error fetching projects:', error);
        throw error;
      }

      if (data) {
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
          modelFiles: (item.metadata?.model_3d_url || item.metadata?.model_url)
            ? [{ name: '3d_model.glb', type: 'glb', size: 0, url: (item.metadata.model_3d_url || item.metadata.model_url) }, ...(item.metadata?.model_files || [])]
            : (item.metadata?.model_files || []),
          isPublic: item.is_public ?? false,
          ownerId: item.owner_id,
          likes: item.likes || 0,
          views: item.views || 0,
          createdAt: item.created_at,
          tools: item.metadata?.tools || item.required_tools || '',
          material: item.material || item.metadata?.material || 'Unknown Material'
        }));

        setMyProjects(mappedProjects);
      }
    } catch (error: any) {
      // Ignore AbortError (code 20) - this happens with React StrictMode
      if (error?.code !== '20') {
        console.error('Failed to fetch my projects:', error);
      }
    }
  };

  useEffect(() => {
    fetchMyProjects();
  }, [user]);

  const handleAddProject = (newProject: Project) => {
    // 1. Optimistic Update
    setMyProjects(prev => [newProject, ...prev]);

    // 2. Background Refresh to ensure consistency
    setTimeout(() => {
      fetchMyProjects();
    }, 1000);
  };

  // Fetch and manage user tokens from database
  useEffect(() => {
    const fetchUserTokens = async () => {
      if (!user) {
        setUserTokens(25); // Default for logged out users
        return;
      }

      try {
        // Check if user has token record
        const { data, error } = await supabase
          .from('user_tokens')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error && error.code === 'PGRST116') {
          // No record exists, create one
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

  // Refetch my projects when view changes (to catch uploads)
  useEffect(() => {
    fetchMyProjects();
  }, [currentView]);

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

    // Update database using RPC
    try {
      if (!projectId.startsWith('static-')) {
        const { error } = await supabase.rpc('increment_likes', {
          row_id: projectId,
          amount: isLiked ? -1 : 1
        });

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

      // Update database using RPC
      if (!projectId.startsWith('static-')) {
        const { error } = await supabase.rpc('increment_views', {
          row_id: projectId
        });

        if (error) {
          console.error('Failed to update views:', error);
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

    // Clear persistent settings on logout
    localStorage.removeItem('jejuremaker_theme');
    localStorage.removeItem('jejuremaker_language');

    // Reset local state (Optional: or let them stay until refresh? Usually better to reset visually)
    setIsDarkMode(false);
    setLanguage('ko');

    alert(language === 'ko' ? '로그아웃 되었습니다.' : 'Logged out successfully.');
    setCurrentView('discovery');
  };

  const handleLoginClick = (targetView?: ViewState) => {
    if (targetView) {
      setAuthTargetView(targetView);
    }
    setShowAuthModal(true);
  };

  const handleAnalyzeRequest = () => {
    if (!user) {
      setAuthTargetView('discovery');
      setShowAuthModal(true);
    } else {
      // Check for sufficient tokens
      if (userTokens < 10) {
        alert(language === 'ko' ? '토큰이 부족합니다. (필요: 10)' : 'Not enough tokens. (Required: 10)');
        return;
      }

      // Deduct tokens immediately
      const cost = 10;
      updateUserTokens(userTokens - cost);

      setShowWizard(true);
    }
  };

  const handleWizardCancel = () => {
    // Refund tokens if user cancels wizard
    console.log('Wizard canceled, refunding 10 tokens');
    if (user) {
      updateUserTokens(userTokens + 10);
    }
    setShowWizard(false);
  };

  const handleUploadComplete = (newProject: Project) => {
    setProjects(prev => [newProject, ...prev]);
    setCurrentView('discovery');
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

  const handleEditProject = (project: Project) => {
    setProjectToEdit(project);
    setCurrentView('upload');
  };

  const handleProjectSelect = (project: Project) => {
    setSelectedProject(project);
    setCurrentView('detail');
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    if (term) {
      setCurrentView('discovery');
    }
  };

  // Filter projects based on search term
  const filteredProjects = useMemo(() => {
    if (!searchTerm) return projects;
    const lowerTerm = searchTerm.toLowerCase();
    return projects.filter(project =>
      project.title.toLowerCase().includes(lowerTerm) ||
      (project.description && project.description.toLowerCase().includes(lowerTerm)) ||
      project.category.toLowerCase().includes(lowerTerm) ||
      project.maker.toLowerCase().includes(lowerTerm) ||
      project.material.toLowerCase().includes(lowerTerm)
    );
  }, [projects, searchTerm]);

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
            projects={filteredProjects}
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
            onBack={() => {
              setSelectedProject(null);
              setCurrentView('discovery');
            }}
            onOpenWorkspace={() => setCurrentView('workspace')}
            project={selectedProject}
            isDarkMode={isDarkMode}
            toggleDarkMode={toggleDarkMode}
            language={language}
            toggleLanguage={toggleLanguage}
            user={user}
            onLoginClick={handleLoginClick}
            onNavigate={setCurrentView}
            onLikeToggle={handleLikeToggle}
            onViewIncrement={handleViewIncrement}
            likedProjects={likedProjects}
            userTokens={userTokens}
            onDeductTokens={(amount) => updateUserTokens(userTokens - amount)}
          />
        );
      case 'workspace':
        const isAi = !!(selectedProject?.isAiRemix || selectedProject?.isAiIdea);
        return (
          <Workspace
            project={selectedProject!}
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
            onBack={() => {
              setProjectToEdit(null); // Clear edit state on back
              setCurrentView('discovery');
            }}
            onUploadComplete={handleUploadComplete}
            language={language}
            user={user}
            onSelectProject={handleProjectSelect}
            initialProject={projectToEdit}
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
            projects={filteredProjects}
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
      case 'lab':
        return (
          <RemakeLab
            language={language}
            userTokens={userTokens}
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
            onEdit={handleEditProject}
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
            projects={filteredProjects}
            user={user}
            onLoginClick={handleLoginClick}
            onLogout={handleLogout}
            userTokens={userTokens}
            setUserTokens={updateUserTokens}
            onAddProject={handleAddProject}
            onLikeToggle={handleLikeToggle}
            likedProjects={likedProjects}
            onAnalyzeClick={handleAnalyzeRequest}
          />
        );
    }
  };

  return (
    <Layout
      user={user}
      userTokens={userTokens}
      language={language}
      toggleLanguage={toggleLanguage}
      isDarkMode={isDarkMode}
      toggleDarkMode={toggleDarkMode}
      onLoginClick={handleLoginClick}
      onNavigate={setCurrentView}
      onLogout={handleLogout}
      makers={MAKERS}
      onAnalyzeClick={handleAnalyzeRequest}
      showWizard={showWizard}
      setShowWizard={setShowWizard}
      setUserTokens={updateUserTokens}
      onAddProject={(project) => {
        handleAddProject(project);
        setCurrentView('profile');
      }} // Pass to Layout if needed
      currentView={currentView}
      onSearch={handleSearch}
      onCancel={handleWizardCancel}
    >
      <Suspense fallback={<LazyFallback />}>
        {renderView()}
      </Suspense>

      {/* Global Auth Modal - Keep it here or in Layout if preferred */}
      {showAuthModal && (
        <AuthModal
          supabase={supabase}
          onClose={() => setShowAuthModal(false)}
          currentView={authTargetView || undefined}
        />
      )}
    </Layout>
  );
};

export default App;