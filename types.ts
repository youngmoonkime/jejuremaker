export interface Maker {
  name: string;
  avatar: string;
  projects: number;
  likes: string;
  rank?: number;
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
}

export interface Message {
  id: string;
  sender: 'user' | 'expert' | 'system';
  text?: string;
  timestamp: string;
  avatar?: string;
  attachmentName?: string;
}
