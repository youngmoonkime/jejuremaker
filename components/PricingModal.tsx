import React, { useState } from 'react';
import { Language } from '../contexts/ThemeContext';

interface PricingModalProps {
    isOpen: boolean;
    onClose: () => void;
    language: Language;
    userTokens: number;
    onPurchaseTokens?: (amount: number) => void;
    onSubscribe?: (planId: string) => void;
}

const PricingModal: React.FC<PricingModalProps> = ({
    isOpen,
    onClose,
    language,
    userTokens,
    onPurchaseTokens,
    onSubscribe
}) => {
    const [activeTab, setActiveTab] = useState<'tokens' | 'subscription'>('tokens');

    if (!isOpen) return null;

    const t = {
        title: language === 'ko' ? '요금 및 토큰 결제' : 'Pricing & Tokens',
        subtitle: language === 'ko' ? '제주 리메이크 랩의 모든 기능을 제약 없이 사용해보세요.' : 'Unlock all features of Jeju Remake Lab.',
        currentBalance: language === 'ko' ? '현재 보유 토큰' : 'Current Balance',
        tabTokens: language === 'ko' ? '토큰 충전' : 'Buy Tokens',
        tabSub: language === 'ko' ? '월정액 구독' : 'Subscriptions',
        close: language === 'ko' ? '닫기' : 'Close',
        purchase: language === 'ko' ? '구매하기' : 'Purchase',
        subscribe: language === 'ko' ? '구독하기' : 'Subscribe',
        currentPlan: language === 'ko' ? '현재 이용중' : 'Current Plan',
        popular: language === 'ko' ? '인기 추천' : 'Popular',
    };

    const tokenPackages = [
        {
            id: 'starter',
            name: language === 'ko' ? '스타터 팩' : 'Starter Pack',
            tokens: 100,
            price: '₩ 6,000',
            desc: language === 'ko' ? '3D 모델 약 3회 생성 가능' : 'Approx. 3x 3D Generations'
        },
        {
            id: 'creator',
            name: language === 'ko' ? '크리에이터 팩' : 'Creator Pack',
            tokens: 300,
            price: '₩ 16,900',
            desc: language === 'ko' ? '소폭 할인 적용' : 'Slight discount applied',
            popular: true
        },
        {
            id: 'master',
            name: language === 'ko' ? '마스터 팩' : 'Master Pack',
            tokens: 1000,
            price: '₩ 49,900',
            desc: language === 'ko' ? '대폭 할인, 전문가용' : 'Massive discount, for pros'
        }
    ];

    const subscriptions = [
        {
            id: 'free',
            name: 'Free',
            price: '₩ 0 / 월',
            tokens: language === 'ko' ? '가입 시 20 토큰' : '20 Tokens on signup',
            features: [
                language === 'ko' ? '타인 작품 구경 무제한' : 'View all projects unlimited',
                language === 'ko' ? '프로젝트 좋아요 기능' : 'Like projects',
            ]
        },
        {
            id: 'pro',
            name: 'Remaker Pro',
            price: '₩ 29,900 / 월',
            tokens: language === 'ko' ? '매월 600 토큰 지급' : '600 Tokens / month',
            features: [
                language === 'ko' ? '정가 36,000원 상당' : 'Value of ₩36,000',
                language === 'ko' ? '생성 대기열 최우선 처리' : 'Priority generation queue',
            ],
            popular: true
        },
        {
            id: 'studio',
            name: 'Remaker Studio',
            price: '₩ 89,900 / 월',
            tokens: language === 'ko' ? '매월 2,000 토큰 지급' : '2,000 Tokens / month',
            features: [
                language === 'ko' ? '정가 120,000원 상당' : 'Value of ₩120,000',
                language === 'ko' ? '미사용 토큰 익월 이월' : 'Rollover unused tokens',
                language === 'ko' ? '전용 고급 AI 모델 선택' : 'Exclusive advanced AI models',
            ]
        }
    ];

    const handlePurchase = (amount: number) => {
        if (onPurchaseTokens) onPurchaseTokens(amount);
    };

    const handleSubscribe = (planId: string) => {
        if (onSubscribe) onSubscribe(planId);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-900 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[90vh] md:h-auto max-h-[90vh]">
                
                {/* Header */}
                <div className="px-6 py-5 md:px-8 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between shrink-0 bg-gray-50/50 dark:bg-gray-800/50">
                    <div>
                        <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <span className="material-icons-round text-primary">storefront</span>
                            {t.title}
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t.subtitle}</p>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-full border border-emerald-100 dark:border-emerald-800/50">
                            <span className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">{t.currentBalance}</span>
                            <div className="flex items-center gap-1">
                                <span className="material-icons-round text-emerald-500 text-sm">recycling</span>
                                <span className="text-sm font-bold text-emerald-900 dark:text-emerald-100">{userTokens}</span>
                            </div>
                        </div>
                        <button 
                            onClick={onClose}
                            className="w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition text-xl"
                        >
                            <span className="material-icons-round">close</span>
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-100 dark:border-gray-800 px-6 md:px-8 shrink-0">
                    <button
                        className={`py-4 px-2 font-bold text-sm border-b-2 transition-colors mr-8 ${activeTab === 'tokens' ? 'border-primary text-primary' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'}`}
                        onClick={() => setActiveTab('tokens')}
                    >
                        {t.tabTokens}
                    </button>
                    <button
                        className={`py-4 px-2 font-bold text-sm border-b-2 transition-colors ${activeTab === 'subscription' ? 'border-primary text-primary' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'}`}
                        onClick={() => setActiveTab('subscription')}
                    >
                        {t.tabSub}
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-gray-50 dark:bg-[#0B1120]">
                    {activeTab === 'tokens' && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {tokenPackages.map(pkg => (
                                <div key={pkg.id} className={`relative bg-white dark:bg-gray-800 rounded-2xl p-6 border-2 transition-all hover:shadow-xl dark:shadow-none ${pkg.popular ? 'border-primary shadow-lg' : 'border-gray-100 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'}`}>
                                    {pkg.popular && (
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-sm">
                                            {t.popular}
                                        </div>
                                    )}
                                    <div className="text-center mb-6">
                                        <h3 className="font-bold text-gray-900 dark:text-white mb-1">{pkg.name}</h3>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{pkg.desc}</p>
                                    </div>
                                    <div className="flex justify-center items-end gap-1 mb-6">
                                        <span className="material-icons-round text-emerald-500 text-3xl mb-1">recycling</span>
                                        <span className="text-4xl font-black text-gray-900 dark:text-white">{pkg.tokens}</span>
                                    </div>
                                    <div className="text-center mb-6">
                                        <span className="text-xl font-bold text-gray-900 dark:text-white">{pkg.price}</span>
                                    </div>
                                    <button 
                                        onClick={() => handlePurchase(pkg.tokens)}
                                        className={`w-full py-3 rounded-xl font-bold text-sm transition-colors ${pkg.popular ? 'bg-primary text-white hover:bg-primary-dark' : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                                    >
                                        {t.purchase}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'subscription' && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {subscriptions.map(sub => (
                                <div key={sub.id} className={`relative bg-white dark:bg-gray-800 rounded-2xl p-6 border-2 flex flex-col transition-all hover:shadow-xl dark:shadow-none ${sub.popular ? 'border-[#ff4c4c] shadow-lg shadow-red-500/10' : 'border-gray-100 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'}`}>
                                    {sub.popular && (
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#ff4c4c] text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-sm">
                                            BEST VALUE
                                        </div>
                                    )}
                                    <div className="mb-6 border-b border-gray-100 dark:border-gray-700 pb-6">
                                        <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-2">{sub.name}</h3>
                                        <div className="text-2xl font-black text-gray-900 dark:text-white mb-2">{sub.price}</div>
                                        <div className="flex items-center gap-1.5 text-sm font-bold text-emerald-600 dark:text-emerald-400">
                                            <span className="material-icons-round text-base">recycling</span>
                                            {sub.tokens}
                                        </div>
                                    </div>
                                    <ul className="space-y-3 mb-8 flex-1">
                                        {sub.features.map((feat, i) => (
                                            <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                                                <span className="material-icons-round text-emerald-500 text-base shrink-0 mt-0.5">check_circle</span>
                                                <span className="leading-tight">{feat}</span>
                                            </li>
                                        ))}
                                    </ul>
                                    <button 
                                        onClick={() => handleSubscribe(sub.id)}
                                        className={`w-full py-3 rounded-xl font-bold text-sm transition-colors mt-auto ${sub.id === 'free' ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed' : sub.popular ? 'bg-[#ff4c4c] text-white hover:bg-red-600' : 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-200'}`}
                                        disabled={sub.id === 'free'}
                                    >
                                        {sub.id === 'free' ? t.currentPlan : t.subscribe}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PricingModal;
