import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Sparkles,
  MoreHorizontal,
  Image as ImageIcon,
  Share2,
  Wrench,
  RotateCcw,
  Maximize,
  Grid3X3,
  Box,
  Send,
  ArrowLeft
} from 'lucide-react';
import ThreeDViewer, { ThreeDViewerHandle } from './ThreeDViewer';
import { Project } from '../types';
import { config } from '../services/config';
import * as aiService from '../services/aiService';
import { Language } from '../App';

interface WorkspaceProps {
  project: Project;
  onExit: () => void;
  language: Language;
  userTokens: number;
  setUserTokens: (tokens: number) => void;
  initialMode?: 'human' | 'ai';
  isAiProject?: boolean;
}

type TabMode = 'EXPERT' | 'COPILOT';

const Workspace: React.FC<WorkspaceProps> = ({ project, onExit, language, userTokens, setUserTokens, initialMode = 'human', isAiProject = false }) => {
  const [activeTab, setActiveTab] = useState<TabMode>(initialMode === 'ai' ? 'COPILOT' : 'EXPERT');
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const viewerRef = useRef<ThreeDViewerHandle>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initial Messages
  const [messages, setMessages] = useState<{ id: number, role: string, name: string, time: string, content: string }[]>([
    {
      id: 1,
      role: 'expert',
      name: 'Master Kim',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      content: language === 'ko'
        ? `반갑네! ${project.title} 작업을 시작해볼까? 현무암 텍스처가 아주 멋스럽구만.`
        : `Welcome! Shall we start working on ${project.title}? The basalt texture looks authentic.`
    }
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = input;
    setInput('');

    // Add User Message
    const newTask = {
      id: Date.now(),
      role: 'user',
      name: 'Me',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      content: userMsg
    };
    setMessages(prev => [...prev, newTask]);
    setIsLoading(true);

    try {
      if (activeTab === 'EXPERT') {
        // Call Master Kim Persona
        const history = messages.map(m => ({ role: m.role, content: m.content }));
        const response = await aiService.chatWithPersona(userMsg, history, 'MASTER_KIM');

        setMessages(prev => [...prev, {
          id: Date.now() + 1,
          role: 'expert',
          name: 'Master Kim',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          content: response
        }]);
      } else {
        // Call AI Copilot (Functional)
        // Reuse the same logic for now, but routed via analyzeCopilotIntent for actions
        const analysis = await aiService.analyzeCopilotIntent(userMsg, project.description || '');

        // Execute actions if any
        if (analysis.type === 'VIEW_CONTROL') {
          if (analysis.action?.includes('rotate')) viewerRef.current?.rotateModel(0, Math.PI / 4);
          if (analysis.action === 'wireframe_on') viewerRef.current?.setWireframe(true);
          if (analysis.action === 'wireframe_off') viewerRef.current?.setWireframe(false);
          if (analysis.action === 'bg_black') viewerRef.current?.setBackground('#000000');
          if (analysis.action === 'bg_white') viewerRef.current?.setBackground('#ffffff');
        }

        setMessages(prev => [...prev, {
          id: Date.now() + 1,
          role: 'copilot',
          name: 'Jeju Copilot',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          content: analysis.message
        }]);
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'system',
        name: 'System',
        time: '',
        content: language === 'ko' ? '오류가 발생했습니다.' : 'An error occurred.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Tools for Left Panel
  const handleTool = (action: string) => {
    if (action === 'rotate') viewerRef.current?.rotateModel(0, Math.PI / 4);
    if (action === 'wireframe') viewerRef.current?.setWireframe(true); // Toggle needs state tracking ideally
    if (action === 'reset') viewerRef.current?.resetCamera();
  };

  return (
    <div className="flex h-screen w-full bg-[#111111] text-white overflow-hidden font-sans fixed inset-0 z-50">
      {/* Left Side - 3D Viewport */}
      <div className="flex-1 relative border-r border-gray-800">
        {/* Header Overlay */}
        <div className="absolute top-4 left-4 z-10 flex items-center space-x-3 bg-black/40 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10">
          <button onClick={onExit} className="mr-2 text-gray-400 hover:text-white">
            <ArrowLeft size={20} />
          </button>
          <div className="w-8 h-8 rounded-lg border-2 border-green-500 flex items-center justify-center text-green-500 font-bold">
            <Box size={16} />
          </div>
          <div>
            <h1 className="text-sm font-bold text-gray-100">{project.title}</h1>
            <p className="text-[10px] text-gray-400">Jeju Remaker Studio</p>
          </div>
          <div className="pl-4 border-l border-white/10 flex space-x-2">
            <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
            <span className="text-xs text-green-400 font-medium tracking-wide">Live Sync</span>
          </div>
        </div>

        {/* Top Right Actions */}
        <div className="absolute top-4 right-4 z-10 flex space-x-2">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-lg border border-white/10 mr-2">
            <span className="text-xs font-bold text-indigo-400">💎 {userTokens}</span>
          </div>
          <button className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 shadow-lg shadow-indigo-900/20">
            <span>Save Draft</span>
          </button>
          <button className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 shadow-lg shadow-green-900/20">
            <span>Export</span>
          </button>
          <button onClick={onExit} className="p-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors">
            <Maximize size={16} />
          </button>
        </div>

        {/* 3D Viewer */}
        <div className="w-full h-full bg-[#050505]">
          <ThreeDViewer
            ref={viewerRef}
            modelUrl={project.modelFiles?.[0]?.url || ''}
            className="w-full h-full"
          />
          {!project.modelFiles?.[0]?.url && (
            <div className="absolute inset-0 flex items-center justify-center text-gray-600">
              No 3D Model Loaded
            </div>
          )}
        </div>

        {/* Floating Toolbar */}
        <div className="absolute left-6 top-1/2 -translate-y-1/2 flex flex-col space-y-3 bg-black/60 backdrop-blur-md p-2 rounded-2xl border border-white/10 shadow-2xl">
          <button onClick={() => handleTool('rotate')} className="p-3 text-gray-400 hover:text-green-400 hover:bg-white/10 rounded-xl transition-all" title="Rotate">
            <RotateCcw size={20} />
          </button>
          <button className="p-3 text-gray-400 hover:text-green-400 hover:bg-white/10 rounded-xl transition-all" title="Pan">
            <Share2 size={20} />
          </button>
          <button onClick={() => handleTool('wireframe')} className="p-3 text-gray-400 hover:text-green-400 hover:bg-white/10 rounded-xl transition-all" title="Wireframe">
            <Grid3X3 size={20} />
          </button>
          <button className="p-3 text-gray-400 hover:text-green-400 hover:bg-white/10 rounded-xl transition-all" title="Settings">
            <Wrench size={20} />
          </button>
        </div>
      </div>

      {/* Right Side - Collaborative Panel */}
      <div className="w-[420px] flex flex-col bg-[#1A1A1A] border-l border-gray-800 shadow-2xl z-20">
        {/* Tabs */}
        <div className="flex items-center p-3 bg-[#1F1F1F] border-b border-gray-800 gap-3">
          <button
            onClick={() => setActiveTab('EXPERT')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all border
                            ${activeTab === 'EXPERT'
                ? 'bg-white text-black border-transparent shadow-lg'
                : 'bg-[#2A2A2A] text-gray-400 border-transparent hover:bg-[#333] hover:text-gray-200'}
                        `}
          >
            <MessageSquare size={16} />
            Human Expert
          </button>
          <button
            onClick={() => setActiveTab('COPILOT')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all border
                            ${activeTab === 'COPILOT'
                ? 'bg-indigo-600 text-white border-transparent shadow-lg shadow-indigo-900/20'
                : 'bg-[#2A2A2A] text-gray-400 border-transparent hover:bg-[#333] hover:text-gray-200'}
                        `}
          >
            <Sparkles size={16} />
            AI Copilot
          </button>
        </div>

        {/* Context Header */}
        <div className="p-5 border-b border-gray-800 flex items-center justify-between bg-[#1A1A1A]">
          <div className="flex items-center gap-4">
            <div className="relative">
              {activeTab === 'EXPERT' ? (
                <img src="https://api.dicebear.com/9.x/avataaars/svg?seed=Felix" alt="Master Kim" className="w-12 h-12 rounded-full bg-gray-700 border-2 border-gray-600" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center border-2 border-indigo-400">
                  <Sparkles size={24} className="text-white" />
                </div>
              )}
              <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-[#1A1A1A] rounded-full"></div>
            </div>
            <div>
              <h3 className="font-bold text-gray-100 text-base">
                {activeTab === 'EXPERT' ? (language === 'ko' ? '김장인 (Master Kim)' : 'Master Kim') : 'Jeju Copilot'}
              </h3>
              <div className="flex items-center gap-1.5 text-xs text-green-500 font-medium mt-0.5">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                {activeTab === 'EXPERT' ? 'Verified Maker • Online' : 'Ready to help'}
              </div>
            </div>
          </div>
          <button className="text-gray-500 hover:text-white transition-colors">
            <MoreHorizontal size={20} />
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-[#1A1A1A] custom-scrollbar">
          {/* Date Divider */}
          <div className="flex items-center justify-center my-2">
            <span className="text-[10px] uppercase font-bold text-gray-500 bg-[#252525] px-3 py-1 rounded-full tracking-wider border border-white/5">
              Today
            </span>
          </div>

          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''} animate-fade-in`}>
              {msg.role !== 'user' && (
                <div className="w-8 h-8 rounded-full bg-gray-700 overflow-hidden flex-shrink-0 mt-1">
                  {msg.role === 'copilot' ? (
                    <div className="w-full h-full bg-indigo-600 flex items-center justify-center"><Sparkles size={14} /></div>
                  ) : (
                    <img src="https://api.dicebear.com/9.x/avataaars/svg?seed=Felix" alt="Avatar" />
                  )}
                </div>
              )}
              <div className={`flex flex-col max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`px-4 py-3 text-sm leading-relaxed shadow-sm
                                    ${msg.role === 'user'
                    ? 'bg-green-600 text-white rounded-2xl rounded-tr-sm shadow-green-900/20'
                    : 'bg-[#2A2A2A] text-gray-200 rounded-2xl rounded-tl-sm border border-gray-700'}
                                `}>
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
                <span className="text-[10px] text-gray-500 mt-1.5 px-1 opacity-70">
                  {msg.time}
                </span>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-700 flex-shrink-0 mt-1 animate-pulse"></div>
              <div className="bg-[#2A2A2A] px-4 py-3 rounded-2xl rounded-tl-sm border border-gray-700">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-[#1F1F1F] border-t border-gray-800">
          <form onSubmit={handleSendMessage} className="relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={activeTab === 'EXPERT' ? (language === 'ko' ? '김장인님에게 메시지...' : "Message Master Kim...") : "Ask AI to edit..."}
              className="w-full bg-[#2A2A2A] text-white placeholder-gray-500 rounded-2xl pl-5 pr-12 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50 border border-transparent focus:border-green-500/50 transition-all font-medium"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center bg-green-600 hover:bg-green-700 text-white rounded-xl transition-all disabled:opacity-50 disabled:bg-gray-600 shadow-lg shadow-green-900/30"
            >
              <Send size={18} />
            </button>
          </form>
          <div className="flex items-center justify-between mt-4 px-1">
            <div className="flex space-x-2">
              <button className="p-2.5 hover:bg-[#333] rounded-xl text-gray-400 hover:text-white transition-colors" title="Attach Image">
                <ImageIcon size={20} />
              </button>
              <button className="p-2.5 hover:bg-[#333] rounded-xl text-gray-400 hover:text-white transition-colors" title="Share Blueprint">
                <Share2 size={20} />
              </button>
            </div>
            <button className="px-4 py-2 rounded-xl bg-[#2A2A2A] hover:bg-[#333] text-xs font-bold text-gray-300 transition-colors border border-gray-700 hover:border-gray-500">
              Requested Fix
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Workspace;