import React, { useState, useEffect, Suspense } from 'react';
import { User } from '@supabase/supabase-js';
import Discovery from './components/Discovery';
import Layout from './components/Layout';
import { Project, Maker } from './types';
import { supabase } from './services/supabase';

// Import Context Hooks
import { useAuth } from './contexts/AuthContext';
import { useTheme } from './contexts/ThemeContext';
import { useTokens } from './contexts/TokenContext';
import { useProjects } from './contexts/ProjectContext';
import { useNotifications } from './contexts/NotificationContext';
import { useToast } from './contexts/ToastContext';
import { deleteFromR2, getR2KeyFromUrl } from './services/r2Storage';

// Lazy-loaded components (code splitting)
const Workspace = React.lazy(() => import('./components/Workspace'));
const AdminUpload = React.lazy(() => import('./components/AdminUpload'));
const Trending = React.lazy(() => import('./components/Trending'));
const Community = React.lazy(() => import('./components/Community'));
const RemakeLab = React.lazy(() => import('./components/RemakeLab'));
const Profile = React.lazy(() => import('./components/Profile'));
const ProjectDetail = React.lazy(() => import('./components/ProjectDetail'));
const AuthModal = React.lazy(() => import('./components/AuthModal'));
const PricingModal = React.lazy(() => import('./components/PricingModal'));

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

// Static projects were removed to favor live data from Supabase.
const INITIAL_PROJECTS: Project[] = [];

