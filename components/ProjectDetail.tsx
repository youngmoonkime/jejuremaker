import React, { useState, useEffect, useRef } from 'react';
import { Language } from '../App';
import { Project } from '../types';
import { User, createClient } from '@supabase/supabase-js';
import ThreeDViewer, { ThreeDViewerHandle } from './ThreeDViewer';
import CopilotPanel from './CopilotPanel';
import { config } from '../services/config';
import * as aiService from '../services/aiService';

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
  onOpenWorkspace: () => void;
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
}

const TRANSLATIONS = {
  ko: {
    backToLibrary: '라이브러리로 돌아가기',
    view3D: '3D 뷰어',
    blueprint: '도면 모드',
    view3DButton: '3D 보기',
    generateBlueprint: '도면 생성',
    plastic: '재활용 플라스틱',
    printing: '3D 프린팅',
    title: '현무암 화분 04', // Default title fallback
    description: '자연 현무암 암석 형상을 닮도록 디자인된 미니멀리스트 화분입니다. 폐플라스틱 병에서 추출한 rPETG 프린팅에 최적화되었습니다.',
    ecoScore: '에코 점수',
    carbonReduction: '탄소 절감',
    impactDesc: '약 20개의 플라스틱 병이 매립되는 것을 방지합니다.',
    findMaker: '메이커 연결',
    connectAI: 'AI 코파일럿 연결',
    downloadGuide: '2D/3D도면 다운로드',
    printTime: '출력 시간',
    difficulty: '난이도',
    filament: '필라멘트',
    license: '라이선스',
    fabricationGuide: '제작 가이드',
    noLink: '다운로드 링크가 등록되지 않았습니다.',
    noFiles: '다운로드 가능한 파일이 없습니다.',
    downloadAll: '전체 다운로드',
    files: '파일',
    downloading: '다운로드 중...',
    views: '조회수',
    likes: '좋아요',
    steps: [ // Default steps fallback
      { id: '01', title: '준비 및 슬라이싱', desc: '프린트 베드가 깨끗한지 확인하세요. 표준 품질은 0.4mm 노즐, 빠른 초안은 0.6mm를 사용하세요. 슬라이서 설정에서 "Vase Mode"(나선형 외곽선)를 활성화하세요.', tip: '레이어 접착력을 높이려면 유량을 5% 늘리세요.' },
      { id: '02', title: '프린팅', desc: '첫 번째 레이어를 주의 깊게 모니터링하세요. 현무암 질감은 레이어 라인을 잘 숨기지만 일관성이 중요합니다. rPETG 권장 온도는 240°C입니다.' },
      { id: '03', title: '후가공', desc: '히트 건으로 거미줄 현상을 제거하세요. 방수가 중요하다면 내부에 에폭시 수지나 특수 실런트를 얇게 코팅하세요.' },
      { id: '04', title: '조립', desc: '본체 아래에 받침대를 놓으세요. 흙을 채우고 좋아하는 식물을 심으세요.' }
    ],
    footer: '© 2024 Project Cyclical. 오픈 지속가능 디자인.',
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
      { id: '01', title: 'Preparation & Slicing', desc: 'Ensure your print bed is clean. Use a 0.4mm nozzle for standard quality or 0.6mm for faster drafting. Enable "Vase Mode" (Spiralize Outer Contour) in your slicer settings.', tip: 'Increase flow rate by 5% for better layer adhesion.' },
      { id: '02', title: 'Printing', desc: 'Monitor the first layer closely. The basalt texture hides layer lines well, but consistency is key. Recommended temperature for rPETG is 240°C.' },
      { id: '03', title: 'Post-Processing', desc: 'Remove stringing with a heat gun. If water-tightness is critical, coat the interior with a thin layer of epoxy resin or a specialized sealant.' },
      { id: '04', title: 'Assembly', desc: 'Place the saucer under the main body. Fill with soil and your favorite plant.' }
    ],
    footer: '© 2024 Project Cyclical. Open Sustainable Design.',
    handmade: 'Handmade',
    isAi: 'AI Generated'
  }
};

type ViewMode = 'default' | '3d' | 'blueprint';

