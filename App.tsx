import React, { useState, useEffect, useMemo, Suspense, useRef } from 'react';
import { User } from '@supabase/supabase-js';
import Discovery from './components/Discovery';
import ProjectDetail from './components/ProjectDetail';
import Layout from './components/Layout';
import AuthModal from './components/AuthModal';
import { Project, Maker } from './types';
import { supabase } from './services/supabase';
import { config } from './services/config';

// Lazy-loaded components (code splitting)
const Workspace = React.lazy(() => import('./components/Workspace'));
const AdminUpload = React.lazy(() => import('./components/AdminUpload'));
const Trending = React.lazy(() => import('./components/Trending'));
const Community = React.lazy(() => import('./components/Community'));
const RemakeLab = React.lazy(() => import('./components/RemakeLab'));
const Profile = React.lazy(() => import('./components/Profile'));

// Loading fallback for lazy components
const LazyFallback = () => (
    <div className="flex items-center justify-center min-h-[400px] w-full">
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
  { id: 'static-2', title: 'Minimalist Pallet Coffee Table', maker: 'WoodWorkStudio', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDtfkCp1u6RQE75IVa1qBK32C6pkRhi_PH7cCop_nLGn1AJzuIT2NqbxN3xYFzGlSG5iMaECKw8rR-g-rwEfhmKPElX1u7y9pUVSXtX2Mm6SGUOmqXZXzz0jmRzh7-t5REfwx67KwSY-8O35HhrDKkvFoeG_cFfhiPg5T1_G0wQ-I62haamEoI0pimhPN_dipCKopy86n4sjsWh610Q3OQaytpYR4o_dxHMh9XGT9FbwxYW17UmqN_HwBJ75w2Sr7jj-o43G4eec6I', category: 'Wood', time: '12h', difficulty: 'Medium', description: 'Simple coffee table made from reclaimed pallets.', likes: 340, views: 1850, createdAt: '2026-01-26T14:30:00Z' },
  { id: 'static-3', title: 'Geometric Glass Bottle Lamp', maker: 'EcoLightz', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAlS4kFqDJmMraQ5iv0a245PyOXT8XYd8MBlFFLxPJtdrqUn0u9yxkKxvyyNEdCK6sw0qi0Fdj8KvbWO1W6eYKENQoUuZ7R_PyP-FnTHwQQ1DGW23HkSA-3NeRWPI9u_wt6EPThHJdVowcxji27rda8BeClTySETj_QVB7Tk6dHVnNktPdhJAJgowciBu-oL8alTxfx51rcqoM8sUGo-bbFebqRgQITnWy5eXs9X0QHF40H5VidAwilMdOawkCfpDg5JjhzrI1hXro', category: 'Glass', time: '6h 15m', difficulty: 'Hard', isAiIdea: true, likes: 840, views: 12500, createdAt: '2026-01-30T08:00:00Z' },
  { id: 'static-4', title: 'PLA Recycled Vase - Voronoi', maker: 'PrintMaster', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCVQHmmS6kEqwz9kbWlPRhdyy0rta4aHB3GAgK5Rm_Qn8cb3YVvFE_AFKoQxAy6eIUhnKcvD0ObXAigxK1BXehW9yFwrQTZyEDYslhE6bU6NnjaEr1HEvUwZ0raaBM2qGGcSGpOm3sTBZmH3Fv14XlpRwZkMJ6kOdSxOkearaFWYepnSc8NbJOpnhPBFGTwpju8j0-Ya9eTYL7vBbJekMVO1pl53Yp0dc0jlW6Wph2dNUDIQPVdyr5HGMvKYU0l4ZUuLaHpHLFQHjI', category: '3D Print', time: '8h', difficulty: 'Easy', likes: 410, views: 2800, createdAt: '2026-01-27T16:00:00Z' },
  { id: 'static-5', title: 'Upcycled Mold Concrete Planters', maker: 'UrbanJungle', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBb0TA0SOf0Uqj3J-p97g6i8C8z3O_0HdMCVan6SsH2SyoTgZzI6LaxF_7LO9qAAaZBZfalY7ilHXKsBfofkNIERYAFM2CAcgUirkA3GBJJ7T9JlAaDJ1aCz8GWGOUVEfs8VyyErsFOT-bkXyoOSmdyi_w1_YfCkprIPFY7-exWQDDvYlNqjboJDdoNjK5MX6XhoXAPlH1e5OoxeqDbPfVfTWUuxSTaD4QsIY4KRo1QpflpBRCqALG9THR1Fy-fTon6zft8CyjiiV4', category: 'Concrete', time: '24h', difficulty: 'Medium', likes: 195, views: 980, createdAt: '2026-01-25T12:00:00Z' },
  { id: 'static-6', title: 'Floating Pipe Bookshelves', maker: 'IndustrialChic', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB7ocu_BWmKGyU8AtIO6vbX0pwjEFsRYpFZHC1NMf3qHUjpB_Bop6bu4OmI0RJzUwWwF7aunaTQvgHSa7SMrAbU2P43_55-IhbPRNPVf4wSHgYEgkT5JpDAfhEKcorGuIKgTehD4tE5hT4PPH-MfgL6LfB_03cpMyTpoPs8kNOYNo5et5VZ87v8L5MlUy-vXYtVL0jMZ9TyArh2gpfvBjuRuDqUw_wqyX2_xuGzz_Oc1RXxMJwkA2rzJTSiEpkfNF7kTkQ0FRysbM', category: 'Metal', time: '2h', difficulty: 'Medium', isAiRemix: true, description: 'An industrial style bookshelf made from recycled plumbing pipes.', steps: [{ title: 'Preparation', desc: 'Clean pipes.' }, { title: 'Assembly', desc: 'Connect pipes.' }], likes: 520, views: 4100, createdAt: '2026-01-29T09:30:00Z' },
];

const FUN_NICKNAMES = [
  '제주의 아들',
  '고독한 소나',
  '귤 줍는 청년',
  '서핑하는 돌하르방',
  '한라산 등반왕',
  '우도 버스기사',
  '성산일출봉 지킴이',
  '바람 부는 날의 억새',
  '재활용하는 해녀',
  '업사이클링 마스터'
];

const getVirtualNickname = (userId: string) => {
   let hash = 0;
   for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash);
   }
   return FUN_NICKNAMES[Math.abs(hash) % FUN_NICKNAMES.length];
};

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
  const [workspaceInitialMode, setWorkspaceInitialMode] = useState<'human' | 'ai' | null>(null);

  // Global Presence & Notification State
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);
  const globalChannelRef = useRef<any>(null);
  const [toastNotification, setToastNotification] = useState<{sender: string, message: string, projectId: string, projectTitle: string} | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);

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

  // User Profile State (Source of Truth from DB)
  const [userProfile, setUserProfile] = useState<{ nickname: string; avatarUrl: string } | null>(null);

  const refreshUserProfile = async () => {
    if (!user) return;
    const { data: profile } = await supabase
        .from('user_profiles')
        .select('nickname, avatar_url')
        .eq('user_id', user.id)
        .maybeSingle();

    if (profile) {
       setUserProfile({ nickname: profile.nickname, avatarUrl: profile.avatar_url });
       
       // Also immediately re-track presence with new data if channel exists
       if (globalChannelRef.current && globalChannelRef.current.state === 'joined') {
           await globalChannelRef.current.track({
               user_id: user.id,
               nickname: profile.nickname,
               virtual_nickname: getVirtualNickname(user.id),
               avatar: profile.avatar_url,
               online_at: new Date().toISOString(),
           });
       }
    }
  };

  useEffect(() => {
     if (user) {
         refreshUserProfile();
     } else {
         setUserProfile(null);
     }
  }, [user]);

  // Active Makers derived from onlineUsers (Global Logic)
  const activeMakers = useMemo(() => {
    return onlineUsers
      .filter(u => u.user_id !== user?.id)
      .map((u, index) => ({
      name: u.nickname || u.virtual_nickname,
      avatar: u.avatar,
      projects: 0, // We can fetch this if needed, defaults to 0 for now
      likes: 'Active',
      rawLikes: 0,
      rank: undefined,
      userId: u.user_id
    }));
  }, [onlineUsers, user?.id]);

  // Direct Messaging State (Global)
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageTarget, setMessageTarget] = useState<Maker | null>(null);
  const [messageText, setMessageText] = useState('');
  const [replyToNotifId, setReplyToNotifId] = useState<string | null>(null);

  const handleOpenMessageModal = (maker: Maker) => {
    if (!user) {
        handleLoginClick();
        return;
    }
    setMessageTarget(maker);
    setShowMessageModal(true);
  };

  const handleSendMessage = async () => {
      if (!messageText.trim() || !messageTarget || !user) return;
      
      try {
          // Construct the notification payload with full sender details
          const notificationData = {
              sender: userProfile?.nickname || getVirtualNickname(user.id),
              senderAvatar: userProfile?.avatarUrl || user.user_metadata?.avatar_url || `https://api.dicebear.com/9.x/avataaars/svg?seed=${user.id}`,
              senderUserId: user.id,
              message: messageText,
              projectId: 'direct_message',
              projectTitle: 'Direct Message',
              targetUserId: (messageTarget as any).userId
          };

          // Broadcast to the global channel
          if (globalChannelRef.current) {
               globalChannelRef.current.send({
                   type: 'broadcast',
                   event: 'chat_notify',
                   payload: notificationData
               });
          }
          
          alert(language === 'ko' ? '메시지를 전송했습니다.' : 'Message sent successfully.');
          setShowMessageModal(false);
          setMessageText('');
          
          if (replyToNotifId) {
             setNotifications(prev => prev.filter(n => n.id !== replyToNotifId));
             setReplyToNotifId(null);
          }
      } catch (error) {
          console.error('Failed to send message:', error);
          alert(language === 'ko' ? '초기화 실패.' : 'Failed to send message.');
      }
  };



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
          .select('id, title, maker, image_url, category, estimated_time, difficulty, is_ai_generated, is_public, owner_id, likes, views, created_at, material, required_tools')
          .order('created_at', { ascending: false })
          .limit(30);

        if (error) {
          console.error("Supabase API Error (fetchProjects):", error.message || error.code || error);
          throw error;
        }

        if (data) {
          // Exclude community posts via JS filter to bypass Supabase .neq index scan breakdown (Issue #57014)
          const filteredData = data.filter((item: any) => item.category !== 'Social').slice(0, 50);

          // Fetch user profiles for the makers
          const ownerIds = [...new Set(filteredData.map((item: any) => item.owner_id).filter(Boolean))];
          let profilesMap: Record<string, any> = {};
          
          if (ownerIds.length > 0) {
            try {
              const { data: profilesData, error: profileError } = await supabase
                .from('user_profiles')
                .select('user_id, nickname, avatar_url')
                .in('user_id', ownerIds);
                
              if (profileError) {
                console.warn("Could not fetch user_profiles (Timeout or Error), falling back to basic data:", profileError.message);
              }
                
              if (profilesData) {
                profilesMap = profilesData.reduce((acc: any, profile: any) => {
                  acc[profile.user_id] = profile;
                  return acc;
                }, {});
              }
            } catch (err) {
              console.warn("Error fetching profiles:", err);
            }
          }

          // Map DB items to Project type
          const mappedProjects: Project[] = filteredData.map((item: any) => {
            const profile = profilesMap[item.owner_id];
            return {
              id: item.id.toString(),
              title: item.title,
              maker: profile?.nickname || item.metadata?.maker_name || item.maker || 'Maker',
              makerAvatarUrl: profile?.avatar_url || item.metadata?.maker_avatar_url,
              image: item.image_url || 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80',
            images: item.metadata?.images || [],
            category: item.category,
            time: item.estimated_time || '2h',
            difficulty: (item.difficulty as 'Easy' | 'Medium' | 'Hard') || 'Medium',
            isAiRemix: item.is_ai_generated,
            description: item.metadata?.description || item.description || (item.title + ' - Custom project'),
            steps: item.metadata?.fabrication_guide || item.metadata?.guide?.steps || item.steps || [],
            downloadUrl: item.metadata?.download_url || '',
            modelFiles: (item.metadata?.model_3d_url || item.metadata?.model_url)
              ? [{ name: '3d_model.glb', type: 'glb', size: 0, url: (item.metadata.model_3d_url || item.metadata.model_url) }, ...(item.metadata?.model_files || [])]
              : (item.metadata?.model_files || []),
            isPublic: item.is_public ?? true,
            ownerId: item.owner_id,
            likes: item.likes || 0,
            views: item.views || 0,
            createdAt: item.created_at,
            tools: item.metadata?.tools || item.required_tools || '',
            material: item.material || item.metadata?.material || 'Unknown Material',
            metadata: item.metadata // Full metadata inclusion
            };
          });
          const publicProjects = mappedProjects.filter(p => {
            // 비공개 프로젝트 제외
            if (p.isPublic === false) return false;
            
            // 이미지 생성이 안 된 미완성본(기본 플레이스홀더 이미지) 제외
            const isPlaceholderImage = p.image === 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80';
            if (isPlaceholderImage) return false;

            return true;
          });
          setProjects(publicProjects);
        }
      } catch (error: any) {
        console.error("Detailed Error in fetchProjects:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        
        // Timeout(57014) 등 여러 에러 시 빈 배열 반환하여 로딩 무한 지연(White Screen) 방지
        setProjects([]);
      }
    };

    const seedAndFetch = async () => {
      const isSeeded = localStorage.getItem('jejuremaker_initial_seeded_v1');
      if (!isSeeded) {
        // Run seed check & insert concurrently to avoid timeout
        await Promise.allSettled(INITIAL_PROJECTS.map(async (p) => {
          const { data } = await supabase.from('items').select('id').eq('title', p.title).maybeSingle();
          if (!data) {
            return supabase.from('items').insert({
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
        }));
        localStorage.setItem('jejuremaker_initial_seeded_v1', 'true');
      }
      fetchProjects();
    };

    seedAndFetch();

    // Realtime subscription for items table (likes, views sync across users)
    const itemsChannel = supabase
      .channel('items-changes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'items' },
        (payload: any) => {
          const updated = payload.new;
          if (updated) {
            setProjects(prev => prev.map(p => {
              if (p.id === updated.id?.toString()) {
                // Only update if the field is explicitly provided in the payload
                const newLikes = updated.likes !== undefined && updated.likes !== null ? updated.likes : p.likes;
                const newViews = updated.views !== undefined && updated.views !== null ? updated.views : p.views;
                return { ...p, likes: newLikes, views: newViews };
              }
              return p;
            }));
          }
        }
      )
      .subscribe();

    return () => {
       subscription.unsubscribe();
       supabase.removeChannel(itemsChannel);
    };
  }, []);

  // Global Realtime Presence & Notification Channel
  useEffect(() => {
    if (!user) return;

    const channel = supabase.channel('global-room');
    globalChannelRef.current = channel;

    channel
      .on('presence', { event: 'sync' }, () => {
        const newState = channel.presenceState();
        const users = Object.values(newState).map((presences: any) => presences[0]);
        const uniqueUsers = Array.from(new Map(users.map(item => [item.user_id, item])).values());
        setOnlineUsers(uniqueUsers);
      })
      .on('broadcast', { event: 'chat_notify' }, (payload: any) => {
         const data = payload.payload;
         // Filter direct messages meant for me, or project room messages
         if (data.projectId === 'direct_message') {
             if (data.targetUserId !== user.id) return; 
         } else {
             if (data.projectId === selectedProject?.id) return;
         }

         const newNotif = {
            id: Date.now().toString() + Math.random().toString(36).substring(7),
            ...data,
            read: false,
            timestamp: new Date().toISOString()
         };
         setToastNotification(data);
         setNotifications(prev => [newNotif, ...prev].slice(0, 50));
         setTimeout(() => setToastNotification(null), 8000);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Fetch the most up-to-date profile from the user_profiles table
          const { data: profile } = await supabase
              .from('user_profiles')
              .select('nickname, avatar_url')
              .eq('user_id', user.id)
              .maybeSingle();

          await channel.track({
            user_id: user.id,
            nickname: profile?.nickname || '',
            virtual_nickname: getVirtualNickname(user.id),
            avatar: profile?.avatar_url || user.user_metadata?.avatar_url || `https://api.dicebear.com/9.x/avataaars/svg?seed=${user.id}`,
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
       supabase.removeChannel(channel);
       globalChannelRef.current = null;
    };
  }, [user, selectedProject?.id]);

  // Extracted fetch function
  const fetchMyProjects = async () => {
    if (!user) {
      setMyProjects([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('items')
        // metadata(JSONB) 제외: 대용량 컬럼이 statement timeout(57014) 원인
        .select('id, title, maker, image_url, category, estimated_time, difficulty, is_ai_generated, is_public, owner_id, likes, views, created_at, material, required_tools')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Supabase API Error (fetchMyProjects):', error.message || error.code || error);
        throw error;
      }

      if (data) {
        // Exclude community posts via JS filter
        const filteredData = data.filter((item: any) => item.category !== 'Social').slice(0, 30);

        // user_profiles 별도 쿼리 불필요: 내 프로젝트는 항상 현재 사용자 소유
        const myNickname = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Me';
        const myAvatarUrl = user.user_metadata?.avatar_url;

        const mappedProjects: Project[] = filteredData.map((item: any) => ({
          id: item.id.toString(),
          title: item.title,
          maker: item.maker || myNickname,
          makerAvatarUrl: myAvatarUrl,
          image: item.image_url || 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80',
          images: [],
          category: item.category,
          time: item.estimated_time || '2h',
          difficulty: (item.difficulty as 'Easy' | 'Medium' | 'Hard') || 'Medium',
          isAiRemix: item.is_ai_generated,
          description: item.title + ' - Custom project',
          steps: [],
          downloadUrl: '',
          modelFiles: [],
          isPublic: item.is_public ?? false,
          ownerId: item.owner_id,
          likes: item.likes || 0,
          views: item.views || 0,
          createdAt: item.created_at,
          tools: item.required_tools || '',
          material: item.material || 'Unknown Material',
          metadata: null // metadata는 프로젝트 상세 진입 시 별도 로드
        }));

        setMyProjects(mappedProjects);
      }
    } catch (error: any) {
      // Ignore AbortError (code 20) - this happens with React StrictMode
      if (error?.code !== '20') {
        console.error('Detailed Error in fetchMyProjects:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        // Timeout(57014) 시 빈 배열로 세팅하여 Fail-Fast (사용자 멈춤 현상 해소)
        if (error?.code === '57014' || error?.message?.includes('timeout')) {
            setMyProjects([]);
        }
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
        setUserTokens(100); // Default for logged out users
        return;
      }

      try {
        // Check if user has token record
        const { data, error } = await supabase
          .from('user_tokens')
          .select('user_id, tokens_remaining, tokens_used, next_reset_at')
          .eq('user_id', user.id)
          .single();

        if (error && error.code === 'PGRST116') {
          // No record exists, create one
          const { data: newRecord, error: insertError } = await supabase
            .from('user_tokens')
            .insert({
              user_id: user.id,
              tokens_remaining: 100,
              tokens_used: 0,
              signup_date: new Date().toISOString(),
              last_reset_at: new Date().toISOString(),
              next_reset_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
            })
            .select()
            .single();

          if (insertError) {
            console.error('Failed to create token record:', insertError);
            setUserTokens(100); // Fallback
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
                tokens_remaining: 100,
                tokens_used: 0,
                last_reset_at: now.toISOString(),
                next_reset_at: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString()
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
        setUserTokens(100); // Fallback
      }
    };

    fetchUserTokens();
  }, [user]);

  // Removed: fetchMyProjects on currentView change — unnecessary egress.
  // handleAddProject already does optimistic update + background refresh.

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

    // Update database using secure proxy (Bypasses RLS limitations)
    try {
      if (!projectId.startsWith('static-')) {
        const proxyUrl = `${config.supabase.url}/functions/v1/tripo-file-proxy`;
        const response = await fetch(proxyUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.supabase.anonKey}`
          },
          body: JSON.stringify({
            action: 'toggle_like',
            projectId: projectId,
            increment: isLiked ? -1 : 1
          })
        });

        if (!response.ok) {
          console.error('Failed to update likes via proxy:', await response.text());
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
      if (userTokens < 20) {
        alert(language === 'ko' ? '토큰이 부족합니다. (필요: 20)' : 'Not enough tokens. (Required: 20)');
        return;
      }

      // Deduct tokens immediately
      const cost = 20;
      updateUserTokens(userTokens - cost);

      setShowWizard(true);
    }
  };

  const handleWizardCancel = () => {
    // Refund tokens if user cancels wizard
    console.log('Wizard canceled, refunding 20 tokens');
    if (user) {
      updateUserTokens(userTokens + 20);
    }
    setShowWizard(false);
  };

  const handleUploadComplete = (newProject: Project) => {
    // Background refresh to ensure all metadata is perfectly synced for subsequent edits
    fetchMyProjects(); 
    setProjects(prev => [newProject, ...prev.filter(p => p.id !== newProject.id)]);
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
      const tokensUsed = Math.max(0, 100 - safeTokenCount);

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

  const handleNotificationClick = (projectId: string, notifId: string) => {
    const notif = notifications.find(n => n.id === notifId);
    
    // Direct Message Reply Logic
    if (notif && projectId === 'direct_message') {
        const makerToReplyTo: Maker = {
           name: notif.sender,
           avatar: notif.senderAvatar || `https://api.dicebear.com/9.x/avataaars/svg?seed=${notif.senderUserId}`,
           projects: 0,
           likes: 'Active',
           rawLikes: 0,
           userId: notif.senderUserId
        };
        // Use timeout to let the notification dropdown close
        setTimeout(() => {
           setMessageTarget(makerToReplyTo);
           setReplyToNotifId(notifId); 
           setShowMessageModal(true);
        }, 100);
        return; // Don't try to navigate to a project
    }

    // Standard Project Notification Logic
    const proj = projects.find(p => p.id === projectId) || myProjects.find(p => p.id === projectId);
    if (proj) {
      setSelectedProject(proj);
      setWorkspaceInitialMode('human'); // Always go to human chat for notifications
      setCurrentView('workspace');
      setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, read: true } : n));
    }
  };

  const handleDeleteNotification = (notifId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notifId));
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
      (project.material || '').toLowerCase().includes(lowerTerm)
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
            onAnalyzeClick={() => {
              // Scroll to Hero analyze section or open upload
              setCurrentView('discovery');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
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
            onExit={() => {
              setCurrentView('detail');
              setWorkspaceInitialMode(null);
            }}
            language={language}
            userTokens={userTokens}
            setUserTokens={updateUserTokens}
            initialMode={workspaceInitialMode || (isAi ? 'ai' : 'human')}
            isAiProject={isAi}
            onlineUsers={onlineUsers}
            globalChannel={globalChannelRef.current}
            currentUserId={user?.id}
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
            onProfileUpdate={refreshUserProfile}
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
      userProfile={userProfile}
      userTokens={userTokens}
      language={language}
      toggleLanguage={toggleLanguage}
      isDarkMode={isDarkMode}
      toggleDarkMode={toggleDarkMode}
      onLoginClick={handleLoginClick}
      onNavigate={setCurrentView}
      onLogout={handleLogout}
      makers={activeMakers}
      onAnalyzeClick={handleAnalyzeRequest}
      sendMessageToMaker={handleOpenMessageModal}
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
      notifications={notifications}
      onNotificationClick={handleNotificationClick}
      onDeleteNotification={handleDeleteNotification}
      projects={filteredProjects}
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

      {/* Direct Message Modal */}
      {showMessageModal && messageTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 w-full max-w-md shadow-2xl scale-100 opacity-100 transition-all">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold dark:text-white flex items-center gap-2">
                        <span className="material-icons-round text-primary">send</span>
                        {language === 'ko' ? `${messageTarget.name}님에게 메시지` : `Message to ${messageTarget.name}`}
                    </h3>
                    <button onClick={() => setShowMessageModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                        <span className="material-icons-round">close</span>
                    </button>
                </div>
                <div className="mb-6 flex items-center gap-3 bg-gray-50 dark:bg-gray-700 p-3 rounded-xl border border-gray-100 dark:border-gray-600">
                    <img src={messageTarget.avatar} alt="avatar" className="w-10 h-10 rounded-full" />
                    <div>
                        <div className="font-semibold text-gray-900 dark:text-gray-100">{messageTarget.name}</div>
                        <div className="text-xs text-green-500 flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div> Active Now
                        </div>
                    </div>
                </div>
                <textarea 
                    autoFocus
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder={language === 'ko' ? "메시지를 입력하세요..." : "Type your message..."}
                    className="w-full h-32 p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none mb-6 dark:text-white text-base"
                />
                <button 
                    onClick={handleSendMessage}
                    disabled={!messageText.trim()}
                    className="w-full py-3.5 bg-primary hover:bg-primary-dark disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-2xl font-bold shadow-[0_8px_16px_-6px_rgba(255,107,43,0.4)] hover:shadow-[0_12px_20px_-6px_rgba(255,107,43,0.5)] transition-all flex items-center justify-center gap-2 text-base"
                >
                    <span className="material-icons-round text-lg">send</span>
                    {language === 'ko' ? '보내기' : 'Send'}
                </button>
            </div>
        </div>
      )}
    </Layout>
  );
};

export default App;