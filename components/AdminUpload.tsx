import React, { useState, useEffect } from 'react';
import {
  UploadCloud,
  Save,
  Image as ImageIcon,
  Loader2,
  HardDrive,
  Settings,
  ArrowUpRight,
  Clock,
  Hammer,
  ChevronRight,
  PlusCircle,
  X,
  Lightbulb,
  Recycle,
  Users,
  Info,
  Box,
  FileBox,
  Trash2,
  AlertTriangle,
  Sparkles
} from 'lucide-react';
import { SupabaseClient } from '@supabase/supabase-js';
import { Project } from '../types';
import { Language } from '../contexts/ThemeContext';
import { useToast } from '../contexts/ToastContext';

// --- Cloudflare R2 Configuration ---
import { config } from '../services/config';
import { uploadToR2, isR2Configured as checkR2Config } from '../services/r2Storage';
import { verifyEcoScore } from '../services/aiService';

// Max file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

interface AdminUploadProps {
  supabase: SupabaseClient;
  onBack: () => void;
  onUploadComplete: (project: Project) => void;
  language: Language;
  user: any;
  onSelectProject: (project: Project) => void;
  initialProject?: Project | null;
}

const MATERIAL_OPTIONS = [
  { label: '폐데님 (청바지)', value: 'Old Denim Jeans', unit: 'ea' },
  { label: '폐플라스틱 (PET병)', value: 'Plastic Bottles (PET)', unit: 'ea' },
  { label: '폐목재 (파렛트)', value: 'Discarded Wood Pallets', unit: 'kg' },
  { label: '유리병', value: 'Glass Bottles', unit: 'ea' },
  { label: '커피박 (커피찌꺼기)', value: 'Coffee Grounds', unit: 'kg' },
  { label: '골판지 (택배박스)', value: 'Cardboard', unit: 'kg' },
  { label: '폐HDPE (병뚜껑 등)', value: 'Waste Plastic (HDPE)', unit: 'g' }
];

const resolveMaterialValue = (rawMaterial: string): string => {
  if (!rawMaterial) return MATERIAL_OPTIONS[0].value;
  const lower = rawMaterial.toLowerCase();
  if (MATERIAL_OPTIONS.some(opt => opt.value === rawMaterial)) return rawMaterial;
  if (lower.includes('데님') || lower.includes('청바지') || lower.includes('denim') || lower.includes('jean')) return 'Old Denim Jeans';
  if (lower.includes('pet') || lower.includes('플라스틱') || lower.includes('plastic') || lower.includes('페트')) return 'Plastic Bottles (PET)';
  if (lower.includes('목재') || lower.includes('나무') || lower.includes('wood') || lower.includes('파렛') || lower.includes('pallet')) return 'Discarded Wood Pallets';
  if (lower.includes('유리') || lower.includes('glass') || lower.includes('병')) return 'Glass Bottles';
  if (lower.includes('커피') || lower.includes('coffee')) return 'Coffee Grounds';
  if (lower.includes('골판지') || lower.includes('cardboard') || lower.includes('박스')) return 'Cardboard';
  if (lower.includes('hdpe') || lower.includes('병뚜껑') || lower.includes('플라스틱')) return 'Waste Plastic (HDPE)';
  return MATERIAL_OPTIONS[0].value;
};

const inferProcessingMethod = (steps: any[]): string => {
  if (!Array.isArray(steps) || steps.length === 0) return '';
  const allText = steps.map((s: any) => `${s.title || ''} ${s.desc || s.description || ''}`).join(' ').toLowerCase();
  if (allText.includes('열') || allText.includes('가열') || allText.includes('heat') || allText.includes('용해') || allText.includes('녹')) return 'heat';
  if (allText.includes('재단') || allText.includes('절단') || allText.includes('자르') || allText.includes('cut') || allText.includes('가위')) return 'cut';
  if (allText.includes('접착') || allText.includes('화학') || allText.includes('chem')) return 'chem';
  if (allText.includes('조립') || allText.includes('결합') || allText.includes('바느질') || allText.includes('재봉')) return 'manual';
  return '';
};

