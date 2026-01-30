export * from './database';

export interface ChatContext {
  text?: string;
  screenshot?: string;
  pageNumber?: number;
}

export type ModelProvider = 'openai' | 'gemini';

export interface LLMMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}
