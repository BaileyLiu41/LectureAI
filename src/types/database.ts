export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          avatar_url: string | null;
          openai_api_key_encrypted: string | null;
          gemini_api_key_encrypted: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          openai_api_key_encrypted?: string | null;
          gemini_api_key_encrypted?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          openai_api_key_encrypted?: string | null;
          gemini_api_key_encrypted?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      folders: {
        Row: {
          id: string;
          user_id: string;
          parent_folder_id: string | null;
          name: string;
          color: string;
          icon: string;
          position: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          parent_folder_id?: string | null;
          name: string;
          color?: string;
          icon?: string;
          position?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          parent_folder_id?: string | null;
          name?: string;
          color?: string;
          icon?: string;
          position?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      documents: {
        Row: {
          id: string;
          user_id: string;
          folder_id: string | null;
          title: string;
          file_name: string;
          file_path: string;
          file_size: number;
          mime_type: string;
          page_count: number | null;
          thumbnail_path: string | null;
          last_viewed_at: string | null;
          last_viewed_page: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          folder_id?: string | null;
          title: string;
          file_name: string;
          file_path: string;
          file_size: number;
          mime_type?: string;
          page_count?: number | null;
          thumbnail_path?: string | null;
          last_viewed_at?: string | null;
          last_viewed_page?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          folder_id?: string | null;
          title?: string;
          file_name?: string;
          file_path?: string;
          file_size?: number;
          mime_type?: string;
          page_count?: number | null;
          thumbnail_path?: string | null;
          last_viewed_at?: string | null;
          last_viewed_page?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      chats: {
        Row: {
          id: string;
          user_id: string;
          document_id: string | null;
          folder_id: string | null;
          title: string;
          model_provider: string;
          model_name: string;
          is_pinned: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          document_id?: string | null;
          folder_id?: string | null;
          title?: string;
          model_provider?: string;
          model_name?: string;
          is_pinned?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          document_id?: string | null;
          folder_id?: string | null;
          title?: string;
          model_provider?: string;
          model_name?: string;
          is_pinned?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          chat_id: string;
          role: 'user' | 'assistant' | 'system';
          content: string;
          selected_text: string | null;
          screenshot_path: string | null;
          page_number: number | null;
          tokens_used: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          chat_id: string;
          role: 'user' | 'assistant' | 'system';
          content: string;
          selected_text?: string | null;
          screenshot_path?: string | null;
          page_number?: number | null;
          tokens_used?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          chat_id?: string;
          role?: 'user' | 'assistant' | 'system';
          content?: string;
          selected_text?: string | null;
          screenshot_path?: string | null;
          page_number?: number | null;
          tokens_used?: number | null;
          created_at?: string;
        };
        Relationships: [];
      };
      highlights: {
        Row: {
          id: string;
          document_id: string;
          user_id: string;
          page_number: number;
          text_content: string | null;
          position_data: Json;
          color: string;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          document_id: string;
          user_id: string;
          page_number: number;
          text_content?: string | null;
          position_data: Json;
          color?: string;
          note?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          document_id?: string;
          user_id?: string;
          page_number?: number;
          text_content?: string | null;
          position_data?: Json;
          color?: string;
          note?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
export type InsertTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];
export type UpdateTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];

export type Profile = Tables<'profiles'>;
export type Folder = Tables<'folders'>;
export type Document = Tables<'documents'>;
export type Chat = Tables<'chats'>;
export type Message = Tables<'messages'>;
export type Highlight = Tables<'highlights'>;