const TRANSLATIONS = {
  ko: {
    sidebar: {
      upload: '자산 업로드',
      inventory: '인벤토리',
      users: '사용자',
      settings: '설정',
      superAdmin: '슈퍼 관리자'
    },
    header: {
      uploadTitle: '새 프로젝트 가이드',
      uploadDesc: '새로운 업사이클링 프로젝트 가이드와 제작 단계를 만드세요.',
      inventoryTitle: '자산 인벤토리',
      inventoryDesc: '데이터베이스에 등록된 모든 자산을 관리하고 조회합니다.',
      saveDraft: '초안 저장',
      publish: '저장 및 게시',
      publishing: '게시 중...'
    },
    basicInfo: {
      title: '기본 정보',
      projectTitle: '프로젝트 제목',
      projectTitlePlaceholder: '예: 업사이클 데님 토트백',
      material: '재료 출처',
      time: '예상 제작 시간',
      timePlaceholder: '예: 2시간',
      category: '카테고리',
      tools: '필요 도구',
      toolsPlaceholder: '예: 3D 프린터, 열풍기',
      difficulty: '난이도',
      modelFile: '제작 파일 (3D 모델 / 2D 도면)',
      modelDragDrop: '파일들을 여기로 드래그하거나 클릭하세요',
      modelFormats: '.STL, .GLB, .DXF, .DWG, .PDF (파일당 최대 10MB)',
      diffLevels: {
        Easy: '쉬움',
        Medium: '보통',
        Hard: '어려움'
      }
    },
    steps: {
      title: '제작 단계',
      dynamic: '다이내믹 가이드',
      stepTitle: '단계 제목',
      descPlaceholder: '제작 동작을 명확하게 설명하세요...',
      expertTip: '전문가 팁',
      tipPlaceholder: '이 단계에 유용한 팁을 추가하세요...',
      addStep: '제작 단계 추가'
    },
    visuals: {
      title: '시각 자료',
      dragDrop: '커버 이미지를 클릭하거나 드래그하세요',
      formats: 'SVG, PNG, JPG 또는 GIF (최대 800x400px)',
      selectImage: '이미지를 선택해주세요.'
    },
    alert: {
      success: '✅ 성공: 프로젝트가 저장되었습니다.',
      error: '❌ 오류: ',
      bucketError: '⚠️ 버킷 오류: "item-images" 버킷을 찾을 수 없습니다.',
      policyError: '⛔ 권한 오류: 업로드 권한이 없습니다. Supabase Storage > Policies 탭에서 INSERT 정책을 추가해주세요.',
      sizeError: '⚠️ 파일 크기 초과: 10MB 이하의 파일만 업로드 가능합니다.',
      r2ConfigError: '⚠️ R2 설정 필요: 코드 상단에 Cloudflare R2 키를 입력해주세요.',
      r2UploadError: '⚠️ R2 업로드 오류: '
    },
    inventory: {
      noItems: '인벤토리에 항목이 없습니다.'
    }
  },
  en: {
    sidebar: {
      upload: 'Asset Upload',
      inventory: 'Inventory',
      users: 'Users',
      settings: 'Settings',
      superAdmin: 'Super Admin'
    },
    header: {
      uploadTitle: 'New Project Guide',
      uploadDesc: 'Create a new upcycling project guide and fabrication steps.',
      inventoryTitle: 'Asset Inventory',
      inventoryDesc: 'Manage and view all registered assets in the database.',
      saveDraft: 'Save Draft',
      publish: 'Save & Publish',
      publishing: 'Publishing...'
    },
    basicInfo: {
      title: 'Basic Information',
      projectTitle: 'Project Title',
      projectTitlePlaceholder: 'e.g., Upcycled Denim Tote Bag',
      material: 'Material Source',
      time: 'Est. Fabrication Time',
      timePlaceholder: 'e.g. 2 hours',
      category: 'Category',
      tools: 'Required Tools',
      toolsPlaceholder: 'e.g. 3D Printer, Heat Gun',
      difficulty: 'Difficulty Level',
      modelFile: 'Fabrication File (3D/2D Drawings)',
      modelDragDrop: 'Drag & drop fabrication files here',
      modelFormats: '.STL, .GLB, .DXF, .DWG, .PDF (Max 10MB each)',
      diffLevels: {
        Easy: 'Easy',
        Medium: 'Medium',
        Hard: 'Hard'
      }
    },
    steps: {
      title: 'Fabrication Steps',
      dynamic: 'Dynamic Guide',
      stepTitle: 'Step Title',
      descPlaceholder: 'Describe the fabrication action clearly...',
      expertTip: 'Expert Tip',
      tipPlaceholder: 'Add a helpful tip regarding this step...',
      addStep: 'Add Fabrication Step'
    },
    visuals: {
      title: 'Visual Assets',
      dragDrop: 'Click or drag cover image here',
      formats: 'SVG, PNG, JPG or GIF (max. 800x400px)',
      selectImage: 'Please select an image.'
    },
    alert: {
      success: '✅ Success: Project saved.',
      error: '❌ Error: ',
      bucketError: '⚠️ Bucket Error: "item-images" bucket not found.',
      policyError: '⛔ Permission Error: No upload access. Add an INSERT policy in Supabase Storage > Policies.',
      sizeError: '⚠️ File too large: Max file size is 10MB.',
      r2ConfigError: '⚠️ R2 Config Required: Please enter Cloudflare R2 keys at the top of the code.',
      r2UploadError: '⚠️ R2 Upload Error: '
    },
    inventory: {
      noItems: 'No items found in inventory.'
    }
  }
};

