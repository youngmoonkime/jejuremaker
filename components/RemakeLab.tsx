import React, { useState, useEffect, useRef } from 'react';
import { Language } from '../contexts/ThemeContext';
import { useToast } from '../contexts/ToastContext';
import { generateUpcyclingImage, generateBlueprintImage } from '../services/aiService';
import { config } from '../services/config';
import { X, Download, RefreshCw, Sparkles, Upload } from 'lucide-react';

interface RemakeLabProps {
    language: Language;
    userTokens: number;
    setUserTokens: (tokens: number) => void;
    onTokenClick?: () => void;
}

type ActiveTool = 'basalt' | 'musician' | 'blueprint' | null;

// ────────────────────────────────────────────
// Tool Modal Wrapper
// ────────────────────────────────────────────
const ToolModal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({ title, onClose, children }) => (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white dark:bg-[#1E293B] w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                <h3 className="font-bold text-lg text-gray-900 dark:text-white">{title}</h3>
                <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center transition">
                    <X size={18} className="text-gray-500" />
                </button>
            </div>
            <div className="p-6">{children}</div>
        </div>
    </div>
);

// ────────────────────────────────────────────
// Result Panel (shared)
// ────────────────────────────────────────────
const ResultPanel: React.FC<{ imageUrl: string; onDownload: () => void; onRegenerate: () => void; language: Language }> = ({ imageUrl, onDownload, onRegenerate, language }) => (
    <div className="mt-4 space-y-3">
        <div className="rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <img src={imageUrl} alt="Generated" className="w-full object-contain max-h-72" />
        </div>
        <div className="flex gap-2">
            <button onClick={onDownload} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-sm transition">
                <Download size={15} /> {language === 'ko' ? '다운로드' : 'Download'}
            </button>
            <button onClick={onRegenerate} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-semibold text-sm transition">
                <RefreshCw size={15} /> {language === 'ko' ? '재생성' : 'Regenerate'}
            </button>
        </div>
    </div>
);

// ────────────────────────────────────────────
// Basalt Pattern Generator Modal
// ────────────────────────────────────────────
const BasaltModal: React.FC<{ language: Language; userTokens: number; setUserTokens: (t: number) => void; onClose: () => void }> = ({ language, userTokens, setUserTokens, onClose }) => {
    const { showToast } = useToast();
    const [finish, setFinish] = useState<'raw' | 'polished' | 'matte'>('raw');
    const [color, setColor] = useState<'dark' | 'rust' | 'black' | 'mixed'>('dark');
    const [density, setDensity] = useState<'sparse' | 'dense' | 'micro'>('dense');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<string | null>(null);
    const COST = 10;

    const finishLabels = { raw: language === 'ko' ? '원석 (Raw)' : 'Raw Stone', polished: language === 'ko' ? '연마 (Polished)' : 'Polished', matte: language === 'ko' ? '무광 (Matte)' : 'Matte' };
    const colorLabels = { dark: language === 'ko' ? '진한 회색' : 'Dark Grey', rust: language === 'ko' ? '녹슨 갈색' : 'Rust Brown', black: language === 'ko' ? '흑색' : 'Jet Black', mixed: language === 'ko' ? '혼합' : 'Mixed' };
    const densityLabels = { sparse: language === 'ko' ? '성근 기공' : 'Sparse Pores', dense: language === 'ko' ? '조밀한 기공' : 'Dense Pores', micro: language === 'ko' ? '초미세 기공' : 'Micro Pores' };

    const generate = async () => {
        if (userTokens < COST) { showToast(language === 'ko' ? `토큰이 부족합니다. (필요: ${COST})` : `Not enough tokens. (Required: ${COST})`, 'warning'); return; }
        setLoading(true);
        setResult(null);
        try {
            const prompt = `A seamless macro-photography texture of Jeju volcanic basalt rock. Surface finish: ${finish}. Color palette: ${color} tones. Pore density: ${density} cellular structure. Scientific specimen photography, ultra high-resolution, uniform square tile, neutral white background, product material sample sheet. No text, no labels, no shadows outside the tile.`;
            const img = await generateUpcyclingImage(prompt, config.models.productImage);
            setResult(img);
            setUserTokens(userTokens - COST);
            showToast(language === 'ko' ? '패턴 생성 완료!' : 'Pattern generated!', 'success');
        } catch (e) {
            showToast(language === 'ko' ? '생성 실패. 다시 시도해주세요.' : 'Generation failed. Please try again.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const download = () => {
        if (!result) return;
        const a = document.createElement('a');
        a.href = result;
        a.download = `basalt_pattern_${Date.now()}.png`;
        a.click();
    };

    return (
        <ToolModal title={language === 'ko' ? '현무암 패턴 생성기' : 'Basalt Pattern Generator'} onClose={onClose}>
            <div className="space-y-4">
                <div>
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 block">{language === 'ko' ? '표면 처리' : 'Surface Finish'}</label>
                    <div className="flex gap-2 flex-wrap">
                        {(['raw', 'polished', 'matte'] as const).map(f => (
                            <button key={f} onClick={() => setFinish(f)} className={`px-4 py-2 rounded-xl text-sm font-medium transition border ${finish === f ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-transparent' : 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'}`}>
                                {finishLabels[f]}
                            </button>
                        ))}
                    </div>
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 block">{language === 'ko' ? '색상' : 'Color'}</label>
                    <div className="flex gap-2 flex-wrap">
                        {(['dark', 'rust', 'black', 'mixed'] as const).map(c => (
                            <button key={c} onClick={() => setColor(c)} className={`px-4 py-2 rounded-xl text-sm font-medium transition border ${color === c ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-transparent' : 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'}`}>
                                {colorLabels[c]}
                            </button>
                        ))}
                    </div>
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 block">{language === 'ko' ? '기공 밀도' : 'Pore Density'}</label>
                    <div className="flex gap-2 flex-wrap">
                        {(['sparse', 'dense', 'micro'] as const).map(d => (
                            <button key={d} onClick={() => setDensity(d)} className={`px-4 py-2 rounded-xl text-sm font-medium transition border ${density === d ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-transparent' : 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'}`}>
                                {densityLabels[d]}
                            </button>
                        ))}
                    </div>
                </div>

                {!result && (
                    <button onClick={generate} disabled={loading} className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 text-white font-bold flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-200 dark:shadow-none">
                        {loading ? <><RefreshCw size={16} className="animate-spin" /> {language === 'ko' ? '생성 중...' : 'Generating...'}</> : <><Sparkles size={16} /> {language === 'ko' ? `생성하기 (${COST} 토큰)` : `Generate (${COST} tokens)`}</>}
                    </button>
                )}

                {result && <ResultPanel imageUrl={result} onDownload={download} onRegenerate={() => { setResult(null); generate(); }} language={language} />}
            </div>
        </ToolModal>
    );
};

// ────────────────────────────────────────────
// Cardboard Musician Modal
// ────────────────────────────────────────────
const MusicianModal: React.FC<{ language: Language; userTokens: number; setUserTokens: (t: number) => void; onClose: () => void }> = ({ language, userTokens, setUserTokens, onClose }) => {
    const { showToast } = useToast();
    const [instrument, setInstrument] = useState<'guitar' | 'drum' | 'ukulele' | 'piano' | 'violin'>('guitar');
    const [style, setStyle] = useState<'cartoon' | 'realistic' | 'minimal'>('cartoon');
    const [theme, setTheme] = useState<'nature' | 'ocean' | 'urban' | 'cosmic'>('ocean');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<string | null>(null);
    const COST = 10;

    const instrLabels: Record<typeof instrument, string> = { guitar: '기타', drum: '드럼', ukulele: '우쿨렐레', piano: '피아노', violin: '바이올린' };
    const styleLabels: Record<typeof style, string> = { cartoon: language === 'ko' ? '카툰' : 'Cartoon', realistic: language === 'ko' ? '사실적' : 'Realistic', minimal: language === 'ko' ? '미니멀' : 'Minimal' };
    const themeLabels: Record<typeof theme, string> = { nature: language === 'ko' ? '자연' : 'Nature', ocean: language === 'ko' ? '바다' : 'Ocean', urban: language === 'ko' ? '도시' : 'Urban', cosmic: language === 'ko' ? '우주' : 'Cosmic' };

    const generate = async () => {
        if (userTokens < COST) { showToast(language === 'ko' ? `토큰이 부족합니다. (필요: ${COST})` : `Not enough tokens. (Required: ${COST})`, 'warning'); return; }
        setLoading(true);
        setResult(null);
        try {
            const styleMap = { cartoon: 'whimsical cartoon illustration', realistic: 'detailed realistic illustration', minimal: 'clean minimal line art illustration' };
            const themeMap = { nature: 'surrounded by Jeju greenery and volcanic rock', ocean: 'on Jeju beach with ocean waves backdrop', urban: 'in a modern city street setting', cosmic: 'floating in outer space with stars' };
            const prompt = `A ${styleMap[style]} of a charming musician character made entirely from recycled cardboard and brown paper, playing a ${instrument}. The character is ${themeMap[theme]}. Visible corrugated cardboard layers, paper fold details, tab connectors visible at joints, warm studio lighting. Upcycling art, eco-friendly design, full character view, white background, no text.`;
            const img = await generateUpcyclingImage(prompt, config.models.productImage);
            setResult(img);
            setUserTokens(userTokens - COST);
            showToast(language === 'ko' ? '캐릭터 생성 완료!' : 'Character generated!', 'success');
        } catch (e) {
            showToast(language === 'ko' ? '생성 실패. 다시 시도해주세요.' : 'Generation failed. Please try again.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const download = () => {
        if (!result) return;
        const a = document.createElement('a');
        a.href = result;
        a.download = `cardboard_musician_${Date.now()}.png`;
        a.click();
    };

    return (
        <ToolModal title={language === 'ko' ? '골판지 뮤지션' : 'Cardboard Musician'} onClose={onClose}>
            <div className="space-y-4">
                <div>
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 block">{language === 'ko' ? '악기' : 'Instrument'}</label>
                    <div className="flex gap-2 flex-wrap">
                        {(['guitar', 'drum', 'ukulele', 'piano', 'violin'] as const).map(i => (
                            <button key={i} onClick={() => setInstrument(i)} className={`px-4 py-2 rounded-xl text-sm font-medium transition border ${instrument === i ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-transparent' : 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'}`}>
                                {instrLabels[i]}
                            </button>
                        ))}
                    </div>
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 block">{language === 'ko' ? '스타일' : 'Art Style'}</label>
                    <div className="flex gap-2 flex-wrap">
                        {(['cartoon', 'realistic', 'minimal'] as const).map(s => (
                            <button key={s} onClick={() => setStyle(s)} className={`px-4 py-2 rounded-xl text-sm font-medium transition border ${style === s ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-transparent' : 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'}`}>
                                {styleLabels[s]}
                            </button>
                        ))}
                    </div>
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 block">{language === 'ko' ? '테마' : 'Theme'}</label>
                    <div className="flex gap-2 flex-wrap">
                        {(['nature', 'ocean', 'urban', 'cosmic'] as const).map(t => (
                            <button key={t} onClick={() => setTheme(t)} className={`px-4 py-2 rounded-xl text-sm font-medium transition border ${theme === t ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-transparent' : 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'}`}>
                                {themeLabels[t]}
                            </button>
                        ))}
                    </div>
                </div>

                {!result && (
                    <button onClick={generate} disabled={loading} className="w-full py-3 rounded-2xl bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 disabled:opacity-50 text-white font-bold flex items-center justify-center gap-2 transition shadow-lg shadow-violet-200 dark:shadow-none">
                        {loading ? <><RefreshCw size={16} className="animate-spin" /> {language === 'ko' ? '생성 중...' : 'Generating...'}</> : <><Sparkles size={16} /> {language === 'ko' ? `생성하기 (${COST} 토큰)` : `Generate (${COST} tokens)`}</>}
                    </button>
                )}

                {result && <ResultPanel imageUrl={result} onDownload={download} onRegenerate={() => { setResult(null); generate(); }} language={language} />}
            </div>
        </ToolModal>
    );
};

// ────────────────────────────────────────────
// Blueprint Creator Modal
// ────────────────────────────────────────────
const BlueprintModal: React.FC<{ language: Language; userTokens: number; setUserTokens: (t: number) => void; onClose: () => void }> = ({ language, userTokens, setUserTokens, onClose }) => {
    const { showToast } = useToast();
    const [bpType, setBpType] = useState<'production' | 'detailed' | 'mechanical'>('production');
    const [imagePreview, setImagePreview] = useState<string>('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<string | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);
    const COST = 15;

    const typeLabels: Record<typeof bpType, { ko: string; en: string }> = {
        production: { ko: '생산 도면', en: 'Production' },
        detailed: { ko: '상세 분해도', en: 'Exploded View' },
        mechanical: { ko: '조립 가이드', en: 'Assembly Guide' },
    };

    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => setImagePreview(reader.result as string);
        reader.readAsDataURL(file);
    };

    const generate = async () => {
        if (!imagePreview && !description.trim()) {
            showToast(language === 'ko' ? '이미지를 업로드하거나 설명을 입력해주세요.' : 'Please upload an image or enter a description.', 'warning');
            return;
        }
        if (userTokens < COST) { showToast(language === 'ko' ? `토큰이 부족합니다. (필요: ${COST})` : `Not enough tokens. (Required: ${COST})`, 'warning'); return; }
        setLoading(true);
        setResult(null);
        try {
            const context = description || 'Upcycled product';
            const img = await generateBlueprintImage(context, imagePreview || undefined, bpType);
            setResult(img);
            setUserTokens(userTokens - COST);
            showToast(language === 'ko' ? '도면 생성 완료!' : 'Blueprint generated!', 'success');
        } catch (e) {
            showToast(language === 'ko' ? '생성 실패. 다시 시도해주세요.' : 'Generation failed. Please try again.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const download = () => {
        if (!result) return;
        const a = document.createElement('a');
        a.href = result;
        a.download = `blueprint_${bpType}_${Date.now()}.png`;
        a.click();
    };

    return (
        <ToolModal title={language === 'ko' ? '도면 만들기' : 'Blueprint Creator'} onClose={onClose}>
            <div className="space-y-4">
                <div>
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 block">{language === 'ko' ? '도면 유형' : 'Blueprint Type'}</label>
                    <div className="flex gap-2 flex-wrap">
                        {(['production', 'detailed', 'mechanical'] as const).map(t => (
                            <button key={t} onClick={() => setBpType(t)} className={`px-4 py-2 rounded-xl text-sm font-medium transition border ${bpType === t ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-transparent' : 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'}`}>
                                {language === 'ko' ? typeLabels[t].ko : typeLabels[t].en}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 block">{language === 'ko' ? '참조 이미지 (선택)' : 'Reference Image (optional)'}</label>
                    <div
                        onClick={() => fileRef.current?.click()}
                        className="w-full h-28 border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-emerald-400 transition relative overflow-hidden"
                    >
                        {imagePreview ? (
                            <img src={imagePreview} className="absolute inset-0 w-full h-full object-cover opacity-70" />
                        ) : (
                            <><Upload size={20} className="text-gray-400 mb-1" /><span className="text-xs text-gray-400">{language === 'ko' ? '클릭하여 이미지 선택' : 'Click to select image'}</span></>
                        )}
                        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
                    </div>
                </div>

                <div>
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 block">{language === 'ko' ? '제품 설명' : 'Product Description'}</label>
                    <textarea
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        placeholder={language === 'ko' ? '예: 재활용 골판지로 만든 노트북 스탠드, 스냅핏 조인트 사용...' : 'e.g. Laptop stand made from recycled cardboard with snap-fit joints...'}
                        className="w-full h-20 px-4 py-3 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-emerald-400 dark:text-white placeholder-gray-400"
                    />
                </div>

                {!result && (
                    <button onClick={generate} disabled={loading} className="w-full py-3 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 disabled:opacity-50 text-white font-bold flex items-center justify-center gap-2 transition shadow-lg shadow-blue-200 dark:shadow-none">
                        {loading ? <><RefreshCw size={16} className="animate-spin" /> {language === 'ko' ? '도면 생성 중...' : 'Generating...'}</> : <><Sparkles size={16} /> {language === 'ko' ? `도면 생성 (${COST} 토큰)` : `Create Blueprint (${COST} tokens)`}</>}
                    </button>
                )}

                {result && <ResultPanel imageUrl={result} onDownload={download} onRegenerate={() => { setResult(null); generate(); }} language={language} />}
            </div>
        </ToolModal>
    );
};


// ────────────────────────────────────────────
// Main RemakeLab Component
// ────────────────────────────────────────────
const RemakeLab: React.FC<RemakeLabProps> = ({ language, userTokens, setUserTokens, onTokenClick }) => {
    const [activeTab, setActiveTab] = useState('all');
    const [currentSlide, setCurrentSlide] = useState(0);
    const [activeTool, setActiveTool] = useState<ActiveTool>(null);

    useEffect(() => {
        const originalTitle = document.title;
        document.title = 'Jeju Remake Lab';
        return () => { document.title = originalTitle; };
    }, []);

    const heroSlides = [
        {
            id: 'basalt',
            title: '현무암 패턴 생성기',
            titleEn: 'Basalt Pattern Generator',
            subtitle: '제주 자연의 질감을 디지털로',
            subtitleEn: 'Digitalizing Jeju Nature Texture',
            description: '제주 현무암 특유의 다공질 패턴을 AI 알고리즘으로 생성합니다.',
            descriptionEn: 'Generate unique Jeju basalt pore patterns using AI algorithms.',
            cta: '패턴 생성하기',
            ctaEn: 'Generate Pattern',
            image: '/images/basalt_pattern.png',
            tool: 'basalt' as ActiveTool,
        },
        {
            id: 'musician',
            title: '골판지 뮤지션',
            titleEn: 'Cardboard Musician',
            subtitle: '폐자재에 리듬을 입히다',
            subtitleEn: 'Giving Rhythm to Waste',
            description: '버려지는 골판지를 활용한 악기와 뮤지션 캐릭터를 디자인합니다.',
            descriptionEn: 'Design musical instruments and characters using recycled cardboard.',
            cta: '캐릭터 만들기',
            ctaEn: 'Create Character',
            image: '/images/cardboard_musician.png',
            tool: 'musician' as ActiveTool,
        },
        {
            id: 'blueprint',
            title: '도면 만들기',
            titleEn: 'Blueprint Creator',
            subtitle: '아이디어를 설계도로',
            subtitleEn: 'Ideas into Blueprints',
            description: 'AI의 도움을 받아 아이디어를 정밀한 2D 도면으로 변환합니다.',
            descriptionEn: 'Convert your ideas into precise 2D blueprints with AI assistance.',
            cta: '도면 생성하기',
            ctaEn: 'Create Blueprint',
            image: '/images/blueprint_creator.png',
            tool: 'blueprint' as ActiveTool,
        },
    ];

    const categories = [
        { id: 'all', label: '모두', labelEn: 'All' },
        { id: 'ai', label: 'AI 생성기', labelEn: 'AI Generators' },
        { id: 'single-color', label: '단색 생성에 적합', labelEn: 'Monochrome' },
        { id: 'multi-color', label: '다색 생성에 적합', labelEn: 'Multicolor' },
        { id: 'laser', label: '레이저 및 커팅', labelEn: 'Laser & Cutting' },
        { id: 'experimental', label: '실험', labelEn: 'Experimental' },
    ];

    const labTools = [
        { id: 'basalt', title: '현무암 패턴 생성기', titleEn: 'Basalt Pattern Gen', description: '제주 현무암의 독특한 기공 패턴을 AI로 생성합니다.', descriptionEn: 'Generate unique Jeju basalt pore patterns using AI.', image: '/images/basalt_pattern.png', category: ['ai', 'experimental'], tool: 'basalt' as ActiveTool, cost: 10 },
        { id: 'musician', title: '골판지 뮤지션', titleEn: 'Cardboard Musician', description: '버려진 골판지로 악기 연주 캐릭터를 디자인합니다.', descriptionEn: 'Design playable instrument characters using recycled cardboard.', image: '/images/cardboard_musician.png', category: ['experimental', 'laser', 'multi-color'], tool: 'musician' as ActiveTool, cost: 10 },
        { id: 'blueprint', title: '도면 만들기', titleEn: 'Blueprint Creator', description: '이미지나 설명으로 정밀한 2D 제작 도면을 생성합니다.', descriptionEn: 'Create precise 2D blueprints from images or descriptions.', image: '/images/blueprint_creator.png', category: ['laser', 'ai', 'single-color'], tool: 'blueprint' as ActiveTool, cost: 15 },
    ];

    useEffect(() => {
        const timer = setInterval(() => setCurrentSlide(p => (p + 1) % heroSlides.length), 5000);
        return () => clearInterval(timer);
    }, []);

    const filteredTools = activeTab === 'all' ? labTools : labTools.filter(t => t.category.includes(activeTab));

    return (
        <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0F172A] text-[#111827] dark:text-[#F3F4F6] transition-colors duration-300 font-sans relative">

            {/* Tool Modals */}
            {activeTool === 'basalt' && <BasaltModal language={language} userTokens={userTokens} setUserTokens={setUserTokens} onClose={() => setActiveTool(null)} />}
            {activeTool === 'musician' && <MusicianModal language={language} userTokens={userTokens} setUserTokens={setUserTokens} onClose={() => setActiveTool(null)} />}
            {activeTool === 'blueprint' && <BlueprintModal language={language} userTokens={userTokens} setUserTokens={setUserTokens} onClose={() => setActiveTool(null)} />}

            {/* Hero Carousel */}
            <section className="relative h-[380px] max-w-[1500px] mx-auto mt-4 rounded-3xl bg-[#0F172A] overflow-hidden flex items-center shadow-xl">
                {heroSlides.map((slide, index) => (
                    <div key={slide.id} className={`absolute inset-0 transition-opacity duration-1000 ${index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
                        <div className="absolute inset-0 z-0 opacity-40">
                            <img src={slide.image} alt={language === 'ko' ? slide.title : slide.titleEn} className="w-full h-full object-cover filter blur-sm" />
                        </div>
                        <div className="absolute inset-0 z-0 bg-gradient-to-r from-[#0F172A] via-[#0F172A]/80 to-transparent" />
                        <div className="relative z-10 px-8 md:px-12 grid grid-cols-12 h-full items-center">
                            <div className="col-span-12 lg:col-span-7 py-12">
                                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#4ADE80]/20 text-[#4ADE80] border border-[#4ADE80]/30 text-xs font-bold mb-6">
                                    <span className="w-2 h-2 rounded-full bg-[#4ADE80] animate-pulse" />
                                    {language === 'ko' ? '새로운 기능' : 'New Feature'}
                                </div>
                                <p className="text-gray-400 font-medium mb-2">{language === 'ko' ? slide.subtitle : slide.subtitleEn}</p>
                                <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-4 tracking-tight">
                                    {language === 'ko' ? slide.title : slide.titleEn}
                                </h1>
                                <p className="text-gray-300 mb-8 max-w-xl leading-relaxed text-lg">
                                    {language === 'ko' ? slide.description : slide.descriptionEn}
                                </p>
                                <button
                                    onClick={() => setActiveTool(slide.tool)}
                                    className="bg-white text-black hover:bg-gray-100 font-semibold py-3 px-6 rounded-lg flex items-center gap-2 transition group shadow-lg"
                                >
                                    <span className="text-emerald-500 font-bold mr-1 flex items-center text-sm gap-0.5">
                                        <span className="material-icons-round text-sm">recycling</span>
                                        {labTools.find(t => t.tool === slide.tool)?.cost}
                                    </span>
                                    {language === 'ko' ? slide.cta : slide.ctaEn}
                                    <span className="material-icons-round group-hover:translate-x-1 transition-transform text-sm">arrow_forward</span>
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                    {heroSlides.map((_, i) => (
                        <button key={i} onClick={() => setCurrentSlide(i)} className={`h-1.5 rounded-full transition-all duration-300 ${i === currentSlide ? 'w-8 bg-white' : 'w-2 bg-white/40 hover:bg-white/60'}`} />
                    ))}
                </div>
            </section>

            {/* Tools Grid Section */}
            <section className="py-16 px-8 md:px-12">
                <div className="text-center mb-10">
                    <h2 className="text-3xl font-bold mb-3 dark:text-white">{language === 'ko' ? '모델링 도구' : 'Modeling Tools'}</h2>
                    <p className="text-gray-500 dark:text-gray-400">
                        {language === 'ko' ? 'AI 기반 제작 도구로 업사이클링 아이디어를 현실로 만드세요.' : 'Bring your upcycling ideas to life with AI-powered tools.'}
                    </p>
                </div>

                {/* Category Tabs */}
                <div className="flex justify-center mb-12 overflow-x-auto no-scrollbar pb-2">
                    <div className="flex gap-3 min-w-max px-4">
                        {categories.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setActiveTab(cat.id)}
                                className={`px-5 py-2 rounded-full text-sm font-medium transition shadow-sm border ${activeTab === cat.id ? 'bg-[#1E293B] text-white border-[#1E293B] dark:bg-white dark:text-[#1E293B]' : 'bg-white dark:bg-[#1E293B] border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-700 dark:text-gray-300'}`}
                            >
                                {language === 'ko' ? cat.label : cat.labelEn}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tool Cards */}
                <div className="flex flex-wrap justify-center gap-8 max-w-7xl mx-auto">
                    {filteredTools.map(tool => (
                        <div
                            key={tool.id}
                            className="group bg-white dark:bg-[#1E293B] border border-gray-100 dark:border-gray-800 rounded-3xl overflow-hidden hover:shadow-2xl dark:hover:shadow-black/60 transition-all duration-500 flex flex-col w-full md:w-[calc(50%-1rem)] lg:w-[calc(33.333%-2rem)] min-w-[300px] max-w-[400px] relative cursor-pointer"
                            onClick={() => setActiveTool(tool.tool)}
                        >
                            <div className="absolute top-3 left-3 z-10 bg-[#4ADE80] text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">NEW</div>
                            <div className="h-48 overflow-hidden relative bg-gray-50 dark:bg-gray-800">
                                <img src={tool.image} alt={language === 'ko' ? tool.title : tool.titleEn} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/90 dark:bg-gray-900/90 rounded-full px-4 py-2 text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                        <Sparkles size={14} className="text-emerald-500" />
                                        {language === 'ko' ? '시작하기' : 'Get Started'}
                                    </div>
                                </div>
                            </div>
                            <div className="p-5 flex-1 flex flex-col">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-bold text-lg text-gray-900 dark:text-white truncate pr-2">
                                        {language === 'ko' ? tool.title : tool.titleEn}
                                    </h3>
                                    <div className="w-16 h-8 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 flex-shrink-0 font-bold text-xs gap-1 border border-emerald-100 dark:border-emerald-800/50">
                                        <span className="material-icons-round text-sm">recycling</span>{tool.cost}
                                    </div>
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                                    {language === 'ko' ? tool.description : tool.descriptionEn}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                {filteredTools.length === 0 && (
                    <div className="text-center py-16">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="material-icons-round text-3xl text-gray-400">search_off</span>
                        </div>
                        <p className="text-gray-500 dark:text-gray-400">
                            {language === 'ko' ? '해당 카테고리에 도구가 없습니다.' : 'No tools in this category.'}
                        </p>
                    </div>
                )}
            </section>

            <footer className="bg-gray-50 dark:bg-[#0B1120] border-t border-gray-200 dark:border-gray-800 py-12 mt-12 transition-colors duration-300">
                <div className="px-8 md:px-12 text-center text-gray-500 dark:text-gray-400 text-sm">
                    <p>© 2026 Jeju Remake Lab. All rights reserved.</p>
                    <div className="mt-4 space-x-4">
                        <a className="hover:text-[#4ADE80] transition cursor-pointer">Privacy Policy</a>
                        <a className="hover:text-[#4ADE80] transition cursor-pointer">Terms of Service</a>
                        <a className="hover:text-[#4ADE80] transition cursor-pointer">Contact Support</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default RemakeLab;
