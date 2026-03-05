import React, { memo } from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';
import { X } from 'lucide-react';

interface CustomNodeProps {
    data: {
        label: string;
        title: string;
        content: string;
        color: string;
        imageUrl?: string;
        onImageClick?: (url: string) => void;
    };
}

export const CustomNode = memo(({ id, data }: CustomNodeProps & { id: string }) => {
    const { setNodes, setEdges } = useReactFlow();

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        setNodes((nds) => nds.filter((n) => n.id !== id));
        setEdges((eds) => eds.filter((edge) => edge.source !== id && edge.target !== id));
    };

    return (
        <div className={`rounded-xl overflow-hidden border border-gray-700 bg-[#1A1A1A] w-64 shadow-xl`} style={{ boxShadow: `0 0 15px ${data.color}20` }}>
            {/* Input Handle */}
            <Handle type="target" position={Position.Left} className="w-2 h-2 !bg-gray-500 border-none" />

            <div className="p-3 relative group">
                <button 
                  onClick={handleDelete}
                  className="absolute top-2 right-2 p-1 text-gray-500 hover:text-red-400 hover:bg-white/10 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                  title="Delete Node"
                >
                    <X size={14} />
                </button>
                <div className="text-[10px] font-bold mb-1" style={{ color: data.color }}>{data.label}</div>
                <div className="text-sm font-bold text-white mb-1.5">{data.title}</div>
                <div className="text-xs text-gray-400 leading-snug break-keep">
                    {data.content}
                </div>
                {data.imageUrl && (
                    <div 
                      className="mt-2 w-full h-24 rounded-lg overflow-hidden border border-white/10 bg-black/50 cursor-pointer hover:border-white/30 transition-all"
                      onClick={(e) => { e.stopPropagation(); data.onImageClick?.(data.imageUrl!); }}
                    >
                        <img src={data.imageUrl} alt="Generated UI" className="w-full h-full object-cover" />
                    </div>
                )}
            </div>

            {/* Output Handle */}
            <Handle type="source" position={Position.Right} className="w-2 h-2 !bg-gray-500 border-none" />
        </div>
    );
});
