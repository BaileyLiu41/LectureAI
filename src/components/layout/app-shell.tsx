'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from './sidebar';
import { CreateFolderDialog } from '@/components/library/create-folder-dialog';
import { createClient } from '@/lib/supabase/client';
import type { Folder } from '@/types';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => {
    const loadFolders = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('folders')
        .select('*')
        .order('position');

      if (data) {
        setFolders(data);
      }
    };

    loadFolders();
  }, []);

  const handleCreateFolder = () => {
    setShowCreateFolder(true);
  };

  const handleFolderCreated = (newFolder: Folder) => {
    setFolders((prev) => [...prev, newFolder]);
  };

  const handleUploadDocument = () => {
    setShowUpload(true);
    // TODO: Open upload dialog
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar
        folders={folders}
        onCreateFolder={handleCreateFolder}
        onUploadDocument={handleUploadDocument}
      />
      <main className="flex-1 flex flex-col overflow-hidden">
        {children}
      </main>

      <CreateFolderDialog
        open={showCreateFolder}
        onClose={() => setShowCreateFolder(false)}
        onFolderCreated={handleFolderCreated}
      />
    </div>
  );
}
