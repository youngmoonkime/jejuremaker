import React, { useState, useEffect, useRef } from 'react';
import { Language } from '../App';
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
  userTokens: number;
  onDeductTokens: (amount: number) => void;
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
    impactDescCardboard: '폐골판지를 재활용하여 자원을 순환합니다.',
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
      { id: '01', title: '준비 및 슬라이싱', desc: '프린트 베드가 깨끗한지 확인하세요. 표준 품질은 0.4mm 노즐, 빠른 초안은 0.6mm를 사용하세요. 슬라이서 설정에서 "Vase Mode"(나선형 외곽선)를 활성화하세요.', tip: '레이어 접착력을 높이려면 유량을 5% 늘리세요.', imageUrl: 'https://images.unsplash.com/photo-1588508065123-287b28e013da?w=800&auto=format&fit=crop' },
      { id: '02', title: '프린팅', desc: '첫 번째 레이어를 주의 깊게 모니터링하세요. 현무암 질감은 레이어 라인을 잘 숨기지만 일관성이 중요합니다. rPETG 권장 온도는 240°C입니다.', imageUrl: 'https://images.unsplash.com/photo-1567789884554-0b844b597180?w=800&auto=format&fit=crop' },
      { id: '03', title: '후가공', desc: '히트 건으로 거미줄 현상을 제거하세요. 방수가 중요하다면 내부에 에폭시 수지나 특수 실런트를 얇게 코팅하세요.', imageUrl: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=800&auto=format&fit=crop' },
      { id: '04', title: '조립', desc: '본체 아래에 받침대를 놓으세요. 흙을 채우고 좋아하는 식물을 심으세요.', imageUrl: 'https://images.unsplash.com/photo-1466781783364-36c955e42a7f?w=800&auto=format&fit=crop' }
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
      { id: '02', title: 'Printing', desc: 'Monitor the first layer closely. The basalt texture hides layer lines well, but consistency is key. Recommended temperature for rPETG is 240°C.', imageUrl: 'https://images.unsplash.com/photo-1567789884554-0b844b597180?w=800&auto=format&fit=crop' },
      { id: '03', title: 'Post-Processing', desc: 'Remove stringing with a heat gun. If water-tightness is critical, coat the interior with a thin layer of epoxy resin or a specialized sealant.', imageUrl: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=800&auto=format&fit=crop' },
      { id: '04', title: 'Assembly', desc: 'Place the saucer under the main body. Fill with soil and your favorite plant.', imageUrl: 'https://images.unsplash.com/photo-1466781783364-36c955e42a7f?w=800&auto=format&fit=crop' }
    ],
    footer: '© 2024 Project Cyclical. Open Sustainable Design.',
    handmade: 'Handmade',
    isAi: 'AI Generated'
  }
};

type ViewMode = 'default' | '3d' | 'blueprint';

