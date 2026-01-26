import React, { useState } from 'react';
import { Message } from '../types';
import { Language } from '../App';

interface WorkspaceProps {
  onExit: () => void;
  language: Language;
}

const INITIAL_MESSAGES: Message[] = [
  { id: '1', sender: 'expert', text: "Welcome to the collaborative space! I see you've imported the Basalt texture. It looks quite authentic.", timestamp: '10:23 AM', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCQktH3DenoThdgeDVlG9xdYEla3FDisOpT8PR36uqEcWdIFpSl7kAMY_Pcn94_KeJ10wtsmlDELj2A9bGn2ExGWjDWap_4wV_35vL82cz30KB7Sk7Y4gcEi3gFknpu-VaipcKYlBDl9FqLgg090jGddRM8JImT5UnIJ52FW9I7ktxhfCdjcZCnDEibQrdIjO7ReTalRE7ONj4avV1OvEkk_vw-yrxX-28NDfbVpBfPSF7-BPPgy5_-BBOsIvl4R5Iq4ozlyCyozH4' },
  { id: '2', sender: 'expert', text: "One thing to note: the geometry on the upper rim seems a bit sharp for this material. Basalt is usually more porous and eroded.", timestamp: '10:25 AM', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCQktH3DenoThdgeDVlG9xdYEla3FDisOpT8PR36uqEcWdIFpSl7kAMY_Pcn94_KeJ10wtsmlDELj2A9bGn2ExGWjDWap_4wV_35vL82cz30KB7Sk7Y4gcEi3gFknpu-VaipcKYlBDl9FqLgg090jGddRM8JImT5UnIJ52FW9I7ktxhfCdjcZCnDEibQrdIjO7ReTalRE7ONj4avV1OvEkk_vw-yrxX-28NDfbVpBfPSF7-BPPgy5_-BBOsIvl4R5Iq4ozlyCyozH4' },
  { id: '3', sender: 'user', text: "Good catch. I was trying to keep the poly count low, but I can add a bevel modifier.", timestamp: '10:27 AM' },
  { id: '4', sender: 'user', text: "How does this look now?", timestamp: '10:28 AM' },
  { id: '5', sender: 'system', text: "New Snapshot Created", timestamp: '10:28 AM', attachmentName: 'Rim_Modification_v2.obj' },
  { id: '6', sender: 'expert', text: "Much better! The light catches the edge more naturally now. Shall we move on to the base?", timestamp: '10:30 AM', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBJuv5jW3PtvXRBaHJipD8C2jBwY9z5xyycvtPQjyEKIVUNzbecvLQ3KztDNI6QclH3uABbHW20b0zs-0tnEJ2DhB9yFVpLTUbnY2R9C6fr4oOQ2HOhrtxYKTLzMyMkZ9npBmhC0aZa8F64tlNVVhJAXEONgy-vrHU2O5N9iyn-Nzh2-OTlr8zJiUouAct-_toZVyd7mfXR3kxarXLXmzON69ZIn5wm401zT1IOHfxA1CO1lbXhgrjnS6jW1im4IgGKH_sYDd3nb6w' },
];

const Workspace: React.FC<WorkspaceProps> = ({ onExit, language }) => {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState('');

  const handleSendMessage = () => {
    if (!inputText.trim()) return;
    const newMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: inputText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages([...messages, newMessage]);
    setInputText('');
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
            <h2 className="text-white text-base font-bold leading-tight tracking-[-0.015em]">Basalt Style Pot (Collaborative)</h2>
            <span className="text-xs text-gray-400 font-medium">Jeju Re-Maker Workspace</span>
          </div>
        </div>
        <div className="flex flex-1 justify-end gap-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full border border-white/10 backdrop-blur-sm">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
              <span className="text-gray-300 text-xs font-medium">Live Sync Active</span>
            </div>
          </div>
          <div className="flex gap-3">
            <button className="flex cursor-pointer items-center justify-center overflow-hidden rounded-xl h-9 px-4 bg-white/10 hover:bg-white/20 text-white text-sm font-bold leading-normal tracking-[0.015em] transition-colors border border-white/5">
              <span className="truncate">Save Draft</span>
            </button>
            <button className="flex cursor-pointer items-center justify-center overflow-hidden rounded-xl h-9 px-5 bg-primary hover:bg-primary-dark text-background-viewer text-sm font-bold leading-normal tracking-[0.015em] shadow-[0_0_15px_rgba(23,207,99,0.3)] transition-all" onClick={onExit}>
              <span className="truncate">Finish & Export</span>
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
            <div className="relative w-96 h-96 group-hover/viewer:scale-[1.02] transition-transform duration-700 ease-out" style={{ 
              background: 'radial-gradient(circle at 30% 30%, #4a4a4a, #1a1a1a)', 
              borderRadius: '40% 40% 50% 50%', 
              boxShadow: '0 30px 60px rgba(0,0,0,0.5)' 
            }}>
              {/* Wireframe overlay effect */}
              <div className="absolute inset-0 opacity-20" style={{ 
                backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 19px, #ffffff 20px), repeating-linear-gradient(90deg, transparent, transparent 19px, #ffffff 20px)',
                borderRadius: '40% 40% 50% 50%' 
              }}></div>
              {/* Specular Highlight */}
              <div className="absolute top-10 left-10 w-20 h-10 bg-white/10 blur-xl rounded-full transform -rotate-12"></div>
            </div>
          </div>

          {/* Info Overlays */}
          <div className="absolute top-6 left-6 flex items-center gap-3">
            <div className="flex flex-col">
              <span className="text-white/40 text-[10px] font-bold tracking-widest mb-1">VIEWPORT</span>
              <div className="flex items-center gap-2 text-white/80 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 hover:bg-black/60 transition-colors cursor-pointer">
                <span className="material-symbols-outlined text-[16px]">view_in_ar</span>
                <span className="text-sm font-medium">Perspective</span>
                <span className="material-symbols-outlined text-[14px] ml-1 text-white/40">expand_more</span>
              </div>
            </div>
          </div>

          {/* Left Toolbar */}
          <div className="absolute left-6 top-1/2 -translate-y-1/2 flex flex-col gap-3">
            <div className="flex flex-col bg-[#1a1a1a]/90 backdrop-blur-md border border-white/10 rounded-2xl p-1.5 shadow-2xl">
              <button className="p-2.5 text-white/60 hover:text-primary hover:bg-white/5 rounded-xl transition-colors group relative">
                <span className="material-symbols-outlined">3d_rotation</span>
                <span className="absolute left-14 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">Orbit</span>
              </button>
              <button className="p-2.5 text-white/60 hover:text-primary hover:bg-white/5 rounded-xl transition-colors group relative">
                <span className="material-symbols-outlined">pan_tool</span>
                <span className="absolute left-14 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">Pan</span>
              </button>
              <button className="p-2.5 text-primary bg-primary/10 rounded-xl transition-colors group relative">
                <span className="material-symbols-outlined fill-current">zoom_in</span>
                <span className="absolute left-14 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">Zoom</span>
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
        <aside className="w-[400px] bg-white flex flex-col shrink-0 z-10 shadow-2xl">
          {/* Sidebar Header */}
          <div className="px-6 py-4 border-b border-[#f0f4f2] flex items-center justify-between bg-white">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-11 h-11 rounded-full bg-cover bg-center border border-gray-100" style={{backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuAjff9K5ZGxsA0gaTTb4gbJLkBPQmgQwUssLLXxTQrTVZqSBY0sk6RrnExuGd_VLiUU6_fsua-JrdSipAEVOxLcFhxIktBw42xvFelQ1NF1wsd7GYjmSIvT9ht8Zw-RlieXUa3jHuZVfNt3Oz0_5rZkph3i7kVpgIvx3akjYfcnFJOkErb_5xZ2Hg3eolXKfepQz_ZF5wSonRv5lZFmiwKskpluiiW4lw7o2yIVf7QhApBC90EE4o2wCWanoaYpuyqD7hIhTII1CK0")'}}></div>
                <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-primary border-2 border-white rounded-full"></div>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-[#111814] text-sm font-bold">Master Kim</h3>
                  <span className="material-symbols-outlined text-primary text-[18px] fill-current">verified</span>
                </div>
                <p className="text-xs text-gray-500 font-medium">Verified Maker • Online</p>
              </div>
            </div>
            <button className="text-gray-400 hover:text-[#111814] p-2 hover:bg-gray-100 rounded-full transition-colors">
              <span className="material-symbols-outlined">more_horiz</span>
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-6 scrollbar-hide bg-[#fbfcfc]">
            <div className="flex justify-center my-2">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider bg-gray-100 px-3 py-1 rounded-full">Today, 10:23 AM</span>
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
                    <button className="ml-auto text-xs font-bold text-blue-600 hover:underline">View</button>
                  </div>
                );
              }

              const isUser = msg.sender === 'user';
              return (
                <div key={msg.id} className={`flex items-end gap-3 max-w-[90%] ${isUser ? 'self-end flex-row-reverse' : ''}`}>
                  {!isUser ? (
                    <div className="w-8 h-8 rounded-full bg-cover bg-center shrink-0 border border-gray-100" style={{backgroundImage: `url("${msg.avatar}")`}}></div>
                  ) : (
                     // Spacer for user alignment implicitly handled by flex-row-reverse, but we could add user avatar here
                     <div className="hidden"></div>
                  )}
                  
                  <div className={`flex flex-col gap-1 ${isUser ? 'items-end' : 'items-start'}`}>
                    <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm max-w-xs
                      ${isUser 
                        ? 'bg-primary text-white rounded-br-none shadow-primary/20' 
                        : 'bg-[#f0f4f2] text-[#111814] rounded-bl-none'
                      }`}>
                      {msg.text}
                    </div>
                    <span className={`text-[10px] text-gray-400 font-medium ${isUser ? 'pr-1' : 'pl-1'}`}>{msg.timestamp}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Actions */}
          <div className="px-5 py-3 bg-white flex gap-2 overflow-x-auto scrollbar-hide border-t border-[#f0f4f2]">
            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-xs font-bold text-gray-600 transition-colors whitespace-nowrap">
              <span className="material-symbols-outlined text-[16px]">share</span>
              Share Blueprint
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-xs font-bold text-gray-600 transition-colors whitespace-nowrap">
              <span className="material-symbols-outlined text-[16px]">build</span>
              Request Mod
            </button>
          </div>

          {/* Input Area */}
          <div className="p-5 bg-white border-t border-[#f0f4f2]">
            <div className="relative flex items-center bg-gray-50 rounded-xl border border-transparent focus-within:border-gray-200 focus-within:bg-white focus-within:shadow-md transition-all">
              <button className="pl-3 pr-2 text-gray-400 hover:text-gray-600 transition-colors">
                <span className="material-symbols-outlined text-[20px] rotate-45">attach_file</span>
              </button>
              <input 
                className="w-full bg-transparent border-none focus:ring-0 text-sm py-3 text-gray-800 placeholder-gray-400" 
                placeholder="Ask Master Kim..." 
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              />
              <button 
                className={`m-1.5 p-2 rounded-lg transition-colors flex items-center justify-center shadow-sm ${inputText ? 'bg-primary hover:bg-primary-dark text-white' : 'bg-gray-200 text-gray-400'}`}
                onClick={handleSendMessage}
              >
                <span className="material-symbols-outlined text-[18px]">arrow_upward</span>
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Workspace;
