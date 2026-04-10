export type OrishaName = 
  | "Ogun" 
  | "Esu" 
  | "Ochosi" 
  | "Oshun" 
  | "Yemoja" 
  | "Orunmila" 
  | "Sango";

export type InteractionMode = "quiet" | "debate" | "roundup";

// Using nvidia/nemotron-3-super-120b-a12b:free as the single model for this project
export const DEFAULT_MODEL = "nvidia/nemotron-3-super-120b-a12b:free" as const;

export interface CouncilMember {
  id: OrishaName;
  name: string;
  title: string;
  role: string;
  temperament: string;
  tone: string;
  strengths: string[];
  blindSpots: string[];
  accentColor: string;
  isActive: boolean;
}

export interface Post {
  id: string;
  authorId: OrishaName | "user";
  authorName: string;
  content: string;
  timestamp: number;
  tags?: string[];
  threadId?: string;
  parentId?: string;
  referencedNoteId?: string;
}

export interface KnowledgeNote {
  id: string;
  title: string;
  category: string;
  sourceType: string;
  tags: string[];
  content: string;
  citation?: string;
}

export type RoundPhase = "frame" | "challenge" | "implement" | "synthesize";

export interface RoundStep {
  phase: RoundPhase;
  memberId: OrishaName;
  label: string;
  directive: string;
}

export interface CouncilState {
  mode: InteractionMode;
  activeMembers: OrishaName[];
  posts: Post[];
  notes: KnowledgeNote[];
}