const DROPDOWN_TRANSLATIONS = {
  ko: {
    materials: {
      'Old Denim Jeans': '폐데님 (청바지)',
      'Plastic Bottles (PET)': '폐플라스틱 (PET병)',
      'Discarded Wood Pallets': '폐목재 (파렛트)',
      'Glass Bottles': '유리병',
      'Coffee Grounds': '커피박 (커피찌꺼기)',
      'Cardboard': '골판지 (택배박스)',
      'Waste Plastic (HDPE)': '폐HDPE (병뚜껑 등)'
    },
    processing: {
      '': '가공 방식 선택 (선택사항)',
      'heat': '열 가공 (Melting/Ironing)',
      'cut': '절단/조립 (Cutting/Assembly)',
      'chem': '화학적 처리 (Chemical)',
      'manual': '수작업 (Manual Only)'
    },
    categories: [
      { label: '가구 (Furniture)', value: 'furniture' },
      { label: '홈 데코 (Home Decor)', value: 'home_decor' },
      { label: '조명 (Lighting)', value: 'lighting' },
      { label: '주방 (Kitchen)', value: 'kitchen' },
      { label: '패션 (Fashion)', value: 'fashion' },
      { label: '예술 (Art)', value: 'art' },
      { label: '기타 (Others)', value: 'others' }
    ],
    sourcePlaceholder: '예: 제주 시청 클린하우스, 함덕 해변 (구체적일수록 신뢰도 상승)'
  },
  en: {
    materials: {
      'Old Denim Jeans': 'Old Denim Jeans',
      'Plastic Bottles (PET)': 'Plastic Bottles (PET)',
      'Discarded Wood Pallets': 'Discarded Wood Pallets',
      'Glass Bottles': 'Glass Bottles',
      'Coffee Grounds': 'Coffee Grounds',
      'Cardboard': 'Cardboard',
      'Waste Plastic (HDPE)': 'Waste Plastic (HDPE)'
    },
    processing: {
      '': 'Select Method (Optional)',
      'heat': 'Heat Processing (Melting/Ironing)',
      'cut': 'Cutting/Assembly',
      'chem': 'Chemical Processing',
      'manual': 'Manual Only'
    },
    categories: [
      { label: 'Furniture', value: 'furniture' },
      { label: 'Home Decor', value: 'home_decor' },
      { label: 'Lighting', value: 'lighting' },
      { label: 'Kitchen', value: 'kitchen' },
      { label: 'Fashion', value: 'fashion' },
      { label: 'Art', value: 'art' },
      { label: 'Others', value: 'others' }
    ],
    sourcePlaceholder: 'e.g. Jeju City Hall, Hamdeok Beach (Specific location increases reliability)'
  }
};

