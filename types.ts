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

export interface Project {
  id: string;
  title: string;
  maker: string;
  image: string;
  category: string;
  time: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  likes?: number;
  isAiRemix?: boolean;
  isAiIdea?: boolean;
  description?: string;
  steps?: Step[];
  downloadUrl?: string;
}

export interface Message {
  id: string;
  sender: 'user' | 'expert' | 'system';
  text?: string;
  timestamp: string;
  avatar?: string;
  attachmentName?: string;
}