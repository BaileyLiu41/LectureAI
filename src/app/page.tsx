import Link from 'next/link';
import { BookOpen, FileText, MessageSquare, Camera, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50 to-white">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary">
            <BookOpen className="h-6 w-6 text-primary-foreground" />
          </div>
          <span className="text-xl font-semibold">LectureAI</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login">
            <Button variant="ghost">Sign in</Button>
          </Link>
          <Link href="/register">
            <Button>Get started</Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-5xl font-bold tracking-tight text-foreground mb-6">
            Understand your lectures
            <span className="text-primary"> with AI</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Upload your lecture handouts, highlight text or capture diagrams,
            and get instant AI explanations. Stop struggling with complex concepts.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="text-lg px-8">
                Start learning free
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="text-lg px-8">
                Sign in
              </Button>
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-24">
          <FeatureCard
            icon={<FileText className="h-6 w-6" />}
            title="Upload PDFs"
            description="Organize your lecture handouts in folders, just like Google Drive"
          />
          <FeatureCard
            icon={<MessageSquare className="h-6 w-6" />}
            title="AI Chat"
            description="Ask questions about any part of your document and get instant explanations"
          />
          <FeatureCard
            icon={<Camera className="h-6 w-6" />}
            title="Screenshot to AI"
            description="Capture equations, diagrams, or any content and ask AI to explain it"
          />
          <FeatureCard
            icon={<FolderOpen className="h-6 w-6" />}
            title="Organized Chats"
            description="Your chats are organized by document and folder, not just by time"
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-24">
        <div className="max-w-7xl mx-auto px-6 py-8 text-center text-muted-foreground">
          <p>Built with AI to help you learn better</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="p-6 rounded-xl bg-white border border-border hover:shadow-md transition-shadow">
      <div className="w-12 h-12 rounded-lg bg-accent flex items-center justify-center text-primary mb-4">
        {icon}
      </div>
      <h3 className="font-semibold text-lg mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}
