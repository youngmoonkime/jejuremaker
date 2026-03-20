import React, { useState, useEffect, useRef } from 'react';
import { Language } from '../contexts/ThemeContext';
import { Project } from '../types';
import { User } from '@supabase/supabase-js';
import ThreeDViewer, { ThreeDViewerHandle } from './ThreeDViewer';
import ErrorBoundary from './ErrorBoundary';
import CopilotPanel from './CopilotPanel';
import { config } from '../services/config';
import { supabase } from '../services/supabase';
import { uploadToR2 } from '../services/r2Storage';
import * as aiService from '../services/aiService';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

// Helper: Base64 to Blob
const base64ToBlob = (base64: string, mimeType: string) => {
  const byteCharacters = atob(base64.split(',')[1]);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
};

interface ProjectDetailProps {
  onBack: () => void;
  onEdit: (project: Project) => void;
  onAnalyze: () => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  language: Language;
  toggleLanguage: () => void;
  project: Project | null;
  user: User | null;
  onLoginClick: (targetView?: any) => void;
  onNavigate: (view: any) => void;
  onLikeToggle: (projectId: string) => void;
  onViewIncrement: (projectId: string) => void;
  likedProjects: Set<string>;
  userTokens: number;
  onDeductTokens: (tokens: number) => void;
  isOwner?: boolean;
  isSuperAdmin?: boolean;
  onViewProfile?: (profileId: string) => void;
  onStatusChange?: () => void;
  onMessageClick?: (maker: import('../types').Maker, initialMessage?: string, options?: { relatedProjectId?: string, relatedProjectTitle?: string, accessType?: 'blueprint' | 'blueprint_detailed' | 'blueprint_mechanical' | '3d_model' }) => void;
}

