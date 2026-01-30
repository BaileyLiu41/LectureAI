'use client';

import Link from 'next/link';
import { FileText, MoreHorizontal, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Document } from '@/types';

interface DocumentCardProps {
  document: Document;
}

export function DocumentCard({ document }: DocumentCardProps) {
  return (
    <Link
      href={`/document/${document.id}`}
      className="group relative bg-white border border-border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
    >
      {/* Thumbnail */}
      <div className="aspect-[3/4] bg-gradient-to-br from-violet-100 to-violet-50 flex items-center justify-center">
        {document.thumbnail_path ? (
          <img
            src={document.thumbnail_path}
            alt={document.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <MessageSquare className="h-8 w-8" />
            <span className="text-xs">Study</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 border-t border-border">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-medium text-sm truncate" title={document.title}>
              {document.title}
            </h3>
            <p className="text-xs text-muted-foreground">PDF Document</p>
          </div>
          <button
            onClick={(e) => {
              e.preventDefault();
              // TODO: Open context menu
            }}
            className="p-1 hover:bg-secondary rounded opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>
    </Link>
  );
}