const App: React.FC = () => {
  // 1. Context Hooks
  const { showToast } = useToast();
  const { user, userProfile, isAdmin, isSuperAdmin, showAuthModal, authTargetView, handleLogout, handleLoginClick, setShowAuthModal, refreshUserProfile } = useAuth();
  const { isDarkMode, language, toggleDarkMode, toggleLanguage } = useTheme();
  const { userTokens, updateUserTokens, deductTokens, refreshTokens } = useTokens();
  const { projects, myProjects, trendingProjects, hasMoreProjects, isLoading, isLoadingMoreProjects, fetchProjects, fetchMyProjects, fetchTrendingProjects, fetchProjectDetails, loadMoreProjects, handleLikeToggle, handleViewIncrement, setProjects, likedProjects, onLikeToggle, allMaterials, fetchAllMaterials } = useProjects();
  const { notifications, onlineUsers, toastNotification, setToastNotification, handleNotificationClick, handleNotificationDelete } = useNotifications();

  // 2. Local UI State
  const [currentView, setCurrentView] = useState<ViewState>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const viewParam = params.get('view') as ViewState;
      const validViews: ViewState[] = ['discovery', 'detail', 'workspace', 'upload', 'trending', 'community', 'profile', 'lab'];
      if (viewParam && validViews.includes(viewParam)) return viewParam;
    }
    return 'discovery';
  });
  
  const [challengeStats, setChallengeStats] = useState<{ 
    global_public_co2: number; 
    global_public_waste: number;
    user_private_co2: number;
    user_private_waste: number;
    global_public_count: number;
    user_private_count: number;
  } | null>(() => {
    const zeroStats = {
      global_public_co2: 0,
      global_public_waste: 0,
      user_private_co2: 0,
      user_private_waste: 0,
      global_public_count: 0,
      user_private_count: 0
    };
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('jejuremaker_challenge_stats');
        if (stored) return JSON.parse(stored);
      } catch (err) { }
    }
    return zeroStats;
  });

  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [targetProfileId, setTargetProfileId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('profileId');
    }
    return null;
  });
  
  const [showWizard, setShowWizard] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
  const [workspaceInitialMode, setWorkspaceInitialMode] = useState<'human' | 'ai' | null>(null);
  const [workspaceSelectedPeerId, setWorkspaceSelectedPeerId] = useState<string | null>(null);

  // States for messaging
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageTarget, setMessageTarget] = useState<Maker | null>(null);
  const [messageText, setMessageText] = useState('');
  const [messageOptions, setMessageOptions] = useState<{relatedProjectId?: string, relatedProjectTitle?: string, accessType?: 'blueprint' | '3d_model', isApproval?: boolean} | null>(null);
  const [receivedMessage, setReceivedMessage] = useState<string>('');

  // Fetch trending projects when switching to trending view
  useEffect(() => {
    if (currentView === 'trending') {
      fetchTrendingProjects();
    }
  }, [currentView, fetchTrendingProjects]);

  const fetchChallengeStats = async () => {
    try {
      const { data, error } = await supabase.rpc('get_remaker_challenge_stats', { 
        p_user_id: user?.id || null 
      });
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        // The RPC returns a single row with the stats
        const stats = data[0];
        setChallengeStats(stats);
        localStorage.setItem('jejuremaker_challenge_stats', JSON.stringify(stats));
      }
    } catch (err) {
      console.error("Failed to fetch challenge stats:", err);
    }
  };

  // Stats fetching
  useEffect(() => {
    fetchChallengeStats();
  }, [user?.id]);

  // Sync state with URL for refreshes and back button
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const view = params.get('view') || 'discovery';
    const projId = params.get('projectId');
    const profId = params.get('profileId');

    if (view !== currentView) setCurrentView(view as ViewState);
    if (profId !== targetProfileId) setTargetProfileId(profId);
    
    // Auto-load project if in detail view or workspace via URL
    if (projId && (!selectedProject || String(selectedProject.id) !== projId)) {
        const loadProject = async () => {
            const proj = projects.find(p => String(p.id) === projId) || 
                         myProjects.find(p => String(p.id) === projId);
            if (proj) {
                if (view === 'detail') setSelectedProject(proj);
                if (view === 'workspace') setProjectToEdit(proj);
            } else {
                const fetched = await fetchProjectDetails(projId);
                if (fetched) {
                    if (view === 'detail') setSelectedProject(fetched);
                    if (view === 'workspace') setProjectToEdit(fetched);
                }
            }
        };
        loadProject();
    }
  }, []); // Run only on mount to handle deep links. Navigation changes are handled by popstate and internal state updates.

  // Push state to URL when state changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const currentUrlView = params.get('view');
    const currentUrlProjId = params.get('projectId');
    const currentUrlProfId = params.get('profileId');

    const nextProjId = (currentView === 'detail' && selectedProject) ? String(selectedProject.id) : 
                       (currentView === 'workspace' && projectToEdit) ? String(projectToEdit.id) : null;
    const nextProfId = (currentView === 'profile' && targetProfileId) ? targetProfileId : null;

    if (currentUrlView !== currentView || currentUrlProjId !== nextProjId || currentUrlProfId !== nextProfId) {
        const newParams = new URLSearchParams();
        newParams.set('view', currentView);
        if (nextProjId) newParams.set('projectId', nextProjId);
        if (nextProfId) newParams.set('profileId', nextProfId);
        
        // Preserve hash fragment (crucial for Supabase OAuth redirects)
        const hash = window.location.hash;
        const newUrl = `${window.location.pathname}?${newParams.toString()}${hash}`;
        
        window.history.pushState({ view: currentView, projectId: nextProjId, profileId: nextProfId }, '', newUrl);
    }
  }, [currentView, selectedProject?.id, projectToEdit?.id, targetProfileId]);

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
        const state = event.state;
        if (state) {
            setCurrentView(state.view || 'discovery');
            setTargetProfileId(state.profileId || null);
            // Project selection will be handled by the URL sync effect
        } else {
            // Fallback for initial state
            const params = new URLSearchParams(window.location.search);
            setCurrentView((params.get('view') as ViewState) || 'discovery');
            setTargetProfileId(params.get('profileId') || null);
        }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Sync selectedProject with latest data from context lists
  useEffect(() => {
    if (selectedProject) {
      const latest = projects.find(p => String(p.id) === String(selectedProject.id)) || 
                     myProjects.find(p => String(p.id) === String(selectedProject.id));
      
      if (latest && (Number(latest.likes) !== Number(selectedProject.likes) || Number(latest.views) !== Number(selectedProject.views))) {
        setSelectedProject(latest);
      }
    }
  }, [projects, myProjects, selectedProject]);

  // =========================================================================
  // UI HANDLERS (Bridging Contexts & Views)
  // =========================================================================
  const handleAnalyzeRequest = () => {
    if (!user) {
      handleLoginClick('discovery');
    } else {
      if (userTokens < 20) {
        showToast(language === 'ko' ? '토큰이 부족합니다. (필요: 20)' : 'Not enough tokens. (Required: 20)', 'warning');
        return;
      }
      updateUserTokens(userTokens - 20);
      setShowWizard(true);
    }
  };

  const handleWizardCancel = () => {
    if (user) updateUserTokens(userTokens + 20);
    setShowWizard(false);
  };

  const handleUploadComplete = (newProject: Project) => {
    fetchProjects();
    fetchMyProjects(); 
    fetchAllMaterials();
    fetchTrendingProjects();
    fetchChallengeStats(); // Refresh stats after new project
    setProjects(prev => [newProject, ...prev.filter(p => p.id !== newProject.id)]);
    setCurrentView('profile'); // Redirect to profile (Library)
  };

  const handleOpenMessageModal = (maker: Maker, initialMessage?: string, options?: any) => {
    if (!user) {
        handleLoginClick();
        return;
    }
    setMessageTarget(maker);
    setMessageText(initialMessage || '');
    setMessageOptions(options || null);
    setReceivedMessage(options?.receivedMessage || '');
    setShowMessageModal(true);
  };

  const handleApproveRequest = async () => {
      if (!messageTarget || !user || !messageOptions?.accessType || !messageOptions?.relatedProjectId) return;
      
      try {
          // 1. Grant Access via RPC
          const { error: grantError } = await supabase.rpc('grant_blueprint_access', {
              p_project_id: messageOptions.relatedProjectId,
              p_user_id: (messageTarget as any).userId,
              p_access_type: messageOptions.accessType
          });

          if (grantError) {
              console.error("Grant Access Error:", grantError);
              showToast(language === 'ko' ? `승인 실패: ${grantError.message}` : `Approval failed: ${grantError.message}`, 'error');
              return;
          }

          // 2. Send Confirmation Message
          await handleSendMessage();
          
          showToast(language === 'ko' ? '승인 및 메시지 전송이 완료되었습니다.' : 'Approval and confirmation message sent!', 'success');
      } catch (err: any) {
          console.error("Failed to approve request", err);
          showToast(language === 'ko' ? `오류가 발생했습니다: ${err.message}` : `An error occurred: ${err.message}`, 'error');
      }
  };

  const handleSendMessage = async () => {
      if (!messageText.trim() || !messageTarget || !user) return;
      try {
          const receiverId = (messageTarget as any).userId;
          // UUID check for project_id to avoid "invalid input syntax for type uuid"
          const isValidUuid = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
          const pid = messageOptions?.relatedProjectId;
          const finalProjectId = (pid && isValidUuid(pid)) ? pid : null;

          console.log(`App: handleSendMessage to receiverId="${receiverId}" from userId="${user.id}"`);
          const { error } = await supabase.from('direct_messages').insert({
              sender_id: user.id,
              receiver_id: receiverId,
              content: messageText,
              project_id: finalProjectId,
              metadata: {
                  projectTitle: messageOptions?.relatedProjectTitle,
                  accessType: messageOptions?.accessType,
                  relatedProjectId: messageOptions?.relatedProjectId,
                  type: messageOptions?.isApproval ? 'access_approved' : undefined
              }
          });

          if (error) {
              console.error("Supabase DM Error:", error);
              showToast(language === 'ko' ? `메시지 전송 실패: ${error.message}` : `Failed to send message: ${error.message}`, 'error');
              return;
          }

          showToast(language === 'ko' ? '메시지를 보냈습니다.' : 'Message sent!', 'success');
          setShowMessageModal(false);
          setMessageText('');
      } catch (err: any) {
          console.error("Failed to send message", err);
          showToast(language === 'ko' ? `오류가 발생했습니다: ${err.message || '알 수 없는 오류'}` : `An error occurred: ${err.message || 'Unknown error'}`, 'error');
      }
  };

  const handlePublish = async (projectId: string) => {
    try {
      const { error } = await supabase
        .from('items')
        .update({ is_public: true })
        .eq('id', projectId);

      if (error) throw error;

      fetchProjects(); 
      fetchMyProjects();
      fetchChallengeStats(); // Refresh stats after publishing
      showToast(language === 'ko' ? '프로젝트가 게시되었습니다.' : 'Project published successfully.', 'success');
    } catch (error) {
      console.error('Failed to publish project:', error);
    }
  };

  const handleEditProject = (project: Project) => {
    setProjectToEdit(project);
    setCurrentView('upload');
  };

  const handleProjectSelect = async (project: Project) => {
    setSelectedProject(project);
    setCurrentView('detail');
    handleViewIncrement(project.id);
    
    // Fetch full details (metadata) because list views no longer fetch it
    if (!project.steps || project.steps.length === 0) {
      const fullProject = await fetchProjectDetails(project.id);
      if (fullProject) {
        setSelectedProject(fullProject);
      }
    }
  };
  const handleSearch = (term: string) => {
    setSearchTerm(term);
    if (term) {
      setCurrentView('discovery');
    }
  };

  const handleNavigate = (view: ViewState, targetId?: string | null) => {
    setTargetProfileId(targetId || null);
    setCurrentView(view);
  };

  // =========================================================================
  // VIEW RENDERER
  // =========================================================================
  const handleSelectNotification = (notif: any) => {
    handleNotificationClick(notif, () => {
      // Priority: Check if it's a blueprint/model access request or approval confirmation
      const accessType = notif.metadata?.accessType || notif.accessType;
      const isApproval = notif.metadata?.type === 'access_approved' || notif.metadata?.isApproval;

      if (isApproval) {
        handleOpenMessageModal({
          name: notif.sender,
          avatar: notif.senderAvatar,
          userId: notif.senderUserId,
          projects: 0,
          likes: '0'
        }, '', {
          relatedProjectId: notif.relatedProjectId || notif.projectId,
          relatedProjectTitle: notif.projectTitle,
          receivedMessage: notif.message
        });
        return;
      }

      if (accessType && !isApproval) {
        const approvalMsg = accessType === 'fabrication_guide'
          ? (language === 'ko' ? '제작가이드 요청을 승인했습니다. 이제 프로젝트에서 확인하실 수 있습니다.' : 'I have approved your fabrication guide request. You can now view it in the project.')
          : (language === 'ko' ? '도면 요청을 승인했습니다. 이제 프로젝트에서 확인하실 수 있습니다.' : 'I have approved your request. You can now view it in the project.');
        handleOpenMessageModal({
          name: notif.sender,
          avatar: notif.senderAvatar,
          userId: notif.senderUserId,
          projects: 0,
          likes: '0'
        }, approvalMsg, {
          relatedProjectId: notif.relatedProjectId || notif.projectId,
          relatedProjectTitle: notif.projectTitle,
          accessType: accessType,
          isApproval: true,
          receivedMessage: notif.message
        });
        return;
      }

      // Check if it's a workspace chat notification (명시적으로 workspace_chat 타입인 경우만)
      if (notif.metadata?.type === 'workspace_chat') {
        const targetProjectId = notif.relatedProjectId || notif.projectId;
        if (targetProjectId && targetProjectId !== 'direct_message') {
          const targetProj = projects.find(p => String(p.id) === String(targetProjectId)) ||
                           myProjects.find(p => String(p.id) === String(targetProjectId));

          if (targetProj) {
            setProjectToEdit(targetProj);
            setWorkspaceInitialMode('human');
            setWorkspaceSelectedPeerId(notif.senderUserId);
            setCurrentView('workspace');
            return;
          }
        }
      }

      // Default: Open message modal for reply (원본 메시지 포함)
      handleOpenMessageModal({
        name: notif.sender,
        avatar: notif.senderAvatar,
        userId: notif.senderUserId,
        projects: 0,
        likes: '0'
      }, '', {
        relatedProjectId: notif.relatedProjectId,
        relatedProjectTitle: notif.projectTitle,
        accessType: notif.accessType,
        receivedMessage: notif.message
      });
    });
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'detail':
        return selectedProject ? (
          <Suspense fallback={<LazyFallback />}>
          <ProjectDetail
            project={selectedProject}
            onBack={() => {
                setSelectedProject(null);
                setCurrentView('discovery');
            }}
            onEdit={(proj) => {
              setProjectToEdit(proj);
              setWorkspaceInitialMode('human');
              setCurrentView('workspace');
            }}
            onAnalyze={() => {
              setProjectToEdit(selectedProject);
              setWorkspaceInitialMode('ai');
              setCurrentView('workspace');
            }}
            onLikeToggle={handleLikeToggle}
            onViewIncrement={handleViewIncrement}
            user={user || undefined}
            isOwner={!!(user?.id && selectedProject?.ownerId && user.id === selectedProject.ownerId)}
            isSuperAdmin={isSuperAdmin}
            onViewProfile={(profileId) => {
               setTargetProfileId(profileId);
               setCurrentView('profile');
            }}
            onStatusChange={fetchChallengeStats}
            onMessageClick={handleOpenMessageModal}
            language={language}
            likedProjects={likedProjects}
            userTokens={userTokens}
            onDeductTokens={deductTokens}
            onLoginClick={handleLoginClick}
            onNavigate={handleNavigate}
            isDarkMode={isDarkMode}
            toggleDarkMode={toggleDarkMode}
            toggleLanguage={toggleLanguage}
          />
          </Suspense>
        ) : <Discovery
              onNavigate={setCurrentView}
              onProjectSelect={handleProjectSelect}
              isDarkMode={isDarkMode}
              toggleDarkMode={toggleDarkMode}
              language={language}
              toggleLanguage={toggleLanguage}
              projects={projects}
              user={user}
              onLoginClick={handleLoginClick}
              onLogout={() => handleLogout(language)}
              userTokens={userTokens}
              setUserTokens={updateUserTokens}
              onAddProject={(p) => {
                setProjects([p, ...projects]);
                setCurrentView('profile');
              }}
              onLikeToggle={onLikeToggle}
              likedProjects={likedProjects}
              onAnalyzeClick={handleAnalyzeRequest}
              onLoadMore={loadMoreProjects}
              hasMore={hasMoreProjects}
              isLoading={isLoading}
              isLoadingMore={isLoadingMoreProjects}
              allMaterials={allMaterials}
            />;

      case 'workspace':
        return (
          <Suspense fallback={<LazyFallback />}>
            <Workspace 
              onExit={() => {
                setProjectToEdit(null);
                setWorkspaceInitialMode(null);
                setWorkspaceSelectedPeerId(null);
                setCurrentView('discovery');
              }}
              project={projectToEdit!}
              initialMode={workspaceInitialMode || 'human'}
              language={language}
              userTokens={userTokens}
              setUserTokens={updateUserTokens}
              currentUserId={user?.id}
              onlineUsers={onlineUsers}
              initialSelectedPeerId={workspaceSelectedPeerId}
            />
          </Suspense>
        );

      case 'upload':
        return (
          <Suspense fallback={<LazyFallback />}>
            {user ? (
              <AdminUpload 
                supabase={supabase}
                onBack={() => setCurrentView('discovery')}
                onUploadComplete={(newProj) => {
                  handleUploadComplete(newProj);
                }}
                language={language}
                user={user}
                onSelectProject={handleProjectSelect}
                initialProject={projectToEdit}
              />
            ) : (
                <div className="p-20 text-center">Login Required</div>
            )}
          </Suspense>
        );

      case 'trending':
        return (
          <Suspense fallback={<LazyFallback />}>
            <Trending 
               projects={trendingProjects} 
               onProjectSelect={handleProjectSelect}
               onNavigate={handleNavigate}
               language={language}
               user={user}
               isDarkMode={isDarkMode}
               toggleDarkMode={toggleDarkMode}
               toggleLanguage={toggleLanguage}
               onLoginClick={handleLoginClick}
               onLogout={() => handleLogout(language)}
               onLikeToggle={handleLikeToggle}
               likedProjects={likedProjects}
            />
          </Suspense>
        );

      case 'community':
        return (
          <Suspense fallback={<LazyFallback />}>
            <Community 
              language={language}
              user={user}
              isDarkMode={isDarkMode}
              toggleDarkMode={toggleDarkMode}
              toggleLanguage={toggleLanguage}
              onNavigate={handleNavigate}
              onLoginClick={handleLoginClick}
              onLogout={() => handleLogout(language)}
            />
          </Suspense>
        );

      case 'lab':
        if (!isSuperAdmin) {
          return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
              <div className="w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-6">
                <span className="material-icons-round text-4xl text-amber-500">construction</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                {language === 'ko' ? '오픈 준비 중' : 'Coming Soon'}
              </h2>
              <p className="text-gray-500 dark:text-gray-400 max-w-sm leading-relaxed mb-6">
                {language === 'ko'
                  ? '제주 리메이크 랩은 현재 오픈 준비 중입니다. 곧 만나요!'
                  : 'Jeju Remake Lab is currently under preparation. See you soon!'}
              </p>
              <button
                onClick={() => setCurrentView('discovery')}
                className="px-6 py-3 rounded-2xl bg-primary text-white font-bold hover:bg-primary/90 transition"
              >
                {language === 'ko' ? '홈으로 돌아가기' : 'Back to Home'}
              </button>
            </div>
          );
        }
        return (
          <Suspense fallback={<LazyFallback />}>
            <RemakeLab
                language={language}
                userTokens={userTokens}
                setUserTokens={updateUserTokens}
                onTokenClick={() => setShowPricingModal(true)}
            />
          </Suspense>
        );

      case 'profile':
        return (
          <Suspense fallback={<LazyFallback />}>
            <Profile 
              user={user}
              targetUserId={targetProfileId || user?.id}
              myProjects={myProjects}
              onProjectSelect={handleProjectSelect}
              onEdit={handleEditProject}
              onPublish={handlePublish}
              onDelete={async (id) => {
                  try {
                      // 1. Collect asset keys before DB deletion
                      const projectToDelete = projects.find(p => String(p.id) === String(id)) || 
                                            myProjects.find(p => String(p.id) === String(id));
                      
                      const keysToDelete: string[] = [];
                      if (projectToDelete) {
                          const primaryKey = getR2KeyFromUrl(projectToDelete.image);
                          if (primaryKey) keysToDelete.push(primaryKey);
                          
                          if (projectToDelete.metadata) {
                              const mk = projectToDelete.metadata;
                              if (mk.model_3d_url) {
                                  const key = getR2KeyFromUrl(mk.model_3d_url);
                                  if (key) keysToDelete.push(key);
                              }
                              if (mk.blueprint_url) {
                                  const key = getR2KeyFromUrl(mk.blueprint_url);
                                  if (key) keysToDelete.push(key);
                              }
                              if (Array.isArray(mk.images)) {
                                  mk.images.forEach((url: string) => {
                                      const key = getR2KeyFromUrl(url);
                                      if (key) keysToDelete.push(key);
                                  });
                              }
                          }
                      }

                      // 2. Perform DB deletion
                      const { error } = await supabase.from('items').delete().eq('id', id);
                      if (error) throw error;
                      
                      // 3. Trigger immediate R2 cleanup (non-blocking for UI)
                      if (keysToDelete.length > 0) {
                          deleteFromR2(keysToDelete).catch(err => console.warn("Background R2 cleanup failed:", err));
                      }
                      
                      // 4. Update local state
                      setProjects(prev => prev.filter(p => String(p.id) !== String(id)));
                      
                      await Promise.all([
                        fetchProjects(),
                        fetchMyProjects(),
                        fetchAllMaterials(),
                        fetchTrendingProjects(),
                        fetchChallengeStats()
                      ]);
                  } catch (e: any) { 
                      console.error("Deletion failed:", e);
                      showToast(language === 'ko' ? `삭제 실패: ${e.message}` : `Deletion failed: ${e.message}`, 'error');
                  }
              }}
              onNavigate={handleNavigate}
              isDarkMode={isDarkMode}
              toggleDarkMode={toggleDarkMode}
              language={language}
              toggleLanguage={toggleLanguage}
              onLoginClick={handleLoginClick}
              onLogout={() => handleLogout(language)}
              userTokens={userTokens}
              onProfileUpdate={refreshUserProfile}
            />
          </Suspense>
        );

      default:
        return (
          <Discovery 
            onNavigate={setCurrentView}
            onProjectSelect={handleProjectSelect}
            isDarkMode={isDarkMode}
            toggleDarkMode={toggleDarkMode}
            language={language}
            toggleLanguage={toggleLanguage}
            projects={projects}
            user={user}
            onLoginClick={handleLoginClick}
            onLogout={() => handleLogout(language)}
            userTokens={userTokens}
            setUserTokens={updateUserTokens}
            onAddProject={(p) => setProjects([p, ...projects])}
            onLikeToggle={onLikeToggle}
            likedProjects={likedProjects}
            onAnalyzeClick={handleAnalyzeRequest}
            onLoadMore={loadMoreProjects}
            hasMore={hasMoreProjects}
            isLoading={isLoading}
            isLoadingMore={isLoadingMoreProjects}
            allMaterials={allMaterials}
          />
        );
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'dark bg-gray-950' : 'bg-gray-50'}`}>
      <Layout
        currentView={currentView}
        onNavigate={(view, id) => {
          if (view === 'workspace' || view === 'upload' || view === 'profile') {
            if (!user) {
               handleLoginClick(view);
               return;
             }
          }
          setCurrentView(view);
          setSelectedProject(null);
          if (id) {
            setTargetProfileId(id);
          } else {
            setTargetProfileId(null);
          }
        }}
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
        language={language}
        toggleLanguage={toggleLanguage}
        onAnalyzeClick={handleAnalyzeRequest}
        makers={onlineUsers.map(u => ({
          name: u.nickname || u.virtual_nickname || 'Maker',
          avatar: u.avatar,
          userId: u.user_id,
          projects: 0,
          likes: '0'
        }))}
        notifications={notifications}
        onNotificationClick={(projectId, notifId) => {
          const notif = notifications.find(n => n.id === notifId);
          if (notif) {
            handleSelectNotification(notif);
          }
        }}
        onDeleteNotification={handleNotificationDelete}
        user={user}
        userProfile={userProfile}
        userTokens={userTokens}
        onLogout={() => handleLogout(language)}
        onLoginClick={() => handleLoginClick()}
        challengeStats={challengeStats}
        isSuperAdmin={isSuperAdmin}
        sendMessageToMaker={handleOpenMessageModal}
        projects={projects}
        myProjects={myProjects}
        showWizard={showWizard}
        setShowWizard={setShowWizard}
        setUserTokens={updateUserTokens}
        onAddProject={(p) => {
          setProjects([p, ...projects]);
          setCurrentView('profile');
        }}
        onCancel={handleWizardCancel}
        onTokenClick={() => setShowPricingModal(true)}
      >
        <main className={(currentView === 'upload' || currentView === 'lab' || currentView === 'workspace') ? "w-full min-h-full relative" : "max-w-7xl mx-auto px-4 py-8 relative"}>
          {renderCurrentView()}
        </main>
      </Layout>

      {/* Shared Modals & Toasts */}
      <Suspense fallback={null}>
        <PricingModal
          isOpen={showPricingModal}
          onClose={() => setShowPricingModal(false)}
          language={language}
          userTokens={userTokens}
          onPurchaseTokens={() => {}}
          onSubscribe={() => {}}
        />
        <AuthModal
          isOpen={showAuthModal}
          supabase={supabase}
          onClose={() => setShowAuthModal(false)}
          onSuccess={() => {
            setShowAuthModal(false);
            refreshTokens();
            refreshUserProfile();
            if (authTargetView) {
              setCurrentView(authTargetView);
            }
          }}
          language={language}
          currentView={currentView}
          projectId={(selectedProject?.id || projectToEdit?.id)?.toString()}
        />
      </Suspense>

      {toastNotification && currentView !== 'workspace' && (
        <div className="fixed bottom-6 right-6 z-[100] animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 shadow-2xl flex items-start gap-4 max-w-sm">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
               <span className="text-xl">💬</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                {toastNotification.sender}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mt-1">
                {toastNotification.message}
              </p>
              <div className="flex items-center gap-2 mt-3">
                <button 
                  onClick={() => {
                    handleSelectNotification(toastNotification);
                    setToastNotification(null);
                  }}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  {language === 'ko' ? '보기' : 'View'}
                </button>
                <span className="text-gray-300">|</span>
                <button 
                  onClick={() => setToastNotification(null)}
                  className="text-xs font-medium text-gray-400 hover:text-gray-600"
                >
                  {language === 'ko' ? '닫기' : 'Close'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Message Modal */}
      {showMessageModal && messageTarget && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
              <h3 className="text-lg font-bold dark:text-white">
                {messageOptions?.isApproval && messageOptions?.accessType === 'fabrication_guide'
                  ? (language === 'ko' ? '제작가이드 요청 승인' : 'Approve Guide Request')
                  : messageOptions?.isApproval && messageOptions?.accessType
                  ? (language === 'ko' ? '도면/모델 요청 승인' : 'Approve Request')
                  : messageOptions?.accessType === 'fabrication_guide'
                  ? (language === 'ko' ? '제작가이드 요청' : 'Request Fabrication Guide')
                  : (language === 'ko' ? `${messageTarget.name}님에게 메시지` : `Message to ${messageTarget.name}`)}
              </h3>
              <button onClick={() => setShowMessageModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="p-6">
              {receivedMessage && (
                <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 rounded-2xl">
                  <p className="text-xs font-medium text-blue-500 dark:text-blue-400 mb-1.5 flex items-center gap-1">
                    <span className="material-icons-round text-sm">mail</span>
                    {language === 'ko' ? `${messageTarget.name}님의 메시지` : `Message from ${messageTarget.name}`}
                  </p>
                  <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">{receivedMessage}</p>
                </div>
              )}
              {messageOptions?.relatedProjectTitle && (
                <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl flex items-center gap-3">
                  <span className="text-lg">📦</span>
                  <div>
                    <p className="text-xs text-gray-500">{language === 'ko' ? '관련 프로젝트' : 'Related Project'}</p>
                    <p className="text-sm font-medium dark:text-white">{messageOptions.relatedProjectTitle}</p>
                  </div>
                </div>
              )}
              <textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder={language === 'ko' ? '메시지를 입력하세요...' : 'Enter your message...'}
                className="w-full h-32 p-4 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl resize-none focus:ring-2 focus:ring-primary/20 dark:text-white"
              />
              <div className="mt-6 flex gap-3">
                <button 
                  onClick={() => setShowMessageModal(false)}
                  className="flex-1 py-3 px-6 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-bold hover:bg-gray-200"
                >
                  {language === 'ko' ? '취소' : 'Cancel'}
                </button>
                <button 
                  onClick={messageOptions?.isApproval ? handleApproveRequest : handleSendMessage}
                  className={`flex-1 py-3 px-6 rounded-xl font-bold transition-all shadow-lg text-white ${
                    messageOptions?.isApproval 
                      ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20' 
                      : 'bg-primary hover:bg-primary/90 shadow-primary/20'
                  }`}
                >
                  {messageOptions?.isApproval 
                    ? (language === 'ko' ? '승인 및 전송' : 'Approve & Send')
                    : (language === 'ko' ? '전송' : 'Send')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
