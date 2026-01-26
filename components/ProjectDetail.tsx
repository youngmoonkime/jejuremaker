import React from 'react';
import { Language } from '../App';

interface ProjectDetailProps {
  onBack: () => void;
  onOpenWorkspace: () => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  language: Language;
  toggleLanguage: () => void;
}

const TRANSLATIONS = {
  ko: {
    backToLibrary: '라이브러리로 돌아가기',
    view3D: '3D 뷰어',
    measure: '측정',
    section: '단면',
    explode: '분해',
    material: '재질',
    view3DButton: '3D 보기',
    generateBlueprint: '도면 생성',
    plastic: '재활용 플라스틱',
    printing: '3D 프린팅',
    title: '현무암 화분 04',
    description: '자연 현무암 암석 형상을 닮도록 디자인된 미니멀리스트 화분입니다. 폐플라스틱 병에서 추출한 rPETG 프린팅에 최적화되었습니다.',
    ecoScore: '에코 점수',
    carbonReduction: '탄소 절감',
    impactDesc: '약 20개의 플라스틱 병이 매립되는 것을 방지합니다.',
    findMaker: '메이커 찾기',
    downloadGuide: '가이드 다운로드',
    printTime: '출력 시간',
    difficulty: '난이도',
    filament: '필라멘트',
    license: '라이선스',
    fabricationGuide: '제작 가이드',
    steps: [
      { id: '01', title: '준비 및 슬라이싱', desc: '프린트 베드가 깨끗한지 확인하세요. 표준 품질은 0.4mm 노즐, 빠른 초안은 0.6mm를 사용하세요. 슬라이서 설정에서 "Vase Mode"(나선형 외곽선)를 활성화하세요.', tip: '레이어 접착력을 높이려면 유량을 5% 늘리세요.' },
      { id: '02', title: '프린팅', desc: '첫 번째 레이어를 주의 깊게 모니터링하세요. 현무암 질감은 레이어 라인을 잘 숨기지만 일관성이 중요합니다. rPETG 권장 온도는 240°C입니다.' },
      { id: '03', title: '후가공', desc: '히트 건으로 거미줄 현상을 제거하세요. 방수가 중요하다면 내부에 에폭시 수지나 특수 실런트를 얇게 코팅하세요.' },
      { id: '04', title: '조립', desc: '본체 아래에 받침대를 놓으세요. 흙을 채우고 좋아하는 식물을 심으세요.' }
    ],
    footer: '© 2024 Project Cyclical. 오픈 지속가능 디자인.'
  },
  en: {
    backToLibrary: 'Back to Library',
    view3D: '3D Viewer',
    measure: 'Measure',
    section: 'Section',
    explode: 'Explode',
    material: 'Material',
    view3DButton: '3D View',
    generateBlueprint: 'Generate Blueprint',
    plastic: 'Upcycled Plastic',
    printing: '3D Printing',
    title: 'Basalt Pot 04',
    description: 'A minimalist planter designed to resemble natural basalt rock formations. Optimized for rPETG printing from waste plastic bottles.',
    ecoScore: 'Eco Score',
    carbonReduction: 'Carbon Reduction',
    impactDesc: 'Prevents approx. 20 bottles from entering landfills.',
    findMaker: 'Find Maker',
    downloadGuide: 'Download Guide',
    printTime: 'Print Time',
    difficulty: 'Difficulty',
    filament: 'Filament',
    license: 'License',
    fabricationGuide: 'Fabrication Guide',
    steps: [
      { id: '01', title: 'Preparation & Slicing', desc: 'Ensure your print bed is clean. Use a 0.4mm nozzle for standard quality or 0.6mm for faster drafting. Enable "Vase Mode" (Spiralize Outer Contour) in your slicer settings.', tip: 'Increase flow rate by 5% for better layer adhesion.' },
      { id: '02', title: 'Printing', desc: 'Monitor the first layer closely. The basalt texture hides layer lines well, but consistency is key. Recommended temperature for rPETG is 240°C.' },
      { id: '03', title: 'Post-Processing', desc: 'Remove stringing with a heat gun. If water-tightness is critical, coat the interior with a thin layer of epoxy resin or a specialized sealant.' },
      { id: '04', title: 'Assembly', desc: 'Place the saucer under the main body. Fill with soil and your favorite plant.' }
    ],
    footer: '© 2024 Project Cyclical. Open Sustainable Design.'
  }
};

