'use client';

import { X, FileText, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ContextBadgeProps {
  text?: string;
  hasScreenshot?: boolean;
  pageNumber?: number;
  onClear: () => void;
}

export function ContextBadge({
  text,
  hasScreenshot,
  pageNumber,
  onClear,
}: ContextBadgeProps) {
  return (
    <div className="mx-4 mb-2 p-3 bg-accent rounded-lg">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            {text && (
              <span className="flex items-center gap-1">
                <FileText className="h-3 w-3" />
                Selected text
              </span>
            )}
            {hasScreenshot && (
              <span className="flex items-center gap-1">
                <Image className="h-3 w-3" />
                Screenshot
              </span>
            )}
            {pageNumber && <span>from page {pageNumber}</span>}
          </div>
          {text && (
            <p className="text-sm truncate">
              &ldquo;{text.slice(0, 100)}{text.length > 100 && '...'}&rdquo;
            </p>
          )}
          {hasScreenshot && !text && (
            <p className="text-sm text-muted-foreground">
              Screenshot attached
            </p>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0"
          onClick={onClear}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
