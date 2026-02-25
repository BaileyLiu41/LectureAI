'use client';

import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { cn } from '@/lib/utils';
import { User, Bot, FileText, Image } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  selectedText?: string;
  screenshot?: string;
  pageNumber?: number;
}

interface ChatMessageProps {
  message: Message;
}

/**
 * Normalize LaTeX delimiters so remark-math can parse them.
 * remark-math uses $...$ / $$...$$ — convert the \(...\) and \[...\] variants.
 */
function normalizeLatex(content: string): string {
  // \[...\]  →  $$\n...\n$$  (display / block math)
  content = content.replace(/\\\[([\s\S]*?)\\\]/g, (_, math) => `\n$$\n${math}\n$$\n`);
  // \(...\)  →  $...$  (inline math)
  content = content.replace(/\\\(([\s\S]*?)\\\)/g, (_, math) => `$${math}$`);
  return content;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const processedContent = normalizeLatex(message.content);

  return (
    <div className={cn('flex gap-3', isUser ? 'flex-row-reverse' : 'flex-row')}>
      {/* Avatar */}
      <div
        className={cn(
          'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
          isUser ? 'bg-primary' : 'bg-accent'
        )}
      >
        {isUser ? (
          <User className="h-4 w-4 text-primary-foreground" />
        ) : (
          <Bot className="h-4 w-4 text-accent-foreground" />
        )}
      </div>

      {/* Content */}
      <div
        className={cn(
          'flex flex-col gap-2 max-w-[80%]',
          isUser ? 'items-end' : 'items-start'
        )}
      >
        {/* Context indicators */}
        {(message.selectedText || message.screenshot) && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {message.selectedText && (
              <span className="flex items-center gap-1">
                <FileText className="h-3 w-3" />
                Selected text
              </span>
            )}
            {message.screenshot && (
              <span className="flex items-center gap-1">
                <Image className="h-3 w-3" />
                Screenshot
              </span>
            )}
            {message.pageNumber && <span>from page {message.pageNumber}</span>}
          </div>
        )}

        {/* Screenshot preview */}
        {message.screenshot && (
          <img
            src={message.screenshot}
            alt="Screenshot"
            className="max-w-full rounded-lg border border-border"
          />
        )}

        {/* Selected text quote */}
        {message.selectedText && (
          <blockquote className="text-sm italic text-muted-foreground border-l-2 border-primary pl-3">
            &ldquo;{message.selectedText.slice(0, 200)}
            {message.selectedText.length > 200 && '...'}&rdquo;
          </blockquote>
        )}

        {/* Message content with markdown + LaTeX */}
        <div
          className={cn(
            'rounded-lg px-4 py-2 text-sm',
            isUser ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
          )}
        >
          <div
            className={cn(
              'prose prose-sm max-w-none break-words',
              isUser ? 'prose-invert [&_.katex]:text-primary-foreground' : 'dark:prose-invert'
            )}
          >
            <ReactMarkdown
              remarkPlugins={[remarkMath]}
              rehypePlugins={[rehypeKatex]}
              components={{
                code({ className, children, ...props }) {
                  const isBlock = className?.includes('language-');
                  return isBlock ? (
                    <code
                      className={cn('block bg-black/10 rounded p-2 text-xs overflow-x-auto', className)}
                      {...props}
                    >
                      {children}
                    </code>
                  ) : (
                    <code className="bg-black/10 rounded px-1 text-xs" {...props}>
                      {children}
                    </code>
                  );
                },
              }}
            >
              {processedContent}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
}
