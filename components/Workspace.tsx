import React, { useState, useRef, useEffect } from 'react';
import { Message, ChatMode } from '../types';
import { Language } from '../App';

interface WorkspaceProps {
  onExit: () => void;
  language: Language;
  userTokens: number;
  setUserTokens: (tokens: number) => void;
  initialMode?: ChatMode;
  isAiProject?: boolean;
}

const TRANSLATIONS = {
  ko: {
    title: '현무암 스타일 화분 (협업)',
    subtitle: '제주 리메이커 작업실',
    liveSync: '실시간 동기화 활성',
    saveDraft: '초안 저장',
    finishExport: '완료 및 내보내기',
    viewport: '뷰포트',
    perspective: '원근 투영',
    orbit: '회전',
    pan: '이동',
    zoom: '확대/축소',
    verifiedMaker: '인증된 메이커',
    aiCopilot: 'AI 코파일럿 (Gemini)',
    online: '온라인',
    today: '오늘',
    shareBlueprint: '도면 공유',
    requestMod: '수정 요청',
    placeholder: '질문을 입력하세요...',
    view: '보기',
    modeHuman: '휴먼 전문가',
    modeAI: 'AI 코파일럿',
    tokenBalance: '보유 토큰',
    generating3D: '3D 모델 생성 중...',
    generatingImage: '이미지 생성 중...',
    cost3D: '💎 5 토큰',
    costImage: '💎 1 토큰',
    aiModeActive: 'AI 코파일럿 모드 활성화'
  },
  en: {
    title: 'Basalt Style Pot (Collaborative)',
    subtitle: 'Jeju Re-Maker Workspace',
    liveSync: 'Live Sync Active',
    saveDraft: 'Save Draft',
    finishExport: 'Finish & Export',
    viewport: 'VIEWPORT',
    perspective: 'Perspective',
    orbit: 'Orbit',
    pan: 'Pan',
    zoom: 'Zoom',
    verifiedMaker: 'Verified Maker',
    aiCopilot: 'AI Co-Pilot (Gemini)',
    online: 'Online',
    today: 'Today',
    shareBlueprint: 'Share Blueprint',
    requestMod: 'Request Mod',
    placeholder: 'Ask a question...',
    view: 'View',
    modeHuman: 'Human Expert',
    modeAI: 'AI Co-Pilot',
    tokenBalance: 'Tokens',
    generating3D: 'Generating 3D Model...',
    generatingImage: 'Generating Image...',
    cost3D: '💎 5 Tokens',
    costImage: '💎 1 Token',
    aiModeActive: 'AI Co-Pilot Mode Active'
  }
};

