'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BookOpen,
  FolderOpen,
  MessageSquare,
  Settings,
  Plus,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Folder } from '@/types';

interface SidebarProps {
  folders: Folder[];
  onCreateFolder: () => void;
  onUploadDocument: () => void;
}

export function Sidebar({ folders, onCreateFolder, onUploadDocument }: SidebarProps) {
  const pathname = usePathname();
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const rootFolders = folders.filter((f) => !f.parent_folder_id);

  const renderFolderTree = (folder: Folder, depth: number = 0) => {
    const childFolders = folders.filter((f) => f.parent_folder_id === folder.id);
    const isExpanded = expandedFolders.has(folder.id);
    const isActive = pathname === `/library/${folder.id}`;

    return (
      <div key={folder.id}>
        <div
          className={cn(
            'flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer hover:bg-accent group',
            isActive && 'bg-accent text-accent-foreground',
            depth > 0 && 'ml-4'
          )}
        >
          {childFolders.length > 0 ? (
            <button
              onClick={() => toggleFolder(folder.id)}
              className="p-0.5 hover:bg-secondary rounded"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
          ) : (
            <span className="w-5" />
          )}
          <Link
            href={`/library/${folder.id}`}
            className="flex items-center gap-2 flex-1"
          >
            <FolderOpen
              className="h-4 w-4"
              style={{ color: folder.color }}
            />
            <span className="text-sm truncate">{folder.name}</span>
          </Link>
        </div>
        {isExpanded &&
          childFolders.map((child) => renderFolderTree(child, depth + 1))}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full w-64 bg-sidebar-bg border-r border-sidebar-border">
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-4 border-b border-sidebar-border">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary">
          <BookOpen className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="font-semibold text-foreground">LectureAI</h1>
          <p className="text-xs text-muted-foreground">Your learning companion</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-hidden flex flex-col">
        <div className="px-3 py-2">
          <Link
            href="/library"
            className={cn(
              'flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent',
              pathname === '/library' && 'bg-accent text-accent-foreground'
            )}
          >
            <FolderOpen className="h-4 w-4" />
            <span className="text-sm">All Documents</span>
          </Link>
          <Link
            href="/chats"
            className={cn(
              'flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent',
              pathname === '/chats' && 'bg-accent text-accent-foreground'
            )}
          >
            <MessageSquare className="h-4 w-4" />
            <span className="text-sm">Chats</span>
          </Link>
        </div>

        {/* Folders */}
        <div className="px-3 py-2 border-t border-sidebar-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Folders
            </span>
            <button
              onClick={onCreateFolder}
              className="p-1 hover:bg-accent rounded"
              title="Create folder"
            >
              <Plus className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
          <ScrollArea className="flex-1 max-h-[calc(100vh-380px)]">
            {rootFolders.length > 0 ? (
              rootFolders.map((folder) => renderFolderTree(folder))
            ) : (
              <p className="text-xs text-muted-foreground px-2 py-1">
                No folders yet
              </p>
            )}
          </ScrollArea>
        </div>

        {/* Settings */}
        <div className="px-3 py-2 border-t border-sidebar-border mt-auto">
          <Link
            href="/settings"
            className={cn(
              'flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent',
              pathname === '/settings' && 'bg-accent text-accent-foreground'
            )}
          >
            <Settings className="h-4 w-4" />
            <span className="text-sm">Settings</span>
          </Link>
        </div>
      </nav>

      {/* Upload Button */}
      <div className="p-3 border-t border-sidebar-border">
        <Button
          onClick={onUploadDocument}
          className="w-full"
        >
          Upload PDF
        </Button>
      </div>
    </div>
  );
}
