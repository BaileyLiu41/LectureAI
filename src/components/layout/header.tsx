'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, FileText, MessageSquare } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface HeaderProps {
  activeTab?: 'documents' | 'chats';
  showTabs?: boolean;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

export function Header({
  activeTab = 'documents',
  showTabs = true,
  searchQuery: controlledSearchQuery,
  onSearchChange,
}: HeaderProps) {
  const [internalSearchQuery, setInternalSearchQuery] = useState('');
  const searchQuery = controlledSearchQuery ?? internalSearchQuery;

  const handleSearchChange = (value: string) => {
    if (onSearchChange) {
      onSearchChange(value);
    } else {
      setInternalSearchQuery(value);
    }
  };

  return (
    <header className="flex items-center justify-between px-6 py-3 border-b border-border bg-background">
      {/* Tabs */}
      {showTabs && (
        <div className="flex items-center gap-1 bg-secondary rounded-lg p-1">
          <Link
            href="/library"
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors',
              activeTab === 'documents'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <FileText className="h-4 w-4" />
            Documents
          </Link>
          <Link
            href="/chats"
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors',
              activeTab === 'chats'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <MessageSquare className="h-4 w-4" />
            Chats
          </Link>
        </div>
      )}

      {!showTabs && <div />}

      {/* Search */}
      <div className="relative w-64">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>
    </header>
  );
}
