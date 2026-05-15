export interface User {
  id: number;
  email: string;
  full_name: string;
  is_admin: boolean;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface Document {
  id: number;
  original_name: string;
  file_type: string;
  file_size: number;
  chunk_count: number;
  status: string;
  summary?: string;
  created_at: string;
}

export interface Citation {
  document_id: number;
  document_name: string;
  chunk_index: number;
  page?: number;
  content: string;
  score: number;
}

export interface Message {
  id: number;
  role: "user" | "assistant" | "system";
  content: string;
  citations?: Citation[];
  created_at: string;
}

export interface Chat {
  id: number;
  title: string;
  created_at: string;
  updated_at: string;
  messages?: Message[];
}

export interface ChatListItem {
  id: number;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
}

export interface Settings {
  openai_api_key_set: boolean;
  model: string;
  embedding_model: string;
}
