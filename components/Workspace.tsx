import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  ArrowLeft,
  X
} from 'lucide-react';
import ThreeDViewer, { ThreeDViewerHandle } from './ThreeDViewer';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { Project } from '../types';
import { config } from '../services/config';
import * as aiService from '../services/aiService';
import { Language } from '../App';
import { ReactFlow, Background, applyNodeChanges, applyEdgeChanges, addEdge, Connection, Edge, Node, NodeChange, EdgeChange, ReactFlowInstance } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { CustomNode } from './CustomNode';
import { supabase } from '../services/supabase';
import ImageModal from './ImageModal';

const nodeTypes = {
  custom: CustomNode,
};

// Initial Data for Knowledge Graph
const initialNodes = [
  {
    id: '1',
    type: 'custom',
    position: { x: 50, y: 150 },
    data: {
      label: '시스템',
      title: '제주 감귤 펄프 스냅핏 백동',
      content: '제주 감귤 펄프 소재를 활용하여 자연스러운 질감을 살리는 미니멀...',
      color: '#4B9FFF', // Blue
    },
  },
  {
    id: '2',
    type: 'custom',
    position: { x: 400, y: 50 },
    data: {
      label: '아이디어',
      title: '디자인 형태 변경',
      content: '비율, 두께, 곡률 등을 조정합니다.',
      color: '#FFB84D', // Orange
    },
  },
  {
    id: '3',
    type: 'custom',
    position: { x: 400, y: 180 },
    data: {
      label: '재료',
      title: '재질 변경',
      content: '현무암, 플라스틱 등 질감을 수정합니다.',
      color: '#4ADE80', // Green
    },
  },
  {
    id: '4',
    type: 'custom',
    position: { x: 400, y: 310 },
    data: {
      label: '제어',
      title: '화면 제어',
      content: '모델 회전, 확대, 와이어프레임 보기 등을 요청합니다.',
      color: '#A78BFA', // Purple
    },
  },
];

const initialEdges = [
  { id: 'e1-2', source: '1', target: '2', animated: true, style: { stroke: '#4B9FFF' } },
  { id: 'e1-3', source: '1', target: '3', animated: true, style: { stroke: '#4B9FFF' } },
  { id: 'e1-4', source: '1', target: '4', animated: true, style: { stroke: '#4B9FFF' } },
];

interface WorkspaceProps {
  project: Project;
  onExit: () => void;
  language: Language;
  userTokens: number;
  setUserTokens: (tokens: number) => void;
  initialMode?: 'human' | 'ai';
  isAiProject?: boolean;
  onlineUsers?: any[];
  globalChannel?: any;
  currentUserId?: string;
}

type TabMode = 'EXPERT' | 'COPILOT';

