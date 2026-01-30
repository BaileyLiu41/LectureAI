'use client';

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

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div
      className={cn(
        'flex gap-3',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
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
            {message.pageNumber && (
              <span>from page {message.pageNumber}</span>
            )}
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

        {/* Message content */}
        <div
          className={cn(
            'rounded-lg px-4 py-2 text-sm',
            isUser
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-foreground'
          )}
        >
          <div className="whitespace-pre-wrap break-words">
            {message.content}
          </div>
        </div>
      </div>
    </div>
  );
}
