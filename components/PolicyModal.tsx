import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Language } from '../contexts/ThemeContext';

export type PolicyType = 'privacy' | 'terms' | 'guidelines' | 'search' | 'faq' | 'cookies';

interface PolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: PolicyType | null;
  language: Language;
}

const PolicyModal: React.FC<PolicyModalProps> = ({ isOpen, onClose, type, language }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      document.body.style.overflow = 'hidden';
    } else {
      setTimeout(() => setIsVisible(false), 200); // Wait for fade out
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen && !isVisible) return null;

  const getTitle = () => {
    switch (type) {
      case 'privacy': return language === 'ko' ? '개인정보 처리방침' : 'Privacy Policy';
      case 'terms': return language === 'ko' ? '이용 약관' : 'Terms of Use';
      case 'guidelines': return language === 'ko' ? '커뮤니티 가이드라인' : 'Community Guidelines';
      case 'search': return language === 'ko' ? '인기 검색어' : 'Popular Searches';
      case 'faq': return language === 'ko' ? '자주 묻는 질문' : 'FAQ';
      case 'cookies': return language === 'ko' ? '쿠키 설정' : 'Cookie Settings';
      default: return '';
    }
  };

  const getContent = () => {
    switch (type) {
      case 'privacy':
        return language === 'ko' 
          ? '개인정보 처리방침에 대한 상세 내용이 여기에 들어갑니다. 본문 내용은 추후 업데이트될 예정입니다.\n\n수집하는 개인정보 항목...\n개인정보의 처리 목적...'
          : 'Privacy Policy content goes here. It will be updated later.\n\nCollected information...\nPurpose of processing...';
      case 'terms':
        return language === 'ko' 
          ? '이용 약관에 대한 상세 내용이 여기에 들어갑니다. 본문 내용은 추후 업데이트될 예정입니다.\n\n제1조 목적...\n제2조 정의...'
          : 'Terms of Use content goes here. It will be updated later.\n\nArticle 1 Purpose...\nArticle 2 Definitions...';
      case 'guidelines':
        return language === 'ko' 
          ? '커뮤니티 가이드라인에 대한 상세 내용이 여기에 들어갑니다. 본문 내용은 추후 업데이트될 예정입니다.\n\n건전한 커뮤니티 조성을 위한 약속...\n금지되는 활동...'
          : 'Community Guidelines content goes here. It will be updated later.\n\nCommitment to a healthy community...\nProhibited activities...';
      case 'search':
        return language === 'ko' 
          ? '현재 인기 있는 검색어 목록을 수집 중입니다.\n이 서비스는 곧 제공될 예정입니다.'
          : 'Popular searches are being aggregated.\nThis service will be available soon.';
      case 'faq':
        return language === 'ko' 
          ? '자주 묻는 질문(FAQ) 내용이 여기에 들어갑니다. 본문 내용은 추후 업데이트될 예정입니다.\n\nQ1. 어떻게 이용하나요?\nQ2. 계정 관리는 어떻게 하나요?'
          : 'FAQ content goes here. It will be updated later.\n\nQ1. How do I use this?\nQ2. How do I manage my account?';
      case 'cookies':
        return language === 'ko' 
          ? '쿠키 설정에 대한 내용이 여기에 들어갑니다. 필수 쿠키 및 선택적 정보 제공 동의 여부를 안내할 예정입니다.'
          : 'Cookie Settings content goes here. We will guide you on necessary cookies and optional consent details.';
      default:
        return language === 'ko' ? '내용을 준비 중입니다.' : 'Content is being prepared.';
    }
  };

  const modalContent = (
    <div className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 transition-all duration-200 ${isOpen ? 'bg-black/40 backdrop-blur-sm opacity-100' : 'bg-transparent opacity-0 pointer-events-none'}`}>
      <div className="absolute inset-0" onClick={onClose}></div>
      <div 
        className={`relative w-full max-w-[600px] max-h-[85vh] flex flex-col bg-white/95 dark:bg-[#1c1c1e]/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-white/10 overflow-hidden transition-all duration-300 ${isOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-white/10 shrink-0">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span className="material-icons-round text-primary text-2xl">info</span>
            {getTitle()}
          </h2>
          <button
            onClick={onClose}
            className="p-2 -mr-2 text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors rounded-full hover:bg-black/5 dark:hover:bg-white/10"
          >
            <span className="material-icons-round text-[20px] leading-none">close</span>
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-gray-50/50 dark:bg-black/20">
          <div className="whitespace-pre-wrap text-[15px] leading-relaxed text-gray-600 dark:text-gray-300">
            {getContent()}
          </div>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
};

export default PolicyModal;