const ProjectDetail: React.FC<ProjectDetailProps> = ({ onBack, onOpenWorkspace, isDarkMode, toggleDarkMode, language, toggleLanguage }) => {
  const t = TRANSLATIONS[language];

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark text-gray-900 dark:text-gray-100 font-display transition-colors duration-300">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 transition-colors">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <button onClick={onBack} className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors group">
            <span className="material-icons-round text-xl group-hover:-translate-x-1 transition-transform">chevron_left</span>
            <span className="font-medium text-sm tracking-wide">{t.backToLibrary}</span>
          </button>
          <div className="flex items-center space-x-4">
             {/* Language Toggle */}
             <button 
              onClick={toggleLanguage}
              className="px-3 py-1.5 rounded-lg font-bold text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              {language === 'ko' ? 'EN' : '한국어'}
            </button>

            {/* Dark Mode Toggle */}
            <button 
              onClick={toggleDarkMode}
              className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
            >
              <span className="material-icons-round">{isDarkMode ? 'light_mode' : 'dark_mode'}</span>
            </button>
            <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-2"></div>
            <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500 dark:text-gray-400">
              <span className="material-icons-round">search</span>
            </button>
            <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500 dark:text-gray-400">
              <span className="material-icons-round">bookmark_border</span>
            </button>
            <div className="w-8 h-8 bg-gradient-to-br from-gray-200 to-gray-400 rounded-full border border-white dark:border-gray-700 shadow-sm"></div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Left Column: Visuals */}
          <div className="lg:col-span-8 space-y-8">
            <div className="relative w-full aspect-video rounded-3xl overflow-hidden bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-800 group select-none transition-colors">
              <img 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDfv7rlXQezFNRd55ViDyVQxZHy5hmFeJRXuYnIhyBrqgo6LsrhVYeZKMz0Mhkh3SM8YgXWYE8qI8_RMrYNIAEJKuWxoO9Wo2s-xMLQKI7o6W0Jfaw_ASJFO3TLZHM35y9JiY1bjQqF-zcsSKoVkW980qHM3rsSDBkRaH6xYmQehOScGrNFCt7L78QxSK__Ljxwcv05op5YxYRS3fRAQLmMyiiiQ5-rMV71Mh-zSiVnCOO856cB0S6IrvFPabp6DIRjOMalBsw9bno" 
                alt="Basalt-style planter" 
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" 
              />
              
              {/* Overlay UI */}
              <div className="absolute inset-0 pointer-events-none z-10">
                <div className="absolute inset-0 opacity-10 grid-pattern"></div>
                {/* SVG Overlay for measurements */}
                <svg className="w-full h-full absolute inset-0" viewBox="0 0 800 450" preserveAspectRatio="none">
                  <defs>
                    <filter id="text-shadow" x="-20%" y="-20%" width="140%" height="140%">
                      <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="black" floodOpacity="0.8"/>
                    </filter>
                  </defs>
                  <line x1="520" y1="80" x2="520" y2="370" stroke="white" strokeWidth="1.5" strokeDasharray="6 4" opacity="0.9" filter="url(#text-shadow)"/>
                  <line x1="510" y1="80" x2="530" y2="80" stroke="white" strokeWidth="1.5" filter="url(#text-shadow)"/>
                  <line x1="510" y1="370" x2="530" y2="370" stroke="white" strokeWidth="1.5" filter="url(#text-shadow)"/>
                  <g filter="url(#text-shadow)">
                    <rect x="530" y="215" width="76" height="28" rx="6" fill="#18181b" fillOpacity="0.85" stroke="rgba(255,255,255,0.2)" strokeWidth="1"/>
                    <text x="568" y="234" textAnchor="middle" fill="white" fontFamily="Inter, sans-serif" fontSize="13" fontWeight="600">250 mm</text>
                  </g>
                </svg>
              </div>

              <div className="absolute top-6 left-6 flex space-x-2 z-20">
                <span className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-semibold uppercase tracking-wider shadow-sm flex items-center gap-2 border border-white/50">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                  {t.view3D}
                </span>
              </div>

              {/* Floating Toolbar */}
              <div className="absolute bottom-6 left-0 right-0 flex justify-center z-30 px-4 pointer-events-auto">
                <div className="flex items-center p-1.5 bg-gray-900/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl ring-1 ring-black/30">
                  <button onClick={onOpenWorkspace} className="flex flex-col items-center justify-center w-16 h-14 rounded-xl bg-white/10 text-white shadow-inner ring-1 ring-white/20 transition-all mr-1 group hover:bg-white/20">
                    <span className="material-icons-round text-xl mb-1 text-primary-light">straighten</span>
                    <span className="text-[10px] font-medium tracking-wide">{t.measure}</span>
                  </button>
                  <button onClick={onOpenWorkspace} className="flex flex-col items-center justify-center w-16 h-14 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all mr-1 group">
                    <span className="material-icons-round text-xl mb-1 group-hover:scale-110 transition-transform">content_cut</span>
                    <span className="text-[10px] font-medium tracking-wide opacity-80 group-hover:opacity-100">{t.section}</span>
                  </button>
                  <button onClick={onOpenWorkspace} className="flex flex-col items-center justify-center w-16 h-14 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all mr-1 group">
                    <span className="material-icons-round text-xl mb-1 group-hover:scale-110 transition-transform">category</span>
                    <span className="text-[10px] font-medium tracking-wide opacity-80 group-hover:opacity-100">{t.explode}</span>
                  </button>
                  <button onClick={onOpenWorkspace} className="flex flex-col items-center justify-center w-16 h-14 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all mr-2 group">
                    <span className="material-icons-round text-xl mb-1 group-hover:scale-110 transition-transform">palette</span>
                    <span className="text-[10px] font-medium tracking-wide opacity-80 group-hover:opacity-100">{t.material}</span>
                  </button>
                  <div className="w-px h-8 bg-white/10 mx-1"></div>
                  <button className="flex items-center justify-center w-10 h-14 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all group">
                    <span className="material-icons-round text-xl group-hover:rotate-180 transition-transform duration-500">refresh</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Thumbnails & Actions */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="flex space-x-4 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
                <button className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-primary shadow-sm flex-shrink-0 transition-transform hover:scale-105">
                  <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuD0cnvxfgp4IMiCJCF5Kgc-rmjnp6gZ58FQ8i4B6eo0_IY_sxXOmgvcSVdxyqjRCQKa02Huv2RTB-cq1bub4YAMnnMFAVm6SYRzI0nCbMjVIH9mkqmZDpjfml8ROouMP7OIjGWaMsqt4XcvDfzCoM2CN0I3HXNjAMi_-VKAmpDIIkAztVwySRMh7VAkVri6Ir--b-Sd6gj57zwupZztDABNTuXbA6Y0nDir-C406FryZm-hzjg5Bpu_1wfee1xgDjSBobfKotqRWHo" alt="Thumb 1" className="w-full h-full object-cover" />
                </button>
                <button className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 opacity-60 hover:opacity-100 transition-all flex-shrink-0 hover:scale-105">
                  <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuC8dnJEdd-sZCCp1IsNUHEf2W0vy8QvD93_mmNjP9ceXmnzF1HhX2JeWeZtbqe6mKscINC50w_1cciEiKWpkEJWmAqSYtptMVmnE9LBZ6YffinR8Iq2Bo1YH9rkGK76l4ehRSJ5xpXDX_7PYvMD9e1XEu9uR7nS2cceNhwy13ZHoWjGntG3lVDFfOvya65bIReJqvfxVE9utOqQ36sm5UEZlQgNahbqLdkx0laAhm-5b-2Dnfz1Dbs-9VhR0JTQPQFSeJbW0zDG2yc" alt="Thumb 2" className="w-full h-full object-cover" />
                </button>
                <button className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 opacity-60 hover:opacity-100 transition-all flex-shrink-0 bg-gray-50 dark:bg-gray-800 flex items-center justify-center hover:scale-105">
                  <span className="material-icons-round text-gray-400">3d_rotation</span>
                </button>
              </div>
              <div className="flex items-center space-x-3 w-full sm:w-auto">
                <button onClick={onOpenWorkspace} className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-5 py-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm font-semibold shadow-sm text-gray-700 dark:text-gray-200">
                  <span className="material-icons-round text-lg">view_in_ar</span>
                  <span>{t.view3DButton}</span>
                </button>
                <button className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-5 py-3 rounded-xl border border-dashed border-primary/50 text-primary bg-primary/5 hover:bg-primary/10 transition-colors text-sm font-semibold group">
                  <span className="material-icons-round text-lg group-hover:scale-110 transition-transform">architecture</span>
                  <span>{t.generateBlueprint}</span>
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
                  <span className="px-2.5 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-semibold rounded-md uppercase tracking-wide">{t.printing}</span>
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">{t.title}</h1>
                <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
                  {t.description}
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
                <button className="w-full py-4 px-6 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center space-x-2">
                  <span>{t.findMaker}</span>
                  <span className="material-icons-round text-sm">arrow_forward</span>
                </button>
                <button className="w-full py-4 px-6 bg-transparent border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center space-x-2">
                  <span className="material-icons-round">download</span>
                  <span>{t.downloadGuide}</span>
                </button>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4 mt-8 pt-8 border-t border-gray-100 dark:border-gray-700">
                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-xl">
                  <span className="block text-[10px] text-gray-400 dark:text-gray-300 uppercase tracking-wider font-bold mb-1">{t.printTime}</span>
                  <span className="block text-lg font-bold text-gray-900 dark:text-white">4h 20m</span>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-xl">
                  <span className="block text-[10px] text-gray-400 dark:text-gray-300 uppercase tracking-wider font-bold mb-1">{t.difficulty}</span>
                  <span className="block text-lg font-bold text-gray-900 dark:text-white">Medium</span>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-xl">
                  <span className="block text-[10px] text-gray-400 dark:text-gray-300 uppercase tracking-wider font-bold mb-1">{t.filament}</span>
                  <span className="block text-lg font-bold text-gray-900 dark:text-white">140g</span>
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
        </div>

        {/* Fabrication Guide */}
        <div className="mt-24 max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold mb-12 flex items-center space-x-3 text-gray-900 dark:text-white">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-icons-round">build</span>
            </div>
            <span>{t.fabricationGuide}</span>
          </h2>
          
          <div className="relative">
            <div className="absolute left-8 top-4 bottom-4 w-0.5 bg-gray-100 dark:bg-gray-800"></div>
            
            {t.steps.map((step, idx) => (
              <div key={step.id} className="relative pl-24 pb-12 group last:pb-0">
                <div className="absolute left-0 top-0 w-16 h-16 flex items-center justify-center bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-full z-10 shadow-sm group-hover:border-primary group-hover:shadow-lg group-hover:shadow-primary/20 transition-all duration-300">
                  <span className="text-xl font-bold text-gray-300 group-hover:text-primary transition-colors">{step.id}</span>
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
        </div>

        {/* Footer simple */}
        <footer className="mt-24 pt-12 border-t border-gray-200 dark:border-gray-800 flex flex-col items-center">
            <p className="text-gray-400 text-sm font-medium">{t.footer}</p>
        </footer>
      </main>
    </div>
  );
};

export default ProjectDetail;
