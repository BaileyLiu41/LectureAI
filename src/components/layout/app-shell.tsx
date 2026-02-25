'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from './sidebar';
import { CreateFolderDialog } from '@/components/library/create-folder-dialog';
import { UploadDropzone } from '@/components/library/upload-dropzone';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
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

      {showUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowUpload(false)}
          />
          <div className="relative bg-background rounded-lg shadow-lg w-full max-w-lg mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Upload PDF</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowUpload(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <UploadDropzone onUploadComplete={() => setShowUpload(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