const ProjectDetail: React.FC<ProjectDetailProps> = ({
  onBack, onOpenWorkspace, language, project, user, onLoginClick, onNavigate, onLikeToggle, onViewIncrement, likedProjects,
  userTokens, onDeductTokens
}) => {
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

  // State for Additional Blueprints
  const [generatingBlueprint, setGeneratingBlueprint] = useState<'detailed' | 'mechanical' | null>(null);
  const [additionalBlueprints, setAdditionalBlueprints] = useState<{ detailed?: string; mechanical?: string }>({});

  // Full Screen Image State
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
  const [show3DModal, setShow3DModal] = useState(false);



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
        const proxyUrl = `${config.supabase.url}/functions/v1/tripo-file-proxy?url=${encodeURIComponent(tripoUrl)}`;
        const proxyResp = await fetch(proxyUrl);
        if (!proxyResp.ok) throw new Error(`Failed to download model from proxy: ${proxyResp.statusText}`);
        const blob = await proxyResp.blob();

        // 3. Upload to R2
        const file = new File([blob], 'copilot_gen.glb', { type: 'model/gltf-binary' });
        const r2Url = await uploadToR2(file, `models/${user?.id || 'anon'}`);

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
            const { data, error } = await supabase
              .from('items')
              .select('*') // Select all to check owner_id
              .eq('id', project.id)
              .single();

            if (data && !error) {
              // Sync metadata
              if (data.metadata) {
                setSyncedMetadata(data.metadata);
              }

              // Access Control: Only Owner can see additional blueprints
              const isOwner = user?.id === data.owner_id;

              if (isOwner && data.metadata?.additional_blueprints) {
                setAdditionalBlueprints(data.metadata.additional_blueprints);
              } else {
                setAdditionalBlueprints({}); // Hide if not owner
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
    const imageUrls = [...displayImages, ...Object.values(additionalBlueprints)];

    // Add images to zip
    await Promise.all(imageUrls.map(async (url, index) => {
      try {
        let response;
        try {
          response = await fetch(url, { mode: 'cors' });
          if (!response.ok) throw new Error('Network response was not ok');
        } catch (err) {
          const baseUrl = import.meta.env.DEV ? 'https://jejuremaker.pages.dev' : '';
          const proxyUrl = `${baseUrl}/api/tripo-proxy?url=${encodeURIComponent(url)}`;
          response = await fetch(proxyUrl);
        }

        const blob = await response.blob();
        // Determine name
        let name = `image_${index + 1}.png`;
        if (url === blueprintUrl) name = `blueprint_production.png`;
        if (url === additionalBlueprints.detailed) name = `blueprint_detailed.png`;
        if (url === additionalBlueprints.mechanical) name = `blueprint_mechanical.png`;

        folder?.file(name, blob);
      } catch (e) {
        console.error("Failed to add image to zip", e);
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
  const displayImage = project?.image || 'https://lh3.googleusercontent.com/aida-public/AB6AXuDfv7rlXQezFNRd55ViDyVQxZHy5hmFeJRXuYnIhyBrqgo6LsrhVYeZKMz0Mhkh3SM8YgXWYE8qI8_RMrYNIAEJKuWxoO9Wo2s-xMLQKI7o6W0Jfaw_ASJFO3TLZHM35y9JiY1bjQqF-zcsSKoW9Wo2s-xMLQKI7o6W0Jfaw_ASJFO3TLZHM35y9JiY1bjQqF-zcsSKoVkW980qHM3rsSDBkRaH6xYmQehOScGrNFCt7L78QxSK__Ljxwcv05op5YxYRS3fRAQLmMyiiiQ5-rMV71Mh-zSiVnCOO856cB0S6IrvFPabp6DIRjOMalBsw9bno';

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

  const additionalBlueprintList = [additionalBlueprints.detailed, additionalBlueprints.mechanical].filter(Boolean) as string[];
  const allViewableImages = [...displayImages, ...additionalBlueprintList];

  const currentDisplayImage = allViewableImages[selectedImageIndex] || displayImage;

  // Logic: Generating Additional Blueprint
  const handleGenerateAdditionalBlueprint = async (type: 'detailed' | 'mechanical') => {
    // Access Control: Only valid owner can generate
    if (!user || user.id !== project?.ownerId) {
      alert(language === 'ko' ? '작성자만 도면을 생성할 수 있습니다.' : 'Only the author can generate blueprints.');
      return;
    }

    const cost = type === 'detailed' ? 5 : 10;
    if (userTokens < cost) {
      alert(`토큰이 부족합니다. (필요: ${cost}, 보유: ${userTokens})`);
      return;
    }

    if (!confirm(`${type === 'detailed' ? '제품 상세도' : '기구 설계도'}를 생성하시겠습니까?\n${cost} 토큰이 차감됩니다.`)) return;

    onDeductTokens(cost);
    setGeneratingBlueprint(type);

    try {
      // Use the Concept Image (displayImages[0] usually) as the Anchor
      // Wait, displayImages[0] might be the final render. Ideally we use the "Concept" image.
      // For now, using the main project image as reference is safe.
      const anchorImage = displayImages[0] || displayImage;

      // Context: Use current recipe or description
      const context = currentRecipe;

      const bp = await aiService.generateBlueprintImage(context, anchorImage, type);

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

    } catch (e) {
      console.error(e);
      alert("도면 생성 실패. 토큰은 반환됩니다.");
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
      alert(language === 'ko' ? '작성자만 3D 모델을 생성할 수 있습니다.' : 'Only the author can generate 3D models.');
      return;
    }

    // Check if model already exists (optional, maybe allow regeneration?)
    if (model3DUrl) {
      if (!confirm(language === 'ko' ? '이미 3D 모델이 존재합니다. 다시 생성하시겠습니까?' : '3D model already exists. Generate again?')) return;
    }

    const cost = 20;
    if (userTokens < cost) {
      alert(`토큰이 부족합니다. (필요: ${cost}, 보유: ${userTokens})`);
      return;
    }

    if (!confirm(language === 'ko' ? `3D 모델을 생성하시겠습니까?\n${cost} 토큰이 차감됩니다.` : `Generate 3D Model?\n${cost} tokens will be deducted.`)) return;

    onDeductTokens(cost);
    setGenerating3D(true);

    try {
      // Use the Concept Image (displayImages[0] or displayImage)
      const anchorImage = displayImages[0] || displayImage;
      const context = currentRecipe; // Use the recipe/description

      // 1. Generate via Tripo (using aiService)
      // Note: aiService.generate3DModel returns the task result URL (Tripo URL)
      // We need to proxy and upload to R2 to avoid CORS and persistence issues.
      const tripoUrl = await aiService.generate3DModel(anchorImage); // Corrected: Pass image URL/File appropriately.
      // aiService.generate3DModel expects (imageUrl) or (file)?
      // Let's assume it accepts the image URL string. If not, we might need a Blob.
      // Checking aiService usage in WizardModal: generate3DModel(selectedImage) where selectedImage is string (base64/url)

      // 2. Proxy & Upload to R2
      // Using the same logic as in Copilot/Wizard
      // 2. Proxy & Upload to R2
      // Use Supabase Edge Function Proxy (same as ThreeDViewer)
      const proxyUrl = `${config.supabase.url}/functions/v1/tripo-file-proxy?url=${encodeURIComponent(tripoUrl)}`;
      const proxyResp = await fetch(proxyUrl);
      if (!proxyResp.ok) throw new Error(`Failed to download model from proxy: ${proxyResp.statusText}`);
      const blob = await proxyResp.blob();

      const file = new File([blob], 'model.glb', { type: 'model/gltf-binary' });
      const r2Url = await uploadToR2(file, `models/${user.id}`);

      // 3. Update Sync Metadata
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

      alert(language === 'ko' ? '3D 모델이 생성되었습니다!' : '3D Model Generated!');
      setViewMode('3d'); // Switch to 3D view

    } catch (e) {
      console.error(e);
      alert(language === 'ko' ? '3D 생성 실패. 토큰은 반환됩니다.' : 'Generation failed. Tokens refunded.');
      onDeductTokens(-cost);
    } finally {
      setGenerating3D(false);
    }
  };

  return (
    <>
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
              Drag to Rotate • Scroll to Zoom
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
      <div className="max-w-7xl mx-auto py-6 lg:py-12 px-4 sm:px-6 lg:px-0 relative">
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
                    3D Preview • Drag to Rotate • Scroll to Zoom
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
                  <img
                    src={currentDisplayImage}
                    alt={displayTitle}
                    className="w-full h-full object-cover transition-all duration-500 cursor-zoom-in"
                    onClick={() => setFullScreenImage(currentDisplayImage)}
                  />

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
                          'MECHANICAL DRAWING'}
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
                    className={`relative w-24 h-24 rounded-xl overflow-hidden border-2 shadow-sm flex-shrink-0 transition-transform hover:scale-105 ${viewMode === 'default' && currentDisplayImage === imgUrl ? 'border-primary ring-2 ring-primary/30' : 'border-transparent'}`}
                  >
                    <img src={imgUrl} alt={`Image ${index + 1}`} className="w-full h-full object-cover" />
                    {imgUrl === blueprintUrl && (
                      <div className="absolute inset-x-0 bottom-0 bg-black/50 text-white text-[10px] text-center py-0.5">도면</div>
                    )}
                  </button>
                ))}

                {/* 2. Detailed Blueprint (Locked or Viewed) - Only show if Owner OR if (hypothetically) public */}
                {(user && user.id === project?.ownerId) && (
                  additionalBlueprints.detailed ? (
                    <button
                      key="detailed-bp"
                      onClick={() => {
                        setViewMode('default');
                        // Find index of this image in allViewableImages
                        const idx = allViewableImages.indexOf(additionalBlueprints.detailed!);
                        setSelectedImageIndex(idx);
                      }}
                      className={`relative w-24 h-24 rounded-xl overflow-hidden border-2 shadow-sm flex-shrink-0 transition-transform hover:scale-105 ${viewMode === 'default' && currentDisplayImage === additionalBlueprints.detailed ? 'border-primary ring-2 ring-primary/30' : 'border-transparent'}`}
                    >
                      <img src={additionalBlueprints.detailed} className="w-full h-full object-cover" />
                      <div className="absolute inset-x-0 bottom-0 bg-blue-600/80 text-white text-[10px] text-center py-0.5">상세도</div>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleGenerateAdditionalBlueprint('detailed')}
                      disabled={!!generatingBlueprint}
                      className="relative w-24 h-24 rounded-xl overflow-hidden border-2 border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800 flex-shrink-0 hover:bg-gray-100 dark:hover:bg-gray-700 transition group"
                    >
                      {generatingBlueprint === 'detailed' ? (
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                      ) : (
                        <>
                          <span className="material-icons-round text-gray-500 mb-1 group-hover:text-primary transition-colors text-xl">lock</span>
                          <span className="text-xs text-gray-700 dark:text-gray-300 font-bold mb-0.5">상세도</span>
                          <span className="text-[10px] text-white bg-primary px-1.5 py-0.5 rounded-full font-black shadow-sm flex items-center gap-0.5">
                            <span className="material-icons-round text-[12px]">recycling</span>
                            5 Token
                          </span>
                        </>
                      )}
                    </button>
                  )
                )}

                {/* 3. Mechanical Blueprint (Locked or Viewed) - Only show if Owner */}
                {(user && user.id === project?.ownerId) && (
                  additionalBlueprints.mechanical ? (
                    <button
                      key="mechanical-bp"
                      onClick={() => {
                        setViewMode('default');
                        const idx = allViewableImages.indexOf(additionalBlueprints.mechanical!);
                        setSelectedImageIndex(idx);
                      }}
                      className={`relative w-24 h-24 rounded-xl overflow-hidden border-2 shadow-sm flex-shrink-0 transition-transform hover:scale-105 ${viewMode === 'default' && currentDisplayImage === additionalBlueprints.mechanical ? 'border-primary ring-2 ring-primary/30' : 'border-transparent'}`}
                    >
                      <img src={additionalBlueprints.mechanical} className="w-full h-full object-cover" />
                      <div className="absolute inset-x-0 bottom-0 bg-indigo-600/80 text-white text-[10px] text-center py-0.5">설계도</div>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleGenerateAdditionalBlueprint('mechanical')}
                      disabled={!!generatingBlueprint}
                      className="relative w-24 h-24 rounded-xl overflow-hidden border-2 border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800 flex-shrink-0 hover:bg-gray-100 dark:hover:bg-gray-700 transition group"
                    >
                      {generatingBlueprint === 'mechanical' ? (
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                      ) : (
                        <>
                          <span className="material-icons-round text-gray-500 mb-1 group-hover:text-primary transition-colors text-xl">lock</span>
                          <span className="text-xs text-gray-700 dark:text-gray-300 font-bold mb-0.5">기구설계</span>
                          <span className="text-[10px] text-white bg-primary px-1.5 py-0.5 rounded-full font-black shadow-sm flex items-center gap-0.5">
                            <span className="material-icons-round text-[12px]">recycling</span>
                            10 Token
                          </span>
                        </>
                      )}
                    </button>
                  )
                )}

                {/* 3D 뷰어 썸네일 */}
                {model3DUrl && (
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
                {model3DUrl ? (
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
                  (user && user.id === project?.ownerId) && (
                    <button
                      onClick={handleGenerate3DModel}
                      disabled={generating3D}
                      className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-5 py-3 rounded-xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors text-sm font-bold shadow-sm"
                    >
                      {generating3D ? (
                        <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <span className="material-icons-round text-lg">recycling</span>
                      )}
                      <span>{language === 'ko' ? '3D 생성 (20T)' : 'Generate 3D (20T)'}</span>
                    </button>
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
                      {(project?.tools || '기본 공구').split(',').map((tool, i) => (
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
                      <span className="text-sm font-bold text-gray-800 dark:text-gray-200">{project?.material || t.plastic}</span>
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
                  <span className="px-2.5 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-semibold rounded-md uppercase tracking-wide">{project?.material || t.plastic}</span>
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

                {/* Dynamic Data Binding */}
                {(() => {
                  const ecoData = syncedMetadata?.eco_validation || (project as any)?.metadata?.eco_validation || (project as any)?.metadata?.eco_impact;
                  const grade = ecoData?.grade || ecoData?.score || 'B';
                  const scoreVal = ecoData?.recalculated_eco_score || (project as any)?.co2_reduction || 1.2;
                  const material = (project?.material || '').toLowerCase();
                  const isCardboard = material.includes('cardboard') || material.includes('paper') || material.includes('골판지') || material.includes('종이');
                  const defaultImpact = isCardboard ? t.impactDescCardboard : t.impactDesc;

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
                          <span className="font-bold text-green-900 dark:text-green-400">-{Number(scoreVal).toFixed(2)}kg CO₂e</span>
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
                  onClick={handleConnectMaker}
                  className={`w-full py-4 px-6 text-white rounded-xl font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center space-x-2
                       ${isAiProject ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-gray-900 dark:bg-white dark:text-gray-900'}
                    `}
                >
                  <span>{isAiProject ? t.connectAI : t.findMaker}</span>
                  <span className="material-icons-round text-sm">{isAiProject ? 'smart_toy' : 'arrow_forward'}</span>
                </button>
                {/* Advanced Download Dropdown */}
                <div className="relative group z-30 w-full">
                  <button
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
                            alert(t.noFiles);
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
                          alert(t.noFiles);
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

                  {step.imageUrl && (
                    <div className="mb-4 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 shadow-sm max-w-2xl group/stepimg relative bg-gray-50 dark:bg-gray-900">
                      <img
                        src={step.imageUrl}
                        alt={step.title}
                        className="w-full h-auto object-contain transition-transform duration-500 hover:scale-105 cursor-zoom-in"
                        onClick={() => setFullScreenImage(step.imageUrl)}
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