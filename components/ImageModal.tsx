import React, { useEffect } from 'react';
import { X, Download } from 'lucide-react';

interface ImageModalProps {
  imageUrl: string;
  onClose: () => void;
  title?: string;
}

const ImageModal: React.FC<ImageModalProps> = ({ imageUrl, onClose, title }) => {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const handleDownload = async () => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `jeju-remaker-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      // Fallback for data URLs if fetch fails
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = `jeju-remaker-${Date.now()}.png`;
      link.click();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm animate-fade-in p-4 md:p-8">
      {/* Close Background */}
      <div className="absolute inset-0" onClick={onClose}></div>

      <div className="relative max-w-5xl w-full h-full flex flex-col items-center justify-center gap-4 z-10 pointer-events-none">
        {/* Header Controls */}
        <div className="absolute top-0 right-0 p-4 flex gap-3 pointer-events-auto">
          <button 
            onClick={handleDownload}
            className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md transition-all border border-white/10 flex items-center gap-2 group"
            title="Download Image"
          >
            <Download size={20} />
            <span className="text-sm font-bold hidden md:inline">Download</span>
          </button>
          <button 
            onClick={onClose}
            className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md transition-all border border-white/10"
            title="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Image Display */}
        <div className="relative w-full h-[80vh] flex items-center justify-center pointer-events-auto">
          <img 
            src={imageUrl} 
            alt={title || "Generated Preview"} 
            className="max-w-full max-h-full object-contain shadow-2xl rounded-lg animate-fade-in-up"
          />
        </div>

        {/* Info */}
        {title && (
          <div className="text-white/80 text-sm font-medium bg-black/40 px-4 py-2 rounded-full backdrop-blur-sm pointer-events-auto">
            {title}
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageModal;
