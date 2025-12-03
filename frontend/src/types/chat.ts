export interface LlamaMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatOptions {
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  top_k?: number;
  repeat_penalty?: number;
  seed?: number;
  stop?: string[];
}

export interface CompletionRequest {
  prompt: string;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  top_k?: number;
  repeat_penalty?: number;
  seed?: number;
  stop?: string[];
  stream?: boolean;
}

export interface ChatCompletionRequest {
  messages: LlamaMessage[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  top_k?: number;
  repeat_penalty?: number;
  seed?: number;
  stop?: string[];
  stream?: boolean;
}

export interface ModelInfo {
  id: string;
  object: string;
  created?: number;
  owned_by?: string;
}

export interface ModelsResponse {
  object: string;
  data: ModelInfo[];
}

// Frontend specific types
export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  webSearchUsed?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatSettings {
  temperature: number;
  max_tokens: number;
  top_p: number;
  top_k?: number;
  repeat_penalty?: number;
  seed?: number;
  stop?: string[];
  webSearchEnabled: boolean;
}

export interface ThemeConfig {
  mode: 'light' | 'dark';
  colors: {
    primary: string;
    background: string;
    text: string;
    accent: string;
  };
  fontSize: number;
  borderRadius: number;
  animations: boolean;
  compactMode: boolean;
}

export interface ConnectionState {
  connected: boolean;
  serverUrl: string;
  model: string;
  error?: string;
}

export interface WebSocketMessage {
  type: 'connect' | 'message' | 'connected' | 'message_received' | 'response_start' | 'response_chunk' | 'response_end' | 'error';
  message?: string;
  content?: string;
  serverUrl?: string;
  options?: ChatOptions;
  enableWebSearch?: boolean;
  webSearchUsed?: boolean;
}