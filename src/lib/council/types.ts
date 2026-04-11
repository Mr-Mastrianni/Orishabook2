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

export type PostType = "async" | "response" | "user_prompted" | "debate";

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

  // Phase 1: Social fields
  title?: string;
  type?: PostType;
  chamberId?: string;
  resonanceCount?: number;
  replyCount?: number;
}

export interface Resonance {
  id: string;
  userId: string;
  postId: string;
  value: 1 | -1;
  timestamp: number;
}

export interface ChamberMembership {
  id: string;
  userId: string;
  chamberId: string;
  joinedAt: number;
}

export interface Save {
  id: string;
  userId: string;
  postId: string;
  savedAt: number;
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

export type DefaultView = "chat" | "archive" | "chambers";

export interface CouncilPreferences {
  /** Heartbeat interval in minutes. 0 disables automatic firing entirely. */
  heartbeatIntervalMinutes: number;
  /** Probability that an async post spawns an immediate agent reply. 0..1. */
  autoReplyProbability: number;
  /** Tab the app lands on after sign-in / reload. */
  defaultView: DefaultView;
  /** Base LLM temperature for all council generators. 0..1.2 */
  creativity: number;
}

export const DEFAULT_PREFERENCES: CouncilPreferences = {
  heartbeatIntervalMinutes: 20,
  autoReplyProbability: 0.6,
  defaultView: "chat",
  creativity: 0.7,
};

export interface CouncilState extends CouncilPreferences {
  mode: InteractionMode;
  activeMembers: OrishaName[];
  posts: Post[];
  notes: KnowledgeNote[];
}

export interface CouncilConfig extends CouncilPreferences {
  mode: InteractionMode;
  model: string;
  activeMembers: OrishaName[];
}