const Workspace: React.FC<WorkspaceProps> = ({ project, onExit, language, userTokens, setUserTokens, initialMode = 'human', isAiProject = false, onlineUsers = [], globalChannel, currentUserId }) => {
  const [activeTab, setActiveTab] = useState<TabMode>(initialMode === 'ai' ? 'COPILOT' : 'EXPERT');
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showExitWarning, setShowExitWarning] = useState(false);
  const viewerRef = useRef<ThreeDViewerHandle>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // React Flow State
  const [nodes, setNodes] = useState<Node[]>(initialNodes as Node[]);
  const [edges, setEdges] = useState<Edge[]>(initialEdges as Edge[]);
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null);

  const [userNickname, setUserNickname] = useState<string>('Maker');

  const clientId = useRef(Math.random().toString(36).substring(7)).current;
  const channelRef = useRef<any>(null);
  const lastSyncTime = useRef<number>(0);

  const [is3DSyncAccepted, setIs3DSyncAccepted] = useState(false);
  
  const is3DSyncAcceptedRef = useRef(false);
  useEffect(() => {
      is3DSyncAcceptedRef.current = is3DSyncAccepted;
  }, [is3DSyncAccepted]);

  // Peer Selection State
  const [selectedPeer, setSelectedPeer] = useState<any | null>(null);

  const [syncedMetadata, setSyncedMetadata] = useState<any>(project?.metadata || null);

  useEffect(() => {
    const fetchNickname = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase
                    .from('user_profiles')
                    .select('nickname')
                    .eq('user_id', user.id)
                    .maybeSingle();
                if (profile?.nickname) {
                    setUserNickname(profile.nickname);
                } else {
                    setUserNickname(user.user_metadata?.full_name || 'Maker');
                }
            }
        } catch (e) {
            console.error("Failed to fetch nickname for Workspace:", e);
        }
    };
    fetchNickname();
  }, []);

  // Sync latest metadata (including 3D model URL)
  useEffect(() => {
    if (!project?.id) return;
    
    const fetchLatestMetadata = async () => {
      try {
        if (typeof project.id === 'string' && project.id.includes('-')) {
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
        console.error("Workspace: Failed to sync metadata", e);
      }
    };
    
    fetchLatestMetadata();
  }, [project?.id]);

  // Fetch existing messages from DB on mount
  useEffect(() => {
    const fetchChatHistory = async () => {
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('id, project_id, sender_id, sender_name, message_text, role, created_at')
          .eq('project_id', project.id)
          .order('created_at', { ascending: true })
          .limit(100);

        if (error) throw error;
        if (data && data.length > 0) {
          const mappedMessages = data.map((msg: any) => ({
             id: msg.id,
             role: msg.role === 'user' ? 'user' : 'expert',
             name: msg.sender_name,
             time: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
             content: msg.message_text
          }));
          setExpertMessages(prev => [...prev.filter(m => m.id !== 1), ...mappedMessages]);
        }
      } catch (err) {
        console.error("Failed to load chat history:", err);
      }
    };

    fetchChatHistory();
  }, [project.id]);

  // Set up Supabase Realtime Channel
  useEffect(() => {
    if (!project.id) return;

    const channel = supabase.channel(`room-${project.id}`)
      .on('broadcast', { event: 'chat_message' }, (payload) => {
        console.log("Workspace: Received chat_message", payload.payload);
        if (payload.payload.clientId !== clientId) {
           setExpertMessages(prev => [...prev, payload.payload.message]);
        }
      })
      .on('broadcast', { event: 'sync_request' }, (payload) => {
        console.log("Workspace: Received sync_request (Auto-accepting)", payload.payload);
        if (payload.payload.clientId !== clientId) {
           setIs3DSyncAccepted(true);
        }
      })
      .on('broadcast', { event: 'camera_sync' }, (payload) => {
        console.log("Workspace: Received camera_sync", payload.payload);
        if (payload.payload.clientId !== clientId) {
           // Ensure sync is accepted when receiving first camera state
           if (!is3DSyncAcceptedRef.current) setIs3DSyncAccepted(true);
           viewerRef.current?.syncCamera(payload.payload.position, payload.payload.target);
        }
      })
      .subscribe((status) => {
          console.log(`Workspace: Channel room-${project.id} status:`, status);
      });

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [project.id, clientId]);

  // --- React Flow Interactive Handlers ---
  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    [],
  );
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    [],
  );
  const onConnect = useCallback(
    (params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)),
    [],
  );

  // Messages State (Separated)
  const [expertMessages, setExpertMessages] = useState<{ id: number, role: string, name: string, time: string, content: string }[]>([
    {
      id: 1,
      role: 'system',
      name: 'Jeju Remaker Hub',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      content: language === 'ko'
        ? `환려합니다! ${project.title} 공간에 오신 것을 환영합니다.`
        : `Welcome! You have entered the workspace for ${project.title}.`
    }
  ]);
  const [copilotMessages, setCopilotMessages] = useState<{ id: number, role: string, name: string, time: string, content: string, imageUrl?: string }[]>([
    {
      id: 1,
      role: 'copilot',
      name: 'Jeju Copilot',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      content: language === 'ko'
        ? '안녕하세요! 제주 리메이커 코파일럿입니다. 제작 과정을 도와드릴까요?'
        : 'Hello! I am your Jeju Remaker Copilot. How can I assist your fabrication process?'
    }
  ]);

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [attachedImageBase64, setAttachedImageBase64] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [expertMessages, copilotMessages]);
  // UI State for tagged node
  const [taggedNodeId, setTaggedNodeId] = useState<string | null>(null);
  const [taggedNodeName, setTaggedNodeName] = useState<string | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("이미지는 5MB 이하만 업로드 가능합니다.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setAttachedImageBase64(event.target?.result as string);
    };
    reader.readAsDataURL(file);
    
    // reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Auto scroll to latest generated node
  useEffect(() => {
    if (nodes.length > initialNodes.length) {
       const latestNode = nodes[nodes.length - 1];
    }
  }, [nodes]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = input;
    setInput('');

    // Add User Message (UI)
    const newTask = {
      id: Date.now(),
      role: 'user',
      name: userNickname,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      content: userMsg,
      imageUrl: attachedImageBase64 || undefined
    };
    
    if (activeTab === 'EXPERT') {
      setExpertMessages(prev => [...prev, newTask]);
    } else {
      setCopilotMessages(prev => [...prev, newTask]);
    }
    
    setIsLoading(true);

    try {
      if (activeTab === 'EXPERT') {
        // 1. Persistent DB Save
        const { data: dbMsg, error: dbError } = await supabase
           .from('messages')
           .insert({
              project_id: project.id,
              sender_id: currentUserId,
              sender_name: userNickname,
              message_text: userMsg,
              role: 'user'
           })
           .select()
           .single();

        if (dbError) console.error("Failed to save message to DB:", dbError);

        // 2. Broadcast User Message to Channel for real-time recipients
        const broadcastMsg = {
           id: dbMsg?.id || Date.now() + 1,
           role: 'expert',
           name: userNickname,
           time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
           content: userMsg
        };
        
        const sendStatus = await channelRef.current?.send({
            type: 'broadcast',
            event: 'chat_message',
            payload: { clientId, message: broadcastMsg }
        });
        console.log("Workspace: chat_message broadcast status:", sendStatus);

        // Broadcast to global channel for toaster notifications
        globalChannel?.send({
            type: 'broadcast',
            event: 'chat_notify',
            payload: {
               projectId: project.id,
               projectTitle: project.title,
               sender: userNickname,
               message: userMsg
            }
        });

      } else {
        // Call AI Copilot (Functional / Node Gen)
        
        // Prepare context for Gemini 2.5 Flash
        const recentNodes = nodes.slice(-5).map(n => ({
            id: n.id,
            label: n.data.label as string,
            content: n.data.content as string
        }));

        // 1. Analyze Intent (Pass User Nickname & Attached Image)
        const analysis: any = await aiService.analyzeCopilotIntent(userMsg, project, recentNodes, taggedNodeId, userNickname, attachedImageBase64);

        let requiredTokens = 0;
        if (analysis.type === 'IMAGE_GENERATION') requiredTokens = 5;
        if (analysis.type === 'GENERATE') requiredTokens = 30;
        if (analysis.type === 'UPDATE_RECIPE') requiredTokens = 1;

        if (requiredTokens > 0) {
           if (userTokens < requiredTokens) {
               setCopilotMessages(prev => [...prev, {
                 id: Date.now() + Math.random(),
                 role: 'copilot',
                 name: 'Jeju Copilot',
                 time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                 content: `죄송합니다, ${userNickname}님. 토큰이 부족하여 해당 작업을 수행할 수 없습니다. (필요: ${requiredTokens}, 보유: ${userTokens})`
               }]);
               setIsLoading(false);
               return;
           } else {
               setUserTokens(userTokens - requiredTokens);
           }
        }

        let replyMessage = analysis.message;
        let generatedImageUrl = undefined;

        // 2. Optional: Generate Image if Requested
        if (analysis.type === 'IMAGE_GENERATION') {
            try {
               // Determine reference image for generation based on tagged node or original project (Base Shape)
               // DO NOT use attachedImageBase64 here, as that is the "Style Reference" absorbed by enriched_prompt.
               const referencedNode = nodes.find(n => n.id === taggedNodeId);
               const referenceImageUrl = referencedNode?.data?.imageUrl || project.images?.[0];

               const finalPrompt = analysis.enriched_prompt 
                 ? analysis.enriched_prompt + " (Maintain original product shape structure, high quality realistic product photography)" 
                 : userMsg + " (Product design concept, high quality, realistic lighting)";

               generatedImageUrl = await aiService.generateUpcyclingImage(finalPrompt, config.models.productImage, referenceImageUrl, false, project, userNickname);
            } catch (e) {
               console.error("Image generation failed", e);
               replyMessage += " (이미지 생성에 실패했습니다.)";
            }
        }

        // 3. Generate New Node based on parsed info
        const newNodeId = `node-${Date.now()}`;
        
        // Determine the parent node to position relative to and link from
        // If the AI says targetNodeId is very specifically null (off-topic branch), we respect it.
        // Otherwise we fallback to the tagged node, or AI suggested node, or the last node.
        const parentNodeId = analysis.targetNodeId === null 
            ? null 
            : (taggedNodeId || analysis.targetNodeId || nodes[nodes.length - 1].id);
            
        const parentNode = parentNodeId ? nodes.find(n => n.id === parentNodeId) : null;
        
        let nodeColor = '#A78BFA'; // Default Purple
        if (analysis.type === 'MATERIAL_CHANGE') nodeColor = '#4ADE80';
        else if (analysis.type === 'DESIGN_CHANGE') nodeColor = '#FFB84D';
        else if (analysis.type === 'IMAGE_GENERATION') nodeColor = '#F472B6'; // Pink for images

        const newNode: Node = {
           id: newNodeId,
           type: 'custom',
           position: parentNode ? { x: parentNode.position.x + 350, y: parentNode.position.y + (Math.random() * 100 - 50) } : { x: 50, y: nodes.length * 150 + 50 },
           data: {
               label: analysis.type,
               title: '사용자 요청',
               content: userMsg,
               color: nodeColor,
               imageUrl: generatedImageUrl,
               onImageClick: (url: string) => setSelectedImage(url)
           }
        };

        setNodes(prev => [...prev, newNode]);
        if (parentNode) {
            const newEdge: Edge = { 
               id: `e${parentNode.id}-${newNodeId}`, 
               source: parentNode.id, 
               target: newNodeId, 
               animated: true, 
               style: { stroke: nodeColor } 
            };
            setEdges(prev => [...prev, newEdge]);
        }

        // Auto-pan to new node
        if (rfInstance) {
            setTimeout(() => {
                rfInstance.setCenter(newNode.position.x + 100, newNode.position.y + 50, { zoom: 1, duration: 800 });
            }, 100);
        }

        // Clear the tag after sending
        setTaggedNodeId(null);
        setTaggedNodeName(null);

        // 4. View Control
        if (analysis.type === 'VIEW_CONTROL') {
          if (analysis.action?.includes('rotate')) viewerRef.current?.rotateModel(0, Math.PI / 4);
          if (analysis.action === 'wireframe_on') viewerRef.current?.setWireframe(true);
          if (analysis.action === 'wireframe_off') viewerRef.current?.setWireframe(false);
          if (analysis.action === 'bg_black') viewerRef.current?.setBackground('#000000');
          if (analysis.action === 'bg_white') viewerRef.current?.setBackground('#ffffff');
        }

        setCopilotMessages(prev => [...prev, {
          id: Date.now() + Math.random(),
          role: 'copilot',
          name: 'Jeju Copilot',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          content: replyMessage,
          imageUrl: generatedImageUrl
        }]);
      }
    } catch (error) {
      console.error(error);
      const errorMsg = {
        id: Date.now() + Math.random(),
        role: 'system',
        name: 'System',
        time: '',
        content: language === 'ko' ? '오류가 발생했습니다.' : 'An error occurred.'
      };
      if (activeTab === 'EXPERT') {
        setExpertMessages(prev => [...prev, errorMsg]);
      } else {
        setCopilotMessages(prev => [...prev, errorMsg]);
      }
    } finally {
      setIsLoading(false);
      setAttachedImageBase64(null);
    }
  };

  const handleCameraChange = useCallback((position: any, target: any) => {
    // Automatic live sync disabled to optimize egress. 
    // Use shareCurrentView() instead for manual sharing.
  }, []);

  const shareCurrentView = () => {
     if (!viewerRef.current || !channelRef.current) return;
     
     const camState = viewerRef.current.getCameraState();
     if (!camState) return;

     setIs3DSyncAccepted(true);
     
     // 1. Send sync_request to notify others that I am sharing
     channelRef.current.send({
        type: 'broadcast',
        event: 'sync_request',
        payload: { clientId, senderName: userNickname }
     });
     
     // 2. Send actual camera position one-time
     channelRef.current.send({
        type: 'broadcast',
        event: 'camera_sync',
        payload: { 
            clientId, 
            position: { x: camState.position.x, y: camState.position.y, z: camState.position.z },
            target: { x: camState.target.x, y: camState.target.y, z: camState.target.z }
        }
     }).then(() => {
        console.log("Workspace: Manual view shared.");
     }).catch(console.error);
  };

  // Tools for Left Panel
  const handleTool = (action: string) => {
    if (action === 'rotate') viewerRef.current?.rotateModel(0, Math.PI / 4);
    if (action === 'wireframe') viewerRef.current?.setWireframe(true); // Toggle needs state tracking ideally
    if (action === 'reset') viewerRef.current?.resetCamera();
  };

  const handleExport = async () => {
    try {
      setIsLoading(true);
      const zip = new JSZip();
      
      // 1. Create a markdown file summarizing the AI Copilot Journey
      let markdownContent = `# 🌿 ${project.title} - Upcycling Recipe Export\n\n`;
      markdownContent += `## 💡 AI Design Concept Map\n`;
      nodes.forEach((node, index) => {
        markdownContent += `\n### Step ${index + 1}: ${node.data.label}\n`;
        markdownContent += `- **요청 내용**: ${node.data.content}\n`;
      });

      zip.file("upcycling_recipe.md", markdownContent);

      // 2. Download and attach all generated images from nodes
      const imageFolder = zip.folder("images");
      const imageFetchPromises = nodes
        .filter(n => n.data.imageUrl)
        .map(async (n, index) => {
           const url = n.data.imageUrl as string;
           try {
              if (url.startsWith('data:image')) {
                 const base64Data = url.split(',')[1];
                 imageFolder?.file(`design_step_${index + 1}.png`, base64Data, { base64: true });
              } else {
                 const response = await fetch(url);
                 const blob = await response.blob();
                 imageFolder?.file(`design_step_${index + 1}.png`, blob);
              }
           } catch (e) {
              console.error(`Failed to fetch image for node ${n.id}`, e);
           }
        });

      await Promise.all(imageFetchPromises);

      // 3. Generate ZIP and trigger download
      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, `${project.title.replace(/\s+/g, '_')}_export.zip`);

    } catch (error) {
       console.error("Export failed:", error);
       alert("Export 중 오류가 발생했습니다.");
    } finally {
       setIsLoading(false);
    }
  };

  // 3D 모델 파일 찾기 - ProjectDetail.tsx와 동일한 로직 적용
  const getModel3DUrl = (): string | null => {
    // 0. Synced metadata from DB (Highest priority)
    if (syncedMetadata?.model_3d_url || syncedMetadata?.model_url) {
      return syncedMetadata.model_3d_url || syncedMetadata.model_url;
    }

    // 1. metadata 확인 (AI 생성 프로젝트)
    const metadataUrl = (project as any)?.metadata?.model_3d_url || (project as any)?.metadata?.model_url;
    if (metadataUrl) return metadataUrl;

    // 2. modelFiles에서 3D 파일 찾기
    const model3DFile = project?.modelFiles?.find(
      file => file.name.toLowerCase().endsWith('.glb') || 
              file.name.toLowerCase().endsWith('.stl') || 
              file.name.toLowerCase().endsWith('.gltf')
    ) || project?.modelFiles?.[0]; // Fallback to first file
    
    return model3DFile?.url || null;
  };

  const model3DUrl = getModel3DUrl();

  return (
    <div className="flex h-screen w-full bg-[#111111] text-white overflow-hidden font-sans fixed inset-0 z-50">
      {/* Left Side - Canvas/Viewer */}
      <div className="flex-1 relative border-r border-gray-800 bg-[#050505] overflow-hidden">
        {/* Header Overlay */}
        <div className="absolute top-4 left-4 z-20 flex items-center space-x-3 bg-black/40 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10">
          <button onClick={() => setShowExitWarning(true)} className="mr-2 text-gray-400 hover:text-white">
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
        <div className="absolute top-4 right-4 z-20 flex space-x-2">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-lg border border-white/10 mr-2">
            <span className="text-xs font-bold text-indigo-400">💎 {userTokens}</span>
          </div>
          <button onClick={handleExport} disabled={isLoading} className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 shadow-lg shadow-green-900/20 disabled:opacity-50">
            <span>Export</span>
          </button>
          <button onClick={() => setShowExitWarning(true)} className="p-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors">
            <Maximize size={16} />
          </button>
        </div>

        {/* MAIN CANVAS RENDERER */}
        {activeTab === 'COPILOT' ? (
            // COPILOT MODE: Full Screen React Flow, PIP 3D Viewer
            <div className="w-full h-full relative">
               <ReactFlow 
                nodes={nodes} 
                edges={edges} 
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onInit={setRfInstance}
                onNodeClick={(_, node) => {
                   setTaggedNodeId(node.id);
                   setTaggedNodeName(node.data.label as string || 'Node');
                }}
                nodeTypes={nodeTypes}
                fitView
                className="w-full h-full"
               >
                 <Background gap={20} size={1} color="#333" />
               </ReactFlow>

               {/* PIP 3D Viewer */}
               <div className="absolute bottom-6 left-6 w-[320px] h-[320px] bg-[#050505] rounded-2xl border border-gray-700 shadow-2xl overflow-hidden z-20 group">
                  <div className="absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-black/80 to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity flex justify-between px-2 items-center">
                    <span className="text-[10px] text-gray-300 font-bold ml-1">3D View</span>
                    <button className="text-gray-400 hover:text-white p-1"><Maximize size={12} /></button>
                  </div>
                  <ThreeDViewer
                    ref={viewerRef}
                    modelUrl={model3DUrl || ''}
                    className="w-full h-full"
                    onCameraChange={handleCameraChange}
                  />
               </div>
               
               {/* PIP Floating Toolbar */}
               <div className="absolute left-[360px] bottom-16 z-20 flex flex-col space-y-3 bg-black/60 backdrop-blur-md p-2 rounded-2xl border border-white/10 shadow-2xl">
                  <button onClick={() => handleTool('rotate')} className="p-2.5 text-gray-400 hover:text-green-400 hover:bg-white/10 rounded-xl transition-all" title="Rotate">
                    <RotateCcw size={16} />
                  </button>
                  <button onClick={() => handleTool('wireframe')} className="p-2.5 text-gray-400 hover:text-green-400 hover:bg-white/10 rounded-xl transition-all" title="Wireframe">
                    <Grid3X3 size={16} />
                  </button>
               </div>
            </div>
        ) : (
            // EXPERT MODE: Full Screen 3D Viewer with Sync Lock
            <div className="w-full h-full bg-[#050505] relative">
              <ThreeDViewer
                ref={viewerRef}
                modelUrl={model3DUrl || ''}
                className={`w-full h-full transition-all duration-700 ${!is3DSyncAccepted ? 'blur-sm opacity-30 pointer-events-none' : 'blur-0 opacity-100'}`}
                onCameraChange={handleCameraChange}
              />
              
              {!is3DSyncAccepted && (
                <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm">
                  <div className="p-8 bg-[#1A1A1A] border border-gray-700 rounded-3xl shadow-2xl flex flex-col items-center max-w-sm text-center">
                    <div className="w-16 h-16 bg-green-900/20 rounded-full flex items-center justify-center text-green-500 mb-4">
                      <Box size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">3D 협업 모드</h3>
                    <p className="text-sm text-gray-400 mb-6 leading-relaxed">
                      상대방이 3D 화면 공유를 시작하거나,<br/>공유 요청을 수락하면 화면이 보입니다.
                    </p>
                      <button 
                        onClick={shareCurrentView}
                        className="px-6 py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-all"
                      >
                        내 화면 공유하기 (Share My View)
                      </button>
                    </div>
                  </div>
                )}

              {!model3DUrl && is3DSyncAccepted && (
                <div className="absolute inset-0 flex items-center justify-center text-gray-600">
                  No 3D Model Loaded
                </div>
              )}
               {/* Floating Toolbar */}
              <div className="absolute left-6 top-1/2 -translate-y-1/2 flex flex-col space-y-3 bg-black/60 backdrop-blur-md p-2 rounded-2xl border border-white/10 shadow-2xl z-20">
                <button onClick={() => handleTool('rotate')} className="p-3 text-gray-400 hover:text-green-400 hover:bg-white/10 rounded-xl transition-all" title="Rotate">
                  <RotateCcw size={20} />
                </button>
                <button 
                  onClick={shareCurrentView} 
                  className={`p-3 rounded-xl transition-all ${is3DSyncAccepted ? 'text-green-400 bg-green-400/10' : 'text-gray-400 hover:text-green-400 hover:bg-white/10'}`} 
                  title="Share/Sync Controls"
                >
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
        )}
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
                 selectedPeer ? (
                    selectedPeer.avatar.startsWith('http') ? (
                        <img src={selectedPeer.avatar} alt={selectedPeer.nickname} className="w-12 h-12 rounded-full bg-gray-700 border-2 border-green-500 shadow-md shadow-green-900/20" />
                    ) : (
                        <div className="w-12 h-12 rounded-full bg-blue-900/50 flex items-center justify-center border-2 border-green-500 shadow-md shadow-green-900/20 text-blue-400 font-bold text-xl">
                          {selectedPeer.nickname.charAt(0)}
                        </div>
                    )
                 ) : (
                   <div className="w-12 h-12 rounded-full bg-green-900/30 flex items-center justify-center border-2 border-green-500 shadow-md shadow-green-900/20">
                     <span className="material-icons-round text-green-500 text-2xl">group</span>
                   </div>
                 )
              ) : (
                <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center border-2 border-indigo-400">
                  <Sparkles size={24} className="text-white" />
                </div>
              )}
              <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-[#1A1A1A] rounded-full"></div>
            </div>
            <div>
              <h3 className="font-bold text-gray-100 text-base">
                {activeTab === 'EXPERT' 
                   ? (selectedPeer ? selectedPeer.nickname : (language === 'ko' ? '프로젝트 채널' : 'Project Channel')) 
                   : 'Jeju Copilot'}
              </h3>
              <div className="flex items-center gap-1.5 text-xs text-green-500 font-medium mt-0.5">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                {activeTab === 'EXPERT' 
                   ? (selectedPeer ? 'Direct Chat' : (onlineUsers.length > 0 ? `${onlineUsers.length} Online` : 'No one online')) 
                   : 'Ready to help'}
              </div>
            </div>
          </div>
          <button className="text-gray-500 hover:text-white transition-colors">
            <MoreHorizontal size={20} />
          </button>
        </div>

        {/* Human Expert Community Roster (Active only in EXPERT mode) */}
        {activeTab === 'EXPERT' && (
           <div className="px-5 py-4 border-b border-gray-800 bg-[#1A1A1A]">
             <div className="flex space-x-4 overflow-x-auto pb-2 scrollbar-hide">
                {/* Removed Everyone Channel Icon */}
                
                {/* Online Makers (Filtering out current user and Master Kim) */}
                {onlineUsers.filter(u => u.user_id !== currentUserId && u.nickname !== '김장인' && u.nickname !== 'Master Kim').map((u, idx) => {
                   const isSelected = selectedPeer?.user_id === u.user_id;
                   return (
                   <div key={idx} onClick={() => setSelectedPeer(u)} className={`flex flex-col items-center gap-1 transition-opacity cursor-pointer ${isSelected ? 'opacity-100' : 'opacity-60 hover:opacity-100'}`}>
                     <div className="relative">
                       {u.avatar.startsWith('http') ? (
                          <img src={u.avatar} alt={u.nickname} className={`w-12 h-12 rounded-full border-2 bg-gray-700 ${isSelected ? 'border-green-500 shadow-lg shadow-green-900/20' : 'border-gray-600'}`} />
                       ) : (
                          <div className={`w-12 h-12 rounded-full border-2 bg-blue-900/50 flex items-center justify-center text-blue-400 font-bold text-sm ${isSelected ? 'border-green-500 shadow-lg shadow-green-900/20' : 'border-gray-600'}`}>
                             {u.nickname.charAt(0)}
                          </div>
                       )}
                       <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#1A1A1A] rounded-full"></div>
                     </div>
                     <span className={`text-[10px] whitespace-nowrap overflow-hidden text-ellipsis max-w-[60px] text-center ${isSelected ? 'font-bold text-gray-200' : 'font-medium text-gray-400'}`}>{u.nickname}</span>
                   </div>
                   );
                })}
             </div>
           </div>
        )}

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-[#1A1A1A] custom-scrollbar">
          {/* Date Divider */}
          <div className="flex items-center justify-center my-2">
            <span className="text-[10px] uppercase font-bold text-gray-500 bg-[#252525] px-3 py-1 rounded-full tracking-wider border border-white/5">
              Today
            </span>
          </div>

          {(activeTab === 'EXPERT' ? expertMessages : copilotMessages).map((msg) => (
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
                  {(msg as any).imageUrl && (
                    <div 
                      className="mt-2 rounded-lg overflow-hidden border border-white/10 bg-black/50 cursor-pointer hover:border-white/30 transition-all aspect-video"
                      onClick={() => setSelectedImage((msg as any).imageUrl)}
                    >
                      <img src={(msg as any).imageUrl} alt="AI Generated" className="w-full h-full object-cover" />
                    </div>
                  )}
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
        <div className="p-4 bg-[#1F1F1F] border-t border-gray-800 flex flex-col">
          {/* Tagged Node Indicator */}
          {taggedNodeId && activeTab === 'COPILOT' && (
             <div className="mb-2 flex items-center gap-2">
                 <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded border border-indigo-500/30 flex items-center gap-1 shadow-sm">
                     <span className="font-bold">🔗 참조:</span> {taggedNodeName}
                     <button type="button" onClick={() => { setTaggedNodeId(null); setTaggedNodeName(null); }} className="ml-1 text-indigo-400 hover:text-white transition-colors">
                         &times;
                     </button>
                 </span>
             </div>
          )}

          {/* Attached Image Preview */}
          {attachedImageBase64 && (
            <div className="mb-3 relative w-20 h-20 rounded-xl border border-white/20 overflow-hidden group">
               <img src={attachedImageBase64} alt="Attached" className="w-full h-full object-cover" />
               <button 
                 type="button" 
                 onClick={() => setAttachedImageBase64(null)} 
                 className="absolute top-1 right-1 bg-black/60 hover:bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all border border-white/10"
                 title="Remove Image"
               >
                 <X size={12} />
               </button>
            </div>
          )}

          <form onSubmit={handleSendMessage} className="relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={activeTab === 'EXPERT' ? (selectedPeer ? `${selectedPeer.nickname}님에게 메시지...` : (language === 'ko' ? '모두에게 메시지 보내기...' : "Message everyone...")) : "Ask AI to edit..."}
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
            <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
            <div className="flex space-x-2">
              <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2.5 hover:bg-[#333] rounded-xl text-gray-400 hover:text-white transition-colors" title="Attach Image">
                <ImageIcon size={20} />
              </button>
              {activeTab === 'EXPERT' && (
                 <button 
                  type="button"
                  onClick={shareCurrentView} 
                  className={`p-2.5 rounded-xl transition-colors ${is3DSyncAccepted ? 'bg-green-600/20 text-green-400 hover:bg-green-600/30' : 'hover:bg-[#333] text-gray-400 hover:text-white'}`}
                  title={is3DSyncAccepted ? "3D Shared" : "Share 3D View"}
                 >
                   <Box size={20} />
                 </button>
              )}
            </div>
            <button className="px-4 py-2 rounded-xl bg-[#2A2A2A] hover:bg-[#333] text-xs font-bold text-gray-300 transition-colors border border-gray-700 hover:border-gray-500">
              Requested Fix
            </button>
          </div>
        </div>
      </div>

      {/* Image Modal Integration */}
      {selectedImage && (
        <ImageModal 
          imageUrl={selectedImage} 
          onClose={() => setSelectedImage(null)} 
        />
      )}

      {/* Exit Warning Modal */}
      {showExitWarning && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#1A1A1A] border border-gray-700 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-scale-in">
             <div className="p-6">
                <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                  <span className="text-red-500">⚠️</span> 워크스페이스 나가기
                </h3>
                <p className="text-sm text-gray-300 leading-relaxed">
                   이 창을 떠나면 코파일럿과 나눈 **대화 내용이 모두 삭제**됩니다.<br/><br/>
                   결과물을 보존하시려면 **[Export]** 버튼을 통해 기기에 다운로드하거나, 스크린샷으로 중요한 내용을 캡처해 주세요.<br/><br/>
                   정말 나가시겠습니까?
                </p>
             </div>
             <div className="flex border-t border-gray-800 bg-[#111111]">
                <button 
                  onClick={() => setShowExitWarning(false)}
                  className="flex-1 py-3 text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 transition-colors border-r border-gray-800"
                >
                  취소(돌아가기)
                </button>
                <button 
                  onClick={() => {
                      setShowExitWarning(false);
                      onExit();
                  }}
                  className="flex-1 py-3 text-sm font-bold text-red-500 hover:bg-red-500/10 transition-colors"
                >
                  네, 나갑니다
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Workspace;