export interface Maker {
  name: string;
  avatar: string;
  projects: number;
  likes: string;
  rank?: number;
}

export interface Step {
  id?: string;
  title: string;
  desc: string;
  tip?: string;
}

export interface ModelFile {
  name: string;
  size: number;
  type: string;
  url: string;
}

export interface Project {
  id: string;
  title: string;
  maker: string;
  image: string; // 메인 이미지 (하위 호환성)
  images?: string[]; // 여러 이미지 지원
  category: string;
  time: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  likes?: number; // 좋아요 수
  views?: number; // 조회수
  isAiRemix?: boolean;
  isAiIdea?: boolean;
  description?: string;
  steps?: Step[];
  downloadUrl?: string; // 하위 호환성을 위해 유지
  modelFiles?: ModelFile[]; // 여러 파일 지원
  isPublic?: boolean; // 공개 여부 (기본값: false)
  ownerId?: string; // 소유자 ID
  createdAt?: string; // 생성 날짜
  metadata?: any; // 추가 메타데이터 (Blueprint URL 등)
}

export interface Message {
  id: string;
  sender: 'user' | 'expert' | 'ai' | 'system';
  text?: string;
  timestamp: string;
  avatar?: string;
  attachmentName?: string;
  attachmentType?: 'image' | '3d_model'; // Added for AI generation results
  attachmentUrl?: string;
}

export type ChatMode = 'human' | 'ai';

// Wizard System Types
export interface MaterialAnalysis {
  material: string; // 재료 이름 (예: "플라스틱 병")
  description: string; // 재료 설명
  confidence: number; // 신뢰도 (0-1)
}

export interface UserIntent {
  desiredOutcome: string;
  category: string;
  additionalNotes: string;
}

export interface CategoryRecommendation {
  category: string;
  icon: string;
  suggestions: string[];
}

export type WizardStep = 'material' | 'intent' | 'generation' | 'complete';