const AdminUpload: React.FC<AdminUploadProps> = ({ supabase, onBack, onUploadComplete, language, user, onSelectProject, initialProject }) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('upload');
  const [inventory, setInventory] = useState([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [modelFiles, setModelFiles] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [existingModels, setExistingModels] = useState<any[]>([]);
  const [aiImageEntries, setAiImageEntries] = useState<{ key: string; url: string; label: string }[]>([]);
  const [isR2Configured, setIsR2Configured] = useState(false);
  const [userNickname, setUserNickname] = useState<string>('');
  const [ecoValidation, setEcoValidation] = useState<any>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const t = TRANSLATIONS[language];
  const t_dropdown = DROPDOWN_TRANSLATIONS[language];

  const [formData, setFormData] = useState({
    title: '',
    material: 'Old Denim Jeans',
    materialQty: '1',
    materialUnit: 'kg',
    sourceLocation: '',
    category: 'Furniture',
    difficulty: 'Intermediate',
    co2: '1.2',
    time: '',
    isAI: false,
    tools: '',
    processingMethod: '',
    steps: [
      { title: '', desc: '', tip: '', imageFile: null as File | null, imageUrl: '' }
    ]
  });

  useEffect(() => {
    if (initialProject) {
      try {
        let parsedSteps = [{ title: '', desc: '', tip: '', imageFile: null as File | null, imageUrl: '' }];
        const rawSteps1 = initialProject.steps;
        const rawSteps2 = (initialProject.metadata as any)?.fabrication_guide;
        const rawSteps3 = (initialProject.metadata as any)?.guide?.steps;
        let targetSteps = null;
        if (Array.isArray(rawSteps1) && rawSteps1.length > 0) targetSteps = rawSteps1;
        else if (Array.isArray(rawSteps2) && rawSteps2.length > 0) targetSteps = rawSteps2;
        else if (Array.isArray(rawSteps3) && rawSteps3.length > 0) targetSteps = rawSteps3;
        
        if (targetSteps) {
            parsedSteps = targetSteps.map((step: any) => ({
                title: step?.title || step?.step || '',
                desc: step?.desc || step?.description || step?.text || '',
                tip: step?.tip || '',
                imageFile: null,
                imageUrl: step?.imageUrl || step?.image || ''
            }));
        }

        setFormData({
            title: initialProject.title || '',
            material: resolveMaterialValue(initialProject.material || (initialProject.metadata as any)?.material || ''),
            materialQty: (initialProject.metadata as any)?.material_qty || '1',
            materialUnit: (initialProject.metadata as any)?.material_unit || 'ea',
            sourceLocation: (initialProject.metadata as any)?.source_location || '',
            category: initialProject.category || 'fashion',
            difficulty: initialProject.difficulty || 'Intermediate',
            co2: initialProject.ecoScore || (initialProject.metadata as any)?.eco_score || '1.2',
            time: initialProject.time || '2h',
            isAI: user?.email === 'Master Kim' ? false : (initialProject.isAiRemix || initialProject.isAiIdea || false),
            tools: initialProject.tools || (initialProject.metadata as any)?.tools || '',
            processingMethod: (initialProject.metadata as any)?.processing_method || inferProcessingMethod(targetSteps || []),
            steps: parsedSteps
        });
        
        const meta = initialProject.metadata as any;
        const seenUrls = new Set<string>();
        const entries: any[] = [];
        if (Array.isArray(meta?.images)) {
          meta.images.forEach((url: string, idx: number) => {
            if (url && !seenUrls.has(url)) { seenUrls.add(url); entries.push({ key: `img_${idx}`, url, label: idx === 0 ? '컨셉 이미지' : '도면' }); }
          });
        }
        setAiImageEntries(entries);
        if (initialProject.images && initialProject.images.length > 0) setExistingImages(initialProject.images);
        else if (initialProject.image) setExistingImages([initialProject.image]);
        if (initialProject.modelFiles) setExistingModels(initialProject.modelFiles);
        if ((initialProject.metadata as any)?.eco_validation) setEcoValidation((initialProject.metadata as any).eco_validation);
      } catch (err) {
        console.error("Critical error while parsing initial project data for editing:", err);
      }
    }
  }, [initialProject, user]);

  const handleVerifyEco = async () => {
    if (!formData.title || !formData.material || !formData.steps[0].desc) {
      showToast("분석을 위해 프로젝트 제목, 재료, 그리고 최소 1개의 제작 단계를 입력해주세요.", 'warning');
      return;
    }
    setIsVerifying(true);
    try {
      const result = await verifyEcoScore({
        title: formData.title,
        material: formData.material,
        qty: `${formData.materialQty}${formData.materialUnit}`,
        location: formData.sourceLocation || 'Unknown',
        steps: formData.steps
      });
      setEcoValidation(result);
    } catch (e) {
      console.error(e);
      showToast("분석 중 오류가 발생했습니다.", 'error');
    } finally {
      setIsVerifying(false);
    }
  };

  useEffect(() => {
    if (checkR2Config()) setIsR2Configured(true);
  }, []);

  useEffect(() => {
    const fetchUserNickname = async () => {
      if (!user) { setUserNickname(''); return; }
      try {
        const { data: profile } = await supabase.from('user_profiles').select('nickname').eq('user_id', user.id).maybeSingle();
        if (profile?.nickname) setUserNickname(profile.nickname);
        else setUserNickname(user.user_metadata?.full_name || user.email?.split('@')[0] || 'Maker');
      } catch (err) {
        setUserNickname(user.user_metadata?.full_name || user.email?.split('@')[0] || 'Maker');
      }
    };
    fetchUserNickname();
  }, [user, supabase]);

  const fetchInventory = async () => {
    try {
      const { data, error } = await supabase.from('items').select('id, title, image_url, category, difficulty, created_at, is_public, owner_id, likes, views').neq('category', 'Social').order('created_at', { ascending: false }).limit(50);
      if (error) throw error;
      if (data) setInventory(data);
    } catch (error) {
      console.error("Fetch Error:", error);
    }
  };

  useEffect(() => {
    if (activeTab === 'inventory') fetchInventory();
  }, [activeTab]);

  const addStep = () => {
    setFormData({ ...formData, steps: [...formData.steps, { title: '', desc: '', tip: '', imageFile: null as File | null, imageUrl: '' }] });
  };

  const removeStep = (index: number) => {
    const newSteps = formData.steps.filter((_, i) => i !== index);
    setFormData({ ...formData, steps: newSteps });
  };

  const updateStep = (index: number, field: string, value: any) => {
    const newSteps = [...formData.steps];
    (newSteps[index] as any)[field] = value;
    if (index === newSteps.length - 1) {
      const currentStep = newSteps[index];
      if (currentStep.title.trim() !== '' && currentStep.desc.trim() !== '') {
        newSteps.push({ title: '', desc: '', tip: '', imageFile: null, imageUrl: '' });
      }
    }
    setFormData({ ...formData, steps: newSteps });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles: File[] = Array.from(e.target.files as FileList);
      setImageFiles(prev => [...prev, ...newFiles]);
      const newUrls = newFiles.map(file => URL.createObjectURL(file));
      setPreviewUrls(prev => [...prev, ...newUrls]);
    }
  };

  const removeExistingImage = (index: number) => setExistingImages(prev => prev.filter((_, i) => i !== index));
  const removeImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleModelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const validFiles = Array.from(e.target.files as FileList).filter(file => {
        if (file.size > MAX_FILE_SIZE) { showToast(`${t.alert.sizeError} (${file.name})`, 'warning'); return false; }
        return true;
      });
      setModelFiles(prev => [...prev, ...validFiles]);
    }
  };

  const removeModelFile = (index: number) => setModelFiles(prev => prev.filter((_, i) => i !== index));
  const removeExistingModel = (index: number) => setExistingModels(prev => prev.filter((_, i) => i !== index));

  const optimizeImage = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const MAX_WIDTH = 1920;
        if (width > MAX_WIDTH) { height = Math.round((height * MAX_WIDTH) / width); width = MAX_WIDTH; }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error('Canvas context failed')); return; }
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => {
          if (!blob) { reject(new Error('Image compression failed')); return; }
          const fileName = file.name.replace(/\.[^/.]+$/, "") + ".webp";
          resolve(new File([blob], fileName, { type: 'image/webp', lastModified: Date.now() }));
        }, 'image/webp', 0.85);
      };
      img.onerror = (error) => reject(error);
    });
  };

  const handleMaterialChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value;
    const option = MATERIAL_OPTIONS.find(opt => opt.value === selectedValue);
    setFormData({ ...formData, material: selectedValue, materialUnit: option ? option.unit : 'kg' });
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (imageFiles.length === 0 && existingImages.length === 0) { showToast(t.visuals.selectImage, 'warning'); return; }
    setLoading(true);
    try {
      const uploadedImageUrls: string[] = [];
      for (const imageFile of imageFiles) {
        const optimizedFile = await optimizeImage(imageFile);
        const url = await uploadToR2(optimizedFile, 'images');
        uploadedImageUrls.push(url);
      }
      const survivingUrlSet = new Set([...aiImageEntries.map(e => e.url), ...existingImages]);
      const originalMetaImages: string[] = (initialProject?.metadata as any)?.images || existingImages || [];
      const savedMainImages = [...originalMetaImages.filter(u => survivingUrlSet.has(u)), ...uploadedImageUrls];
      const finalImageUrl = savedMainImages.length > 0 ? savedMainImages[0] : (initialProject?.image || 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80');

      const uploadedModels = [];
      for (const file of modelFiles) {
        const url = await uploadToR2(file, 'models');
        uploadedModels.push({ name: file.name, size: file.size, type: file.type, url });
      }
      const allModelFiles = [...existingModels, ...uploadedModels];

      const processedSteps = await Promise.all(formData.steps.map(async (step) => {
        let finalStepImageUrl = step.imageUrl;
        if (step.imageFile) finalStepImageUrl = await uploadToR2(step.imageFile, 'steps');
        return { title: step.title, desc: step.desc, tip: step.tip, imageUrl: finalStepImageUrl };
      }));

      const commonData = {
        title: formData.title, material: formData.material, category: formData.category, difficulty: formData.difficulty,
        co2_reduction: parseFloat(formData.co2), estimated_time: formData.time, required_tools: formData.tools,
        image_url: finalImageUrl, is_ai_generated: formData.isAI, is_public: false,
        metadata: {
          ...(initialProject?.metadata as any || {}), fabrication_guide: processedSteps, model_files: allModelFiles,
          download_url: allModelFiles.length > 0 ? allModelFiles[0].url : '', images: savedMainImages,
          tools: formData.tools, material_qty: formData.materialQty, material_unit: formData.materialUnit,
          source_location: formData.sourceLocation, processing_method: formData.processingMethod,
          eco_validation: ecoValidation, eco_score: ecoValidation?.recalculated_eco_score || formData.co2,
          maker_name: userNickname || 'Maker'
        }
      };

      const { data, error } = initialProject 
        ? await supabase.from('items').update(commonData).eq('id', initialProject.id).select()
        : await supabase.from('items').insert([{ ...commonData, owner_id: user?.id }]).select();

      if (error) throw error;
      const realId = data?.[0]?.id?.toString() || (initialProject?.id || Date.now().toString());
      onUploadComplete({
        id: realId, title: formData.title, maker: userNickname || 'Maker', image: finalImageUrl, images: savedMainImages,
        category: formData.category, time: formData.time || '2h', difficulty: formData.difficulty as any,
        isAiRemix: formData.isAI, description: `Project: ${formData.title}`, steps: processedSteps as any[],
        downloadUrl: allModelFiles.length > 0 ? allModelFiles[0].url : '', modelFiles: allModelFiles
      });
      showToast(initialProject ? '수정되었습니다.' : '게시되었습니다.', 'success');
    } catch (error: any) {
      showToast(`오류: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const isIdentityComplete = formData.title.trim() !== '' && formData.category !== '' && formData.time.trim() !== '';
  const isMaterialComplete = formData.material !== '' && formData.materialQty !== '' && formData.sourceLocation.trim() !== '';
  const isProcessComplete = formData.tools.trim() !== '' && formData.processingMethod !== '';
  const isFilesComplete = (modelFiles.length > 0 || existingModels.length > 0);
  const isStepsStarted = formData.steps.some(s => s.title.trim() !== '' || s.desc.trim() !== '');

  const showAll = !!initialProject;

  return (
    <div className="flex h-screen w-full bg-[#f6f8f7] dark:bg-[#05120d] text-slate-900 dark:text-slate-100 font-sans overflow-hidden">
      <aside className="w-20 lg:w-72 flex-shrink-0 flex flex-col justify-between bg-[#0d1b17] border-r border-white/5 h-full transition-all">
        <div className="flex flex-col gap-8 p-6">
          <div className="flex items-center gap-3 px-2 cursor-pointer" onClick={onBack}>
            <div className="bg-[#10b77f]/20 p-2 rounded-xl"><Recycle className="text-[#10b77f] w-7 h-7" /></div>
            <h1 className="text-white text-lg font-bold hidden lg:block">Jeju Re-Maker</h1>
          </div>
          <nav className="flex flex-col gap-2">
            <button onClick={() => setActiveTab('upload')} className={`flex items-center gap-3 px-4 py-3 rounded-full ${activeTab === 'upload' ? 'bg-[#10b77f] text-white shadow-lg shadow-[#10b77f]/30' : 'text-gray-400 hover:text-white'}`}><UploadCloud className="w-5 h-5" /><p className="text-sm font-medium hidden lg:block">{t.sidebar.upload}</p></button>
            <button onClick={() => setActiveTab('inventory')} className={`flex items-center gap-3 px-4 py-3 rounded-full ${activeTab === 'inventory' ? 'bg-[#10b77f] text-white shadow-lg shadow-[#10b77f]/30' : 'text-gray-400 hover:text-white'}`}><HardDrive className="w-5 h-5" /><p className="text-sm font-medium hidden lg:block">{t.sidebar.inventory}</p></button>
          </nav>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-full overflow-y-auto relative bg-[#f6f8f7] dark:bg-transparent">
        <header className="sticky top-0 z-20 bg-white/80 dark:bg-[#0d2118]/80 backdrop-blur-md border-b border-gray-200/50 dark:border-white/5 px-8 py-5 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{activeTab === 'upload' ? t.header.uploadTitle : t.header.inventoryTitle}</h2>
            <p className="text-slate-500 text-sm mt-1">{activeTab === 'upload' ? t.header.uploadDesc : t.header.inventoryDesc}</p>
          </div>
          {activeTab === 'upload' && (
            <div className="flex gap-3 items-center">
              <button onClick={handleVerifyEco} disabled={isVerifying} className="px-4 py-2.5 rounded-full bg-white text-slate-700 border flex items-center gap-2 hover:bg-slate-50">{isVerifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-yellow-400" />}{isVerifying ? '분석 중...' : 'AI 가치 분석'}</button>
              <button onClick={handleUpload} disabled={loading} className="px-6 py-2.5 rounded-full bg-[#10b77f] text-white font-medium text-sm flex items-center gap-2 shadow-lg shadow-[#10b77f]/30 hover:shadow-[#10b77f]/50">{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}{loading ? t.header.publishing : t.header.publish}</button>
            </div>
          )}
        </header>

        <div className="p-8 max-w-5xl mx-auto w-full pb-32">
          {activeTab === 'upload' ? (
            <>
              {/* Stage 1: Identity */}
              <section className="mb-10 animate-fade-in-up">
                <div className="flex items-center gap-2 mb-4 px-2"><Info className="w-5 h-5 text-[#10b77f]" /><h3 className="text-lg font-bold text-slate-800 dark:text-white">1. Project Identity</h3></div>
                <div className="bg-white dark:bg-[#152e25]/60 p-8 rounded-[2rem] border border-gray-100 dark:border-white/5 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="col-span-2 flex flex-col gap-2"><label className="text-sm font-semibold ml-2">{t.basicInfo.projectTitle}</label><input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full bg-slate-50 dark:bg-black/30 rounded-full px-6 py-4 outline-none focus:ring-2 focus:ring-[#10b77f]/20" placeholder={t.basicInfo.projectTitlePlaceholder} /></div>
                    <div className="flex flex-col gap-2"><label className="text-sm font-semibold ml-2">{t.basicInfo.category}</label><select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full bg-slate-50 dark:bg-black/30 rounded-full px-6 py-4 appearance-none outline-none">{t_dropdown.categories.map(cat => <option key={cat.value} value={cat.value}>{cat.label}</option>)}</select></div>
                    <div className="flex flex-col gap-2"><label className="text-sm font-semibold ml-2">{t.basicInfo.time}</label><div className="relative"><input value={formData.time} onChange={(e) => setFormData({ ...formData, time: e.target.value })} className="w-full bg-slate-50 dark:bg-black/30 rounded-full px-6 py-4 outline-none" placeholder={t.basicInfo.timePlaceholder} /><Clock className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400" /></div></div>
                  </div>
                </div>
              </section>

              {/* Stage 2: Material */}
              {(showAll || isIdentityComplete) && (
                <section className="mb-10 animate-fade-in-up">
                  <div className="flex items-center gap-2 mb-4 px-2"><Recycle className="w-5 h-5 text-[#10b77f]" /><h3 className="text-lg font-bold text-slate-800 dark:text-white">2. Material & Eco Data</h3></div>
                  <div className="bg-white dark:bg-[#152e25]/60 p-8 rounded-[2rem] border border-gray-100 dark:border-white/5 space-y-6">
                     <div className="flex flex-col gap-4">
                       <label className="text-sm font-semibold ml-2">{t.basicInfo.material}</label>
                       <div className="flex flex-col md:flex-row gap-4">
                         <div className="flex-[2]"><select value={formData.material} onChange={handleMaterialChange} className="w-full bg-slate-50 dark:bg-black/30 rounded-full px-6 py-4">{MATERIAL_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{t_dropdown.materials[opt.value as keyof typeof t_dropdown.materials] || opt.label}</option>)}</select></div>
                         <div className="flex-1 flex gap-2"><input type="number" value={formData.materialQty} onChange={(e) => setFormData({ ...formData, materialQty: e.target.value })} className="w-full bg-slate-50 dark:bg-black/30 rounded-full px-6 py-4 text-center font-bold" /><select value={formData.materialUnit} onChange={(e) => setFormData({ ...formData, materialUnit: e.target.value })} className="w-24 bg-slate-50 dark:bg-black/30 rounded-full px-2"><option>kg</option><option>g</option><option>ea</option></select></div>
                       </div>
                       <label className="text-sm font-semibold ml-2 mt-2">수거처 (Source Location)</label>
                       <input type="text" placeholder={t_dropdown.sourcePlaceholder} value={formData.sourceLocation} onChange={(e) => setFormData({ ...formData, sourceLocation: e.target.value })} className="w-full bg-slate-50 dark:bg-black/30 rounded-full px-6 py-4" />
                     </div>
                  </div>
                </section>
              )}

              {/* Stage 3: Process */}
              {(showAll || isMaterialComplete) && (
                <section className="mb-10 animate-fade-in-up">
                  <div className="flex items-center gap-2 mb-4 px-2"><Hammer className="w-5 h-5 text-[#10b77f]" /><h3 className="text-lg font-bold text-slate-800 dark:text-white">3. Fabrication Process</h3></div>
                  <div className="bg-white dark:bg-[#152e25]/60 p-8 rounded-[2rem] border border-gray-100 dark:border-white/5 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex flex-col gap-2"><label className="text-sm font-semibold ml-2">{t.basicInfo.tools}</label><div className="w-full bg-slate-50 dark:bg-black/30 rounded-[2rem] px-6 py-4 flex flex-wrap gap-2 items-center min-h-[56px]">{formData.tools.split(',').filter(t => t.trim() !== '').map((tool, idx) => (<span key={idx} className="bg-white dark:bg-white/10 px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1">{tool.trim()}<button onClick={() => { const newTools = formData.tools.split(',').filter((_, i) => i !== idx).join(','); setFormData({ ...formData, tools: newTools }); }}><X className="w-3 h-3" /></button></span>))}<input type="text" className="bg-transparent outline-none flex-1 min-w-[120px]" placeholder={formData.tools ? "" : t.basicInfo.toolsPlaceholder} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); const val = e.currentTarget.value.trim(); if (val) { const current = formData.tools ? formData.tools.split(',') : []; if (!current.includes(val)) setFormData({ ...formData, tools: [...current, val].join(',') }); e.currentTarget.value = ''; } } }} /></div></div>
                      <div className="flex flex-col gap-2"><label className="text-sm font-semibold ml-2">가공 방식</label><select value={formData.processingMethod} onChange={(e) => setFormData({ ...formData, processingMethod: e.target.value })} className="w-full bg-slate-50 dark:bg-black/30 rounded-full px-6 py-4">{Object.entries(t_dropdown.processing).map(([k, v]) => <option key={k} value={k}>{v as string}</option>)}</select></div>
                    </div>
                  </div>
                </section>
              )}

              {/* Stage 4: Files */}
              {(showAll || isProcessComplete) && (
                <section className="mb-10 animate-fade-in-up">
                  <div className="flex items-center gap-2 mb-4 px-2"><Settings className="w-5 h-5 text-[#10b77f]" /><h3 className="text-lg font-bold text-slate-800 dark:text-white">4. Files & Settings</h3></div>
                  <div className="bg-white dark:bg-[#152e25]/60 p-8 rounded-[2rem] border border-gray-100 dark:border-white/5 space-y-8">
                    <div className="flex flex-col gap-2">
                       <label className="text-sm font-semibold ml-2 flex items-center gap-2"><Box className="w-4 h-4 text-[#f48120]" />{t.basicInfo.modelFile}</label>
                       <div className="relative group"><input type="file" multiple accept=".stl,.obj,.glb,.gltf,.dxf,.dwg,.pdf,.svg,.ai,.png" onChange={handleModelChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" /><div className="w-full bg-slate-50 dark:bg-black/30 border-2 border-dashed rounded-2xl px-6 py-8 flex items-center justify-center"><p className="text-slate-400">{modelFiles.length > 0 ? `${modelFiles.length} files selected` : t.basicInfo.modelDragDrop}</p></div></div>
                    </div>
                    <div className="grid grid-cols-2 gap-6 pt-6 border-t border-slate-50">
                       <div className="flex items-center justify-between bg-slate-50 dark:bg-black/30 p-4 rounded-2xl"><p className="text-sm font-bold">AI Generated</p><button onClick={() => setFormData({ ...formData, isAI: !formData.isAI })} className={`w-12 h-6 rounded-full relative ${formData.isAI ? 'bg-primary' : 'bg-gray-300'}`}><div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.isAI ? 'right-1' : 'left-1'}`} /></button></div>
                       <div className="flex p-1 bg-slate-100 rounded-full">{['Easy', 'Medium', 'Hard'].map(level => <button key={level} onClick={() => setFormData({ ...formData, difficulty: level as any })} className={`flex-1 py-2 rounded-full text-xs font-bold ${formData.difficulty === level ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>{level}</button>)}</div>
                    </div>
                  </div>
                </section>
              )}

              {/* Stage 5: Steps */}
              {(showAll || isFilesComplete) && (
                <section className="mb-10 animate-fade-in-up">
                  <div className="flex items-center gap-2 mb-4 px-2"><Hammer className="w-5 h-5 text-[#10b77f]" /><h3 className="text-lg font-bold text-slate-800 dark:text-white">5. Fabrication Steps</h3></div>
                  <div className="flex flex-col gap-4">
                    {formData.steps.map((step, index) => {
                      const isFirst = index === 0;
                      const prevStep = index > 0 ? formData.steps[index - 1] : null;
                      const isPrevComplete = prevStep && prevStep.title.trim() !== '' && prevStep.desc.trim() !== '';
                      const hasCurrentContent = step.title.trim() !== '' || step.desc.trim() !== '';
                      if (!isFirst && !isPrevComplete && !hasCurrentContent) return null;
                      return (
                        <div key={index} className="bg-white dark:bg-[#152e25]/60 p-6 rounded-[2rem] border border-gray-100 dark:border-white/5 relative animate-fade-in-up">
                          <div className="flex flex-col md:flex-row gap-6 pl-8">
                             <div className="flex-1 space-y-4">
                               <input value={step.title} onChange={(e) => updateStep(index, 'title', e.target.value)} className="w-full bg-transparent border-0 border-b text-lg font-semibold" placeholder={`Step ${index + 1} Title`} />
                               <textarea value={step.desc} onChange={(e) => updateStep(index, 'desc', e.target.value)} className="w-full bg-slate-50 dark:bg-black/30 rounded-2xl p-4 text-sm" placeholder="Step description..." rows={3} />
                             </div>
                             <div className="w-full md:w-32 aspect-square bg-slate-50 dark:bg-black/30 rounded-xl flex items-center justify-center relative overflow-hidden border-2 border-dashed">
                               {step.imageFile || step.imageUrl ? <img src={step.imageFile ? URL.createObjectURL(step.imageFile) : step.imageUrl} className="absolute inset-0 w-full h-full object-cover" /> : <ImageIcon className="text-slate-300" />}
                               <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => e.target.files?.[0] && updateStep(index, 'imageFile', e.target.files[0])} />
                             </div>
                          </div>
                          {formData.steps.length > 1 && <button onClick={() => removeStep(index)} className="absolute right-4 top-4 text-slate-300 hover:text-red-500"><X className="w-5 h-5" /></button>}
                        </div>
                      );
                    })}
                    <button onClick={addStep} className="w-full py-4 rounded-[2rem] border-2 border-dashed text-slate-400 hover:border-[#10b77f] hover:text-[#10b77f] flex items-center justify-center gap-2"><PlusCircle /><span>Add Step</span></button>
                  </div>
                </section>
              )}

              {/* Stage 6: Visual Assets */}
              {(showAll || isStepsStarted) && (
                <section className="mb-10 animate-fade-in-up">
                  <div className="flex items-center gap-2 mb-4 px-2"><ImageIcon className="w-5 h-5 text-[#10b77f]" /><h3 className="text-lg font-bold text-slate-800 dark:text-white">6. Visual Assets</h3></div>
                  <div className="bg-white dark:bg-[#152e25]/60 p-8 rounded-[2rem] border border-gray-100 dark:border-white/5">
                    <div className="w-full min-h-48 rounded-3xl bg-slate-50 dark:bg-black/30 border-2 border-dashed flex flex-col items-center justify-center cursor-pointer relative overflow-hidden">
                      <input type="file" accept="image/*" multiple onChange={handleImageChange} className="absolute inset-0 opacity-0 z-10 cursor-pointer" />
                      {(existingImages.length > 0 || previewUrls.length > 0) ? (
                        <div className="grid grid-cols-3 gap-4 p-4 w-full">
                          {existingImages.map((url, i) => <img key={i} src={url} className="w-full aspect-video object-cover rounded-lg" />)}
                          {previewUrls.map((url, i) => <img key={i} src={url} className="w-full aspect-video object-cover rounded-lg border-2 border-[#10b77f]" />)}
                        </div>
                      ) : <p className="text-slate-400">Upload Project Images</p>}
                    </div>
                  </div>
                </section>
              )}
            </>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {inventory.length > 0 ? inventory.map((item: any) => (
                <div key={item.id} onClick={() => onSelectProject({ ...item, id: item.id.toString(), maker: item.metadata?.maker_name || 'Maker', steps: item.metadata?.fabrication_guide || [] })} className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer group">
                  <div className="aspect-video bg-slate-100 rounded-2xl mb-4 overflow-hidden relative">
                    <img src={item.image_url || 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80'} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  </div>
                  <h4 className="font-bold text-slate-900 mb-1 group-hover:text-[#10b77f]">{item.title}</h4>
                   <div className="flex justify-between items-center pt-4 border-t border-slate-50">
                    <span className="text-xs text-slate-500 truncate">{item.material}</span>
                    <ArrowUpRight className="w-4 h-4 text-slate-300" />
                  </div>
                </div>
              )) : <div className="col-span-full py-20 text-center text-slate-400">No items found</div>}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminUpload;