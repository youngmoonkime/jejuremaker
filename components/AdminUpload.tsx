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
  AlertTriangle
} from 'lucide-react';
import { SupabaseClient } from '@supabase/supabase-js';
import { Project } from '../types';
import { Language } from '../App';

// --- Cloudflare R2 Configuration ---
// 주의: 실제 프로덕션 환경에서는 이 키들을 환경변수(.env)로 관리하거나 
// 서버(Supabase Edge Function)에서 서명된 URL을 생성하여 사용하는 것이 보안상 안전합니다.
import { config } from '../services/config';
import { uploadToR2, isR2Configured as checkR2Config } from '../services/r2Storage';

// Max file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

interface AdminUploadProps {
  supabase: SupabaseClient;
  onBack: () => void;
  onUploadComplete: (project: Project) => void;
  language: Language;
  user: any;
}

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

const AdminUpload: React.FC<AdminUploadProps> = ({ supabase, onBack, onUploadComplete, language, user }) => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'inventory'
  const [inventory, setInventory] = useState([]);

  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  // R2 File State - Changed to array for multiple files
  const [modelFiles, setModelFiles] = useState<File[]>([]);
  const [isR2Configured, setIsR2Configured] = useState(false);

  const t = TRANSLATIONS[language];

  const [formData, setFormData] = useState({
    title: '',
    material: 'Old Denim Jeans',
    category: 'Furniture',
    difficulty: 'Intermediate',
    co2: '1.2',
    time: '',
    isAI: false,
    tools: '',
    steps: [
      { title: '', desc: '', tip: '' }
    ]
  });

  // Check R2 Configuration on mount
  useEffect(() => {
    if (checkR2Config()) {
      setIsR2Configured(true);
    }
  }, []);

  // --- Inventory Data Fetching & Bucket Check ---
  const fetchInventory = async () => {
    try {
      const { data, error } = await supabase
        .from('items')
        .select('*')
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
    // Attempt to initialize storage bucket if it doesn't exist
    const ensureBucket = async () => {
      try {
        const { data: buckets } = await supabase.storage.listBuckets();
        // If we can list buckets and 'item-images' is missing, try to create it
        if (buckets && !buckets.find(b => b.name === 'item-images')) {
          const { error } = await supabase.storage.createBucket('item-images', {
            public: true,
            fileSizeLimit: 5242880, // 5MB
            allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp']
          });
          if (error) console.warn("Auto-bucket creation failed (likely permissions):", error.message);
          else console.log("Created 'item-images' bucket successfully.");
        }
      } catch (e) {
        // Silently fail if listing/creating is restricted (common for anon keys)
        console.debug("Storage initialization skipped (permissions)");
      }
    };
    ensureBucket();

    if (activeTab === 'inventory') {
      fetchInventory();
    }
  }, [activeTab]);

  // --- Step Management Handlers ---
  const addStep = () => {
    setFormData({
      ...formData,
      steps: [...formData.steps, { title: '', desc: '', tip: '' }]
    });
  };

  const removeStep = (index: number) => {
    const newSteps = formData.steps.filter((_, i) => i !== index);
    setFormData({ ...formData, steps: newSteps });
  };

  const updateStep = (index: number, field: string, value: string) => {
    const newSteps = [...formData.steps];
    (newSteps[index] as any)[field] = value;
    setFormData({ ...formData, steps: newSteps });
  };

  // --- Handlers ---
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles: File[] = Array.from(e.target.files as FileList);
      setImageFiles(prev => [...prev, ...newFiles]);
      const newUrls = newFiles.map(file => URL.createObjectURL(file));
      setPreviewUrls(prev => [...prev, ...newUrls]);
    }
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



  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (imageFiles.length === 0) { alert(t.visuals.selectImage); return; }

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

      const finalImageUrl = uploadedImageUrls[0] || 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80';

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

      // 3. Save Data to Database using Supabase SDK
      const { data: insertData, error: insertError } = await supabase
        .from('items')
        .insert([
          {
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
            owner_id: user?.id, // Required for RLS policy
            metadata: {
              fabrication_guide: formData.steps,
              model_files: uploadedModels, // Store array of files
              download_url: uploadedModels.length > 0 ? uploadedModels[0].url : '', // Fallback backward compatibility
              images: uploadedImageUrls // 모든 이미지 URL
            }
          }
        ])
        .select();

      if (insertError) throw insertError;

      alert(t.alert.success);

      const newProject: Project = {
        id: Date.now().toString(),
        title: formData.title,
        maker: 'Master Kim',
        image: finalImageUrl,
        images: uploadedImageUrls, // 모든 이미지 URL
        category: formData.category,
        time: formData.time || '2h',
        difficulty: formData.difficulty as 'Easy' | 'Medium' | 'Hard',
        isAiRemix: formData.isAI,
        description: `Project: ${formData.title}. Material: ${formData.material}`,
        steps: formData.steps,
        downloadUrl: uploadedModels.length > 0 ? uploadedModels[0].url : '',
        modelFiles: uploadedModels
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
    <div className="flex h-screen w-full bg-[#f6f8f7] text-slate-900 font-sans selection:bg-[#10b77f] selection:text-white overflow-hidden">

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
            <button
              onClick={() => setActiveTab('inventory')}
              className={`flex items-center gap-3 px-4 py-3 rounded-full transition-all group ${activeTab === 'inventory' ? 'bg-[#10b77f] text-white shadow-[0_0_15px_rgba(16,183,127,0.3)]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
              <HardDrive className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <p className="text-sm font-medium hidden lg:block">{t.sidebar.inventory}</p>
            </button>
            <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-full text-gray-400 hover:text-white hover:bg-white/5 transition-colors group">
              <Users className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <p className="text-sm font-medium hidden lg:block">{t.sidebar.users}</p>
            </a>
          </nav>
        </div>
        <div className="p-6">
          <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-full text-gray-400 hover:text-white hover:bg-white/5 transition-colors group">
            <Settings className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <p className="text-sm font-medium hidden lg:block">{t.sidebar.settings}</p>
          </a>
          <div className="mt-4 flex items-center gap-3 px-4 py-3 border-t border-white/10 pt-6">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-white text-xs font-bold border border-white/20">
              MK
            </div>
            <div className="hidden lg:block">
              <p className="text-white text-xs font-semibold">Master Kim</p>
              <p className="text-gray-500 text-[10px]">{t.sidebar.superAdmin}</p>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-full overflow-y-auto relative bg-[#f6f8f7]">
        {/* Header - Design preserved */}
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-gray-200/50 px-8 py-5 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              {activeTab === 'upload' ? t.header.uploadTitle : t.header.inventoryTitle}
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              {activeTab === 'upload' ? t.header.uploadDesc : t.header.inventoryDesc}
            </p>
          </div>
          {activeTab === 'upload' && (
            <div className="flex gap-3">
              <button className="px-6 py-2.5 rounded-full text-slate-600 font-medium text-sm hover:bg-slate-100 transition-colors">{t.header.saveDraft}</button>
              <button
                onClick={handleUpload}
                disabled={loading}
                className="px-6 py-2.5 rounded-full bg-[#10b77f] text-white font-medium text-sm shadow-lg shadow-[#10b77f]/30 hover:shadow-[#10b77f]/50 hover:-translate-y-0.5 transition-all flex items-center gap-2 disabled:opacity-50"
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
                <div className="bg-white p-8 rounded-[2rem] shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)] border border-gray-100 flex flex-col gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-slate-700 text-sm font-semibold ml-2">{t.basicInfo.projectTitle}</label>
                    <input
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full bg-slate-50 border-0 text-slate-900 rounded-full px-6 py-4 focus:ring-2 focus:ring-[#10b77f]/20 focus:bg-white transition-all placeholder:text-slate-400 font-medium outline-none"
                      placeholder={t.basicInfo.projectTitlePlaceholder}
                      type="text"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-2">
                      <label className="text-slate-700 text-sm font-semibold ml-2">{t.basicInfo.material}</label>
                      <div className="relative">
                        <select
                          value={formData.material}
                          onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                          className="w-full bg-slate-50 border-0 text-slate-900 rounded-full px-6 py-4 appearance-none focus:ring-2 focus:ring-[#10b77f]/20 focus:bg-white transition-all font-medium outline-none"
                        >
                          <option>Old Denim Jeans</option>
                          <option>Plastic Bottles (PET)</option>
                          <option>Discarded Wood Pallets</option>
                          <option>Glass Bottles</option>
                          <option>Coffee Grounds</option>
                          <option>Waste Plastic</option>
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
                          className="w-full bg-slate-50 border-0 text-slate-900 rounded-full px-6 py-4 focus:ring-2 focus:ring-[#10b77f]/20 focus:bg-white transition-all placeholder:text-slate-400 font-medium outline-none"
                          placeholder={t.basicInfo.timePlaceholder}
                          type="text"
                        />
                        <Clock className="w-5 h-5 absolute right-5 top-1/2 -translate-y-1/2 text-slate-400" />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-2">
                      <label className="text-slate-700 text-sm font-semibold ml-2">{t.basicInfo.category}</label>
                      <div className="relative">
                        <select
                          value={formData.category}
                          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                          className="w-full bg-slate-50 border-0 text-slate-900 rounded-full px-6 py-4 appearance-none focus:ring-2 focus:ring-[#10b77f]/20 focus:bg-white transition-all font-medium outline-none"
                        >
                          {['Furniture', 'Home Decor', 'Kitchen', 'Fashion', 'Art'].map(cat => <option key={cat}>{cat}</option>)}
                        </select>
                        <ChevronRight className="w-5 h-5 absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none rotate-90" />
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-slate-700 text-sm font-semibold ml-2">{t.basicInfo.tools}</label>
                      <input
                        value={formData.tools}
                        onChange={(e) => setFormData({ ...formData, tools: e.target.value })}
                        className="w-full bg-slate-50 border-0 text-slate-900 rounded-full px-6 py-4 focus:ring-2 focus:ring-[#10b77f]/20 focus:bg-white transition-all placeholder:text-slate-400 font-medium outline-none"
                        placeholder={t.basicInfo.toolsPlaceholder}
                        type="text"
                      />
                    </div>
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
                      <div className={`w-full bg-slate-50 border-2 border-dashed ${modelFiles.length > 0 ? 'border-[#10b77f] bg-[#10b77f]/5' : 'border-slate-200'} rounded-2xl px-6 py-8 flex flex-col items-center justify-center text-center transition-all group-hover:border-[#10b77f]/50 group-hover:bg-slate-100`}>
                        {modelFiles.length > 0 ? (
                          <div className="w-full flex flex-col gap-2">
                            <div className="flex items-center justify-center gap-2 text-[#10b77f] mb-2">
                              <FileBox className="w-6 h-6" />
                              <span className="font-bold">{modelFiles.length} files selected</span>
                            </div>
                            <div className="grid gap-2 max-h-48 overflow-y-auto w-full px-2 z-20">
                              {modelFiles.map((file, idx) => (
                                <div key={idx} className="flex items-center justify-between bg-white p-3 rounded-xl border border-[#10b77f]/20 shadow-sm relative z-20">
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
                      <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-gray-100">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-xl transition-colors ${formData.isAI ? 'bg-primary/20 text-primary' : 'bg-gray-200 text-gray-500'}`}>
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
                          className={`w-12 h-6 rounded-full transition-all relative ${formData.isAI ? 'bg-primary' : 'bg-gray-300'}`}
                        >
                          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.isAI ? 'right-1' : 'left-1'}`}></div>
                        </button>
                      </div>

                      {/* Difficulty Selector */}
                      <div className="flex flex-col gap-2">
                        <label className="text-slate-700 text-[10px] font-bold uppercase tracking-wider ml-2">{t.basicInfo.difficulty}</label>
                        <div className="flex p-1 bg-slate-100 rounded-full w-full">
                          {['Easy', 'Intermediate', 'Advanced'].map((level) => (
                            <button
                              key={level}
                              type="button"
                              onClick={() => setFormData({ ...formData, difficulty: level })}
                              className={`flex-1 py-2 rounded-full text-xs font-bold transition-all ${formData.difficulty === level ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
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
                    <div key={index} className="group bg-white p-6 rounded-[2rem] shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)] border border-gray-100 relative hover:border-[#10b77f]/30 transition-colors">
                      <div className="absolute left-6 top-6 bg-slate-100 text-slate-600 size-8 rounded-full flex items-center justify-center font-bold text-sm">{index + 1}</div>

                      {formData.steps.length > 1 && (
                        <button onClick={() => removeStep(index)} className="absolute right-6 top-6 text-slate-300 hover:text-rose-500 transition-colors">
                          <X className="w-5 h-5" />
                        </button>
                      )}

                      <div className="pl-12 flex flex-col gap-4">
                        <input
                          value={step.title}
                          onChange={(e) => updateStep(index, 'title', e.target.value)}
                          className="w-full bg-transparent border-0 border-b border-gray-200 text-slate-900 px-0 py-2 focus:ring-0 focus:border-[#10b77f] text-lg font-semibold placeholder:text-slate-300 transition-colors"
                          placeholder={t.steps.stepTitle}
                          type="text"
                        />
                        <textarea
                          value={step.desc}
                          onChange={(e) => updateStep(index, 'desc', e.target.value)}
                          className="w-full bg-slate-50 border-0 text-slate-600 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-[#10b77f]/20 transition-all resize-none text-sm leading-relaxed"
                          placeholder={t.steps.descPlaceholder}
                          rows={3}
                        ></textarea>
                        <div className="bg-yellow-50 border border-yellow-100 rounded-2xl p-4 flex gap-3 items-start">
                          <Lightbulb className="text-yellow-500 w-5 h-5 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-xs font-bold text-yellow-700 uppercase mb-1">{t.steps.expertTip}</p>
                            <input
                              value={step.tip}
                              onChange={(e) => updateStep(index, 'tip', e.target.value)}
                              className="w-full bg-transparent border-0 p-0 text-sm text-yellow-900 placeholder:text-yellow-900/40 focus:ring-0"
                              placeholder={t.steps.tipPlaceholder}
                              type="text"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  <button
                    onClick={addStep}
                    className="w-full py-4 rounded-[2rem] border-2 border-dashed border-slate-200 text-slate-400 hover:border-[#10b77f] hover:text-[#10b77f] hover:bg-[#10b77f]/5 transition-all flex items-center justify-center gap-2 group"
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
                  <h3 className="text-lg font-bold text-slate-800">{t.visuals.title}</h3>
                </div>
                <div className="bg-white p-8 rounded-[2rem] shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)] border border-gray-100">
                  <div className="w-full min-h-64 rounded-3xl bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-100 hover:border-[#10b77f]/50 transition-all group relative overflow-hidden">
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
                        <div className="bg-white p-4 rounded-full shadow-sm mb-4 group-hover:scale-110 transition-transform duration-300">
                          <UploadCloud className="text-[#10b77f] w-8 h-8" />
                        </div>
                        <h4 className="text-slate-900 font-semibold text-lg">{t.visuals.dragDrop}</h4>
                        <p className="text-slate-500 text-sm mt-1">{t.visuals.formats}</p>
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
                <div key={item.id} className="bg-white p-6 rounded-[2rem] shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)] border border-gray-100 hover:shadow-lg transition-all">
                  <div className="aspect-video bg-slate-100 rounded-2xl mb-4 overflow-hidden relative">
                    <img src={item.image_url || 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80'} alt={item.title} className="w-full h-full object-cover" />
                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur px-2 py-1 rounded-lg text-[10px] font-bold text-[#10b77f] shadow-sm uppercase">{item.category}</div>
                  </div>
                  <h4 className="font-bold text-slate-900 mb-1">{item.title}</h4>
                  <p className="text-xs text-slate-500 mb-4">{item.material}</p>
                  <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                    <div className="flex items-center gap-1 text-xs font-semibold text-slate-600">
                      <Clock className="w-3 h-3" /> {item.estimated_time}
                    </div>
                    <button className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-[#10b77f] hover:text-white transition-all">
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
      </main >
    </div >
  );
};

export default AdminUpload;