export interface User {
  userId: string;
  displayName: string;
  avatarUrl?: string | null;
}

export interface LocalizedText {
  text: string;
  locale: string | null;
}

export interface Reaction {
  emoji: string;
  count: number;
}

export interface Reply {
  authorUser: User;
  message: string;
  replyDate: string;
}

export interface GoodVibe {
  goodVibeId: string;
  collectionId: string | null;
  collectionName: LocalizedText[] | null;
  cardId: string | null;
  cardPrompt: LocalizedText[] | null;
  prompt: string | null;
  message: string;
  senderUser: User;
  creationDate: string;
  isPublic: boolean;
  recipients: User[];
  reactions: Reaction[];
  replyCount: number;
  replies?: Reply[];
}

export interface GoodVibesResponse {
  data: GoodVibe[];
  metadata?: {
    continuationToken?: string;
    pageSize?: number;
    totalCount?: number;
    cacheReady?: boolean;
  };
}