const ProjectDetail: React.FC<ProjectDetailProps> = ({ onBack, onOpenWorkspace, language, project, user, onLoginClick, onNavigate, onLikeToggle, onViewIncrement, likedProjects }) => {
  const t = TRANSLATIONS[language];
  const [viewMode, setViewMode] = useState<ViewMode>('default');
  const [showFileList, setShowFileList] = useState(false);
  const [syncedMetadata, setSyncedMetadata] = useState<any>(null); // State for fresh metadata

  // --- AI Copilot State ---
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [copilotLoading, setCopilotLoading] = useState(false);
  const [copilotMessages, setCopilotMessages] = useState<{ role: 'user' | 'assistant'; content: string; type?: 'text' | 'preview' | 'action'; meta?: any }[]>([]);
  const viewerRef = useRef<ThreeDViewerHandle>(null);

  // State for "Recipe Mode" (Current Prompt)
  const [currentRecipe, setCurrentRecipe] = useState(project?.description || "A 3D model");

  // Helper: Upload Logic
  const uploadToR2 = async (file: Blob, path: string) => {
    // Create a fresh client for this operation
    const supabase = createClient(config.supabase.url, config.supabase.anonKey);

    // 1. Get Presigned URL
    const { data, error } = await supabase.functions.invoke('upload-r2', {
      body: {
        key: path,
        contentType: file.type,
        action: 'put'
      }
    });
    if (error || !data?.url) throw new Error('Failed to get upload URL');

    // 2. Upload to R2
    await fetch(data.url, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': file.type }
    });

    // 3. Return Public URL
    return `${config.r2.publicDomain}/${path}`;
  };

  const handleCopilotMessage = async (msg: string) => {
    const newMessages = [...copilotMessages, { role: 'user', content: msg } as const];
    setCopilotMessages(newMessages);
    setCopilotLoading(true);

    try {
      // 1. Analyze Intent
      const analysis = await aiService.analyzeCopilotIntent(msg, currentRecipe);
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
        setCopilotMessages(prev => [...prev, { role: 'assistant', content: "네, 새로운 디자인으로 3D 모델 생성을 시작합니다..." }]);

        // 1. Call Tripo
        const tripoUrl = await aiService.generate3DModel(currentRecipe);

        // 2. Download via Proxy (CORS Bypass)
        const baseUrl = import.meta.env.DEV ? 'https://jejuremaker.pages.dev' : '';
        const proxyUrl = `${baseUrl}/api/tripo-proxy?url=${encodeURIComponent(tripoUrl)}`;
        const proxyResp = await fetch(proxyUrl);
        const blob = await proxyResp.blob();

        // 3. Upload to R2
        const fileName = `copilot_gen_${Date.now()}.glb`;
        const r2Path = `models/${user?.id || 'anon'}/${fileName}`;
        const r2Url = await uploadToR2(blob, r2Path);

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
      setCopilotMessages(prev => [...prev, { role: 'assistant', content: "오류가 발생했습니다. 잠시 후 다시 시도해주세요." }]);
    } finally {
      setCopilotLoading(false);
    }
  };


  // Increment view count when project is loaded AND fetch latest metadata
  useEffect(() => {
    if (project?.id) {
      onViewIncrement(project.id);

      // AI 프로젝트라면 Copilot 자동 활성화 안내 (옵션)
      if (project.isAiRemix || project.isAiIdea) {
        // setIsCopilotOpen(true); // 너무 공격적일 수 있으니 보류
      }

      // Fetch latest metadata to ensure 3D URL is up to date (sync with Wizard generation)
      const fetchLatestData = async () => {
        try {
          // If the project ID is numeric (legacy), skip. If UUID, fetch.
          if (typeof project.id === 'string' && project.id.includes('-')) {
            const supabase = createClient(config.supabase.url, config.supabase.anonKey);
            const { data, error } = await supabase
              .from('items')
              .select('metadata')
              .eq('id', project.id)
              .single();

            if (data && !error && data.metadata) {
              setSyncedMetadata(data.metadata);
            }
          }
        } catch (e) {
          console.error("Failed to sync project metadata", e);
        }
      };

      fetchLatestData();
    }
  }, [project?.id]);

  const handleToolClick = (mode: ViewMode) => {
    setViewMode(mode === viewMode ? 'default' : mode);
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
      alert(t.noFiles);
      return;
    }

    // 파일이 1개면 바로 다운로드, 여러 개면 목록 표시
    if (files.length === 1) {
      downloadFile(files[0]);
    } else {
      setShowFileList(!showFileList);
    }
  };

  const downloadFile = (file: { name: string; url: string }) => {
    const link = document.createElement('a');
    link.href = file.url;
    link.download = file.name;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadAllFiles = () => {
    const files = project?.modelFiles || [];
    files.forEach((file, index) => {
      setTimeout(() => {
        downloadFile(file);
      }, index * 500); // 브라우저 다운로드 제한 회피
    });
  };

  const handleConnectMaker = () => {
    if (project?.isAiRemix || project?.isAiIdea) {
      onOpenWorkspace();
      return;
    }

    if (user) {
      // User is logged in, go to workspace
      onNavigate('workspace');
    } else {
      // User not logged in, show auth modal then go to workspace
      onLoginClick('workspace');
    }
  };

  // Determine what content to show
  const displayTitle = project?.title || t.title;
  const displayDesc = project?.description || t.description;
  const displayImage = project?.image || 'https://lh3.googleusercontent.com/aida-public/AB6AXuDfv7rlXQezFNRd55ViDyVQxZHy5hmFeJRXuYnIhyBrqgo6LsrhVYeZKMz0Mhkh3SM8YgXWYE8qI8_RMrYNIAEJKuWxoO9Wo2s-xMLQKI7o6W0Jfaw_ASJFO3TLZHM35y9JiY1bjQqF-zcsSKoVkW980qHM3rsSDBkRaH6xYmQehOScGrNFCt7L78QxSK__Ljxwcv05op5YxYRS3fRAQLmMyiiiQ5-rMV71Mh-zSiVnCOO856cB0S6IrvFPabp6DIRjOMalBsw9bno';

  // Get Blueprint URL - Use synced data if available
  const blueprintUrl = syncedMetadata?.blueprint_url || (project as any)?.metadata?.blueprint_url;

  // Update displayImages to include blueprint if available
  const notebookImages = project?.images || [displayImage];
  const displayImages = blueprintUrl && !notebookImages.includes(blueprintUrl)
    ? [...notebookImages, blueprintUrl]
    : notebookImages;

  const displayCategory = project?.category || t.printing;
  const displayTime = project?.time || '4h 20m';
  const displayDifficulty = project?.difficulty || 'Medium';

  // Check if project is AI generated
  const isAiProject = project?.isAiRemix || project?.isAiIdea;

  // 3D 모델 파일 찾기 - Use synced data if available
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

  const model3DUrl = getModel3DUrl();

  // Logic for fabrication steps
  // If the project has custom steps, use them. Otherwise use the default steps from translation.
  const displaySteps = (project?.steps && project.steps.length > 0)
    ? project.steps.map((s, i) => ({
      id: (i + 1).toString().padStart(2, '0'),
      title: s.title,
      desc: s.desc,
      tip: s.tip
    }))
    : t.steps;

  // Handle Image Selection from Thumbnails
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const currentDisplayImage = displayImages[selectedImageIndex] || displayImage;

  return (
    <>
      <div className="max-w-7xl mx-auto py-12 relative">
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

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 px-6 lg:px-0">
          {/* Left Column: Visuals */}
          <div className="lg:col-span-8 space-y-8">
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
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/70 text-xs font-mono bg-black/60 px-4 py-2 rounded-full backdrop-blur-sm">
                    3D Preview • Drag to Rotate • Scroll to Zoom
                  </div>
                </div>
              ) : (
                <>
                  <img
                    src={currentDisplayImage}
                    alt={displayTitle}
                    className="w-full h-full object-cover transition-all duration-500"
                  />

                  {/* Label for Blueprint */}
                  {currentDisplayImage === blueprintUrl && (
                    <div className="absolute top-4 right-4 px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-full shadow-lg">
                      BLUEPRINT
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
              </div>
            </div>

            {/* Thumbnails & Actions */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="flex space-x-4 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
                {/* 모든 이미지 썸네일 */}
                {displayImages.map((imgUrl, index) => (
                  <button
                    key={`img-${index}`}
                    onClick={() => {
                      setViewMode('default');
                      setSelectedImageIndex(index);
                    }}
                    className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 shadow-sm flex-shrink-0 transition-transform hover:scale-105 ${viewMode === 'default' && currentDisplayImage === imgUrl ? 'border-primary ring-2 ring-primary/30' : 'border-transparent'}`}
                  >
                    <img src={imgUrl} alt={`Image ${index + 1}`} className="w-full h-full object-cover" />
                    {imgUrl === blueprintUrl && (
                      <div className="absolute inset-x-0 bottom-0 bg-black/50 text-white text-[10px] text-center py-0.5">도면</div>
                    )}
                  </button>
                ))}

                {/* 3D 뷰어 썸네일 */}
                {model3DUrl && (
                  <button
                    onClick={() => handleToolClick('3d')}
                    className={`relative w-20 h-20 rounded-xl overflow-hidden border transition-all flex-shrink-0 flex items-center justify-center hover:scale-105 cursor-pointer
                        ${viewMode === '3d' ? 'border-primary bg-primary/10' : 'border-gray-200 dark:border-gray-700 opacity-60 hover:opacity-100 bg-gray-50 dark:bg-gray-800'}
                      `}
                  >
                    <span className={`material-icons-round ${viewMode === '3d' ? 'text-primary' : 'text-gray-400'}`}>3d_rotation</span>
                  </button>
                )}
              </div>
              <div className="flex items-center space-x-3 w-full sm:w-auto">
                <button onClick={() => handleToolClick('3d')} className={`flex-1 sm:flex-none flex items-center justify-center space-x-2 px-5 py-3 rounded-xl border transition-colors text-sm font-semibold shadow-sm 
                      ${viewMode === '3d'
                    ? 'bg-gray-900 text-white border-transparent'
                    : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200'
                  }
                  `}>
                  <span className="material-icons-round text-lg">view_in_ar</span>
                  <span>{t.view3DButton}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Details */}
          <div className="lg:col-span-4 space-y-8">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm sticky top-24 transition-colors">
              <div className="space-y-4 mb-8">
                <div className="flex flex-wrap gap-2">
                  <span className="px-2.5 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-semibold rounded-md uppercase tracking-wide">{t.plastic}</span>
                  <span className="px-2.5 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-semibold rounded-md uppercase tracking-wide">{displayCategory}</span>
                </div>
                <div className="flex justify-between items-start">
                  <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white flex-1 mr-4">{displayTitle}</h1>
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
                <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
                  {displayDesc}
                </p>
              </div>

              {/* Eco Score */}
              <div className="p-5 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl border border-green-100 dark:border-green-800 mb-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                <div className="flex items-center justify-between mb-3 relative z-10">
                  <div className="flex items-center space-x-2">
                    <span className="material-icons-round text-primary">eco</span>
                    <span className="font-bold text-green-900 dark:text-green-400">{t.ecoScore}</span>
                  </div>
                  <span className="bg-primary text-white text-xs font-bold px-2 py-0.5 rounded shadow-lg shadow-primary/30">A+</span>
                </div>
                <div className="space-y-2 relative z-10">
                  <div className="flex justify-between text-sm">
                    <span className="text-green-800/70 dark:text-green-400/70">{t.carbonReduction}</span>
                    <span className="font-bold text-green-900 dark:text-green-400">-2.5kg CO₂e</span>
                  </div>
                  <div className="w-full bg-green-200/50 dark:bg-green-700/50 rounded-full h-1.5">
                    <div className="bg-primary h-1.5 rounded-full shadow-[0_0_10px_rgba(23,207,99,0.5)]" style={{ width: '95%' }}></div>
                  </div>
                  <p className="text-xs text-green-700 dark:text-green-500 pt-1 font-medium">{t.impactDesc}</p>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="space-y-3">
                <button
                  onClick={handleConnectMaker}
                  className={`w-full py-4 px-6 text-white rounded-xl font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center space-x-2
                       ${isAiProject ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-gray-900 dark:bg-white dark:text-gray-900'}
                    `}
                >
                  <span>{isAiProject ? t.connectAI : t.findMaker}</span>
                  <span className="material-icons-round text-sm">{isAiProject ? 'smart_toy' : 'arrow_forward'}</span>
                </button>
                <button
                  onClick={handleDownload}
                  className="w-full py-4 px-6 bg-transparent border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <span className="material-icons-round">download</span>
                  <span>{t.downloadGuide}</span>
                  {project?.modelFiles && project.modelFiles.length > 1 && (
                    <span className="ml-2 px-2 py-0.5 bg-primary text-white text-xs rounded-full">
                      {project.modelFiles.length}
                    </span>
                  )}
                </button>

                {/* File List (shown when multiple files exist and user clicked download) */}
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

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4 mt-8 pt-8 border-t border-gray-100 dark:border-gray-700">
                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-xl">
                  <span className="block text-[10px] text-gray-400 dark:text-gray-300 uppercase tracking-wider font-bold mb-1">{t.printTime}</span>
                  <span className="block text-lg font-bold text-gray-900 dark:text-white">{displayTime}</span>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-xl">
                  <span className="block text-[10px] text-gray-400 dark:text-gray-300 uppercase tracking-wider font-bold mb-1">{t.difficulty}</span>
                  <span className="block text-lg font-bold text-gray-900 dark:text-white">{displayDifficulty}</span>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-xl">
                  <span className="block text-[10px] text-gray-400 dark:text-gray-300 uppercase tracking-wider font-bold mb-1">{t.filament}</span>
                  <span className="block text-lg font-bold text-gray-900 dark:text-white">140g</span>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-xl">
                  <span className="block text-[10px] text-gray-400 dark:text-gray-300 uppercase tracking-wider font-bold mb-1">{t.views}</span>
                  <span className="block text-lg font-bold text-gray-900 dark:text-white">{(project?.views || 0).toLocaleString()}</span>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-xl">
                  <span className="block text-[10px] text-gray-400 dark:text-gray-300 uppercase tracking-wider font-bold mb-1">{t.likes}</span>
                  <span className="block text-lg font-bold text-gray-900 dark:text-white">{(project?.likes || 0).toLocaleString()}</span>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-xl">
                  <span className="block text-[10px] text-gray-400 dark:text-gray-300 uppercase tracking-wider font-bold mb-1">{t.license}</span>
                  <span className="block text-lg font-bold text-gray-900 dark:text-white flex items-center gap-1">
                    CC BY <span className="material-icons-round text-[14px] text-gray-400">info</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div >

        {/* Fabrication Guide */}
        < div className="mt-24 max-w-5xl mx-auto px-6 lg:px-0" >
          <h2 className="text-2xl font-bold mb-12 flex items-center space-x-3 text-gray-900 dark:text-white">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-icons-round">build</span>
            </div>
            <span>{t.fabricationGuide}</span>
          </h2>

          <div className="relative">
            <div className="absolute left-8 top-4 bottom-4 w-0.5 bg-gray-100 dark:bg-gray-800"></div>

            {displaySteps.map((step, idx) => (
              <div key={idx} className="relative pl-24 pb-12 group last:pb-0">
                <div className="absolute left-0 top-0 w-16 h-16 flex items-center justify-center bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-full z-10 shadow-sm group-hover:border-primary group-hover:shadow-lg group-hover:shadow-primary/20 transition-all duration-300">
                  <span className="text-xl font-bold text-gray-300 group-hover:text-primary transition-colors">{idx + 1}</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">{step.title}</h3>
                  <p className="text-gray-500 dark:text-gray-400 leading-relaxed mb-4">{step.desc}</p>
                  {step.tip && (
                    <div className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm rounded-lg border border-blue-100 dark:border-blue-800 font-medium">
                      <span className="material-icons-round text-sm">lightbulb</span>
                      <span>Tip: {step.tip}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div >

        {/* Floating Action Button for AI Copilot */}
        {(project?.isAiRemix || project?.isAiIdea) && (
          <button
            onClick={onOpenWorkspace}
            className="fixed bottom-8 right-8 w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-xl flex items-center justify-center transition-all hover:scale-110 z-40 animate-bounce-slow"
            aria-label="Open AI Workspace"
          >
            <span className="material-icons-round text-2xl">smart_toy</span>
          </button>
        )}

        {/* Footer simple */}
        < footer className="mt-24 pt-12 border-t border-gray-200 dark:border-gray-800 flex flex-col items-center" >
          <p className="text-gray-400 text-sm font-medium">{t.footer}</p>
        </footer >
      </div >
    </>
  );
};

export default ProjectDetail;