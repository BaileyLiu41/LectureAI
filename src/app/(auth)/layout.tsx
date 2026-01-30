import { BookOpen } from 'lucide-react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-violet-600 to-purple-700 p-12 flex-col justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/20">
            <BookOpen className="h-6 w-6 text-white" />
          </div>
          <span className="text-xl font-semibold text-white">LectureAI</span>
        </div>

        <div className="space-y-6">
          <h1 className="text-4xl font-bold text-white leading-tight">
            Understand your lectures<br />with AI assistance
          </h1>
          <p className="text-lg text-white/80 max-w-md">
            Upload your lecture handouts, highlight text or capture screenshots,
            and get instant AI explanations to master any topic.
          </p>
        </div>

        <p className="text-sm text-white/60">
          Your AI-powered learning companion
        </p>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  );
}
