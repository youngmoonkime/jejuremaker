import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Upload, 
  Plus, 
  Trash2, 
  Save, 
  Image as ImageIcon, 
  Sparkles, 
  Leaf, 
  AlertCircle,
  FileCode,
  Loader2,
  HardDrive,
  Settings,
  ArrowUpRight,
  Eye,
  FileText,
  Clock,
  Hammer,
  ChevronRight,
  ListChecks,
  PlusCircle,
  X,
  Lightbulb,
  Recycle,
  UploadCloud,
  Users,
  LayoutGrid,
  Info,
  Menu,
  CheckCircle2
} from 'lucide-react';
import { Project } from '../types';
import { Language } from '../App';

// --- Configuration ---
const supabaseUrl = 'https://jbkfsvinitavzyflcuwg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impia2ZzdmluaXRhdnp5ZmxjdXdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0MDAxOTUsImV4cCI6MjA4NDk3NjE5NX0.Nn3_-8Oky-yZ7VwFiiWbhxKdWfqOSz1ddj93fztfMak';

interface AdminUploadProps {
  onBack: () => void;
  onUploadComplete: (project: Project) => void;
  language: Language;
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
      success: '✅ 성공: 이미지와 상세 제작 가이드가 모두 저장되었습니다.',
      error: '❌ 오류: '
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
      success: '✅ Success: Image and detailed guide saved.',
      error: '❌ Error: '
    },
    inventory: {
      noItems: 'No items found in inventory.'
    }
  }
};

const AdminUpload: React.FC<AdminUploadProps> = ({ onBack, onUploadComplete, language }) => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'inventory'
  const [inventory, setInventory] = useState([]);
  
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  
  const t = TRANSLATIONS[language];

  const [formData, setFormData] = useState({
    title: '',
    material: 'Old Denim Jeans',
    category: 'Furniture',
    difficulty: 'Intermediate',
    co2: '1.2',
    time: '',
    isAI: true,
    tools: '',
    // 제작 가이드 스텝 데이터
    steps: [
      { title: '', desc: '', tip: '' }
    ]
  });

  // --- Inventory Data Fetching ---
  const fetchInventory = async () => {
    if (!supabaseKey) return;
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/items?select=*&order=created_at.desc`, {
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey
        }
      });
      if (response.ok) {
        const data = await response.json();
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
      steps: [...formData.steps, { title: '', desc: '', tip: '' }]
    });
  };

  const removeStep = (index) => {
    const newSteps = formData.steps.filter((_, i) => i !== index);
    setFormData({ ...formData, steps: newSteps });
  };

  const updateStep = (index, field, value) => {
    const newSteps = [...formData.steps];
    newSteps[index][field] = value;
    setFormData({ ...formData, steps: newSteps });
  };

  // --- Handlers ---
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!imageFile) { alert(t.visuals.selectImage); return; }

    setLoading(true);
    try {
      // 1. 이미지 업로드
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const storageUrl = `${supabaseUrl}/storage/v1/object/item-images/${fileName}`;

      const storageResponse = await fetch(storageUrl, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${supabaseKey}`, 'apikey': supabaseKey },
        body: imageFile
      });

      if (!storageResponse.ok) throw new Error("이미지 업로드 실패");

      const publicUrl = `${supabaseUrl}/storage/v1/object/public/item-images/${fileName}`;

      // 2. 데이터 저장 (가이드 스텝 포함)
      const dbResponse = await fetch(`${supabaseUrl}/rest/v1/items`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          title: formData.title,
          material: formData.material,
          category: formData.category,
          difficulty: formData.difficulty,
          co2_reduction: parseFloat(formData.co2),
          estimated_time: formData.time,
          required_tools: formData.tools,
          image_url: publicUrl,
          is_ai_generated: formData.isAI,
          metadata: {
            fabrication_guide: formData.steps
          }
        })
      });

      if (!dbResponse.ok) throw new Error("데이터 저장 실패");

      alert(t.alert.success);
      
      // Navigate back and update main list
      const newProject: Project = {
        id: Date.now().toString(),
        title: formData.title,
        maker: 'Master Kim',
        image: publicUrl,
        category: formData.category,
        time: formData.time || '2h',
        difficulty: formData.difficulty as 'Easy' | 'Medium' | 'Hard',
        isAiRemix: formData.isAI,
        description: `Project: ${formData.title}. Material: ${formData.material}`,
        steps: formData.steps
      };
      
      onUploadComplete(newProject);
      
    } catch (error) {
      alert(`${t.alert.error}${error.message}`);
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
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
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
                          onChange={(e) => setFormData({...formData, material: e.target.value})}
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
                          onChange={(e) => setFormData({...formData, time: e.target.value})}
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
                            onChange={(e) => setFormData({...formData, category: e.target.value})}
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
                          onChange={(e) => setFormData({...formData, tools: e.target.value})}
                          className="w-full bg-slate-50 border-0 text-slate-900 rounded-full px-6 py-4 focus:ring-2 focus:ring-[#10b77f]/20 focus:bg-white transition-all placeholder:text-slate-400 font-medium outline-none" 
                          placeholder={t.basicInfo.toolsPlaceholder} 
                          type="text" 
                        />
                     </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-slate-700 text-sm font-semibold ml-2">{t.basicInfo.difficulty}</label>
                    <div className="flex p-1 bg-slate-100 rounded-full w-fit">
                      {['Easy', 'Intermediate', 'Advanced'].map((level) => (
                        <button 
                          key={level}
                          type="button"
                          onClick={() => setFormData({...formData, difficulty: level})}
                          className={`px-6 py-2 rounded-full text-sm font-semibold transition-all ${formData.difficulty === level ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                          {t.basicInfo.diffLevels[level] || level}
                        </button>
                      ))}
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
                  <div className="w-full h-64 rounded-3xl bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-100 hover:border-[#10b77f]/50 transition-all group relative overflow-hidden">
                    <input className="absolute inset-0 opacity-0 cursor-pointer z-10" type="file" accept="image/*" onChange={handleImageChange} />
                    {previewUrl ? (
                      <img src={previewUrl} className="w-full h-full object-cover rounded-2xl" alt="Preview" />
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
              {inventory.length > 0 ? inventory.map((item) => (
                <div key={item.id} className="bg-white p-6 rounded-[2rem] shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)] border border-gray-100 hover:shadow-lg transition-all">
                  <div className="aspect-video bg-slate-100 rounded-2xl mb-4 overflow-hidden relative">
                    <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
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
      </main>
    </div>
  );
};

export default AdminUpload;