const TRANSLATIONS = {
  ko: {
    backToLibrary: '라이브러리로 돌아가기',
    view3D: '3D 뷰어',
    blueprint: '제작 도면',
    view3DButton: '3D 보기',
    generateBlueprint: '도면 생성',
    plastic: '지속가능한 소재',
    printing: '3D 프린팅',
    title: '제주 메이커스 04',
    description: '제주도의 자연에서 영감을 받은 지속가능한 디자인.',
    ecoScore: '에코 점수',
    carbonReduction: '탄소 절감',
    impactDesc: '약 20개의 플라스틱 병을 대체하는 효과입니다.',
    impactDescCardboard: '재활용 소재로 환경을 보호합니다.',
    findMaker: '메이커 찾기',
    connectAI: 'AI 코파일럿 연결',
    downloadGuide: '2D/3D도면 다운로드',
    printTime: '출력 시간',
    difficulty: '난이도',
    filament: '필라멘트',
    license: '라이선스',
    fabricationGuide: '제작 가이드',
    noLink: '다운로드 링크가 없습니다.',
    noFiles: '다운로드 가능한 파일이 없습니다.',
    downloadAll: '전체 다운로드',
    files: '파일',
    downloading: '다운로드 중...',
    views: '조회',
    likes: '좋아요',
    steps: [
      { id: '01', title: '재료 준비', desc: '필라멘트를 준비하세요.', tip: '노즐 온도를 높이면 품질이 좋아집니다.', imageUrl: '' },
      { id: '02', title: '프린팅', desc: '적절한 온도로 프린팅하세요.', imageUrl: '' },
      { id: '03', title: '조립', desc: '스냅핏 구조로 조립하세요.', imageUrl: '' },
      { id: '04', title: '완성', desc: '완성된 제품을 확인하세요.', imageUrl: '' }
    ],
    handmade: '핸드메이드',
    isAi: 'AI 생성'
  },
  en: {
    backToLibrary: 'Back to Library',
    view3D: '3D Viewer',
    blueprint: 'Blueprint Mode',
    view3DButton: '3D View',
    generateBlueprint: 'Generate Blueprint',
    plastic: 'Upcycled Plastic',
    printing: '3D Printing',
    title: 'Basalt Pot 04',
    description: 'A minimalist planter designed to resemble natural basalt rock formations. Optimized for rPETG printing from waste plastic bottles.',
    ecoScore: 'Eco Score',
    carbonReduction: 'Carbon Reduction',
    impactDesc: 'Prevents approx. 20 bottles from entering landfills.',
    impactDescCardboard: 'Recycles waste cardboard to circulate resources.',
    findMaker: 'Connect Maker',
    connectAI: 'Connect AI Co-Pilot',
    downloadGuide: 'Download Guide',
    printTime: 'Print Time',
    difficulty: 'Difficulty',
    filament: 'Filament',
    license: 'License',
    fabricationGuide: 'Fabrication Guide',
    noLink: 'No download link available.',
    noFiles: 'No files available for download.',
    downloadAll: 'Download All',
    files: 'Files',
    downloading: 'Downloading...',
    views: 'Views',
    likes: 'Likes',
    steps: [
      { id: '01', title: 'Preparation & Slicing', desc: 'Ensure your print bed is clean. Use a 0.4mm nozzle for standard quality or 0.6mm for faster drafting. Enable "Vase Mode" (Spiralize Outer Contour) in your slicer settings.', tip: 'Increase flow rate by 5% for better layer adhesion.', imageUrl: 'https://images.unsplash.com/photo-1588508065123-287b28e013da?w=800&auto=format&fit=crop' },
      { id: '02', title: 'Printing', desc: 'Monitor the first layer closely. The basalt texture hides layer lines well, but consistency is key. Recommended temperature for rPETG is 240째C.', imageUrl: 'https://images.unsplash.com/photo-1567789884554-0b844b597180?w=800&auto=format&fit=crop' },
      { id: '03', title: 'Post-Processing', desc: 'Remove stringing with a heat gun. If water-tightness is critical, coat the interior with a thin layer of epoxy resin or a specialized sealant.', imageUrl: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=800&auto=format&fit=crop' },
      { id: '04', title: 'Assembly', desc: 'Place the saucer under the main body. Fill with soil and your favorite plant.', imageUrl: 'https://images.unsplash.com/photo-1466781783364-36c955e42a7f?w=800&auto=format&fit=crop' }
    ],
    handmade: 'Handmade',
    isAi: 'AI Generated'
  }
};

type ViewMode = 'default' | '3d' | 'blueprint';

const ProjectDetail: React.FC<ProjectDetailProps> = ({
  onBack, onEdit, onAnalyze, language, project, user, onLoginClick, onNavigate, onLikeToggle, onViewIncrement, likedProjects,
  userTokens, onDeductTokens, onMessageClick, isOwner, isSuperAdmin, onViewProfile, onStatusChange
}) => {
  const t = TRANSLATIONS[language];
  const [viewMode, setViewMode] = useState<ViewMode>('default');
  const [showFileList, setShowFileList] = useState(false);
  const [syncedMetadata, setSyncedMetadata] = useState<any>(null); // State for fresh metadata
  
  // Access Control States
  const [hasGuideAccess, setHasGuideAccess] = useState<boolean>(false); // Strictly for step-by-step guide
  const [hasDetailedAccess, setHasDetailedAccess] = useState<boolean>(false); // For blueprint_detailed / main blueprint
  const [hasMechanicalAccess, setHasMechanicalAccess] = useState<boolean>(false); // For blueprint_mechanical
  const [has3DAccess, setHas3DAccess] = useState<boolean>(false); // For 3D viewer
  const [isProjectOwner, setIsProjectOwner] = useState<boolean>(false);

  const hasTechnicalAccess = hasDetailedAccess || hasMechanicalAccess || has3DAccess || isProjectOwner;

  // --- Strict Access Synchronization (Base & Realtime) ---
  useEffect(() => {
    const userId = user?.id;
    const ownerId = project?.ownerId;
    const adminMode = !!isSuperAdmin;
    
    // Support both ownerId and owner_id for robustness during transitions
    const actualOwnerId = ownerId || (project as any)?.owner_id;
    const calculatedIsOwner = !!(userId && actualOwnerId && String(userId).trim() === String(actualOwnerId).trim());
    
    setIsProjectOwner(calculatedIsOwner);

    // Initial guide access (Owner/Admin only)
    setHasGuideAccess(calculatedIsOwner || adminMode);
    
    // Initial technical access (Owner/Admin or inherited from props)
    if (calculatedIsOwner || adminMode) {
        setHasDetailedAccess(true);
        setHasMechanicalAccess(true);
        setHas3DAccess(true);
    }
  }, [user?.id, project?.ownerId, (project as any)?.owner_id, isSuperAdmin]);

  // --- AI Copilot State ---
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [copilotLoading, setCopilotLoading] = useState(false);
  const [copilotMessages, setCopilotMessages] = useState<{ role: 'user' | 'assistant'; content: string; type?: 'text' | 'preview' | 'action'; meta?: any }[]>([]);
  const viewerRef = useRef<ThreeDViewerHandle>(null);

  // State for "Recipe Mode" (Current Prompt)
  const [currentRecipe, setCurrentRecipe] = useState(project?.description || "A 3D model");

  // State for Additional Blueprints
  const [generatingBlueprint, setGeneratingBlueprint] = useState<'detailed' | 'mechanical' | null>(null);
  const [additionalBlueprints, setAdditionalBlueprints] = useState<{ detailed?: string; mechanical?: string }>({});

  // Full Screen Image State
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
  const [show3DModal, setShow3DModal] = useState(false);

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState<{ show: boolean, message: string, type: 'info' | 'success' | 'error' | 'warning' }>({ show: false, message: '', type: 'info' });

  // --- Inline Edit State ---
  const [isEditMode, setIsEditMode] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editSteps, setEditSteps] = useState<{ title: string; desc: string; tip?: string }[]>([]);
  const [editImages, setEditImages] = useState<{ conceptImages: string[]; blueprintUrl: string; detailed: string; mechanical: string; }>({ conceptImages: [], blueprintUrl: '', detailed: '', mechanical: '' });
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const editImageInputRef = useRef<HTMLInputElement>(null);
  const [editImageTarget, setEditImageTarget] = useState<'concept' | 'blueprint' | 'detailed' | 'mechanical' | null>(null);
  const [editConceptIdx, setEditConceptIdx] = useState<number>(0);

  // --- Cancellation & Refund Logic ---
  const handleCancelGeneration = (type: 'detailed' | 'mechanical' | '3d') => {
    const cost = type === '3d' ? 30 : 5;
    
    if (type === '3d') {
      setGenerating3D(false);
    } else {
      setGeneratingBlueprint(null);
    }

    onDeductTokens(-cost); // Refund
    showToast(language === 'ko' ? `${cost} 토큰이 반환되었습니다.` : `${cost} tokens refunded.`, 'success');
  };

  const showToast = (message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info', duration = 4000) => {
    setToastMessage({ show: true, message, type });
    setTimeout(() => {
      setToastMessage(prev => ({ ...prev, show: false }));
    }, duration);
  };

  const enterEditMode = () => {
    const meta = syncedMetadata || (project as any)?.metadata || {};
    setEditTitle(project?.title || '');
    setEditDescription(meta.description || project?.description || '');
    const steps = meta.fabrication_guide || project?.steps || [];
    setEditSteps(steps.map((s: any) => ({ title: s.title || '', desc: s.desc || '', tip: s.tip || '' })));
    const imgs = meta.images || project?.images || [];
    setEditImages({
      conceptImages: imgs.length > 0 ? [...imgs] : [project?.image || ''],
      blueprintUrl: meta.blueprint_url || '',
      detailed: meta.additional_blueprints?.detailed || additionalBlueprints.detailed || '',
      mechanical: meta.additional_blueprints?.mechanical || additionalBlueprints.mechanical || '',
    });
    setIsEditMode(true);
  };

  const handleSaveEdit = async () => {
    if (!project?.id || !user) return;
    setIsSavingEdit(true);
    showToast(language === 'ko' ? '저장 중...' : 'Saving...', 'info');

    try {
      const currentMeta = syncedMetadata || (project as any)?.metadata || {};

      // --- CRITICAL FIX: Ensure no large base64 data strings are saved to Supabase metadata ---
      const uploadIfBase64 = async (url: string | undefined, folder: string): Promise<string> => {
        if (url && url.startsWith('data:image')) {
          try {
            const blob = base64ToBlob(url, 'image/png');
            return await uploadToR2(blob, folder);
          } catch (e) {
            console.error(`Failed to offload base64 image to R2 in ${folder}:`, e);
            return url; // Fallback to base64 if R2 fails
          }
        }
        return url || '';
      };

      // Process all potential base64 images in parallel
      const [
        cleanBlueprint,
        cleanDetailed,
        cleanMechanical,
        ...cleanConceptImages
      ] = await Promise.all([
        uploadIfBase64(editImages.blueprintUrl, 'blueprints'),
        uploadIfBase64(editImages.detailed, 'blueprints'),
        uploadIfBase64(editImages.mechanical, 'blueprints'),
        ...editImages.conceptImages.map(img => uploadIfBase64(img, 'ai-generated'))
      ]);

      const newMeta = {
        ...currentMeta,
        description: editDescription,
        fabrication_guide: editSteps,
        blueprint_url: cleanBlueprint,
        images: cleanConceptImages,
        additional_blueprints: {
          ...(currentMeta.additional_blueprints || {}),
          detailed: cleanDetailed,
          mechanical: cleanMechanical,
        },
      };

      const { error } = await supabase.from('items').update({
        title: editTitle,
        image_url: cleanConceptImages[0] || project.image,
        metadata: newMeta,
      }).eq('id', project.id);

      if (error) throw error;

      setSyncedMetadata(newMeta);
      setAdditionalBlueprints({ detailed: cleanDetailed, mechanical: cleanMechanical });
      setIsEditMode(false);
      showToast(language === 'ko' ? '수정 내용이 저장되었습니다!' : 'Changes saved!', 'success');
    } catch (e) {
      console.error(e);
      showToast(language === 'ko' ? '저장에 실패했습니다.' : 'Failed to save.', 'error');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleEditImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editImageTarget) return;
    showToast(language === 'ko' ? '이미지 업로드 중...' : 'Uploading image...', 'info', 8000);
    try {
      const url = await uploadToR2(file, 'ai-generated');
      if (editImageTarget === 'concept') {
        setEditImages(prev => {
          const imgs = [...prev.conceptImages];
          imgs[editConceptIdx] = url;
          return { ...prev, conceptImages: imgs };
        });
      } else {
        setEditImages(prev => ({ ...prev, [editImageTarget]: url }));
      }
    showToast(language === 'ko' ? '업로드 완료!' : 'Uploaded!', 'success');
    } catch (err) {
      console.error(err);
      showToast(language === 'ko' ? '업로드 실패' : 'Upload failed', 'error');
    } finally {
      if (editImageInputRef.current) editImageInputRef.current.value = '';
      setEditImageTarget(null);
    }
  };


  const handleCopilotMessage = async (msg: string) => {
    const newMessages = [...copilotMessages, { role: 'user', content: msg } as const];
    setCopilotMessages(newMessages);
    setCopilotLoading(true);

    try {
      // 1. Analyze Intent
      const analysis = await aiService.analyzeCopilotIntent(
        msg, 
        currentRecipe as any, 
        [], 
        null, 
        user?.user_metadata?.nickname || 'User', 
        null, 
        hasDetailedAccess
      );
      console.log("Copilot Intent:", analysis);

      // 2. Handle Actions
      if (analysis.type === 'VIEW_CONTROL') {
        if (analysis.action?.includes('rotate')) viewerRef.current?.rotateModel(0, Math.PI / 4);
        if (analysis.action === 'wireframe_on') viewerRef.current?.setWireframe(true);
        if (analysis.action === 'wireframe_off') viewerRef.current?.setWireframe(false);
        if (analysis.action === 'bg_black') viewerRef.current?.setBackground('#000000');
        if (analysis.action === 'bg_white') viewerRef.current?.setBackground('#ffffff');

        setCopilotMessages(prev => [...prev, { role: 'assistant', content: analysis.message }]);

      } else if (analysis.type === 'UPDATE_RECIPE') {
        if (analysis.recipe_update) {
          setCurrentRecipe(analysis.recipe_update);
          console.log("Recipe Updated:", analysis.recipe_update);
        }
        setCopilotMessages(prev => [...prev, { role: 'assistant', content: analysis.message }]);

      } else if (analysis.type === 'GENERATE') {
        setCopilotMessages(prev => [...prev, { role: 'assistant', content: "네, 새로운 디자인으로 3D 모델 생성을 시작합니다.." }]);

        // 1. Call Tripo (aiService already generates and uploads to R2)
        const r2Url = await aiService.generate3DModel(currentRecipe);

        // 4. Update View
        // Hack: Update syncedMetadata locally to force re-render of 3D Viewer
        setSyncedMetadata({ ...syncedMetadata, model_3d_url: r2Url });

        // 5. Success Message
        setCopilotMessages(prev => [...prev, { role: 'assistant', content: "생성이 완료되었습니다! 화면을 확인해보세요." }]);
      } else {
        // CHAT
        setCopilotMessages(prev => [...prev, { role: 'assistant', content: analysis.message }]);
      }

    } catch (error) {
      console.error(error);
      setCopilotMessages(prev => [...prev, { role: 'assistant', content: '오류가 발생했습니다. 다시 시도해주세요.' }]);
    } finally {
      setCopilotLoading(false);
    }
  };


  const handleTogglePublic = async () => {
    if (!project?.id || !user || !isOwner) return;
    
    const newPublicStatus = !project.isPublic;
    showToast(newPublicStatus ? (language === 'ko' ? '공개로 전환 중...' : 'Publishing...') : (language === 'ko' ? '비공개로 전환 중...' : 'Setting to private...'), 'info');
    
    try {
      const { error } = await supabase
        .from('items')
        .update({ is_public: newPublicStatus })
        .eq('id', project.id);

      if (error) throw error;
      
      // Update local project object (Note: project object here might be read-only from props, 
      // but we update the synced state if necessary or let parent handle it via fetch)
      project.isPublic = newPublicStatus;
      showToast(newPublicStatus ? (language === 'ko' ? '공개되었습니다!' : 'Published!') : (language === 'ko' ? '비공개 처리되었습니다.' : 'Set to private.'), 'success');
      
      if (onStatusChange) onStatusChange();
      
      // Force re-render or let parent know (if needed, but for now simple local update)
      setSyncedMetadata(prev => ({ ...prev })); 
    } catch (err) {
      console.error("Failed to toggle public status", err);
      showToast(language === 'ko' ? '상태 변경 실패' : 'Toggle failed', 'error');
    }
  };

  // Increment view count when project is loaded AND fetch latest metadata
  useEffect(() => {
    if (project?.id) {
      onViewIncrement(project.id);

      // AI 프로젝트면 Copilot 자동 활성화 안내 (옵션)
      if (project.isAiRemix || project.isAiIdea) {
        // setIsCopilotOpen(true); // 아직 공개적일 때 에서만 보류
      }

      // Fetch latest metadata to ensure 3D URL is up to date (sync with Wizard generation)
      const fetchLatestData = async () => {
        try {
          // If the project ID is numeric (legacy), skip. If UUID, fetch.
          if (typeof project.id === 'string' && project.id.includes('-')) {
            const { data, error } = await supabase
              .from('items')
              .select('id, owner_id, metadata')
              .eq('id', project.id)
              .single();

            if (data && !error) {
              // Sync metadata
              if (data.metadata) {
                setSyncedMetadata(data.metadata);
                if (data.metadata.description) {
                  setCurrentRecipe(data.metadata.description);
                }
              }

              // Access Control: Owner or Granted User
              const currentIsOwner = !!(user?.id && data.owner_id && user.id === data.owner_id);
              let dbHasDetailed = false;
              let dbHasMechanical = false;
              let dbHas3D = false;

              if (!currentIsOwner && !isSuperAdmin && user?.id) {
                try {
                  const { data: grantData } = await supabase
                    .from('blueprint_access_grants')
                    .select('access_type')
                    .eq('project_id', project.id)
                    .eq('user_id', user.id);
                  if (grantData && grantData.length > 0) {
                      dbHasDetailed = grantData.some(g => g.access_type === 'blueprint_detailed' || g.access_type === 'blueprint');
                      dbHasMechanical = grantData.some(g => g.access_type === 'blueprint_mechanical' || g.access_type === 'blueprint');
                      dbHas3D = grantData.some(g => g.access_type === '3d_model');
                  }
                } catch (err) {
                   console.error("Access verification failed", err);
                }
              }
              const finalDetailed = currentIsOwner || !!isSuperAdmin || dbHasDetailed;
              const finalMechanical = currentIsOwner || !!isSuperAdmin || dbHasMechanical;
              const final3D = currentIsOwner || !!isSuperAdmin || dbHas3D;
              const finalGuide = currentIsOwner || !!isSuperAdmin; 

              setHasDetailedAccess(finalDetailed);
              setHasMechanicalAccess(finalMechanical);
              setHas3DAccess(final3D);
              setHasGuideAccess(finalGuide);

              if ((finalDetailed || finalMechanical) && data.metadata?.additional_blueprints) {
                setAdditionalBlueprints(data.metadata.additional_blueprints);
              } else {
                setAdditionalBlueprints({});
              }
            }
          }
        } catch (e) {
          console.error("Failed to sync project metadata", e);
        }
      };

      fetchLatestData();
    }
  }, [project?.id, user?.id]); // Re-run when user changes

  const handleToolClick = (tool: string) => {
    if (tool === '3d') setViewMode('3d');
  };

  // Update view mode to 3D if Copilot is opened
  useEffect(() => {
    if (isCopilotOpen && viewMode !== '3d') {
      setViewMode('3d');
    }
  }, [isCopilotOpen]);

  const handleDownload = () => {
    if (!user) {
      onLoginClick('detail');
      return;
    }

    const files = project?.modelFiles || [];

    if (files.length === 0) {
      showToast(t.noFiles, 'warning');
      return;
    }

    // 파일이 1개면 바로 다운로드, 여러 개면 목록 표시
    if (files.length === 1) {
      downloadFile(files[0]);
    } else {
      setShowFileList(!showFileList);
    }
  };



  const downloadFile = async (file: { name: string; url: string }) => {
    try {
      const response = await fetch(file.url);
      const blob = await response.blob();
      saveAs(blob, file.name);
    } catch (e) {
      console.error("Download failed", e);
      // Fallback for simple link open if fetch fails (CORS etc)
      window.open(file.url, '_blank');
    }
  };

  const downloadImagesAsZip = async () => {
    const zip = new JSZip();
    const folder = zip.folder("images");

    // Add dynamically generated blueprints too
    const imageUrls = [...displayImages, ...Object.values(additionalBlueprints)].filter(isImageUrl);

    // Add images to zip
    await Promise.all(imageUrls.map(async (url: string, index: number) => {
      try {
        let blob: Blob;
        
        if (url.startsWith('data:image')) {
          // Handle Base64 directly without network request
          const mimeType = url.split(':')[1]?.split(';')[0] || 'image/png';
          blob = base64ToBlob(url, mimeType);
        } else {
          // Fetch external images with proxy fallback
          let response;
          try {
            // Bypass browser cache (opaque response) by adding a timestamp
            const fetchUrl = url.includes('?') ? `${url}&_cb=${Date.now()}` : `${url}?_cb=${Date.now()}`;
            response = await fetch(fetchUrl, { mode: 'cors' });
            if (!response.ok) throw new Error('CORS or Network error');
          } catch (err) {
            // Fallback to Supabase Edge Function Proxy (works for R2 & Tripo, fails for Google due to whitelist)
            const proxyUrl = `${config.supabase.url}/functions/v1/tripo-file-proxy?url=${encodeURIComponent(url)}`;
            response = await fetch(proxyUrl);
          }

          if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
          }
          
          blob = await response.blob();
        }

        // Validate: Ensure it's not an error message (too small for a real image) or an HTML document
        if (blob.size < 500 || blob.type.includes('text/html')) {
            console.warn(`Suspiciously small file or HTML document (${blob.size} bytes, type ${blob.type}) for URL: ${url}. Skipping.`);
            return;
        }

        // Determine name
        let name = `image_${index + 1}.png`;
        if (url === blueprintUrl) name = `blueprint_production.png`;
        if (url === (additionalBlueprints as any).detailed) name = `blueprint_detailed.png`;
        if (url === (additionalBlueprints as any).mechanical) name = `blueprint_mechanical.png`;

        folder?.file(name, blob);
      } catch (e) {
        console.error("Failed to add image to zip", e, "URL:", url);
      }
    }));

    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, `${project?.title || 'project'}_images.zip`);
  };

  const downloadAllFiles = () => {
    const files = project?.modelFiles || [];
    files.forEach((file, index) => {
      setTimeout(() => {
        downloadFile(file);
      }, index * 500); // 브라우저 다운로드 제한 회피
    });
  };

  const handleConnectMaker = (forceMessage: boolean = false) => {
    if (!user) {
      onLoginClick('detail');
      return;
    }

    // 로그인한 모든 사용자가 AI 코파일럿에 접근 가능
    if (!forceMessage) {
      onAnalyze();
      return;
    }

    if (onMessageClick && project) {
      const maker = {
        name: project.maker,
        avatar: project.makerAvatarUrl || '',
        userId: project.ownerId || '',
        projects: 0,
        likes: '',
        rawLikes: 0,
      };
      
      // 일반 메이커 연결 시, 자신의 프로젝트면 차단
      if (user.id === project.ownerId) {
        showToast(language === 'ko' ? '자신의 프로젝트입니다.' : 'This is your own project.', 'info');
        return;
      }

      onMessageClick(maker, undefined, { 
        relatedProjectId: project.id, 
        relatedProjectTitle: project.title 
      });
    }
  };


  // Determine what content to show
  const displayTitle = project?.title || t.title;
  const displayDesc = syncedMetadata?.description || project?.description || t.description;
  const displayImage = project?.image || 'https://lh3.googleusercontent.com/aida-public/AB6AXuDfv7rlXQezFNRd55ViDyVQxZHy5hmFeJRXuYnIhyBrqgo6LsrhVYeZKMz0Mhkh3SM8YgXWYE8qI8_RMrYNIAEJKuWxoO9Wo2s-xMLQKI7o6W0Jfaw_ASJFO3TLZHM35y9JiY1bjQqF-zcsSKoW9Wo2s-xMLQKI7o6W0Jfaw_ASJFO3TLZHM35y9JiY1bjQqF-zcsSKoVkW980qHM3rsSDBkRaH6xYmQehOScGrNFCt7L78QxSK__Ljxwcv05op5YxYRS3fRAQLmMyiiiQ5-rMV71Mh-zSiVnCOO856cB0S6IrvFPabp6DIRjOMalBsw9bno';

  // Get Blueprint URL - Use synced data if available
  const blueprintUrl = syncedMetadata?.blueprint_url || (project as any)?.metadata?.blueprint_url;

  // Helper to check if a URL is an image (Blacklist non-image binaries)
  const isImageUrl = (url: any): url is string => {
    if (!url || typeof url !== 'string') return false;
    if (url.startsWith('data:image')) return true;
    
    const clean = url.split('?')[0].toLowerCase();
    
    // Core binary types that are NEVER images
    const isAlwaysBinary = clean.endsWith('.glb') || clean.endsWith('.stl') || clean.endsWith('.gltf') || clean.endsWith('.zip') || clean.endsWith('.obj') || clean.endsWith('.fbx');
    if (isAlwaysBinary) return false;

    // Handle .bin files: 
    // - If in "models" folder, it's a 3D model (reject)
    // - If in "ai-generated" folder, it's likely a misnamed image (allow for legacy)
    if (clean.endsWith('.bin')) {
      if (clean.includes('/models/')) return false;
      if (clean.includes('/ai-generated/')) return true;
      return false; // Default to reject other .bin
    }

    return true; // Assume other URLs (jpg, png, etc) are images
  };

  // Collect ALL potential image sources into a cumulative pool safely
  const getSafeImageArray = (input: any): string[] => {
    if (!input) return [];
    if (Array.isArray(input)) return input.filter(item => typeof item === 'string');
    if (typeof input === 'string') return [input];
    return [];
  };

  const assetPool = [
    displayImage,
    ...(hasDetailedAccess ? [
      blueprintUrl,
      ...getSafeImageArray(syncedMetadata?.images),
      ...getSafeImageArray(project?.images)
    ] : [])
  ].filter(isImageUrl);

  // Deduplicate the pool and use as displayImages
  const displayImages = Array.from(new Set(assetPool));
  
  // For compatibility with parts and generation logic that expects "notebook images" (excluding the primary blueprint)
  const notebookImages = displayImages.filter(url => url !== blueprintUrl);

  const displayCategory = project?.category || t.printing;
  
  // Helper to remove "(including 3D printing time)" etc.
  const cleanTime = (time: string) => {
    if (!time) return '';
    return time.replace(/\s?\(.*(printing|프린팅).*\)/i, '').trim();
  };

  const displayTime = cleanTime(project?.time || '4h 20m');
  const displayDifficulty = project?.difficulty || 'Medium';

  // Check if project is AI generated
  const isAiProject = project?.isAiRemix || project?.isAiIdea;

  // 3D 紐⑤뜽 ?뚯씪 李얘린 - Use synced data if available
  const getModel3DUrl = (): string | null => {
    // 0. Synced metadata from DB (Highest priority for fresh Wizard generation)
    if (syncedMetadata?.model_3d_url) {
      return syncedMetadata.model_3d_url;
    }

    // 1. 먼저 metadata.model_3d_url 확인 (AI 생성 프로젝트)
    const metadataUrl = (project as any)?.metadata?.model_3d_url || (project as any)?.metadata?.model_url;
    if (metadataUrl) {
      return metadataUrl;
    }

    // 2. modelFiles에서 3D 파일 찾기
    const model3DFile = project?.modelFiles?.find(
      file => file.name.toLowerCase().endsWith('.glb') ||
        file.name.toLowerCase().endsWith('.stl') ||
        file.name.toLowerCase().endsWith('.gltf')
    );

    return model3DFile?.url || null;
  };

  const model3DUrl = hasTechnicalAccess ? getModel3DUrl() : null;

  // Logic for fabrication steps
  // If the project has custom steps, use them. Otherwise use the default steps from translation.
  // CRITICAL FIX: Ensure we fallback to metadata.fabrication_guide if project.steps is not present or empty
  const activeSteps = (project?.steps && project.steps.length > 0) 
    ? project.steps 
    : (syncedMetadata?.fabrication_guide || (project as any)?.metadata?.fabrication_guide || (project as any)?.metadata?.guide?.steps);

  const displaySteps = (activeSteps && activeSteps.length > 0)
    ? activeSteps.map((s: any, i: number) => ({
      id: (i + 1).toString().padStart(2, '0'),
      title: s.title,
      desc: s.desc,
      tip: s.tip,
      imageUrl: s.imageUrl
    }))
    : t.steps;

  // Handle Image Selection from Thumbnails
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Logic to handle additional blueprints display
  // If selectedImageIndex points to an additional blueprint, show it.
  // We need a unified list of viewable images.

  // NOTE: displayImages tracks "Base" images. 
  // We will handle the "view" logic slightly differently: currentDisplayImage is computed including additionalBlueprints

  const additionalBlueprintList = (hasDetailedAccess ? [additionalBlueprints.detailed, additionalBlueprints.mechanical] : []).filter(Boolean) as string[];
  const allViewableImages = [...displayImages, ...additionalBlueprintList];

  const currentDisplayImage = allViewableImages[selectedImageIndex] || displayImage;

  // Logic: Generating Additional Blueprint
  const handleGenerateAdditionalBlueprint = async (type: 'detailed' | 'mechanical') => {
    // Access Control: Only valid owner can generate
    if (!user || user.id !== project?.ownerId) {
      showToast(language === 'ko' ? '작성자만 도면을 생성할 수 있습니다.' : 'Only the author can generate blueprints.', 'warning');
      return;
    }

    const cost = 5; // Both types now cost 5 tokens
    if (userTokens < cost) {
      showToast('토큰이 부족합니다. (필요: ' + cost + ', 보유: ' + userTokens + ')', 'warning');
      return;
    }

    if (!confirm((type === 'detailed' ? '상세도' : '조립 가이드') + '를 생성하시겠습니까?\n' + cost + ' 토큰이 차감됩니다.')) return;

    onDeductTokens(cost);
    setGeneratingBlueprint(type);
    showToast(language === 'ko' ? '도면 생성을 시작합니다. 완료 후 자동 저장됩니다. (브라우저를 닫지 마세요)' : 'Generating blueprint. It will be saved automatically. (Do not close the browser)', 'info', 5000);

    try {
      // Use the Concept Image (displayImages[0] usually) as the Anchor
      // Filter out any potential non-images just in case
      const anchorImage = displayImages.find(isImageUrl) || (isImageUrl(displayImage) ? displayImage : null);

      if (!anchorImage) {
        throw new Error(language === 'ko' ? '도면 생성을 위한 참조 이미지를 찾을 수 없습니다.' : 'Could not find a reference image for blueprint generation.');
      }

      console.log("Generating Blueprint - Anchor Image:", anchorImage);

      // Context: Use current recipe or description
      const context = currentRecipe;

      let bp = await aiService.generateBlueprintImage(context, anchorImage, type);

      // --- CRITICAL FIX: Upload base64 to R2 to avoid large Supabase payload ---
      if (bp && bp.startsWith('data:image')) {
        try {
          const blob = base64ToBlob(bp, 'image/png');
          bp = await uploadToR2(blob, 'blueprints');
          console.log("Newly generated blueprint uploaded to R2:", bp);
        } catch (uploadErr) {
          console.error("R2 Upload failed for blueprint, using base64 fallback", uploadErr);
          // Continue with base64 if upload fails, though this might cause the fetch error again
        }
      }

      const newBlueprints = { ...additionalBlueprints, [type]: bp };
      setAdditionalBlueprints(newBlueprints);

      // Auto-select the new blueprint
      setSelectedImageIndex(displayImages.length + (type === 'detailed' ? 0 : (additionalBlueprints.detailed ? 1 : 0))); // Rough index logic, simplification for now

      // Persistence: Save to Supabase
      if (project?.id && !project.id.startsWith('static')) {
        const { error } = await supabase
          .from('items')
          .update({
            metadata: {
              ...(project.metadata || {}),
              ...(syncedMetadata || {}),
              additional_blueprints: newBlueprints
            }
          })
          .eq('id', project.id);

        if (error) {
          console.error('Failed to save blueprints to Supabase:', error);
        } else {
          console.log('Blueprints saved to Supabase');
        }
      }

      showToast(language === 'ko' ? '도면 생성이 완료되었습니다!' : 'Blueprint generated successfully!', 'success');

    } catch (e) {
      console.error(e);
      showToast(language === 'ko' ? '도면 생성 실패. 토큰이 반환됩니다.' : 'Generation failed. Tokens refunded.', 'error');
      onDeductTokens(-cost); // Refund
    } finally {
      setGeneratingBlueprint(null);
    }
  };

  // Logic: Generate 3D Model (On-Demand)
  const [generating3D, setGenerating3D] = useState(false);

  const handleGenerate3DModel = async () => {
    // Access Control: Only Owner
    if (!user || user.id !== project?.ownerId) {
      showToast(language === 'ko' ? '작성자만 3D 모델을 생성할 수 있습니다.' : 'Only the author can generate 3D models.', 'warning');
      return;
    }

    // Check if model already exists (optional, maybe allow regeneration?)
    if (model3DUrl) {
      if (!confirm(language === 'ko' ? '이미 3D 모델이 존재합니다. 다시 생성하시겠습니까?' : '3D model already exists. Generate again?')) return;
    }

    const cost = 30; // 30 tokens for 3D generation
    if (userTokens < cost) {
      showToast('토큰이 부족합니다. (필요: ' + cost + ', 보유: ' + userTokens + ')', 'warning');
      return;
    }

    if (!confirm(language === 'ko' ? '3D 모델을 생성하시겠습니까?\n' + cost + ' 토큰이 차감됩니다.' : 'Generate 3D Model?\n' + cost + ' tokens will be deducted.')) return;

    onDeductTokens(cost);
    setGenerating3D(true);
    showToast(language === 'ko' ? '3D 모델 생성을 시작합니다. 완료 후 자동 저장됩니다. (브라우저를 닫지 마세요)' : 'Generating 3D model. It will be saved automatically. (Do not close the browser)', 'info', 5000);

    try {
      // Use the Concept Image (displayImages[0] or displayImage)
      const anchorImage = displayImages[0] || displayImage;
      const context = currentRecipe; // Use the recipe/description

      // 1. Generate via Tripo (and aiService already uploads it to R2)
      const r2Url = await aiService.generate3DModel(anchorImage);

      // 2. Update Sync Metadata
      const newMetadata = {
        ...(project?.metadata || {}),
        ...(syncedMetadata || {}),
        model_3d_url: r2Url
      };
      setSyncedMetadata(newMetadata);

      // 4. Update Supabase
      if (project?.id) {
        const { error } = await supabase
          .from('items')
          .update({
            metadata: newMetadata,
            // Also update model_url column if it exists for legacy compatibility?
            // model_url: r2Url 
          })
          .eq('id', project.id);

        if (error) console.error('Supabase update failed', error);
      }

      showToast(language === 'ko' ? '3D 모델이 완성되었습니다!' : '3D Model completed!', 'success');
      setViewMode('3d'); // Switch to 3D view

    } catch (e) {
      console.error(e);
      showToast(language === 'ko' ? '3D 생성 실패. 토큰이 반환됩니다.' : 'Generation failed. Tokens refunded.', 'error');
      onDeductTokens(-cost);
    } finally {
      setGenerating3D(false);
    }
  };

  return (
    <>
      {/* Toast Notification */}
      <div className={`fixed bottom-24 lg:bottom-10 right-4 lg:right-10 px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 transition-all duration-500 z-[100] transform ${toastMessage.show ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-10 opacity-0 scale-95 pointer-events-none'}
        ${toastMessage.type === 'success' ? 'bg-green-500 text-white' : toastMessage.type === 'error' ? 'bg-red-500 text-white' : toastMessage.type === 'warning' ? 'bg-amber-500 text-white' : 'bg-gray-900 border border-gray-700 text-white'}
      `}>
        {toastMessage.type === 'success' ? <span className="material-icons-round">check_circle</span> :
         toastMessage.type === 'error' ? <span className="material-icons-round">error</span> :
         toastMessage.type === 'warning' ? <span className="material-icons-round">warning</span> :
         <span className="material-icons-round animate-spin">sync</span>}
        <p className="font-bold text-sm select-none break-keep w-max max-w-[80vw] sm:max-w-md">{toastMessage.message}</p>
      </div>

      {/* Hidden file input for image upload in edit mode */}
      <input
        ref={editImageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleEditImageUpload}
      />

      {/* Edit Mode Sticky Banner */}
      {isEditMode && (
        <div className="fixed top-0 inset-x-0 z-[90] bg-amber-500 text-white flex items-center justify-between px-6 py-3 shadow-xl">
          <div className="flex items-center gap-2 font-bold text-sm">
            <span className="material-icons-round text-lg">edit</span>
            {language === 'ko' ? '수정 모드' : 'Edit Mode'}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsEditMode(false)}
              className="px-4 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white font-semibold text-sm transition-colors"
            >
              {language === 'ko' ? '취소' : 'Cancel'}
            </button>
            <button
              onClick={handleSaveEdit}
              disabled={isSavingEdit}
              className="px-5 py-1.5 rounded-lg bg-white text-amber-600 font-bold text-sm hover:bg-amber-50 transition-colors shadow-sm disabled:opacity-60 flex items-center gap-2"
            >
              {isSavingEdit && <span className="material-icons-round text-sm animate-spin">sync</span>}
              {language === 'ko' ? '저장' : 'Save'}
            </button>
          </div>
        </div>
      )}

      {/* Full Screen Image Modal */}
      {fullScreenImage && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 transition-opacity duration-300"
          onClick={() => setFullScreenImage(null)}
        >
          <div className="relative max-w-full max-h-full">
            <img
              src={fullScreenImage}
              alt="Full Screen View"
              className="max-w-[95vw] max-h-[95vh] object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={() => setFullScreenImage(null)}
              className="absolute top-4 right-4 w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center backdrop-blur-sm transition-colors"
            >
              <span className="material-icons-round">close</span>
            </button>
          </div>
        </div>
      )}

      {/* 3D Viewer Modal */}
      {show3DModal && model3DUrl && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in"
          onClick={() => setShow3DModal(false)}
        >
          <div
            className="relative w-full max-w-4xl aspect-square bg-[#111] rounded-3xl overflow-hidden shadow-2xl border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <ErrorBoundary
              fallback={
                <div className="w-full h-full flex flex-col items-center justify-center bg-[#111] text-white/50 space-y-2">
                  <span className="material-icons-round text-4xl">broken_image</span>
                  <span className="text-sm">3D 모델을 불러올 수 없습니다</span>
                </div>
              }
            >
              <ThreeDViewer modelUrl={model3DUrl} className="w-full h-full" />
            </ErrorBoundary>

            <div className="absolute top-6 left-1/2 -translate-x-1/2 text-white/50 text-sm font-mono bg-black/60 px-4 py-2 rounded-full backdrop-blur-sm pointer-events-none">
              Drag to Rotate ??Scroll to Zoom
            </div>

            <button
              onClick={() => setShow3DModal(false)}
              className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center backdrop-blur-sm transition-colors z-10"
            >
              <span className="material-icons-round">close</span>
            </button>
          </div>
        </div>
      )}

      {/* PIP 3D Viewer for Copilot */}
      {isCopilotOpen && (
        <div className="fixed bottom-6 left-6 w-80 h-80 bg-[#111] rounded-2xl shadow-2xl border border-gray-700/50 overflow-hidden z-[70] animate-fade-in-up group">
          <div className="absolute top-0 left-0 right-0 p-3 bg-gradient-to-b from-black/80 to-transparent z-10 flex justify-between items-center opacity-100 transition-opacity">
             <span className="text-white text-[10px] uppercase tracking-wider font-bold px-2 flex items-center gap-2">
               <span className="material-icons-round text-primary text-sm animate-pulse">auto_awesome</span>
               {model3DUrl ? 'AI 3D Preview' : 'Design Reference'}
             </span>
          </div>
          {model3DUrl ? (
            <ErrorBoundary
              fallback={
                <div className="w-full h-full flex flex-col items-center justify-center bg-[#111] text-white/50 space-y-2">
                  <span className="material-icons-round text-2xl">broken_image</span>
                  <span className="text-xs">미리보기 오류</span>
                </div>
              }
            >
              <ThreeDViewer ref={viewerRef} modelUrl={model3DUrl} className="w-full h-full cursor-grab active:cursor-grabbing" />
            </ErrorBoundary>
          ) : (
             <div className="w-full h-full relative group">
                <img src={displayImage} alt="Reference" className="w-full h-full object-cover opacity-60 transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                <div className="absolute inset-0 flex items-center justify-center">
                   <div className="bg-black/40 backdrop-blur-md border border-white/10 px-4 py-2 rounded-xl text-white/70 text-[10px] uppercase font-bold tracking-widest">
                      3D Model Unavailable
                   </div>
                </div>
             </div>
          )}
        </div>
      )}

      <div className="max-w-7xl mx-auto py-6 lg:py-12 px-4 sm:px-6 lg:px-0 relative">
        {/* Floating Action Buttons aligned with content container (Sticky) */}
        <div className="sticky top-[calc(100vh-60px)] w-full h-0 z-40 pointer-events-none">
          <div className="relative w-full h-14">
            {/* AI Pilot Button (Right) */}
            {(project?.isAiRemix || project?.isAiIdea) && (
              <button
                onClick={() => {
                  if (!user) {
                    onLoginClick('detail');
                  } else {
                    onAnalyze();
                  }
                }}
                className="absolute right-6 lg:right-0 w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-xl flex items-center justify-center transition-all hover:scale-110 pointer-events-auto animate-bounce-slow"
                aria-label="Open AI Workspace"
              >
                <span className="material-icons-round text-2xl">smart_toy</span>
              </button>
            )}

            {/* Edit Button (Left) */}
            {user && project?.ownerId && user.id === project.ownerId && !isEditMode && (
              <button
                onClick={enterEditMode}
                className="absolute left-6 lg:left-0 w-14 h-14 bg-amber-500 hover:bg-amber-600 text-white rounded-full shadow-xl flex items-center justify-center transition-all hover:scale-110 pointer-events-auto"
                title={language === 'ko' ? '제작가이드 수정' : 'Edit'}
              >
                <span className="material-icons-round text-2xl">edit</span>
              </button>
            )}
          </div>
        </div>

        {/* Copilot Panel Integration */}
        {isCopilotOpen && (
          <CopilotPanel
            isOpen={isCopilotOpen}
            onClose={() => setIsCopilotOpen(false)}
            messages={copilotMessages}
            onSendMessage={handleCopilotMessage}
            isLoading={copilotLoading}
          />
        )}

        {/* Back Button - Adding it here since nav is removed */}
        <button onClick={onBack} className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors group mb-6 px-6 lg:px-0">
          <span className="material-icons-round text-xl group-hover:-translate-x-1 transition-transform">chevron_left</span>
          <span className="font-medium text-sm tracking-wide">{t.backToLibrary}</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 px-0">
          {/* Left Column: Visuals */}
          <div className="lg:col-span-8 space-y-6 lg:space-y-8">
            <div className="relative w-full aspect-video rounded-3xl overflow-hidden bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-800 group select-none transition-colors">

              {/* Conditional Content based on View Mode */}
              {viewMode === '3d' ? (
                <div className="w-full h-full bg-[#111111] relative overflow-hidden">
                  {model3DUrl ? (
                    <ThreeDViewer ref={viewerRef} modelUrl={model3DUrl} className="w-full h-full" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <p className="text-white/50 text-sm">3D 모델 파일이 없습니다</p>
                    </div>
                  )}
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/70 text-xs font-mono bg-black/60 px-4 py-2 rounded-full backdrop-blur-sm pointer-events-none">
                    3D Preview · Drag to Rotate · Scroll to Zoom
                  </div>
                  {/* Expand Button */}
                  <button
                    onClick={() => setShow3DModal(true)}
                    className="absolute top-4 right-4 p-2 bg-black/30 hover:bg-black/60 text-white rounded-full backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 z-10"
                    title="Expand 3D View"
                  >
                    <span className="material-icons-round text-xl">open_in_full</span>
                  </button>
                </div>
              ) : (
                <>
                  {currentDisplayImage ? (
                    <img
                      src={currentDisplayImage}
                      alt={displayTitle}
                      className="w-full h-full object-cover transition-all duration-500 cursor-zoom-in"
                      onClick={() => setFullScreenImage(currentDisplayImage)}
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-col gap-2">
                      <span className="material-icons-round text-gray-300 text-5xl">image_not_supported</span>
                      <span className="text-xs text-gray-400">{language === 'ko' ? '이미지 없음' : 'No image'}</span>
                    </div>
                  )}

                  {/* Fullscreen hint icon */}
                  <div className="absolute bottom-4 right-4 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    onClick={() => setFullScreenImage(currentDisplayImage)}>
                    <span className="material-icons-round text-lg">fullscreen</span>
                  </div>

                  {/* Label for Blueprints */}
                  {(currentDisplayImage === blueprintUrl || currentDisplayImage === additionalBlueprints.detailed || currentDisplayImage === additionalBlueprints.mechanical) && (
                    <div className="absolute top-4 right-4 px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-full shadow-lg">
                      {currentDisplayImage === blueprintUrl ? 'PRODUCTION DRAWING' :
                        currentDisplayImage === additionalBlueprints.detailed ? 'DETAILED DRAWING' :
                          '조립 가이드'}
                    </div>
                  )}
                </>
              )}

              {/* Status Indicator */}
              <div className="absolute top-6 left-6 flex space-x-2 z-20">
                <span className={`px-3 py-1 backdrop-blur-sm rounded-full text-xs font-semibold uppercase tracking-wider shadow-sm flex items-center gap-2 border transition-colors
                    ${viewMode === 'default' ? 'bg-white/90 text-gray-800 border-white/50' : 'bg-primary text-white border-primary/50'}
                  `}>
                  <span className={`w-2 h-2 rounded-full ${viewMode === 'default' ? 'bg-gray-400' : 'bg-white animate-pulse'}`}></span>
                  {viewMode === '3d' ? '3D Active' : 'Image View'}
                </span>

                {isAiProject ? (
                  <span className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-bold text-primary flex items-center gap-1 shadow-sm border border-white/50">
                    <span className="material-icons-round text-sm">auto_awesome</span>
                    {project?.isAiRemix ? (language === 'ko' ? 'AI 리믹스' : 'AI Remix') : (language === 'ko' ? 'AI 아이디어' : 'AI Idea')}
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-bold text-gray-700 flex items-center gap-1 shadow-sm border border-white/50">
                    <span className="material-icons-round text-sm">front_hand</span>
                    {t.handmade}
                  </span>
                )}

                {/* --- NEW: Visibility Toggle for Owner --- */}
                {isOwner && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleTogglePublic(); }}
                    className={`px-3 py-1 backdrop-blur-md rounded-full text-xs font-bold flex items-center gap-1.5 shadow-md border transition-all hover:scale-105 active:scale-95
                      ${project?.isPublic 
                        ? 'bg-green-500/90 text-white border-green-400' 
                        : 'bg-gray-800/90 text-white border-gray-600'}
                    `}
                    title={project?.isPublic ? (language === 'ko' ? '비공개로 전환' : 'Make Private') : (language === 'ko' ? '커뮤니티에 공개' : 'Make Public')}
                  >
                    <span className="material-icons-round text-sm">
                      {project?.isPublic ? 'public' : 'lock'}
                    </span>
                    {project?.isPublic 
                      ? (language === 'ko' ? '공개 중' : 'Public') 
                      : (language === 'ko' ? '비공개' : 'Private')}
                  </button>
                )}
              </div>
            </div>

            {/* Thumbnails & Actions */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="flex space-x-4 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
                {/* 컨셉 이미지 썸네일 */}
                {(isEditMode ? editImages.conceptImages : displayImages).map((imgUrl, index) => (
                  <div key={`img-${index}`} className="relative w-24 h-24 flex-shrink-0">
                    <button
                      onClick={() => {
                        if (!isEditMode) {
                          setViewMode('default');
                          setSelectedImageIndex(index);
                        }
                      }}
                      className={`w-full h-full rounded-xl overflow-hidden border-2 shadow-sm transition-transform ${!isEditMode ? 'hover:scale-105 cursor-pointer' : 'cursor-default'} ${viewMode === 'default' && currentDisplayImage === imgUrl ? 'border-primary ring-2 ring-primary/30' : 'border-transparent'}`}
                    >
                      {imgUrl ? (
                        <img src={imgUrl} alt={`Image ${index + 1}`} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                          <span className="material-icons-round text-gray-400">image</span>
                        </div>
                      )}
                      {imgUrl === blueprintUrl && !isEditMode && (
                        <div className="absolute inset-x-0 bottom-0 bg-black/50 text-white text-[10px] text-center py-0.5">도면</div>
                      )}
                    </button>
                    {/* Edit mode overlays */}
                    {isEditMode && (
                      <div className="absolute inset-0 rounded-xl flex flex-col items-center justify-center gap-1.5 bg-black/40">
                        <button
                          onClick={() => { setEditConceptIdx(index); setEditImageTarget('concept'); editImageInputRef.current?.click(); }}
                          className="w-8 h-8 bg-white/90 rounded-full flex items-center justify-center text-blue-600 shadow hover:scale-110 transition-transform"
                          title="이미지 교체"
                        >
                          <span className="material-icons-round text-sm">file_upload</span>
                        </button>
                        <button
                          onClick={() => setEditImages(prev => { const imgs = [...prev.conceptImages]; imgs[index] = ''; return { ...prev, conceptImages: imgs }; })}
                          className="w-8 h-8 bg-white/90 rounded-full flex items-center justify-center text-red-500 shadow hover:scale-110 transition-transform"
                          title="이미지 삭제"
                        >
                          <span className="material-icons-round text-sm">delete</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}

                {/* 2. Detailed Blueprint */}
                {(user && (user.id === project?.ownerId || hasDetailedAccess)) ? (
                  additionalBlueprints.detailed || (isEditMode && editImages.detailed) ? (
                    <div className="relative w-24 h-24 flex-shrink-0">
                      <button
                        key="detailed-bp"
                        onClick={() => {
                          if (!isEditMode) {
                            setViewMode('default');
                            const idx = allViewableImages.indexOf(additionalBlueprints.detailed!);
                            setSelectedImageIndex(idx);
                          }
                        }}
                        className={`w-full h-full rounded-xl overflow-hidden border-2 shadow-sm ${!isEditMode ? 'hover:scale-105 transition-transform cursor-pointer' : 'cursor-default'} ${viewMode === 'default' && currentDisplayImage === additionalBlueprints.detailed ? 'border-primary ring-2 ring-primary/30' : 'border-transparent'}`}
                      >
                        {(isEditMode ? editImages.detailed : additionalBlueprints.detailed) ? (
                          <img src={isEditMode ? editImages.detailed : additionalBlueprints.detailed} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center"><span className="material-icons-round text-gray-400">image</span></div>
                        )}
                        <div className="absolute inset-x-0 bottom-0 bg-blue-600/80 text-white text-[10px] text-center py-0.5">상세도</div>
                      </button>
                      {isEditMode && (
                        <div className="absolute inset-0 rounded-xl flex flex-col items-center justify-center gap-1.5 bg-black/40">
                          <button onClick={() => { setEditImageTarget('detailed'); editImageInputRef.current?.click(); }} className="w-8 h-8 bg-white/90 rounded-full flex items-center justify-center text-blue-600 shadow hover:scale-110 transition-transform" title="교체">
                            <span className="material-icons-round text-sm">file_upload</span>
                          </button>
                          <button onClick={() => setEditImages(prev => ({ ...prev, detailed: '' }))} className="w-8 h-8 bg-white/90 rounded-full flex items-center justify-center text-red-500 shadow hover:scale-110 transition-transform" title="삭제">
                            <span className="material-icons-round text-sm">delete</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    (user.id === project?.ownerId) && (
                      generatingBlueprint === 'detailed' ? (
                        <div className="relative w-24 h-24 rounded-xl overflow-hidden border-2 border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800 flex-shrink-0 transition group">
                          <div className="flex flex-col items-center gap-2">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                            <button 
                              onClick={() => handleCancelGeneration('detailed')}
                              className="text-[10px] text-red-500 font-bold hover:underline"
                            >
                              {language === 'ko' ? '취소' : 'Cancel'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleGenerateAdditionalBlueprint('detailed')}
                          disabled={!!generatingBlueprint}
                          className="relative w-24 h-24 rounded-xl overflow-hidden border-2 border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800 flex-shrink-0 hover:bg-gray-100 dark:hover:bg-gray-700 transition group"
                        >
                          <span className="material-icons-round text-gray-500 mb-1 group-hover:text-primary transition-colors text-xl">lock</span>
                          <span className="text-xs text-gray-700 dark:text-gray-300 font-bold mb-0.5">상세도</span>
                          <span className="text-[10px] text-white bg-primary px-1.5 py-0.5 rounded-full font-black shadow-sm flex items-center gap-0.5">
                            <span className="material-icons-round text-[12px]">recycling</span>
                            5 Token
                          </span>
                        </button>
                      )
                    )
                  )
                ) : (
                  (user && user.id !== project?.ownerId && !hasDetailedAccess && (syncedMetadata?.additional_blueprints?.detailed || (project as any)?.metadata?.additional_blueprints?.detailed)) && (
                    <button
                      onClick={() => {
                          if (onMessageClick && project) {
                              const maker = {
                                  name: project.maker,
                                  avatar: project.makerAvatarUrl || '',
                                  userId: project.ownerId || '',
                                  projects: 0,
                                  likes: '',
                                  rawLikes: 0,
                              };
                              const templateText = `[도면 요청] 안녕하세요! "${project.title}" 프로젝트의 상세도 도면 접근 권한을 요청합니다.`;
                              onMessageClick(maker, templateText, { relatedProjectId: project.id, relatedProjectTitle: project.title, accessType: 'blueprint_detailed' });
                          }
                      }}
                      className="relative w-24 h-24 rounded-xl overflow-hidden border-2 border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800 flex-shrink-0 hover:bg-gray-100 dark:hover:bg-gray-700 transition group"
                      title={language === 'ko' ? '제작자에게 상세도 도면 요청하기' : 'Request Detailed Blueprint from Maker'}
                    >
                      <span className="material-icons-round text-gray-500 mb-1 group-hover:text-primary transition-colors text-xl">lock</span>
                      <span className="text-[11px] text-gray-700 dark:text-gray-300 font-bold mb-0.5 whitespace-nowrap overflow-hidden text-ellipsis w-[90%] text-center">도면요청(상세도)</span>
                    </button>
                  )
                )}

                {/* 3. Mechanical Blueprint */}
                {(user && (user.id === project?.ownerId || hasMechanicalAccess)) ? (
                  additionalBlueprints.mechanical || (isEditMode && editImages.mechanical) ? (
                    <div className="relative w-24 h-24 flex-shrink-0">
                      <button
                        key="mechanical-bp"
                        onClick={() => {
                          if (!isEditMode) {
                            setViewMode('default');
                            const idx = allViewableImages.indexOf(additionalBlueprints.mechanical!);
                            setSelectedImageIndex(idx);
                          }
                        }}
                        className={`w-full h-full rounded-xl overflow-hidden border-2 shadow-sm ${!isEditMode ? 'hover:scale-105 transition-transform cursor-pointer' : 'cursor-default'} ${viewMode === 'default' && currentDisplayImage === additionalBlueprints.mechanical ? 'border-primary ring-2 ring-primary/30' : 'border-transparent'}`}
                      >
                        {(isEditMode ? editImages.mechanical : additionalBlueprints.mechanical) ? (
                          <img src={isEditMode ? editImages.mechanical : additionalBlueprints.mechanical} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center"><span className="material-icons-round text-gray-400">image</span></div>
                        )}
                        <div className="absolute inset-x-0 bottom-0 bg-indigo-600/80 text-white text-[10px] text-center py-0.5">조립 가이드</div>
                      </button>
                      {isEditMode && (
                        <div className="absolute inset-0 rounded-xl flex flex-col items-center justify-center gap-1.5 bg-black/40">
                          <button onClick={() => { setEditImageTarget('mechanical'); editImageInputRef.current?.click(); }} className="w-8 h-8 bg-white/90 rounded-full flex items-center justify-center text-blue-600 shadow hover:scale-110 transition-transform" title="교체">
                            <span className="material-icons-round text-sm">file_upload</span>
                          </button>
                          <button onClick={() => setEditImages(prev => ({ ...prev, mechanical: '' }))} className="w-8 h-8 bg-white/90 rounded-full flex items-center justify-center text-red-500 shadow hover:scale-110 transition-transform" title="삭제">
                            <span className="material-icons-round text-sm">delete</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    (user.id === project?.ownerId) && (
                      generatingBlueprint === 'mechanical' ? (
                        <div className="relative w-24 h-24 rounded-xl overflow-hidden border-2 border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800 flex-shrink-0 transition group">
                          <div className="flex flex-col items-center gap-2">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                            <button 
                              onClick={() => handleCancelGeneration('mechanical')}
                              className="text-[10px] text-red-500 font-bold hover:underline"
                            >
                              {language === 'ko' ? '취소' : 'Cancel'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleGenerateAdditionalBlueprint('mechanical')}
                          disabled={!!generatingBlueprint}
                          className="relative w-24 h-24 rounded-xl overflow-hidden border-2 border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800 flex-shrink-0 hover:bg-gray-100 dark:hover:bg-gray-700 transition group"
                        >
                          <span className="material-icons-round text-gray-500 mb-1 group-hover:text-primary transition-colors text-xl">lock</span>
                          <span className="text-xs text-gray-700 dark:text-gray-300 font-bold mb-0.5">조립가이드</span>
                          <span className="text-[10px] text-white bg-primary px-1.5 py-0.5 rounded-full font-black shadow-sm flex items-center gap-0.5">
                            <span className="material-icons-round text-[12px]">recycling</span>
                            5 Token
                          </span>
                        </button>
                      )
                    )
                  )
                ) : (
                  (user && user.id !== project?.ownerId && !hasMechanicalAccess && (syncedMetadata?.additional_blueprints?.mechanical || (project as any)?.metadata?.additional_blueprints?.mechanical)) && (
                    <button
                      onClick={() => {
                          if (onMessageClick && project) {
                              const maker = {
                                  name: project.maker,
                                  avatar: project.makerAvatarUrl || '',
                                  userId: project.ownerId || '',
                                  projects: 0,
                                  likes: '',
                                  rawLikes: 0,
                              };
                              const templateText = `[도면 요청] 안녕하세요! "${project.title}" 프로젝트의 조립 가이드 도면 접근 권한을 요청합니다.`;
                              onMessageClick(maker, templateText, { relatedProjectId: project.id, relatedProjectTitle: project.title, accessType: 'blueprint_mechanical' });
                          }
                      }}
                      className="relative w-24 h-24 rounded-xl overflow-hidden border-2 border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800 flex-shrink-0 hover:bg-gray-100 dark:hover:bg-gray-700 transition group"
                      title={language === 'ko' ? '제작자에게 조립 가이드 도면 요청하기' : 'Request Mechanical Blueprint from Maker'}
                    >
                      <span className="material-icons-round text-gray-500 mb-1 group-hover:text-primary transition-colors text-xl">lock</span>
                      <span className="text-[11px] text-gray-700 dark:text-gray-300 font-bold mb-0.5 whitespace-nowrap overflow-hidden text-ellipsis w-[90%] text-center">도면요청(조립 가이드)</span>
                    </button>
                  )
                )}

                {/* 3D 뷰어 썸네일 */}
                {model3DUrl && (has3DAccess || user?.id === project?.ownerId) && (
                  <button
                    onClick={() => handleToolClick('3d')}
                    className={`relative w-24 h-24 rounded-xl overflow-hidden border transition-all flex-shrink-0 flex items-center justify-center hover:scale-105 cursor-pointer
                        ${viewMode === '3d' ? 'border-primary bg-primary/10' : 'border-gray-200 dark:border-gray-700 opacity-60 hover:opacity-100 bg-gray-50 dark:bg-gray-800'}
                      `}
                  >
                    <span className={`material-icons-round ${viewMode === '3d' ? 'text-primary' : 'text-gray-400'}`}>3d_rotation</span>
                  </button>
                )}
              </div>
              <div className="flex items-center space-x-3 w-full sm:w-auto">
                {/* 3D View / Generate Button */}
                {model3DUrl && (has3DAccess || user?.id === project?.ownerId) ? (
                  <button onClick={() => handleToolClick('3d')} className={`flex-1 sm:flex-none flex items-center justify-center space-x-2 px-5 py-3 rounded-xl border transition-colors text-sm font-semibold shadow-sm 
                        ${viewMode === '3d'
                      ? 'bg-gray-900 text-white border-transparent'
                      : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200'
                    }
                    `}>
                    <span className="material-icons-round text-lg">view_in_ar</span>
                    <span>{t.view3DButton}</span>
                  </button>
                ) : (
                  model3DUrl && user && user.id !== project?.ownerId && !has3DAccess ? (
                    <button
                      onClick={() => {
                          if (onMessageClick && project) {
                              const maker = {
                                  name: project.maker,
                                  avatar: project.makerAvatarUrl || '',
                                  userId: project.ownerId || '',
                                  projects: 0,
                                  likes: '',
                                  rawLikes: 0,
                              };
                              const templateText = `[3D뷰어 요청] 안녕하세요! "${project.title}" 프로젝트의 3D 모델 접근 권한을 요청합니다.`;
                              onMessageClick(maker, templateText, { relatedProjectId: project.id, relatedProjectTitle: project.title, accessType: '3d_model' });
                          }
                      }}
                      className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-5 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm font-semibold shadow-sm"
                    >
                      <span className="material-icons-round text-lg">lock</span>
                      <span>{language === 'ko' ? '3D뷰어 요청' : 'Request 3D View'}</span>
                    </button>
                  ) : (
                    (user && user.id === project?.ownerId) ? (
                      generating3D ? (
                        <div className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-5 py-3 rounded-xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 shadow-sm">
                          <div className="flex items-center gap-3">
                            <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                            <div className="flex flex-col lg:flex-row items-center gap-2">
                              <span className="text-xs font-bold text-green-700 dark:text-green-300">
                                {language === 'ko' ? '3D 생성 중...' : 'Generating 3D...'}
                              </span>
                              <button 
                                onClick={() => handleCancelGeneration('3d')}
                                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-[10px] font-bold shadow-sm transition-all"
                              >
                                {language === 'ko' ? '취소 및 환불' : 'Cancel & Refund'}
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={handleGenerate3DModel}
                          disabled={generating3D}
                          className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-5 py-3 rounded-xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors text-sm font-bold shadow-sm"
                        >
                          <span className="material-icons-round text-lg">recycling</span>
                          <span>{language === 'ko' ? '3D 생성 (30T)' : 'Generate 3D (30T)'}</span>
                        </button>
                      )
                    ) : null
                  )
                )}
              </div>
            </div>
            {/* --- NEW: Production Info & Materials Section (Left Column) --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 animate-fade-in-up">

              {/* 1. Production Specs Card */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <span className="material-icons-round text-primary">analytics</span>
                  제작 정보
                </h3>
                <div className="space-y-4">
                  {/* Time */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                        <span className="material-icons-round">schedule</span>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-bold uppercase">제작 시간</p>
                        <p className="text-base font-bold text-gray-900 dark:text-white">{displayTime}</p>
                      </div>
                    </div>
                  </div>
                  {/* Difficulty */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                        <span className="material-icons-round">signal_cellular_alt</span>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-bold uppercase">난이도</p>
                        <p className="text-base font-bold text-gray-900 dark:text-white">{displayDifficulty}</p>
                      </div>
                    </div>
                  </div>
                  {/* Tools */}
                  <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-2xl">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="material-icons-round text-gray-400 text-sm">build</span>
                      <p className="text-xs text-gray-500 font-bold uppercase">필요 도구</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {((syncedMetadata?.tools || project?.tools) || '기본 도구').split(',').map((tool: string, i: number) => (
                        <span key={i} className="px-2.5 py-1 bg-white dark:bg-gray-600 border border-gray-100 dark:border-gray-500 rounded-lg text-xs font-bold text-gray-700 dark:text-gray-200">
                          {tool.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Materials & Parts List Card */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2 relative z-10">
                  <span className="material-icons-round text-emerald-500">inventory_2</span>
                  필요 부품 및 재료
                </h3>

                <div className="space-y-3 relative z-10 max-h-[240px] overflow-y-auto custom-scrollbar pr-1">
                  {/* Main Material */}
                  <div className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/30 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-800/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                        <span className="material-icons-round text-sm">recycling</span>
                      </div>
                      <span className="text-sm font-bold text-gray-800 dark:text-gray-200">{syncedMetadata?.material || project?.material || t.plastic}</span>
                    </div>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-white dark:bg-gray-800 px-2 py-1 rounded-md shadow-sm">Main</span>
                  </div>

                  {/* AI Generated Materials List */}
                  {syncedMetadata?.materials_list ? (
                    syncedMetadata.materials_list.map((mat: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-2.5 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors border-b border-gray-100 dark:border-gray-800 last:border-0">
                        <div className="flex items-center gap-3">
                          <div className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                          <span className="text-sm text-gray-700 dark:text-gray-300">{mat.item}</span>
                        </div>
                        <span className="text-xs font-mono text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded text-right min-w-[60px]">{mat.estimated_qty}</span>
                      </div>
                    ))
                  ) : (
                    // Fallback if no list exists
                    <div className="text-center py-8 text-gray-400 text-xs">
                      <p>상세 부품 목록이 없습니다.</p>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>

          {/* Right Column: Details */}
          <div className="lg:col-span-4 space-y-8">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm sticky top-24 transition-colors">
              <div className="space-y-4 mb-8">
                <div className="flex flex-wrap gap-2">
                  <span className="px-2.5 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-semibold rounded-md uppercase tracking-wide">{syncedMetadata?.material || project?.material || t.plastic}</span>
                  <span className="px-2.5 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-semibold rounded-md uppercase tracking-wide">{displayCategory}</span>
                </div>
                <div className="flex justify-between items-start">
                  {isEditMode ? (
                    <input
                      value={editTitle}
                      onChange={e => setEditTitle(e.target.value)}
                      className="text-3xl font-bold tracking-tight flex-1 mr-4 bg-amber-50 dark:bg-amber-900/20 border-b-2 border-amber-400 focus:outline-none text-gray-900 dark:text-white px-2 py-1 rounded-t-md"
                      placeholder="?쒕ぉ"
                    />
                  ) : (
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white flex-1 mr-4">{displayTitle}</h1>
                  )}
                  <button
                    onClick={() => project && onLikeToggle(project.id)}
                    className={`p-2 rounded-full transition-all flex-shrink-0 ${project && likedProjects.has(project.id)
                      ? 'bg-red-50 dark:bg-red-900/20 text-red-500'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-400 hover:text-red-500'
                      }`}
                  >
                    <span className="material-icons-round text-2xl">
                      {project && likedProjects.has(project.id) ? 'favorite' : 'favorite_border'}
                    </span>
                  </button>
                </div>
                {isEditMode ? (
                  <textarea
                    value={editDescription}
                    onChange={e => setEditDescription(e.target.value)}
                    rows={4}
                    className="w-full text-sm text-gray-700 dark:text-gray-300 bg-amber-50 dark:bg-amber-900/20 border border-amber-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none leading-relaxed"
                    placeholder="제품 설명"
                  />
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
                    {displayDesc}
                  </p>
                )}
              </div>

              {/* Eco Score */}
              <div className="p-5 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl border border-green-100 dark:border-green-800 mb-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>

                {/* Dynamic Data Binding */}
                {(() => {
                  const ecoData = syncedMetadata?.eco_validation || (project as any)?.metadata?.eco_validation || (project as any)?.metadata?.eco_impact;
                  const grade = ecoData?.grade || ecoData?.score || 'B';
                  const scoreVal = ecoData?.recalculated_eco_score || (project as any)?.co2_reduction || 1.2;
                  const material = (syncedMetadata?.material || project?.material || '').toLowerCase();
                  const isCardboard = material.includes('cardboard') || material.includes('paper') || material.includes('골판지') || material.includes('종이');
                  const defaultImpact = t.impactDesc; // Removed conditional for cardboard, using default

                  const badgeText = ecoData?.eco_badge || ecoData?.visual_analogy || defaultImpact;

                  return (
                    <>
                      <div className="flex items-center justify-between mb-3 relative z-10">
                        <div className="flex items-center space-x-2">
                          <span className="material-icons-round text-primary">eco</span>
                          <span className="font-bold text-green-900 dark:text-green-400">{t.ecoScore}</span>
                        </div>
                        <span className="bg-primary text-white text-xs font-bold px-2 py-0.5 rounded shadow-lg shadow-primary/30">{grade}</span>
                      </div>
                      <div className="space-y-2 relative z-10">
                        <div className="flex justify-between text-sm">
                          <span className="text-green-800/70 dark:text-green-400/70">{t.carbonReduction}</span>
                          <span className="font-bold text-green-900 dark:text-green-400">-{Number(scoreVal).toFixed(2)}kg CO₂</span>
                        </div>
                        <div className="w-full bg-green-200/50 dark:bg-green-700/50 rounded-full h-1.5">
                          <div className="bg-primary h-1.5 rounded-full shadow-[0_0_10px_rgba(23,207,99,0.5)]" style={{ width: grade === 'A' ? '95%' : grade === 'B' ? '70%' : '40%' }}></div>
                        </div>
                        <p className="text-xs text-green-700 dark:text-green-500 pt-1 font-medium">{badgeText}</p>
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* CTA Buttons */}
              <div className="space-y-3">
                <button
                  onClick={() => {
                    if (!user) {
                      onLoginClick('detail');
                    } else {
                      onAnalyze();
                    }
                  }}
                  className="w-full py-4 px-6 text-white rounded-xl font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700"
                >
                  <span>{t.connectAI}</span>
                  <span className="material-icons-round text-sm">smart_toy</span>
                </button>
                {/* Advanced Download Dropdown */}
                <div className="relative group z-30 w-full">
                  <button
                    onClick={() => !user && onLoginClick('detail')}
                    className="w-full py-3.5 lg:py-4 px-6 bg-[#00ae42] hover:bg-[#009639] text-white rounded-xl font-bold shadow-lg transition-all flex items-center justify-center space-x-2 active:scale-95"
                  >
                    <span>다운로드</span>
                    <span className="material-icons-round text-sm ml-auto">expand_more</span>
                  </button>

                  <div className="absolute top-full left-0 right-0 mt-2 bg-[#1a1c1e] border border-gray-700 rounded-xl shadow-2xl overflow-hidden invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-200 transform origin-top scale-95 group-hover:scale-100">
                    <button
                      onClick={() => {
                        // 3D Model Download (.glb)
                        const files = project?.modelFiles || [];
                        const modelFile = files.find(f => f.name.toLowerCase().includes('glb') || f.name.toLowerCase().includes('stl')) || files[0];

                        if (modelFile) {
                          // Force .glb extension
                          const newName = modelFile.name.replace(/\.[^/.]+$/, "") + ".glb";
                          downloadFile({ ...modelFile, name: newName });
                        } else {
                          const url = model3DUrl;
                          if (url) {
                            downloadFile({ name: `${project?.title || 'model'}.glb`, url: url });
                          } else {
                            showToast(t.noFiles, 'warning');
                          }
                        }
                      }}
                      className="w-full text-left px-5 py-3 text-gray-200 hover:bg-white/10 text-sm font-medium flex items-center justify-between"
                    >
                      3D 모델 (.glb)
                      <span className="material-icons-round text-xs opacity-50">3d_rotation</span>
                    </button>
                    <div className="h-px bg-gray-700 my-0"></div>
                    <button
                      onClick={() => {
                        // Download Images as Zip
                        if (displayImages.length > 0) {
                          downloadImagesAsZip();
                        } else {
                          showToast(t.noFiles, 'warning');
                        }
                      }}
                      className="w-full text-left px-5 py-3 text-gray-200 hover:bg-white/10 text-sm font-medium flex items-center justify-between"
                    >
                      이미지 전체 (.zip)
                      <span className="material-icons-round text-xs opacity-50">folder_zip</span>
                    </button>

                  </div>
                </div>

                {/* File List (Legacy Support) */}
                {showFileList && project?.modelFiles && project.modelFiles.length > 1 && (
                  <div className="mt-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 space-y-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-gray-700 dark:text-gray-200">
                        {t.files} ({project.modelFiles.length})
                      </span>
                      <button
                        onClick={downloadAllFiles}
                        className="text-xs font-bold text-primary hover:text-primary-dark flex items-center gap-1"
                      >
                        <span className="material-icons-round text-sm">download</span>
                        {t.downloadAll}
                      </button>
                    </div>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {project.modelFiles.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-primary dark:hover:border-primary transition-colors group"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                              <span className="material-icons-round text-gray-600 dark:text-gray-300 text-sm">insert_drive_file</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                {file.name}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {(file.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => downloadFile(file)}
                            className="p-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                          >
                            <span className="material-icons-round text-sm">download</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Stats Grid - Simplified */}
              <div className="grid grid-cols-3 gap-4 mt-8 pt-8 border-t border-gray-100 dark:border-gray-700">
                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-xl text-center">
                  <span className="block text-[10px] text-gray-400 dark:text-gray-300 uppercase tracking-wider font-bold mb-1">{t.views}</span>
                  <span className="block text-lg font-bold text-gray-900 dark:text-white">{(project?.views || 0).toLocaleString()}</span>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-xl text-center">
                  <span className="block text-[10px] text-gray-400 dark:text-gray-300 uppercase tracking-wider font-bold mb-1">{t.likes}</span>
                  <span className="block text-lg font-bold text-gray-900 dark:text-white">{(project?.likes || 0).toLocaleString()}</span>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-xl text-center">
                  <span className="block text-[10px] text-gray-400 dark:text-gray-300 uppercase tracking-wider font-bold mb-1">{t.license}</span>
                  <span className="block text-lg font-bold text-gray-900 dark:text-white flex items-center justify-center gap-1">
                    CC BY <span className="material-icons-round text-[14px] text-gray-400">info</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div >

        {/* Fabrication Guide */}
        <div className="mt-24 max-w-5xl mx-auto px-6 lg:px-0">
          <h2 className="text-2xl font-bold mb-12 flex items-center space-x-3 text-gray-900 dark:text-white">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-icons-round">build</span>
            </div>
            <span>{t.fabricationGuide}</span>
          </h2>

          {(hasGuideAccess) ? (
            <div className="relative">
              <div className="absolute left-8 top-4 bottom-4 w-0.5 bg-gray-100 dark:bg-gray-800"></div>

              {(isEditMode ? editSteps : displaySteps).map((step: any, idx: number) => (
                <div key={idx} className="relative pl-24 pb-12 group last:pb-0">
                  <div className="absolute left-0 top-0 w-16 h-16 flex items-center justify-center bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-full z-10 shadow-sm group-hover:border-primary group-hover:shadow-lg group-hover:shadow-primary/20 transition-all duration-300">
                    <span className="text-xl font-bold text-gray-300 group-hover:text-primary transition-colors">{idx + 1}</span>
                  </div>
                  <div>
                    {isEditMode ? (
                      <div className="space-y-2 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-2xl p-4">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-amber-600 uppercase tracking-wide">Step {idx + 1}</span>
                          <button
                            onClick={() => setEditSteps(prev => prev.filter((_, i) => i !== idx))}
                            className="text-red-400 hover:text-red-600 transition-colors"
                            title="스텝 삭제"
                          >
                            <span className="material-icons-round text-sm">delete</span>
                          </button>
                        </div>
                        <input
                          value={step.title}
                          onChange={e => setEditSteps(prev => prev.map((s, i) => i === idx ? { ...s, title: e.target.value } : s))}
                          className="w-full text-lg font-bold bg-white dark:bg-gray-800 border border-amber-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400 text-gray-900 dark:text-white"
                          placeholder="스텝 제목"
                        />
                        <textarea
                          value={step.desc}
                          onChange={e => setEditSteps(prev => prev.map((s, i) => i === idx ? { ...s, desc: e.target.value } : s))}
                          rows={3}
                          className="w-full text-sm bg-white dark:bg-gray-800 border border-amber-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400 text-gray-600 dark:text-gray-300 resize-none"
                          placeholder="작업 설명"
                        />
                        <input
                          value={step.tip || ''}
                          onChange={e => setEditSteps(prev => prev.map((s, i) => i === idx ? { ...s, tip: e.target.value } : s))}
                          className="w-full text-sm bg-white dark:bg-gray-800 border border-amber-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400 text-yellow-700 dark:text-yellow-400"
                          placeholder="팁 (선택사항)"
                        />
                      </div>
                    ) : (
                      <>
                        <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">{step.title}</h3>
                        <p className="text-gray-500 dark:text-gray-400 leading-relaxed mb-4">{step.desc}</p>
                        {(step as any).imageUrl && (
                          <div className="mb-4 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 shadow-sm max-w-2xl group/stepimg relative bg-gray-50 dark:bg-gray-900">
                            <img
                              src={(step as any).imageUrl}
                              alt={step.title}
                              className="w-full h-auto object-contain transition-transform duration-500 hover:scale-105 cursor-zoom-in"
                              onClick={() => setFullScreenImage((step as any).imageUrl)}
                            />
                            <div className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 rounded-full text-white backdrop-blur-sm opacity-0 group-hover/stepimg:opacity-100 transition-opacity pointer-events-none">
                              <span className="material-icons-round text-sm">fullscreen</span>
                            </div>
                          </div>
                        )}
                        {step.tip && (
                          <div className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm rounded-lg border border-blue-100 dark:border-blue-800 font-medium">
                            <span className="material-icons-round text-sm">lightbulb</span>
                            <span>Tip: {step.tip}</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}

              {/* Add Step button in edit mode */}
              {isEditMode && (
                <div className="pl-24 pt-4">
                  <button
                    onClick={() => setEditSteps(prev => [...prev, { title: '', desc: '', tip: '' }])}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-dashed border-amber-300 text-amber-600 hover:bg-amber-50 transition-colors text-sm font-bold"
                  >
                    <span className="material-icons-round text-sm">add</span>
                    {language === 'ko' ? '스텝 추가' : 'Add Step'}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-3xl p-12 border border-gray-100 dark:border-gray-700 flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-white dark:bg-gray-800 shadow-xl flex items-center justify-center mb-6 border border-gray-50 dark:border-gray-700">
                <span className="material-icons-round text-gray-300 text-4xl">lock</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                {language === 'ko' ? '제작가이드는 제작자 전용입니다.' : 'Fabrication guide is private.'}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-sm leading-relaxed mb-8 text-sm">
                {language === 'ko' 
                  ? 'AI로 생성된 가이드의 정확성 확인 및 품질 관리를 위해 제작가이드는 제작자 본인에게만 제공됩니다.' 
                  : 'Due to accuracy verification and quality control of AI-generated guides, this section is only available to the creator.'}
              </p>
              <button
                onClick={() => handleConnectMaker(true)}
                className="px-6 py-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl text-sm font-bold text-gray-700 dark:text-gray-200 shadow-sm hover:shadow-md transition-all active:scale-95"
              >
                {language === 'ko' ? '제작자에게 문의하기' : 'Contact Maker'}
              </button>
            </div>
          )}
        </div>


        {/* Footer simple */}
        <footer className="mt-24 pb-12" />
      </div >
    </>
  );
};

export default ProjectDetail;
