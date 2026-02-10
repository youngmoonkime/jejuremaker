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
import { Language } from '../App';

// --- Cloudflare R2 Configuration ---
// 주의: 실제 프로덕션 환경에서는 이 키들을 환경변수(.env)로 관리하거나 
// 서버(Supabase Edge Function)에서 서명된 URL을 생성하여 사용하는 것이 보안상 안전합니다.
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
  initialProject?: Project | null; // Add optional initialProject for edit mode
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
        Intermediate: '보통',
        Advanced: '어려움'
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
        Intermediate: 'Intermediate',
        Advanced: 'Advanced'
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
    categories: ['가구 (Furniture)', '홈 데코 (Home Decor)', '조명 (Lighting)', '주방 (Kitchen)', '패션 (Fashion)', '예술 (Art)', '기타 (Others)'],
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
    categories: ['Furniture', 'Home Decor', 'Lighting', 'Kitchen', 'Fashion', 'Art', 'Others'],
    sourcePlaceholder: 'e.g. Jeju City Hall, Hamdeok Beach (Specific location increases reliability)'
  }
};

const AdminUpload: React.FC<AdminUploadProps> = ({ supabase, onBack, onUploadComplete, language, user, onSelectProject, initialProject }) => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'inventory'
  const [inventory, setInventory] = useState([]);

  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  // R2 File State - Changed to array for multiple files
  const [modelFiles, setModelFiles] = useState<File[]>([]);

  // Edit Mode State: Track existing assets to avoid re-uploading
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [existingModels, setExistingModels] = useState<any[]>([]);

  const [isR2Configured, setIsR2Configured] = useState(false);

  // User nickname state - fetched from user_profiles table
  const [userNickname, setUserNickname] = useState<string>('');

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

  // Populate form if editing
  useEffect(() => {
    if (initialProject) {
      console.log("Editing project:", initialProject);
      setFormData({
        title: initialProject.title,
        material: initialProject.material || 'Old Denim Jeans',
        materialQty: (initialProject.metadata as any)?.material_qty || '1',
        materialUnit: (initialProject.metadata as any)?.material_unit || 'ea',
        sourceLocation: (initialProject.metadata as any)?.source_location || '',
        category: initialProject.category,
        difficulty: initialProject.difficulty,
        co2: initialProject.ecoScore || (initialProject.metadata as any)?.eco_score || '1.2',
        time: initialProject.time,
        isAI: user?.email === 'Master Kim' ? false : (initialProject.isAiRemix || initialProject.isAiIdea || false), // Restore AI flag
        tools: initialProject.tools || '',
        processingMethod: (initialProject.metadata as any)?.processing_method || '',
        steps: initialProject.steps?.map(step => ({
          title: step.title,
          desc: step.desc,
          tip: step.tip || '',
          imageFile: null,
          imageUrl: step.imageUrl || ''
        })) || [{ title: '', desc: '', tip: '', imageFile: null, imageUrl: '' }]
      });

      // Set existing assets
      if (initialProject.images && initialProject.images.length > 0) {
        setExistingImages(initialProject.images);
        // Don't set previewUrls, we'll handle display separately or merge them visually
      } else if (initialProject.image) {
        setExistingImages([initialProject.image]);
      }

      if (initialProject.modelFiles) {
        setExistingModels(initialProject.modelFiles);
      }

      if ((initialProject.metadata as any)?.eco_validation) {
        setEcoValidation((initialProject.metadata as any).eco_validation);
      }
    }
  }, [initialProject]);

  const [ecoValidation, setEcoValidation] = useState<any>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerifyEco = async () => {
    if (!formData.title || !formData.material || !formData.steps[0].desc) {
      alert("분석을 위해 프로젝트 제목, 재료, 그리고 최소 1개의 제작 단계를 입력해주세요.");
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
      alert("분석 중 오류가 발생했습니다.");
    } finally {
      setIsVerifying(false);
    }
  };

  // Check R2 Configuration on mount
  useEffect(() => {
    if (checkR2Config()) {
      setIsR2Configured(true);
    }
  }, []);

  // Fetch user's custom nickname from user_profiles table
  useEffect(() => {
    const fetchUserNickname = async () => {
      if (!user) {
        setUserNickname('');
        return;
      }
      try {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('nickname')
          .eq('user_id', user.id)
          .maybeSingle();

        if (profile?.nickname) {
          setUserNickname(profile.nickname);
        } else {
          setUserNickname(user.user_metadata?.full_name || user.email?.split('@')[0] || 'Maker');
        }
      } catch (err) {
        setUserNickname(user.user_metadata?.full_name || user.email?.split('@')[0] || 'Maker');
      }
    };
    fetchUserNickname();
  }, [user, supabase]);

  // --- Inventory Data Fetching & Bucket Check ---
  const fetchInventory = async () => {
    try {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .neq('category', 'Social') // Filter out community posts
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        setInventory(data);
      }
    } catch (error) {
      console.error("Fetch Error:", error);
    }
  };

  useEffect(() => {
    if (activeTab === 'inventory') {
      fetchInventory();
    }
  }, [activeTab]);

  // --- Step Management Handlers ---
  const addStep = () => {
    setFormData({
      ...formData,
      steps: [...formData.steps, { title: '', desc: '', tip: '', imageFile: null, imageUrl: '' }]
    });
  };

  const removeStep = (index: number) => {
    const newSteps = formData.steps.filter((_, i) => i !== index);
    setFormData({ ...formData, steps: newSteps });
  };

  const updateStep = (index: number, field: string, value: any) => {
    const newSteps = [...formData.steps];
    (newSteps[index] as any)[field] = value;
    setFormData({ ...formData, steps: newSteps });
  };

  // --- Handlers ---
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles: File[] = Array.from(e.target.files as FileList);
      setImageFiles(prev => [...prev, ...newFiles]);
      const newUrls = newFiles.map(file => URL.createObjectURL(file)); // Re-add this line
      setPreviewUrls(prev => [...prev, ...newUrls]);
    }
  };

  const removeExistingImage = (index: number) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleModelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles: File[] = Array.from(e.target.files as FileList);

      // Validate file size (10MB)
      const validFiles = newFiles.filter(file => {
        if (file.size > MAX_FILE_SIZE) {
          alert(`${t.alert.sizeError} (${file.name})`);
          return false;
        }
        return true;
      });

      setModelFiles(prev => [...prev, ...validFiles]);
    }
  };

  const removeModelFile = (index: number) => {
    setModelFiles(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingModel = (index: number) => {
    setExistingModels(prev => prev.filter((_, i) => i !== index));
  };

  const optimizeImage = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const MAX_WIDTH = 1920;

        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context failed'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Image compression failed'));
            return;
          }
          // Convert original extension to .webp
          const fileName = file.name.replace(/\.[^/.]+$/, "") + ".webp";
          const optimizedFile = new File([blob], fileName, {
            type: 'image/webp',
            lastModified: Date.now(),
          });
          resolve(optimizedFile);
        }, 'image/webp', 0.85); // 85% quality
      };
      img.onerror = (error) => reject(error);
    });
  };

  // Add Auto-Unit Logic
  const handleMaterialChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value;
    const option = MATERIAL_OPTIONS.find(opt => opt.value === selectedValue);
    setFormData({
      ...formData,
      material: selectedValue,
      materialUnit: option ? option.unit : 'kg' // Auto-set unit
    });
  };





  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    // Allow if we have existing images even if no NEW images
    if (imageFiles.length === 0 && existingImages.length === 0) { alert(t.visuals.selectImage); return; }

    setLoading(true);
    const uploadedImageUrls: string[] = [];

    try {
      // 1. Optimize and Upload Images to Cloudflare R2
      for (const imageFile of imageFiles) {
        try {
          console.log(`Optimizing image: ${imageFile.name}...`);
          const optimizedFile = await optimizeImage(imageFile);
          console.log(`Uploading optimized image (${(optimizedFile.size / 1024).toFixed(2)}KB) to R2...`);

          const url = await uploadToR2(optimizedFile, 'images');
          uploadedImageUrls.push(url);
        } catch (err: any) {
          console.error(`Failed to process image ${imageFile.name}:`, err);
          // Fallback to uploading original if optimization fails, or just warn
          try {
            const url = await uploadToR2(imageFile, 'images');
            uploadedImageUrls.push(url);
          } catch (fallbackErr) {
            console.error("Fallback upload also failed", fallbackErr);
          }
        }
      }

      const allImageUrls = [...existingImages, ...uploadedImageUrls];
      const finalImageUrl = allImageUrls[0] || 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80';

      // 2. Upload Model Files to Cloudflare R2 (Multiple)
      const uploadedModels = [];
      if (modelFiles.length > 0) {
        if (!isR2Configured) {
          alert(t.alert.r2ConfigError);
        }

        for (const file of modelFiles) {
          const url = await uploadToR2(file, 'models');
          uploadedModels.push({
            name: file.name,
            size: file.size,
            type: file.type,
            url: url
          });
        }
      }

      const allModelFiles = [...existingModels, ...uploadedModels];

      // 2.5 Upload Step Images
      const processedSteps = await Promise.all(formData.steps.map(async (step) => {
        let finalStepImageUrl = step.imageUrl;
        if (step.imageFile) {
          try {
            console.log(`Uploading step image...`);
            finalStepImageUrl = await uploadToR2(step.imageFile, 'steps');
          } catch (err) {
            console.error("Failed to upload step image", err);
          }
        }
        // Return step without function/file objects for JSON storage
        return {
          title: step.title,
          desc: step.desc,
          tip: step.tip,
          imageUrl: finalStepImageUrl
        };
      }));

      // 3. Save Data to Database using Supabase SDK
      const commonData = {
        title: formData.title,
        material: formData.material,
        category: formData.category,
        difficulty: formData.difficulty,
        co2_reduction: parseFloat(formData.co2),
        estimated_time: formData.time,
        required_tools: formData.tools,
        image_url: finalImageUrl,
        is_ai_generated: formData.isAI,
        is_public: true, // Admin uploads are public by default
        metadata: {
          fabrication_guide: processedSteps,
          model_files: allModelFiles, // Store combined files
          download_url: allModelFiles.length > 0 ? allModelFiles[0].url : '',
          images: allImageUrls, // Store combined images
          tools: formData.tools,
          material_qty: formData.materialQty,
          material_unit: formData.materialUnit,
          source_location: formData.sourceLocation,
          processing_method: formData.processingMethod,
          eco_validation: ecoValidation,
          eco_score: ecoValidation?.recalculated_eco_score || formData.co2,
          maker_name: initialProject?.maker || userNickname || 'Maker' // Save maker name to DB
        }
      };

      let resultData;

      if (initialProject) {
        // UPDATE EXISTING
        const { data, error } = await supabase
          .from('items')
          .update(commonData)
          .eq('id', initialProject.id)
          .select();

        if (error) throw error;
        resultData = data;
        alert(language === 'ko' ? '프로젝트가 수정되었습니다.' : 'Project updated successfully.');
      } else {
        // INSERT NEW
        const { data, error } = await supabase
          .from('items')
          .insert([{
            ...commonData,
            owner_id: user?.id, // Only set owner on creation
          }])
          .select();

        if (error) throw error;
        resultData = data;
        alert(t.alert.success);
      }

      const newProject: Project = {
        id: initialProject ? initialProject.id : Date.now().toString(), // Use existing ID if editing
        title: formData.title,
        maker: initialProject?.maker || userNickname || 'Maker', // Use fetched nickname
        image: finalImageUrl,
        images: allImageUrls,
        category: formData.category,
        time: formData.time || '2h',
        difficulty: formData.difficulty as 'Easy' | 'Medium' | 'Hard',
        isAiRemix: formData.isAI,
        description: `Project: ${formData.title}. Material: ${formData.material}`,
        steps: processedSteps as any[],
        downloadUrl: allModelFiles.length > 0 ? allModelFiles[0].url : '',
        modelFiles: allModelFiles
      };

      onUploadComplete(newProject);

    } catch (error: any) {
      alert(`${t.alert.error}${error.message}`);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#f6f8f7] dark:bg-[#05120d] dark:bg-gradient-to-br dark:from-[#0d2a1f] dark:to-[#05120d] text-slate-900 dark:text-slate-100 font-sans selection:bg-[#10b77f] selection:text-white overflow-hidden">

      {/* Sidebar - Design preserved */}
      <aside className="w-20 lg:w-72 flex-shrink-0 flex flex-col justify-between bg-[#0d1b17] border-r border-white/5 h-full transition-all duration-300">
        <div className="flex flex-col gap-8 p-6">
          <div className="flex items-center gap-3 px-2 cursor-pointer" onClick={onBack}>
            <div className="bg-[#10b77f]/20 p-2 rounded-xl">
              <Recycle className="text-[#10b77f] w-7 h-7" />
            </div>
            <h1 className="text-white text-lg font-bold tracking-tight hidden lg:block">Jeju Re-Maker</h1>
          </div>
          <nav className="flex flex-col gap-2">
            <button
              onClick={() => setActiveTab('upload')}
              className={`flex items-center gap-3 px-4 py-3 rounded-full transition-all group ${activeTab === 'upload' ? 'bg-[#10b77f] text-white shadow-[0_0_15px_rgba(16,183,127,0.3)]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
              <UploadCloud className="w-5 h-5" />
              <p className="text-sm font-medium hidden lg:block">{t.sidebar.upload}</p>
            </button>
            {/* Inventory Item Removed as per request */}
          </nav>
        </div>

      </aside>

      <main className="flex-1 flex flex-col h-full overflow-y-auto relative bg-[#f6f8f7] dark:bg-transparent">
        {/* Header - Design preserved */}
        <header className="sticky top-0 z-20 bg-white/80 dark:bg-[#0d2118]/80 backdrop-blur-md border-b border-gray-200/50 dark:border-white/5 px-8 py-5 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {activeTab === 'upload' ? t.header.uploadTitle : t.header.inventoryTitle}
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              {activeTab === 'upload' ? t.header.uploadDesc : t.header.inventoryDesc}
            </p>
          </div>

          {/* Eco Badge (Real-time / Verified) */}
          {activeTab === 'upload' && (
            <div className="hidden md:flex items-center gap-4 bg-emerald-50/50 border border-emerald-100 px-4 py-2 rounded-2xl">
              <div className={`p-2 rounded-full ${ecoValidation?.is_consistent ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                {isVerifying ? <Loader2 className="w-5 h-5 animate-spin" /> : <Recycle className="w-5 h-5" />}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">ECO IMPACT</p>
                <p className="text-sm font-bold text-slate-900">
                  {ecoValidation ? ecoValidation.eco_badge : 'Start typing to analyze'}
                </p>
              </div>
              {ecoValidation && (
                <div className="text-right pl-4 border-l border-emerald-200">
                  <p className="text-[10px] text-slate-400">Reliability</p>
                  <p className="text-lg font-black text-emerald-600 leading-none">{ecoValidation.data_reliability_score}<span className="text-xs text-emerald-400">/10</span></p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'upload' && (
            <div className="flex gap-3 items-center">
              {/* Verification Stat (Visible only when verified) */}
              {ecoValidation && (
                <div className="flex flex-col items-end mr-4 hidden xl:flex">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Verified Score</span>
                  <div className="flex items-center gap-1">
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${ecoValidation.grade === 'A' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{ecoValidation.grade || 'B'}</span>
                    <span className="text-sm font-bold text-slate-700">-{Number(ecoValidation.recalculated_eco_score).toFixed(2)}kg</span>
                  </div>
                </div>
              )}

              <button
                onClick={handleVerifyEco}
                disabled={isVerifying}
                className={`px-4 py-2.5 rounded-full font-medium text-sm transition-all flex items-center gap-2 border ${isVerifying ? 'bg-slate-100 text-slate-400 border-transparent' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300'}`}
              >
                {isVerifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-yellow-400" />}
                {isVerifying ? '분석 중...' : 'AI 가치 분석'}
              </button>

              <div className="h-8 w-px bg-gray-200 mx-1"></div>

              <button className="px-6 py-2.5 rounded-full text-slate-600 font-medium text-sm hover:bg-slate-100 transition-colors">{t.header.saveDraft}</button>
              <button
                onClick={handleUpload}
                disabled={loading || !ecoValidation}
                className={`px-6 py-2.5 rounded-full bg-[#10b77f] text-white font-medium text-sm shadow-lg shadow-[#10b77f]/30 transition-all flex items-center gap-2 
                    ${loading || !ecoValidation ? 'opacity-50 cursor-not-allowed grayscale' : 'hover:shadow-[#10b77f]/50 hover:-translate-y-0.5'}
                `}
                title={!ecoValidation ? "AI 가치 분석을 먼저 완료해주세요" : ""}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}

                {loading ? t.header.publishing : t.header.publish}
              </button>
            </div>
          )}
        </header>

        <div className="p-8 max-w-5xl mx-auto w-full pb-32">
          {activeTab === 'upload' ? (
            <>
              {/* Basic Information Section */}
              <section className="mb-10">
                <div className="flex items-center gap-2 mb-4 px-2">
                  <Info className="w-5 h-5 text-[#10b77f]" />
                  <h3 className="text-lg font-bold text-slate-800">{t.basicInfo.title}</h3>
                </div>
                <div className="bg-white dark:bg-[#152e25]/60 backdrop-blur-xl p-8 rounded-[2rem] shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)] border border-gray-100 dark:border-white/5 flex flex-col gap-8">

                  {/* Group A: Project Identity */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-100">
                      <Info className="w-5 h-5 text-[#10b77f]" />
                      <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider">1. Project Identity</h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="col-span-1 md:col-span-2 flex flex-col gap-2">
                        <label className="text-slate-700 text-sm font-semibold ml-2">{t.basicInfo.projectTitle}</label>
                        <input
                          value={formData.title}
                          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                          className="w-full bg-slate-50 dark:bg-black/30 border-0 text-slate-900 dark:text-white rounded-full px-6 py-4 focus:ring-2 focus:ring-[#10b77f]/20 focus:bg-white dark:focus:bg-black/50 transition-all placeholder:text-slate-400 font-medium outline-none"
                          placeholder={t.basicInfo.projectTitlePlaceholder}
                          type="text"
                        />
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="text-slate-700 text-sm font-semibold ml-2">{t.basicInfo.category}</label>
                        <div className="relative">
                          <select
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            className="w-full bg-slate-50 dark:bg-black/30 border-0 text-slate-900 dark:text-white rounded-full px-6 py-4 appearance-none focus:ring-2 focus:ring-[#10b77f]/20 focus:bg-white dark:focus:bg-black/50 transition-all font-medium outline-none"
                          >
                            {t_dropdown.categories.map(cat => <option key={cat}>{cat}</option>)}
                          </select>
                          <ChevronRight className="w-5 h-5 absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none rotate-90" />
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="text-slate-700 text-sm font-semibold ml-2">{t.basicInfo.time}</label>
                        <div className="relative">
                          <input
                            value={formData.time}
                            onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                            className="w-full bg-slate-50 dark:bg-black/30 border-0 text-slate-900 dark:text-white rounded-full px-6 py-4 focus:ring-2 focus:ring-[#10b77f]/20 focus:bg-white dark:focus:bg-black/50 transition-all placeholder:text-slate-400 font-medium outline-none"
                            placeholder={t.basicInfo.timePlaceholder}
                            type="text"
                          />
                          <Clock className="w-5 h-5 absolute right-5 top-1/2 -translate-y-1/2 text-slate-400" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Group B: Material & Eco Data */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-100">
                      <Recycle className="w-5 h-5 text-[#10b77f]" />
                      <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider">2. Material & Eco Data</h4>
                    </div>

                    <div className="flex flex-col gap-4">
                      <label className="text-slate-700 dark:text-slate-300 text-sm font-semibold ml-2">{t.basicInfo.material}</label>
                      <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-[2]">
                          <select
                            value={formData.material}
                            onChange={handleMaterialChange}
                            className="w-full bg-slate-50 dark:bg-black/30 border-0 text-slate-900 dark:text-white rounded-full px-6 py-4 appearance-none focus:ring-2 focus:ring-[#10b77f]/20 focus:bg-white dark:focus:bg-black/50 transition-all font-medium outline-none"
                          >
                            {MATERIAL_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {t_dropdown.materials[opt.value as keyof typeof t_dropdown.materials]}
                              </option>
                            ))}
                          </select>
                          <ChevronRight className="w-5 h-5 absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none rotate-90" />
                        </div>
                        <div className="flex flex-1 gap-2">
                          <input
                            type="number"
                            placeholder="Qty"
                            value={formData.materialQty}
                            onChange={(e) => setFormData({ ...formData, materialQty: e.target.value })}
                            className="w-full bg-slate-50 dark:bg-black/30 border-0 text-slate-900 dark:text-white rounded-full px-6 py-4 text-center font-bold outline-none focus:ring-2 focus:ring-[#10b77f]/20"
                          />
                          <select
                            value={formData.materialUnit}
                            onChange={(e) => setFormData({ ...formData, materialUnit: e.target.value })}
                            className="w-24 bg-slate-50 dark:bg-black/30 border-0 text-slate-500 dark:text-slate-400 rounded-full px-2 py-4 text-center font-bold outline-none appearance-none"
                          >
                            <option>kg</option>
                            <option>g</option>
                            <option>ea</option>
                          </select>
                        </div>
                      </div>

                      <label className="text-slate-700 dark:text-slate-300 text-sm font-semibold ml-2 mt-2">수거처 (Source Location)</label>
                      <input
                        type="text"
                        placeholder={t_dropdown.sourcePlaceholder}
                        value={formData.sourceLocation}
                        onChange={(e) => setFormData({ ...formData, sourceLocation: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-black/30 border-0 text-slate-900 dark:text-white rounded-full px-6 py-4 focus:ring-2 focus:ring-[#10b77f]/20 outline-none"
                      />
                    </div>
                  </div>

                  {/* Group C: Fabrication Process */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-100">
                      <Hammer className="w-5 h-5 text-[#10b77f]" />
                      <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider">3. Fabrication Process</h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex flex-col gap-2">
                        <label className="text-slate-700 dark:text-slate-300 text-sm font-semibold ml-2">{t.basicInfo.tools} <span className="text-[10px] text-slate-400 font-normal">(Enter로 태그 추가)</span></label>
                        <div className="w-full bg-slate-50 dark:bg-black/30 border-0 rounded-[2rem] px-6 py-4 focus-within:ring-2 focus-within:ring-[#10b77f]/20 focus-within:bg-white dark:focus-within:bg-black/50 transition-all flex flex-wrap gap-2 items-center min-h-[56px]">
                          {formData.tools.split(',').filter(t => t.trim() !== '').map((tool, idx) => (
                            <span key={idx} className="bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1 shadow-sm">
                              {tool.trim()}
                              <button
                                onClick={() => {
                                  const newTools = formData.tools.split(',').filter((_, i) => i !== idx).join(',');
                                  setFormData({ ...formData, tools: newTools });
                                }}
                                className="hover:text-red-500 rounded-full p-0.5 transition-colors"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                          <input
                            type="text"
                            className="bg-transparent outline-none flex-1 min-w-[120px] text-slate-900 dark:text-white placeholder:text-slate-400 font-medium"
                            placeholder={formData.tools ? "" : t.basicInfo.toolsPlaceholder}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                const val = e.currentTarget.value.trim();
                                if (val) {
                                  const current = formData.tools ? formData.tools.split(',') : [];
                                  if (!current.includes(val)) {
                                    setFormData({ ...formData, tools: [...current, val].join(',') });
                                  }
                                  e.currentTarget.value = '';
                                }
                              } else if (e.key === 'Backspace' && e.currentTarget.value === '' && formData.tools) {
                                const current = formData.tools.split(',');
                                current.pop();
                                setFormData({ ...formData, tools: current.join(',') });
                              }
                            }}
                          />
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-slate-700 dark:text-slate-300 text-sm font-semibold ml-2">가공 방식</label>
                        <div className="relative">
                          <select
                            value={formData.processingMethod}
                            onChange={(e) => setFormData({ ...formData, processingMethod: e.target.value })}
                            className="w-full bg-slate-50 dark:bg-[#1e1e1e] border-0 text-slate-900 dark:text-white rounded-full px-6 py-4 appearance-none focus:ring-2 focus:ring-[#10b77f]/20 focus:bg-white dark:focus:bg-[#252525] transition-all font-medium outline-none"
                          >
                            <option value="">{t_dropdown.processing['']}</option>
                            <option value="heat">{t_dropdown.processing['heat']}</option>
                            <option value="cut">{t_dropdown.processing['cut']}</option>
                            <option value="chem">{t_dropdown.processing['chem']}</option>
                            <option value="manual">{t_dropdown.processing['manual']}</option>
                          </select>
                          <ChevronRight className="w-5 h-5 absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none rotate-90" />
                        </div>
                      </div>
                    </div>

                    {/* Verification Banner if Verified */}
                    {ecoValidation && (
                      <div className={`mt-4 p-4 rounded-2xl border ${ecoValidation.is_consistent ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className={`font-bold ${ecoValidation.is_consistent ? 'text-emerald-800' : 'text-amber-800'}`}>
                              {ecoValidation.is_consistent ? '✅ 데이터 일치 확인됨' : '⚠️ 데이터 불일치 감지'}
                            </h4>
                            <p className="text-sm text-slate-600 mt-1">{ecoValidation.suggestions}</p>
                          </div>
                          {ecoValidation.calculation_basis && (
                            <div className="hidden md:block text-right bg-white/50 px-3 py-2 rounded-xl border border-black/5">
                              <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Calculation Basis</p>
                              <p className="text-xs font-mono text-slate-600">{ecoValidation.calculation_basis}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Old Verification Button Removed (Moved to Header) */}
                  </div>



                  {/* R2 Upload Section (Multiple Files) */}
                  <div className="flex flex-col gap-2">
                    <label className="text-slate-700 text-sm font-semibold ml-2 flex items-center gap-2">
                      <Box className="w-4 h-4 text-[#f48120]" /> {/* Cloudflare Orange-ish */}
                      {t.basicInfo.modelFile}
                    </label>
                    <div className="relative group">
                      <input
                        type="file"
                        multiple // Enable multiple files
                        accept=".stl,.obj,.glb,.gltf,.dxf,.dwg,.pdf,.svg,.ai,.png"
                        onChange={handleModelChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <div className={`w-full bg-slate-50 dark:bg-black/30 border-2 border-dashed ${modelFiles.length > 0 ? 'border-[#10b77f] bg-[#10b77f]/5' : 'border-slate-200 dark:border-white/10'} rounded-2xl px-6 py-8 flex flex-col items-center justify-center text-center transition-all group-hover:border-[#10b77f]/50 group-hover:bg-slate-100 dark:group-hover:bg-white/5`}>
                        {modelFiles.length > 0 ? (
                          <div className="w-full flex flex-col gap-2">
                            <div className="flex items-center justify-center gap-2 text-[#10b77f] mb-2">
                              <FileBox className="w-6 h-6" />
                              <span className="font-bold">{modelFiles.length} files selected</span>
                            </div>
                            <div className="grid gap-2 max-h-48 overflow-y-auto w-full px-2 z-20">
                              {modelFiles.map((file, idx) => (
                                <div key={idx} className="flex items-center justify-between bg-white dark:bg-white/5 p-3 rounded-xl border border-[#10b77f]/20 shadow-sm relative z-20">
                                  <div className="flex items-center gap-3 overflow-hidden">
                                    <div className="bg-[#10b77f]/10 p-1.5 rounded-lg">
                                      <FileBox className="w-4 h-4 text-[#10b77f]" />
                                    </div>
                                    <div className="flex flex-col items-start min-w-0">
                                      <span className="font-medium text-sm truncate w-full text-slate-700">{file.name}</span>
                                      <span className="text-[10px] text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation(); // Stop click from triggering file input
                                      removeModelFile(idx);
                                    }}
                                    className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition-colors z-30"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                            <p className="text-slate-400 text-xs mt-2">Click area to add more files</p>
                          </div>
                        ) : (
                          <>
                            <UploadCloud className="w-8 h-8 text-slate-400 mb-2 group-hover:scale-110 transition-transform" />
                            <p className="text-slate-600 font-medium">{t.basicInfo.modelDragDrop}</p>
                            <p className="text-slate-400 text-xs mt-1">{t.basicInfo.modelFormats}</p>
                          </>
                        )}
                      </div>
                    </div>
                    {/* R2 Warning Alert */}
                    {!isR2Configured && (
                      <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 text-amber-700 text-sm">
                        <AlertTriangle className="w-5 h-5 shrink-0" />
                        <div>
                          <p className="font-bold">R2 Key Configuration Needed</p>
                          <p className="text-xs mt-1 text-amber-600">
                            To enable real file uploads, you must set your Cloudflare R2 Account ID, Access Key, and Secret Key in <code>components/AdminUpload.tsx</code>. Currently using mock uploads.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-4 mt-6 border-t border-slate-50 pt-6">
                    <label className="text-slate-700 text-sm font-semibold ml-2 flex items-center gap-2">
                      <Settings className="w-4 h-4 text-[#10b77f]" />
                      Project Settings
                    </label>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* AI Toggle */}
                      <div className="flex items-center justify-between bg-slate-50 dark:bg-black/30 p-4 rounded-2xl border border-gray-100 dark:border-white/5">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-xl transition-colors ${formData.isAI ? 'bg-primary/20 text-primary' : 'bg-gray-200 dark:bg-white/10 text-gray-500 dark:text-gray-400'}`}>
                            <span className="material-icons-round text-sm">auto_awesome</span>
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-800">{language === 'ko' ? 'AI 생성물' : 'AI Generated'}</p>
                            <p className="text-[10px] text-slate-500">{language === 'ko' ? 'AI 리믹스 또는 아이디어로 표시됩니다' : 'Marked as AI Remix or Idea'}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, isAI: !formData.isAI })}
                          className={`w-12 h-6 rounded-full transition-all relative ${formData.isAI ? 'bg-primary' : 'bg-gray-300 dark:bg-white/20'}`}
                        >
                          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.isAI ? 'right-1' : 'left-1'}`}></div>
                        </button>
                      </div>

                      {/* Difficulty Selector */}
                      <div className="flex flex-col gap-2">
                        <label className="text-slate-700 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider ml-2">{t.basicInfo.difficulty}</label>
                        <div className="flex p-1 bg-slate-100 dark:bg-black/30 rounded-full w-full">
                          {['Easy', 'Intermediate', 'Advanced'].map((level) => (
                            <button
                              key={level}
                              type="button"
                              onClick={() => setFormData({ ...formData, difficulty: level })}
                              className={`flex-1 py-2 rounded-full text-xs font-bold transition-all ${formData.difficulty === level ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                            >
                              {t.basicInfo.diffLevels[level as 'Easy' | 'Intermediate' | 'Advanced'] || level}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Fabrication Steps Section */}
              <section className="mb-10">
                <div className="flex items-center justify-between mb-4 px-2">
                  <div className="flex items-center gap-2">
                    <Hammer className="w-5 h-5 text-[#10b77f]" />
                    <h3 className="text-lg font-bold text-slate-800">{t.steps.title}</h3>
                  </div>
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">{t.steps.dynamic}</span>
                </div>
                <div className="flex flex-col gap-4">
                  {formData.steps.map((step, index) => (
                    <div key={index} className="group bg-white dark:bg-[#152e25]/60 backdrop-blur-xl p-6 rounded-[2rem] shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)] border border-gray-100 dark:border-white/5 relative hover:border-[#10b77f]/30 transition-colors">
                      <div className="absolute left-6 top-6 bg-slate-100 dark:bg-black/30 text-slate-600 dark:text-slate-300 size-8 rounded-full flex items-center justify-center font-bold text-sm">{index + 1}</div>

                      {formData.steps.length > 1 && (
                        <button onClick={() => removeStep(index)} className="absolute right-6 top-6 text-slate-300 hover:text-rose-500 transition-colors">
                          <X className="w-5 h-5" />
                        </button>
                      )}

                      <div className="pl-12 flex flex-col md:flex-row gap-6">
                        {/* Inputs */}
                        <div className="flex-1 flex flex-col gap-4">
                          <input
                            value={step.title}
                            onChange={(e) => updateStep(index, 'title', e.target.value)}
                            className="w-full bg-transparent border-0 border-b border-gray-200 dark:border-white/10 text-slate-900 dark:text-white px-0 py-2 focus:ring-0 focus:border-[#10b77f] text-lg font-semibold placeholder:text-slate-300 transition-colors"
                            placeholder={t.steps.stepTitle}
                            type="text"
                          />
                          <textarea
                            value={step.desc}
                            onChange={(e) => updateStep(index, 'desc', e.target.value)}
                            className="w-full bg-slate-50 dark:bg-black/30 border-0 text-slate-600 dark:text-slate-300 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-[#10b77f]/20 transition-all resize-none text-sm leading-relaxed"
                            placeholder={t.steps.descPlaceholder}
                            rows={3}
                          ></textarea>
                          <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-100 dark:border-yellow-900/30 rounded-2xl p-4 flex gap-3 items-start">
                            <Lightbulb className="text-yellow-500 w-5 h-5 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-xs font-bold text-yellow-700 dark:text-yellow-500 uppercase mb-1">{t.steps.expertTip}</p>
                              <input
                                value={step.tip}
                                onChange={(e) => updateStep(index, 'tip', e.target.value)}
                                className="w-full bg-transparent border-0 p-0 text-sm text-yellow-900 dark:text-yellow-200 placeholder:text-yellow-900/40 dark:placeholder:text-yellow-200/40 focus:ring-0"
                                placeholder={t.steps.tipPlaceholder}
                                type="text"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Step Image Upload */}
                        <div className="w-full md:w-48 flex-shrink-0 flex flex-col gap-2">
                          <div className="w-full aspect-video md:aspect-square bg-slate-50 dark:bg-black/30 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-xl flex flex-col items-center justify-center relative overflow-hidden group/image hover:border-[#10b77f] transition-colors">
                            {step.imageFile || step.imageUrl ? (
                              <>
                                <img
                                  src={step.imageFile ? URL.createObjectURL(step.imageFile) : step.imageUrl}
                                  className="absolute inset-0 w-full h-full object-cover"
                                />
                                <button
                                  onClick={() => {
                                    updateStep(index, 'imageFile', null);
                                    updateStep(index, 'imageUrl', '');
                                  }}
                                  className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover/image:opacity-100 transition-opacity"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </>
                            ) : (
                              <>
                                <ImageIcon className="w-8 h-8 text-slate-300 mb-2" />
                                <span className="text-xs text-slate-400 font-medium">사진 추가</span>
                              </>
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              className="absolute inset-0 opacity-0 cursor-pointer"
                              onChange={(e) => {
                                if (e.target.files?.[0]) {
                                  updateStep(index, 'imageFile', e.target.files[0]);
                                }
                              }}
                            />
                          </div>
                          <p className="text-[10px] text-center text-slate-400">단계별 사진 (선택)</p>
                        </div>
                      </div>
                    </div>
                  ))}

                  <button
                    onClick={addStep}
                    className="w-full py-4 rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-white/10 text-slate-400 hover:border-[#10b77f] hover:text-[#10b77f] hover:bg-[#10b77f]/5 transition-all flex items-center justify-center gap-2 group"
                  >
                    <PlusCircle className="w-6 h-6 group-hover:scale-110 transition-transform" />
                    <span className="font-semibold">{t.steps.addStep}</span>
                  </button>
                </div>
              </section>

              {/* Visual Assets Section */}
              <section className="mb-10">
                <div className="flex items-center gap-2 mb-4 px-2">
                  <ImageIcon className="w-5 h-5 text-[#10b77f]" />
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white">{t.visuals.title}</h3>
                </div>
                <div className="bg-white dark:bg-[#152e25]/60 backdrop-blur-xl p-8 rounded-[2rem] shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)] border border-gray-100 dark:border-white/5">
                  <div className="w-full min-h-64 rounded-3xl bg-slate-50 dark:bg-black/30 border-2 border-dashed border-slate-200 dark:border-white/10 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-100 dark:hover:bg-black/50 hover:border-[#10b77f]/50 transition-all group relative overflow-hidden">
                    <input className="absolute inset-0 opacity-0 cursor-pointer z-10" type="file" accept="image/*" multiple onChange={handleImageChange} />
                    {previewUrls.length > 0 ? (
                      <div className="w-full p-4 grid grid-cols-2 gap-4">
                        {previewUrls.map((url, index) => (
                          <div key={index} className="relative group/img">
                            <img src={url} className="w-full h-40 object-cover rounded-2xl" alt={`Preview ${index + 1}`} />
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); removeImage(index); }}
                              className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover/img:opacity-100 transition-opacity"
                            >
                              <span className="material-icons-round text-sm">close</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <>
                        <div className="bg-white dark:bg-[#252525] p-4 rounded-full shadow-sm mb-4 group-hover:scale-110 transition-transform duration-300">
                          <UploadCloud className="text-[#10b77f] w-8 h-8" />
                        </div>
                        <h4 className="text-slate-900 dark:text-white font-semibold text-lg">{t.visuals.dragDrop}</h4>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{t.visuals.formats}</p>
                      </>
                    )}
                  </div>
                </div>
              </section>
            </>
          ) : (
            /* Inventory View - Styled to match */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {inventory.length > 0 ? inventory.map((item: any) => (
                <div
                  key={item.id}
                  onClick={() => {
                    // Map DB item to Project type before selecting
                    const project: Project = {
                      id: item.id.toString(),
                      title: item.title,
                      maker: item.metadata?.maker_name || userNickname || 'Maker',
                      image: item.image_url,
                      images: item.metadata?.images || [],
                      category: item.category,
                      time: item.estimated_time,
                      difficulty: item.difficulty,
                      isAiRemix: item.is_ai_generated,
                      description: item.metadata?.description || item.description,
                      steps: item.metadata?.fabrication_guide || [],
                      downloadUrl: item.metadata?.download_url,
                      modelFiles: item.metadata?.model_files || [],
                      isPublic: item.is_public,
                      ownerId: item.owner_id,
                      likes: item.likes,
                      views: item.views,
                      createdAt: item.created_at,
                      tools: item.metadata?.tools || item.required_tools,
                      material: item.material
                    };
                    onSelectProject(project);
                  }}
                  className="bg-white p-6 rounded-[2rem] shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)] border border-gray-100 hover:shadow-lg transition-all cursor-pointer group"
                >
                  <div className="aspect-video bg-slate-100 rounded-2xl mb-4 overflow-hidden relative">
                    <img src={item.image_url || 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80'} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur px-2 py-1 rounded-lg text-[10px] font-bold text-[#10b77f] shadow-sm uppercase">{item.category}</div>
                  </div>
                  <h4 className="font-bold text-slate-900 mb-1 group-hover:text-[#10b77f] transition-colors">{item.title}</h4>
                  <p className="text-xs text-slate-500 mb-4">{item.material}</p>
                  <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                    <div className="flex items-center gap-1 text-xs font-semibold text-slate-600">
                      <Clock className="w-3 h-3" /> {item.estimated_time}
                    </div>
                    <button className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-[#10b77f] group-hover:text-white transition-all">
                      <ArrowUpRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )) : (
                <div className="col-span-full py-20 text-center">
                  <p className="text-slate-400 font-medium">{t.inventory.noItems}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminUpload;