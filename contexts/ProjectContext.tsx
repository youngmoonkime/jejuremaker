import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../services/supabase';
import { Project } from '../types';
import { useAuth } from './AuthContext';

interface ProjectContextType {
  projects: Project[];
  myProjects: Project[];
  hasMoreProjects: boolean;
  isLoading: boolean;
  isLoadingMoreProjects: boolean;
  fetchProjects: () => Promise<void>;
  fetchMyProjects: () => Promise<void>;
  loadMoreProjects: () => Promise<void>;
  trendingProjects: Project[];
  fetchTrendingProjects: () => Promise<void>;
  fetchProjectDetails: (projectId: string) => Promise<Project | null>;
  likedProjects: Set<string>;
  onLikeToggle: (projectId: string) => Promise<void>;
  handleLikeToggle: (projectId: string) => Promise<void>;
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  allMaterials: string[];
  fetchAllMaterials: () => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

const PAGE_SIZE = 6;

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [trendingProjects, setTrendingProjects] = useState<Project[]>([]);
  const [myProjects, setMyProjects] = useState<Project[]>([]);
  const [projectsCursor, setProjectsCursor] = useState<string | null>(null);
  const [hasMoreProjects, setHasMoreProjects] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoadingMoreProjects, setIsLoadingMoreProjects] = useState<boolean>(false);
  const [likedProjects, setLikedProjects] = useState<Set<string>>(new Set());
  const [allMaterials, setAllMaterials] = useState<string[]>([]);
  const isFetchingRef = useRef(false);
  const isFetchingMyProjectsRef = useRef(false);
  const isFetchingMaterialsRef = useRef(false);

  const fetchUserLikes = useCallback(async () => {
    if (!user) {
      setLikedProjects(new Set());
      return;
    }

    try {
      const { data, error } = await supabase
        .from('project_likes')
        .select('project_id')
        .eq('user_id', user.id);

      if (error) throw error;

      if (data) {
        const likedIds = new Set(data.map(item => String(item.project_id)));
        setLikedProjects(likedIds);
        localStorage.setItem('jejuremaker_liked_projects', JSON.stringify(Array.from(likedIds)));
      }
    } catch (err) {
      console.error("Error fetching user likes:", err);
      // Fallback to localStorage
      const stored = localStorage.getItem('jejuremaker_liked_projects');
      if (stored) {
        try {
          const arr = JSON.parse(stored);
          if (Array.isArray(arr)) {
            setLikedProjects(new Set(arr.map(String)));
          }
        } catch (e) { }
      }
    }
  }, [user]);

  // Sync liked projects from DB when user changes
  useEffect(() => {
    fetchUserLikes();
  }, [user, fetchUserLikes]);

  // Initial local storage sync (fallback/pre-login)
  useEffect(() => {
    if (user) return; // DB sync will handle it if logged in

    const liked = new Set<string>();
    const stored = localStorage.getItem('jejuremaker_liked_projects');
    if (stored) {
      try {
        const arr = JSON.parse(stored);
        if (Array.isArray(arr)) {
          arr.forEach(id => liked.add(String(id)));
        }
      } catch (err) { }
    }
    setLikedProjects(liked);
  }, [user]);

  const mapProjectsData = useCallback((data: any[], profilesMap: Record<string, any>): Project[] => {
    return data.map((item: any) => {
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
        ecoScore: item.eco_score,
        metadata: {
          material_qty: item.material_qty,
          material_unit: item.material_unit,
          ...item.metadata
        }
      };
    });
  }, []);

  const fetchProjects = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setIsLoading(true);

    try {
      // 🔧 최적화: 무거운 metadata 제외 (목록 성능 극대화)
      const { data, error } = await supabase
        .from('items')
        .select('id, title, maker, image_url, category, estimated_time, difficulty, is_ai_generated, is_public, owner_id, likes, views, created_at, material')
        .eq('is_public', true)
        .neq('category', 'Social')
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE);

      if (error) {
        console.error("Supabase API Error (fetchProjects):", error.message);
        return;
      }

      if (data && data.length > 0) {
        const lastItem = data[data.length - 1];
        setProjectsCursor(lastItem.created_at);
        setHasMoreProjects(data.length === PAGE_SIZE);

        const ownerIds = [...new Set(data.map((item: any) => item.owner_id).filter(Boolean))];
        let profilesMap: Record<string, any> = {};
        
        if (ownerIds.length > 0) {
          const { data: profilesData } = await supabase
            .from('user_profiles')
            .select('user_id, nickname, avatar_url')
            .in('user_id', ownerIds);
            
          if (profilesData) {
            profilesMap = profilesData.reduce((acc: any, profile: any) => {
              acc[profile.user_id] = profile;
              return acc;
            }, {});
          }
        }

        setProjects(mapProjectsData(data, profilesMap));
      } else {
        setHasMoreProjects(false);
      }
    } catch (error) {
      console.error("Error in fetchProjects:", error);
    } finally {
      isFetchingRef.current = false;
      setIsLoading(false);
    }
  }, [mapProjectsData]);
  
  // FIXED: 500 에러 해결 - 단일 .order() 사용 + 클라이언트 정렬
  const fetchTrendingProjects = useCallback(async () => {
    try {
      // 🔧 최적화: 무거운 metadata 제외 (Social 카테고리 제외)
      const { data, error } = await supabase
        .from('items')
        .select('id, title, maker, image_url, category, estimated_time, difficulty, is_ai_generated, is_public, owner_id, likes, views, created_at, material')
        .eq('is_public', true)
        .neq('category', 'Social')
        .order('likes', { ascending: false })
        .limit(30);

      if (error) {
        console.error("Supabase Error (fetchTrendingProjects):", error);
        return;
      }

      if (data && data.length > 0) {
        // 클라이언트에서 likes + views 합산 점수로 재정렬
        const sorted = [...data].sort((a, b) => {
          const scoreA = (a.likes || 0) * 2 + (a.views || 0);
          const scoreB = (b.likes || 0) * 2 + (b.views || 0);
          return scoreB - scoreA;
        });

        const ownerIds = [...new Set(sorted.map((item: any) => item.owner_id).filter(Boolean))];
        let profilesMap: Record<string, any> = {};
        
        if (ownerIds.length > 0) {
          const { data: profilesData } = await supabase
            .from('user_profiles')
            .select('user_id, nickname, avatar_url')
            .in('user_id', ownerIds);
            
          if (profilesData) {
            profilesMap = profilesData.reduce((acc: any, profile: any) => {
              acc[profile.user_id] = profile;
              return acc;
            }, {});
          }
        }
        setTrendingProjects(mapProjectsData(sorted, profilesMap));
      }
    } catch (err) {
      console.error("Error fetching trending projects:", err);
    }
  }, [mapProjectsData]);

  const fetchMyProjects = useCallback(async () => {
    if (!user) {
      setMyProjects([]);
      return;
    }

    if (isFetchingMyProjectsRef.current) return;
    isFetchingMyProjectsRef.current = true;

    try {
      // 🔧 최적화: 무거운 metadata 제외 (Social 카테고리 제외)
      const { data, error } = await supabase
        .from('items')
        .select('id, title, maker, image_url, category, estimated_time, difficulty, is_ai_generated, is_public, owner_id, likes, views, created_at, material')
        .eq('owner_id', user.id)
        .neq('category', 'Social')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Supabase API Error (fetchMyProjects):', error.message);
        return;
      }

      if (data) {
        setMyProjects(mapProjectsData(data, {}));
      }
    } catch (error) {
      console.error('Failed to fetch my projects:', error);
    } finally {
      isFetchingMyProjectsRef.current = false;
    }
  }, [user]);

  const fetchProjectDetails = useCallback(async (projectId: string): Promise<Project | null> => {
    try {
      if (projectId.startsWith('static-')) return null;

      const { data, error } = await supabase
        .from('items')
        .select('*, metadata')
        .eq('id', projectId)
        .single();

      if (error) throw error;
      if (data) {
        // Fetch profile
        let profile = null;
        if (data.owner_id) {
          const { data: profileData } = await supabase
            .from('user_profiles')
            .select('user_id, nickname, avatar_url')
            .eq('user_id', data.owner_id)
            .single();
          profile = profileData;
        }
        
        const mapped = mapProjectsData([data], profile ? { [profile.user_id]: profile } : {});
        return mapped[0];
      }
      return null;
    } catch (err) {
      console.error("Error fetching project details:", err);
      return null;
    }
  }, [mapProjectsData]);

  const loadMoreProjects = useCallback(async () => {
    if (!projectsCursor || isLoadingMoreProjects || !hasMoreProjects) return;
    
    setIsLoadingMoreProjects(true);

    try {
      // 🔧 최적화: 무거운 metadata 제외 (목록 성능 극대화)
      const { data, error } = await supabase
        .from('items')
        .select('id, title, maker, image_url, category, estimated_time, difficulty, is_ai_generated, is_public, owner_id, likes, views, created_at, material')
        .eq('is_public', true)
        .neq('category', 'Social')
        .lt('created_at', projectsCursor)
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE);

      if (error) {
        console.error("Supabase API Error (loadMoreProjects):", error.message);
        return;
      }

      if (data && data.length > 0) {
        const lastItem = data[data.length - 1];
        setProjectsCursor(lastItem.created_at);
        setHasMoreProjects(data.length === PAGE_SIZE);

        const ownerIds = [...new Set(data.map((item: any) => item.owner_id).filter(Boolean))];
        let profilesMap: Record<string, any> = {};
        
        if (ownerIds.length > 0) {
          const { data: profilesData } = await supabase
            .from('user_profiles')
            .select('user_id, nickname, avatar_url')
            .in('user_id', ownerIds);
            
          if (profilesData) {
            profilesMap = profilesData.reduce((acc: any, profile: any) => {
              acc[profile.user_id] = profile;
              return acc;
            }, {});
          }
        }

        const mappedProjects = mapProjectsData(data, profilesMap);
        
        setProjects(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const newProjects = mappedProjects.filter(p => !existingIds.has(p.id));
          return [...prev, ...newProjects];
        });
      } else {
        setHasMoreProjects(false);
      }
    } catch (error) {
      console.error("Error in loadMoreProjects:", error);
    } finally {
      setIsLoadingMoreProjects(false);
    }
  }, [projectsCursor, isLoadingMoreProjects, hasMoreProjects, mapProjectsData]);

  // FIXED: Secure like toggle - Prevent infinite likes by using project_likes table
  const handleLikeToggle = useCallback(async (projectId: string) => {
    if (!user || !projectId) {
      console.warn("User must be logged in to like a project");
      return;
    }

    const isLiked = likedProjects.has(projectId);
    const newLikedProjects = new Set(likedProjects);

    // 1. Immediate local state update (Optimistic UI)
    if (isLiked) {
      newLikedProjects.delete(projectId);
    } else {
      newLikedProjects.add(projectId);
    }
    setLikedProjects(newLikedProjects);

    // Update all project lists optimistically
    const updater = (prev: Project[]) => prev.map(p => {
      if (String(p.id) === String(projectId)) {
        return { ...p, likes: Math.max(0, (Number(p.likes) || 0) + (isLiked ? -1 : 1)) };
      }
      return p;
    });
    setProjects(updater);
    setMyProjects(updater);
    setTrendingProjects(updater);

    // 2. DB Persistence
    try {
      if (!projectId.startsWith('static-')) {
        if (isLiked) {
          // Unlike: Remove from project_likes
          const { error: unlikeError } = await supabase
            .from('project_likes')
            .delete()
            .eq('project_id', projectId)
            .eq('user_id', user.id);

          if (unlikeError) throw unlikeError;
          
          // Decrement global counter
          const { error: rpcError } = await supabase.rpc('increment_likes', { row_id: projectId, amount: -1 });
          if (rpcError) {
            // Fallback if RPC fails
            const { data } = await supabase.from('items').select('likes').eq('id', projectId).single();
            await supabase.from('items').update({ likes: Math.max(0, (data?.likes || 0) - 1) }).eq('id', projectId);
          }
        } else {
          // Like: Add to project_likes
          const { error: likeError } = await supabase
            .from('project_likes')
            .insert({ project_id: projectId, user_id: user.id });

          if (likeError) {
            // Probably already liked (race condition), just ignore or handle
            if (likeError.code === '23505') return; 
            throw likeError;
          }

          // Increment global counter
          const { error: rpcError } = await supabase.rpc('increment_likes', { row_id: projectId, amount: 1 });
          if (rpcError) {
            // Fallback if RPC fails
            const { data } = await supabase.from('items').select('likes').eq('id', projectId).single();
            await supabase.from('items').update({ likes: (data?.likes || 0) + 1 }).eq('id', projectId);
          }
        }
      }
    } catch (error) {
      console.error('Error updating like:', error);
      // Rollback local state on error
      setLikedProjects(likedProjects);
      const rollbackUpdater = (prev: Project[]) => prev.map(p => {
        if (String(p.id) === String(projectId)) {
          // Simplistic rollback, in production we might need fresh data
          return { ...p, likes: (Number(p.likes) || 0) + (isLiked ? 1 : -1) };
        }
        return p;
      });
      setProjects(rollbackUpdater);
      setMyProjects(rollbackUpdater);
      setTrendingProjects(rollbackUpdater);
    }
  }, [user, likedProjects]);

  const handleViewIncrement = useCallback(async (projectId: string) => {
    if (!projectId) return;

    const sessionKey = 'jejuremaker_viewed_projects';
    const viewed = sessionStorage.getItem(sessionKey);
    const viewedSet = viewed ? new Set(JSON.parse(viewed)) : new Set<string>();

    if (viewedSet.has(projectId)) return;

    // 1. Mark as viewed locally
    viewedSet.add(projectId);
    sessionStorage.setItem(sessionKey, JSON.stringify(Array.from(viewedSet)));

    // 2. Optimistic UI update
    const updater = (prevList: Project[]) => prevList.map(p => {
      if (String(p.id) === String(projectId)) {
        return { ...p, views: (Number(p.views) || 0) + 1 };
      }
      return p;
    });
    setProjects(updater);
    setMyProjects(updater);
    setTrendingProjects(updater);

    // 3. Async Server Update - 직접 UPDATE
    if (!projectId.startsWith('static-')) {
      try {
        const { data: currentItem } = await supabase
          .from('items')
          .select('views')
          .eq('id', projectId)
          .single();

        const currentViews = currentItem?.views || 0;

        await supabase
          .from('items')
          .update({ views: currentViews + 1 })
          .eq('id', projectId);
      } catch (err) {
        console.error("View update error:", err);
      }
    }
  }, []);

  const fetchAllMaterials = useCallback(async () => {
    if (isFetchingMaterialsRef.current) return;
    isFetchingMaterialsRef.current = true;

    try {
      // 🔧 최적화: 오직 material, category 컬럼만 선택하고 Social 제외
      const { data, error } = await supabase
        .from('items')
        .select('material, category')
        .eq('is_public', true)
        .neq('category', 'Social');

      if (error) {
        console.error("Error fetching materials:", error);
        return;
      }

      if (data) {
        const materialsSet = new Set<string>();
        data.forEach(item => {
          if (item.material) materialsSet.add(item.material);
          if (item.category && item.category !== 'Social') materialsSet.add(item.category);
        });
        
        // Remove 'Unknown Material' and similar if necessary, then sort
        const sortedMaterials = Array.from(materialsSet)
          .filter(m => m && m !== 'Unknown Material' && m !== 'Social')
          .sort((a, b) => a.localeCompare(b));
          
        setAllMaterials(sortedMaterials);
      }
    } catch (err) {
      console.error("Error in fetchAllMaterials:", err);
    } finally {
      isFetchingMaterialsRef.current = false;
    }
  }, []);

  useEffect(() => {
    fetchProjects();
    fetchAllMaterials(); // Fetch materials once on mount
  }, [fetchProjects, fetchAllMaterials]);

  useEffect(() => {
    if (user) fetchMyProjects();
  }, [user, fetchMyProjects]);

  const contextValue = React.useMemo(() => ({
    projects,
    myProjects,
    trendingProjects,
    hasMoreProjects,
    isLoading,
    isLoadingMoreProjects,
    fetchProjects,
    fetchMyProjects,
    fetchTrendingProjects,
    fetchProjectDetails,
    loadMoreProjects,
    likedProjects,
    onLikeToggle: handleLikeToggle,
    handleLikeToggle,
    handleViewIncrement,
    setProjects,
    allMaterials,
    fetchAllMaterials
  }), [
    projects, 
    myProjects, 
    trendingProjects, 
    hasMoreProjects, 
    isLoading, 
    isLoadingMoreProjects, 
    fetchProjects, 
    fetchMyProjects, 
    fetchTrendingProjects, 
    fetchProjectDetails,
    loadMoreProjects, 
    likedProjects, 
    handleLikeToggle, 
    handleViewIncrement,
    allMaterials,
    fetchAllMaterials
  ]);

  return (
    <ProjectContext.Provider value={contextValue}>
      {children}
    </ProjectContext.Provider>
  );
};

export const useProjects = () => {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProjects must be used within a ProjectProvider');
  }
  return context;
};