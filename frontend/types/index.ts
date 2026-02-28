export interface User {
  user_id: string;
  email: string;
  name: string;
  created_at: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user: User;
  token: string;
}

export interface PdfFile {
  pdf_id: string;
  user_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  page_count: number;
  uploaded_at: string;
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
}

export interface ChatSession {
  session_id: string;
  user_id: string;
  session_name: string;
  created_at: string;
  pdfs?: PdfFile[];
}

export interface ChatMessage {
  message_id: string;
  session_id: string;
  sender: 'user' | 'assistant';
  message_text: string;
  references?: string | null;
  created_at: string;
}

export interface MessageReference {
  pdf_id: string;
  page_number: number;
  chunk_text: string;
}

export interface ApiError {
  message: string;
  status: number;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}