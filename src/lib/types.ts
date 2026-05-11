export type LawArea = 
  | 'constitutional' | 'criminal' | 'property' | 'family' 
  | 'labour' | 'company' | 'tax' | 'contract' | 'nrb' | 'general';

export type Religion = 'muslim' | 'hindu' | 'christian' | 'adibashi' | 'general';
export type Language = 'english' | 'bangla' | 'mixed';
export type SafetySeverity = 'critical' | 'high' | 'medium' | 'low';
export type ConfidenceLevel = 'high' | 'medium' | 'low' | 'none';

export interface KnowledgeChunk {
  id: string;
  area: LawArea;
  subArea?: string;
  religion?: Religion;
  question: string;
  answer: string;
  legalBasis: string;
  procedure?: string;
  conclusion: string;
  actName?: string;
  sectionNumbers: string[];
  yearEnacted?: number;
  lastVerified: string;
  verifiedBy: string;
  isActive: boolean;
  embedding?: number[];
  triggerKeywords: string[];
  confidenceScore: number;
  version: number;
}

export interface RetrievedChunk extends KnowledgeChunk {
  similarity: number;
  rank: number;
}

export interface SafetyCheck {
  isSafe: boolean;
  severity: SafetySeverity;
  detectedKeywords: string[];
  action: 'block' | 'warn' | 'escalate' | 'allow';
  message?: string;
  requiresHumanReview: boolean;
}

export interface Citation {
  actName: string;
  section: string;
  isVerified: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  metadata?: {
    area?: LawArea;
    religion?: Religion;
    confidence?: ConfidenceLevel;
    citations?: Citation[];
    safetyFlags?: SafetyCheck[];
  };
}

export interface UserProfile {
  id: string;
  email?: string;
  phone?: string;
  religion?: Religion;
  preferredLanguage: Language;
  isPaid: boolean;
  queriesToday: number;
  lastQueryDate?: string;
}

export interface QueryContext {
  userId?: string;
  userProfile?: UserProfile;
  area?: LawArea;
  religion?: Religion;
  language: Language;
  isPaid: boolean;
  queryCount: number;
  conversationId?: string;
}

export interface RetrievalResult {
  chunks: RetrievedChunk[];
  confidence: ConfidenceLevel;
  fallbackNeeded: boolean;
}

export interface ProcessedResponse {
  content: string;
  isSafe: boolean;
  safetyChecks: SafetyCheck[];
  citations: Citation[];
  confidence: ConfidenceLevel;
  requiresEscalation: boolean;
  escalationMessage?: string;
}