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
  commentsCount?: number; // 댓글 수
}

// Social Feed Post Type (reusing Project for simplicity but can be distinct)
export type SocialPost = Project;

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
  material: string; // 재료 이름
  description: string; // 재료 설명
  confidence: number; // 신뢰도
  traits?: string; // 소재 DNA 분석 결과 (질감, 색상, 특징 등)
  recommendations?: { // 카테고리별 추천 스타일 ID
      lighting?: string;
      furniture?: string;
      interior?: string;
      stationery?: string;
      [key: string]: string | undefined;
  };
}

export interface UserIntent {
  desiredOutcome: string;
  category: string;
  additionalNotes: string;
  selectedStyle?: string; // 선택된 스타일 ID
}

export interface CategoryRecommendation {
  category: string;
  icon: string;
  suggestions: string[];
}

export type WizardStep = 'material' | 'analysis_result' | 'concepts' | 'blueprint' | '3d_choice' | 'generation' | 'final';
