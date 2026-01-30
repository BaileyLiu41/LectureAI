-- LectureAI Database Schema
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users profile extension (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  openai_api_key_encrypted TEXT,
  gemini_api_key_encrypted TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Folders table (hierarchical structure)
CREATE TABLE public.folders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  parent_folder_id UUID REFERENCES public.folders(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#8b5cf6',
  icon TEXT DEFAULT 'folder',
  position INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Documents table
CREATE TABLE public.documents (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  folder_id UUID REFERENCES public.folders(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL DEFAULT 'application/pdf',
  page_count INT,
  thumbnail_path TEXT,
  last_viewed_at TIMESTAMPTZ,
  last_viewed_page INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chats table (conversations about documents/folders)
CREATE TABLE public.chats (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE,
  folder_id UUID REFERENCES public.folders(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'New Chat',
  model_provider TEXT NOT NULL DEFAULT 'openai',
  model_name TEXT NOT NULL DEFAULT 'gpt-4o',
  is_pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT chat_context_check CHECK (
    (document_id IS NOT NULL AND folder_id IS NULL) OR
    (document_id IS NULL AND folder_id IS NOT NULL) OR
    (document_id IS NULL AND folder_id IS NULL)
  )
);

-- Messages table
CREATE TABLE public.messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  chat_id UUID REFERENCES public.chats(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  selected_text TEXT,
  screenshot_path TEXT,
  page_number INT,
  tokens_used INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Document highlights/annotations
CREATE TABLE public.highlights (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  page_number INT NOT NULL,
  text_content TEXT,
  position_data JSONB NOT NULL,
  color TEXT DEFAULT '#ffeb3b',
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_folders_user_id ON public.folders(user_id);
CREATE INDEX idx_folders_parent_id ON public.folders(parent_folder_id);
CREATE INDEX idx_documents_user_id ON public.documents(user_id);
CREATE INDEX idx_documents_folder_id ON public.documents(folder_id);
CREATE INDEX idx_chats_user_id ON public.chats(user_id);
CREATE INDEX idx_chats_document_id ON public.chats(document_id);
CREATE INDEX idx_chats_folder_id ON public.chats(folder_id);
CREATE INDEX idx_messages_chat_id ON public.messages(chat_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at);
CREATE INDEX idx_highlights_document_id ON public.highlights(document_id);
CREATE INDEX idx_highlights_user_id ON public.highlights(user_id);

-- Row Level Security Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.highlights ENABLE ROW LEVEL SECURITY;

-- Profiles policies (using (select auth.uid()) for optimized performance)
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING ((select auth.uid()) = id);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING ((select auth.uid()) = id);
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK ((select auth.uid()) = id);

-- Folders policies
CREATE POLICY "Users can view own folders" ON public.folders
  FOR SELECT USING ((select auth.uid()) = user_id);
CREATE POLICY "Users can create own folders" ON public.folders
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "Users can update own folders" ON public.folders
  FOR UPDATE USING ((select auth.uid()) = user_id);
CREATE POLICY "Users can delete own folders" ON public.folders
  FOR DELETE USING ((select auth.uid()) = user_id);

-- Documents policies
CREATE POLICY "Users can view own documents" ON public.documents
  FOR SELECT USING ((select auth.uid()) = user_id);
CREATE POLICY "Users can create own documents" ON public.documents
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "Users can update own documents" ON public.documents
  FOR UPDATE USING ((select auth.uid()) = user_id);
CREATE POLICY "Users can delete own documents" ON public.documents
  FOR DELETE USING ((select auth.uid()) = user_id);

-- Chats policies
CREATE POLICY "Users can view own chats" ON public.chats
  FOR SELECT USING ((select auth.uid()) = user_id);
CREATE POLICY "Users can create own chats" ON public.chats
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "Users can update own chats" ON public.chats
  FOR UPDATE USING ((select auth.uid()) = user_id);
CREATE POLICY "Users can delete own chats" ON public.chats
  FOR DELETE USING ((select auth.uid()) = user_id);

-- Messages policies
CREATE POLICY "Users can view own messages" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.chats
      WHERE chats.id = messages.chat_id
      AND chats.user_id = (select auth.uid())
    )
  );
CREATE POLICY "Users can create messages in own chats" ON public.messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chats
      WHERE chats.id = messages.chat_id
      AND chats.user_id = (select auth.uid())
    )
  );
CREATE POLICY "Users can delete own messages" ON public.messages
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.chats
      WHERE chats.id = messages.chat_id
      AND chats.user_id = (select auth.uid())
    )
  );

-- Highlights policies
CREATE POLICY "Users can view own highlights" ON public.highlights
  FOR SELECT USING ((select auth.uid()) = user_id);
CREATE POLICY "Users can create own highlights" ON public.highlights
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "Users can update own highlights" ON public.highlights
  FOR UPDATE USING ((select auth.uid()) = user_id);
CREATE POLICY "Users can delete own highlights" ON public.highlights
  FOR DELETE USING ((select auth.uid()) = user_id);

-- Updated_at trigger function (with secure search_path)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_folders_updated_at BEFORE UPDATE ON public.folders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_chats_updated_at BEFORE UPDATE ON public.chats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create profile on user signup (with secure search_path)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Storage bucket policies (run these in the Supabase dashboard SQL editor)
-- Note: Storage policies need to be created through the Supabase dashboard
-- or using the Supabase CLI with the storage-api

-- Example storage policies (create via dashboard):
-- Bucket: documents (private)
-- Policy: Users can upload to their own folder
-- Policy: Users can read their own documents
-- Policy: Users can delete their own documents

-- Bucket: chat-attachments (private)
-- Policy: Users can upload screenshots to their own folder
-- Policy: Users can read their own attachments
