import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, X, ChevronRight, ChevronLeft } from 'lucide-react';

interface CopilotPanelProps {
    isOpen: boolean;
    onClose: () => void;
    onSendMessage: (message: string) => Promise<void>;
    messages: { role: 'user' | 'assistant'; content: string; type?: 'text' | 'preview' | 'action'; meta?: any }[];
    isLoading: boolean;
}

const CopilotPanel: React.FC<CopilotPanelProps> = ({ isOpen, onClose, onSendMessage, messages, isLoading }) => {
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;
        const msg = input;
        setInput('');
        await onSendMessage(msg);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed top-0 right-0 h-full w-96 bg-white dark:bg-gray-900 shadow-2xl z-50 transform transition-transform duration-300 flex flex-col border-l border-gray-200 dark:border-gray-800">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900">
                <div className="flex items-center space-x-2">
                    <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2 rounded-lg">
                        <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 dark:text-white">AI Atelier</h3>
                        <p className="text-xs text-green-600 font-medium">Copilot Active</p>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
                >
                    <X className="w-5 h-5 text-gray-500" />
                </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900/50">
                {messages.length === 0 && (
                    <div className="text-center py-10 opacity-60">
                        <Sparkles className="w-12 h-12 mx-auto text-blue-400 mb-3" />
                        <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
                            무엇을 도와드릴까요?
                        </h4>
                        <p className="text-xs text-gray-500">
                            "색상을 바꿔줘"<br />
                            "손잡이를 더 길게 만들어줘"<br />
                            "위에서 보여줘"
                        </p>
                    </div>
                )}

                {messages.map((msg, idx) => (
                    <div
                        key={idx}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm ${msg.role === 'user'
                                    ? 'bg-blue-600 text-white rounded-br-none'
                                    : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-gray-700 rounded-bl-none'
                                }`}
                        >
                            {msg.content}
                            {msg.type === 'preview' && msg.meta?.imageUrl && (
                                <div className="mt-2 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                                    <img src={msg.meta.imageUrl} alt="Preview" className="w-full h-auto" />
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-white dark:bg-gray-800 px-4 py-3 rounded-2xl rounded-bl-none border border-gray-100 dark:border-gray-700 shadow-sm flex items-center space-x-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSubmit} className="p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
                <div className="relative">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="AI에게 수정 요청..."
                        className="w-full pl-4 pr-12 py-3 bg-gray-100 dark:bg-gray-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500 dark:text-white placeholder-gray-400"
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || isLoading}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
                <div className="mt-2 text-center">
                    <span className="text-[10px] text-gray-400">
                        단순 뷰어 조작은 무료 • 생성은 확인 후 진행됩니다
                    </span>
                </div>
            </form>
        </div>
    );
};

export default CopilotPanel;
