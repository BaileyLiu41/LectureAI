# LectureAI

AI-powered study assistant for understanding lecture handouts and documents. Upload PDFs, highlight text or capture screenshots, and get instant AI explanations.

## Features

- **Document Library**: Upload and organize PDFs in folders (like Google Drive)
- **PDF Reader**: Full-featured PDF viewer with zoom, navigation, and text selection
- **Text Selection → AI**: Highlight text and click "Ask AI" to get explanations
- **Screenshot Tool**: Capture any area (equations, diagrams) and ask questions
- **AI Chat Sidebar**: Stream responses from GPT-4o or Gemini
- **Organized Chats**: Chats linked to documents, not just chronological

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Supabase (Auth, PostgreSQL, Storage)
- **PDF**: react-pdf (PDF.js wrapper)
- **AI**: OpenAI GPT-4o, Google Gemini (user-provided keys)

## Getting Started

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd LectureAI
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the migration file: `supabase/migrations/20240101000000_initial_schema.sql`
3. Go to Storage and create two buckets:
   - `documents` (private)
   - `chat-attachments` (private)

### 3. Configure Environment Variables

Copy the example env file:

```bash
cp .env.local.example .env.local
```

Fill in your Supabase credentials (found in Project Settings > API):

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 5. Configure API Keys

1. Register/login to your account
2. Go to Settings
3. Add your OpenAI and/or Gemini API keys

## Project Structure

```
src/
├── app/
│   ├── (auth)/          # Login, register, forgot password
│   ├── (dashboard)/     # Main app pages
│   │   ├── library/     # Document library
│   │   ├── document/    # PDF viewer + chat
│   │   ├── chats/       # All chats view
│   │   └── settings/    # API key config
│   └── api/             # API routes
├── components/
│   ├── chat/            # AI sidebar components
│   ├── layout/          # App shell, sidebar
│   ├── library/         # Document cards, upload
│   ├── pdf-viewer/      # PDF rendering, selection
│   └── ui/              # Base UI components
├── hooks/               # Custom React hooks
├── lib/                 # Utilities, Supabase clients
└── types/               # TypeScript definitions
```

## Usage

1. **Upload a PDF**: Click "Upload PDF" or drag-and-drop
2. **Open a document**: Click any document to open the reader
3. **Ask about text**: Select text → click "Ask AI" button
4. **Screenshot**: Click "Screenshot" → drag to select area → ask question
5. **Chat**: Type questions in the sidebar chat

## Deployment

Deploy to Vercel:

```bash
npm run build
```

Set environment variables in your deployment platform.

## License

MIT