const INITIAL_MESSAGES: Message[] = [
  { id: '1', sender: 'expert', text: "Welcome to the collaborative space! I see you've imported the Basalt texture. It looks quite authentic.", timestamp: '10:23 AM', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCQktH3DenoThdgeDVlG9xdYEla3FDisOpT8PR36uqEcWdIFpSl7kAMY_Pcn94_KeJ10wtsmlDELj2A9bGn2ExGWjDWap_4wV_35vL82cz30KB7Sk7Y4gcEi3gFknpu-VaipcKYlBDl9FqLgg090jGddRM8JImT5UnIJ52FW9I7ktxhfCdjcZCnDEibQrdIjO7ReTalRE7ONj4avV1OvEkk_vw-yrxX-28NDfbVpBfPSF7-BPPgy5_-BBOsIvl4R5Iq4ozlyCyozH4' },
  { id: '2', sender: 'expert', text: "One thing to note: the geometry on the upper rim seems a bit sharp for this material. Basalt is usually more porous and eroded.", timestamp: '10:25 AM', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCQktH3DenoThdgeDVlG9xdYEla3FDisOpT8PR36uqEcWdIFpSl7kAMY_Pcn94_KeJ10wtsmlDELj2A9bGn2ExGWjDWap_4wV_35vL82cz30KB7Sk7Y4gcEi3gFknpu-VaipcKYlBDl9FqLgg090jGddRM8JImT5UnIJ52FW9I7ktxhfCdjcZCnDEibQrdIjO7ReTalRE7ONj4avV1OvEkk_vw-yrxX-28NDfbVpBfPSF7-BPPgy5_-BBOsIvl4R5Iq4ozlyCyozH4' },
  { id: '3', sender: 'user', text: "Good catch. I was trying to keep the poly count low, but I can add a bevel modifier.", timestamp: '10:27 AM' },
  { id: '4', sender: 'user', text: "How does this look now?", timestamp: '10:28 AM' },
  { id: '5', sender: 'system', text: "New Snapshot Created", timestamp: '10:28 AM', attachmentName: 'Rim_Modification_v2.obj' },
  { id: '6', sender: 'expert', text: "Much better! The light catches the edge more naturally now. Shall we move on to the base?", timestamp: '10:30 AM', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBJuv5jW3PtvXRBaHJipD8C2jBwY9z5xyycvtPQjyEKIVUNzbecvLQ3KztDNI6QclH3uABbHW20b0zs-0tnEJ2DhB9yFVpLTUbnY2R9C6fr4oOQ2HOhrtxYKTLzMyMkZ9npBmhC0aZa8F64tlNVVhJAXEONgy-vrHU2O5N9iyn-Nzh2-OTlr8zJiUouAct-_toZVyd7mfXR3kxarXLXmzON69ZIn5wm401zT1IOHfxA1CO1lbXhgrjnS6jW1im4IgGKH_sYDd3nb6w' },
];

const Workspace: React.FC<WorkspaceProps> = ({ onExit, language, userTokens, setUserTokens, initialMode = 'human', isAiProject = false }) => {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState('');
  const [chatMode, setChatMode] = useState<ChatMode>(initialMode);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [generated3DModel, setGenerated3DModel] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const t = TRANSLATIONS[language];

  // If isAiProject is true, force mode to AI (safety check)
  useEffect(() => {
      if (isAiProject && chatMode !== 'ai') {
          setChatMode('ai');
      }
  }, [isAiProject]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAiProcessing]);

  // AI Response Simulation
  const handleAiResponse = async (userQuery: string) => {
    setIsAiProcessing(true);
    const lowerQuery = userQuery.toLowerCase();
    
    // Simulate delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    let aiMessage: Message = {
        id: Date.now().toString(),
        sender: 'ai',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        avatar: 'https://cdn-icons-png.flaticon.com/512/4712/4712109.png' // AI Avatar
    };

    // 1. 3D Model Generation Logic (Simulated Tripo 3D)
    if (lowerQuery.includes('3d') || lowerQuery.includes('model') || lowerQuery.includes('모델')) {
        if (userTokens >= 5) {
            setUserTokens(userTokens - 5);
            
            // Initial acknowledgement
            setMessages(prev => [...prev, {
                ...aiMessage,
                text: language === 'ko' ? "3D 모델 생성을 시작합니다. (💎 5 토큰 차감)" : "Starting 3D model generation. (💎 5 tokens deducted)"
            }]);

            // Simulate longer processing for 3D
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            const newModelUrl = "https://mock-url.com/model.glb";
            setGenerated3DModel(newModelUrl); // Trigger viewer update
            
            aiMessage = {
                ...aiMessage,
                id: (Date.now() + 1).toString(),
                text: language === 'ko' ? "3D 모델이 생성되었습니다! 뷰어에서 확인해보세요." : "3D model generated! Check the viewer.",
                attachmentType: '3d_model',
                attachmentName: 'generated_pot_v1.glb',
                attachmentUrl: newModelUrl
            };
        } else {
             aiMessage.text = language === 'ko' ? "토큰이 부족합니다. (필요: 5, 보유: " + userTokens + ")" : "Insufficient tokens. (Required: 5, Balance: " + userTokens + ")";
        }
    } 
    // 2. Image Generation Logic (Simulated Gemini Imagen)
    else if (lowerQuery.includes('image') || lowerQuery.includes('picture') || lowerQuery.includes('이미지') || lowerQuery.includes('사진')) {
         if (userTokens >= 1) {
            setUserTokens(userTokens - 1);
            
            aiMessage = {
                ...aiMessage,
                text: language === 'ko' ? "요청하신 스타일의 이미지를 생성했습니다. (💎 1 토큰 차감)" : "Here is the image you requested. (💎 1 token deducted)",
                attachmentType: 'image',
                attachmentUrl: 'https://images.unsplash.com/photo-1583086683103-6058db6027a8?auto=format&fit=crop&w=600&q=80' // Mock generated image
            };
         } else {
            aiMessage.text = language === 'ko' ? "토큰이 부족합니다. (필요: 1, 보유: " + userTokens + ")" : "Insufficient tokens. (Required: 1, Balance: " + userTokens + ")";
         }
    }
    // 3. General Chat
    else {
        const responses = language === 'ko' ? [
            "좋은 아이디어네요! 현무암 질감을 더 살리려면 노이즈 텍스처를 추가해보는 건 어떨까요?",
            "재활용 플라스틱(rPETG)은 240도에서 출력하는 것이 가장 결합력이 좋습니다.",
            "이 디자인은 오버행이 적어서 서포트 없이도 출력이 가능해 보입니다."
        ] : [
            "That's a great idea! To enhance the basalt texture, maybe add some noise displacement?",
            "For rPETG, printing at 240°C usually yields the best layer adhesion.",
            "The overhangs look minimal, so you might be able to print this without supports."
        ];
        aiMessage.text = responses[Math.floor(Math.random() * responses.length)];
    }

    setMessages(prev => [...prev, aiMessage]);
    setIsAiProcessing(false);
  };

  const handleSendMessage = () => {
    if (!inputText.trim()) return;
    
    const newMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: inputText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages(prev => [...prev, newMessage]);
    
    const query = inputText;
    setInputText('');

    if (chatMode === 'ai') {
        handleAiResponse(query);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background-viewer overflow-hidden text-[#111814] font-display">
      {/* Top Navigation */}
      <header className="flex items-center justify-between whitespace-nowrap border-b border-white/10 bg-[#1a1a1a] px-6 py-3 shrink-0 z-20">
        <div className="flex items-center gap-4 text-white">
          <div className="w-9 h-9 flex items-center justify-center bg-primary/20 rounded-xl text-primary cursor-pointer hover:bg-primary/30 transition-colors" onClick={onExit}>
            <span className="material-symbols-outlined text-[20px]">hexagon</span>
          </div>
          <div>
            <h2 className="text-white text-base font-bold leading-tight tracking-[-0.015em]">{t.title}</h2>
            <span className="text-xs text-gray-400 font-medium">{t.subtitle}</span>
          </div>
        </div>
        <div className="flex flex-1 justify-end gap-6">
          <div className="flex items-center gap-3">
            {/* Token Balance Display */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-indigo-900/50 to-purple-900/50 rounded-full border border-indigo-500/30 backdrop-blur-sm mr-4">
                <span className="text-sm">💎</span>
                <span className="text-xs font-bold text-indigo-200">{userTokens}</span>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full border border-white/10 backdrop-blur-sm">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
              <span className="text-gray-300 text-xs font-medium">{t.liveSync}</span>
            </div>
          </div>
          <div className="flex gap-3">
            <button className="flex cursor-pointer items-center justify-center overflow-hidden rounded-xl h-9 px-4 bg-white/10 hover:bg-white/20 text-white text-sm font-bold leading-normal tracking-[0.015em] transition-colors border border-white/5">
              <span className="truncate">{t.saveDraft}</span>
            </button>
            <button className="flex cursor-pointer items-center justify-center overflow-hidden rounded-xl h-9 px-5 bg-primary hover:bg-primary-dark text-background-viewer text-sm font-bold leading-normal tracking-[0.015em] shadow-[0_0_15px_rgba(23,207,99,0.3)] transition-all" onClick={onExit}>
              <span className="truncate">{t.finishExport}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace Area */}
      <div className="flex flex-1 h-full overflow-hidden relative">
        {/* 3D Viewer (Left) */}
        <div className="flex-1 bg-[#111111] relative overflow-hidden group/viewer">
          {/* Grid Background */}
          <div className="absolute inset-0 grid-pattern opacity-30 pointer-events-none"></div>
          {/* Vignette */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.6)_100%)] pointer-events-none"></div>
          
          {/* 3D Object Representation */}
          <div className="absolute inset-0 flex items-center justify-center">
            {/* If 3D is generated, show a different visual placeholder to indicate change */}
            <div className={`relative transition-all duration-700 ease-out group-hover/viewer:scale-[1.02] 
                ${generated3DModel ? 'w-80 h-96' : 'w-96 h-96'}`} 
                style={{ 
                    background: generated3DModel 
                        ? 'radial-gradient(circle at 70% 20%, #2c3e50, #000000)' // Darker, sleeker look for new model
                        : 'radial-gradient(circle at 30% 30%, #4a4a4a, #1a1a1a)', 
                    borderRadius: generated3DModel ? '20px' : '40% 40% 50% 50%', 
                    boxShadow: '0 30px 60px rgba(0,0,0,0.5)' 
            }}>
              {/* Wireframe overlay effect */}
              <div className="absolute inset-0 opacity-20" style={{ 
                backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 19px, #ffffff 20px), repeating-linear-gradient(90deg, transparent, transparent 19px, #ffffff 20px)',
                borderRadius: generated3DModel ? '20px' : '40% 40% 50% 50%' 
              }}></div>
              
              {/* Specular Highlight */}
              <div className="absolute top-10 left-10 w-20 h-10 bg-white/10 blur-xl rounded-full transform -rotate-12"></div>
              
              {/* New Label if generated */}
              {generated3DModel && (
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-primary/20 text-primary border border-primary/50 px-3 py-1 rounded-full text-xs font-bold animate-bounce">
                      New Generated Model
                  </div>
              )}
            </div>
          </div>

          {/* Info Overlays */}
          <div className="absolute top-6 left-6 flex items-center gap-3">
            <div className="flex flex-col">
              <span className="text-white/40 text-[10px] font-bold tracking-widest mb-1">{t.viewport}</span>
              <div className="flex items-center gap-2 text-white/80 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 hover:bg-black/60 transition-colors cursor-pointer">
                <span className="material-symbols-outlined text-[16px]">view_in_ar</span>
                <span className="text-sm font-medium">{t.perspective}</span>
                <span className="material-symbols-outlined text-[14px] ml-1 text-white/40">expand_more</span>
              </div>
            </div>
          </div>

          {/* Left Toolbar */}
          <div className="absolute left-6 top-1/2 -translate-y-1/2 flex flex-col gap-3">
            <div className="flex flex-col bg-[#1a1a1a]/90 backdrop-blur-md border border-white/10 rounded-2xl p-1.5 shadow-2xl">
              <button className="p-2.5 text-white/60 hover:text-primary hover:bg-white/5 rounded-xl transition-colors group relative">
                <span className="material-symbols-outlined">3d_rotation</span>
                <span className="absolute left-14 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">{t.orbit}</span>
              </button>
              <button className="p-2.5 text-white/60 hover:text-primary hover:bg-white/5 rounded-xl transition-colors group relative">
                <span className="material-symbols-outlined">pan_tool</span>
                <span className="absolute left-14 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">{t.pan}</span>
              </button>
              <button className="p-2.5 text-primary bg-primary/10 rounded-xl transition-colors group relative">
                <span className="material-symbols-outlined fill-current">zoom_in</span>
                <span className="absolute left-14 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">{t.zoom}</span>
              </button>
            </div>
            <div className="flex flex-col bg-[#1a1a1a]/90 backdrop-blur-md border border-white/10 rounded-2xl p-1.5 shadow-2xl">
              <button className="p-2.5 text-white/60 hover:text-primary hover:bg-white/5 rounded-xl transition-colors">
                <span className="material-symbols-outlined">straighten</span>
              </button>
              <button className="p-2.5 text-white/60 hover:text-primary hover:bg-white/5 rounded-xl transition-colors">
                <span className="material-symbols-outlined">layers</span>
              </button>
            </div>
          </div>

          {/* Bottom Coordinates */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-[#1a1a1a]/80 backdrop-blur-md border border-white/10 px-5 py-2.5 rounded-full shadow-lg">
            <div className="flex items-center gap-2 text-white/60 text-xs font-mono border-r border-white/10 pr-4">
              <span className="material-symbols-outlined text-[14px]">grid_4x4</span>
              <span>X: 12.4cm</span>
            </div>
            <div className="flex items-center gap-2 text-white/60 text-xs font-mono border-r border-white/10 pr-4">
              <span>Y: 8.2cm</span>
            </div>
            <div className="flex items-center gap-2 text-white/60 text-xs font-mono">
              <span>Z: 15.0cm</span>
            </div>
          </div>
        </div>

        {/* Chat Sidebar (Right) */}
        <aside className="w-[400px] bg-white flex flex-col shrink-0 z-10 shadow-2xl transition-all duration-300">
          
          {/* Mode Switcher */}
          <div className="px-4 pt-4 bg-white">
              {isAiProject ? (
                  // AI Project Only View
                  <div className="flex items-center justify-center p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                      <div className="flex items-center gap-2 text-indigo-700 font-bold text-sm">
                          <span className="material-symbols-outlined text-[20px]">smart_toy</span>
                          {t.aiModeActive}
                      </div>
                  </div>
              ) : (
                  // Normal View (Switchable)
                  <div className="flex p-1 bg-gray-100 rounded-xl relative">
                      {/* Sliding Background */}
                      <div className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-lg shadow-sm transition-all duration-300 ease-out ${chatMode === 'ai' ? 'left-[calc(50%+2px)]' : 'left-1'}`}></div>
                      
                      <button 
                        onClick={() => setChatMode('human')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-bold relative z-10 transition-colors ${chatMode === 'human' ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                      >
                          <span className="material-symbols-outlined text-[18px]">person</span>
                          {t.modeHuman}
                      </button>
                      <button 
                        onClick={() => setChatMode('ai')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-bold relative z-10 transition-colors ${chatMode === 'ai' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                      >
                          <span className="material-symbols-outlined text-[18px]">smart_toy</span>
                          {t.modeAI}
                      </button>
                  </div>
              )}
          </div>

          {/* Sidebar Header Info */}
          <div className="px-6 py-4 border-b border-[#f0f4f2] flex items-center justify-between bg-white">
            <div className="flex items-center gap-3">
              <div className="relative">
                {chatMode === 'human' ? (
                     <div className="w-11 h-11 rounded-full bg-cover bg-center border border-gray-100" style={{backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuAjff9K5ZGxsA0gaTTb4gbJLkBPQmgQwUssLLXxTQrTVZqSBY0sk6RrnExuGd_VLiUU6_fsua-JrdSipAEVOxLcFhxIktBw42xvFelQ1NF1wsd7GYjmSIvT9ht8Zw-RlieXUa3jHuZVfNt3Oz0_5rZkph3i7kVpgIvx3akjYfcnFJOkErb_5xZ2Hg3eolXKfepQz_ZF5wSonRv5lZFmiwKskpluiiW4lw7o2yIVf7QhApBC90EE4o2wCWanoaYpuyqD7hIhTII1CK0")'}}>
                        <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-primary border-2 border-white rounded-full"></div>
                     </div>
                ) : (
                     <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 border border-indigo-50 flex items-center justify-center">
                        <img src="https://cdn-icons-png.flaticon.com/512/4712/4712109.png" alt="AI" className="w-7 h-7" />
                        <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-indigo-500 border-2 border-white rounded-full"></div>
                     </div>
                )}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-[#111814] text-sm font-bold">{chatMode === 'human' ? 'Master Kim' : 'Eco-Bot AI'}</h3>
                  <span className={`material-symbols-outlined text-[18px] fill-current ${chatMode === 'human' ? 'text-primary' : 'text-indigo-500'}`}>verified</span>
                </div>
                <p className="text-xs text-gray-500 font-medium">
                    {chatMode === 'human' ? `${t.verifiedMaker} • ${t.online}` : t.aiCopilot}
                </p>
              </div>
            </div>
            <button className="text-gray-400 hover:text-[#111814] p-2 hover:bg-gray-100 rounded-full transition-colors">
              <span className="material-symbols-outlined">more_horiz</span>
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-6 scrollbar-hide bg-[#fbfcfc]">
            <div className="flex justify-center my-2">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider bg-gray-100 px-3 py-1 rounded-full">{t.today}, 10:23 AM</span>
            </div>

            {messages.map((msg) => {
              if (msg.sender === 'system') {
                return (
                   <div key={msg.id} className="flex items-center gap-3 px-3 py-2 bg-white border border-gray-100 rounded-xl shadow-sm mx-4">
                    <div className="size-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[20px]">view_in_ar</span>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <p className="text-xs font-bold text-gray-800">{msg.text}</p>
                      <p className="text-[10px] text-gray-500 truncate font-mono">{msg.attachmentName}</p>
                    </div>
                    <button className="ml-auto text-xs font-bold text-blue-600 hover:underline">{t.view}</button>
                  </div>
                );
              }

              const isUser = msg.sender === 'user';
              const isAi = msg.sender === 'ai';
              
              return (
                <div key={msg.id} className={`flex items-end gap-3 max-w-[90%] ${isUser ? 'self-end flex-row-reverse' : ''}`}>
                  {!isUser ? (
                    <div className={`w-8 h-8 rounded-full bg-cover bg-center shrink-0 border border-gray-100 ${isAi ? 'bg-indigo-50 p-1' : ''}`} 
                        style={!isAi ? {backgroundImage: `url("${msg.avatar}")`} : {}}>
                        {isAi && <img src="https://cdn-icons-png.flaticon.com/512/4712/4712109.png" alt="AI" className="w-full h-full" />}
                    </div>
                  ) : (
                     <div className="hidden"></div>
                  )}
                  
                  <div className={`flex flex-col gap-1 ${isUser ? 'items-end' : 'items-start'}`}>
                    <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm max-w-xs relative
                      ${isUser 
                        ? 'bg-primary text-white rounded-br-none shadow-primary/20' 
                        : isAi 
                            ? 'bg-white border border-indigo-100 text-gray-800 rounded-bl-none shadow-indigo-100/50'
                            : 'bg-[#f0f4f2] text-[#111814] rounded-bl-none'
                      }`}>
                      {msg.text}
                      
                      {/* Attachments (AI Generation Results) */}
                      {msg.attachmentType === 'image' && msg.attachmentUrl && (
                          <div className="mt-3 rounded-lg overflow-hidden shadow-sm border border-gray-100">
                              <img src={msg.attachmentUrl} alt="Generated" className="w-full h-auto object-cover" />
                          </div>
                      )}
                      {msg.attachmentType === '3d_model' && (
                          <div className="mt-3 flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
                              <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center text-gray-500">
                                  <span className="material-symbols-outlined">deployed_code</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                  <p className="text-xs font-bold text-gray-700 truncate">{msg.attachmentName}</p>
                                  <p className="text-[10px] text-gray-500">GLB Model</p>
                              </div>
                          </div>
                      )}
                    </div>
                    <span className={`text-[10px] text-gray-400 font-medium ${isUser ? 'pr-1' : 'pl-1'}`}>{msg.timestamp}</span>
                  </div>
                </div>
              );
            })}
            
            {isAiProcessing && (
                <div className="flex items-center gap-2 text-xs text-gray-400 ml-12">
                    <div className="flex space-x-1">
                        <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: '0s'}}></div>
                        <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                    <span>AI Generating...</span>
                </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions */}
          <div className="px-5 py-3 bg-white flex gap-2 overflow-x-auto scrollbar-hide border-t border-[#f0f4f2]">
            {chatMode === 'ai' ? (
                <>
                    <button 
                        onClick={() => { setInputText('Make a 3D model of a vase'); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 rounded-lg text-xs font-bold text-indigo-700 transition-colors whitespace-nowrap"
                    >
                        <span className="material-symbols-outlined text-[16px]">deployed_code</span>
                        {t.generating3D.replace('...', '')} ({t.cost3D})
                    </button>
                    <button 
                         onClick={() => { setInputText('Generate an image idea for a chair'); }}
                         className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 rounded-lg text-xs font-bold text-indigo-700 transition-colors whitespace-nowrap"
                    >
                        <span className="material-symbols-outlined text-[16px]">image</span>
                        {t.generatingImage.replace('...', '')} ({t.costImage})
                    </button>
                </>
            ) : (
                <>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-xs font-bold text-gray-600 transition-colors whitespace-nowrap">
                        <span className="material-symbols-outlined text-[16px]">share</span>
                        {t.shareBlueprint}
                    </button>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-xs font-bold text-gray-600 transition-colors whitespace-nowrap">
                        <span className="material-symbols-outlined text-[16px]">build</span>
                        {t.requestMod}
                    </button>
                </>
            )}
          </div>

          {/* Input Area */}
          <div className="p-5 bg-white border-t border-[#f0f4f2]">
            <div className={`relative flex items-center bg-gray-50 rounded-xl border border-transparent focus-within:bg-white focus-within:shadow-md transition-all ${chatMode === 'ai' ? 'focus-within:border-indigo-200' : 'focus-within:border-gray-200'}`}>
              <button className="pl-3 pr-2 text-gray-400 hover:text-gray-600 transition-colors">
                <span className="material-symbols-outlined text-[20px] rotate-45">attach_file</span>
              </button>
              <input 
                className="w-full bg-transparent border-none focus:ring-0 text-sm py-3 text-gray-800 placeholder-gray-400" 
                placeholder={chatMode === 'ai' ? (language === 'ko' ? "AI에게 명령을 내려보세요 (예: 3D 모델 생성...)" : "Command AI (e.g. Generate 3D model...)") : t.placeholder} 
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              />
              <button 
                className={`m-1.5 p-2 rounded-lg transition-colors flex items-center justify-center shadow-sm 
                    ${inputText 
                        ? (chatMode === 'ai' ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-primary hover:bg-primary-dark text-white') 
                        : 'bg-gray-200 text-gray-400'
                    }`}
                onClick={handleSendMessage}
              >
                <span className="material-symbols-outlined text-[18px]">{chatMode === 'ai' ? 'auto_awesome' : 'arrow_upward'}</span>
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Workspace;