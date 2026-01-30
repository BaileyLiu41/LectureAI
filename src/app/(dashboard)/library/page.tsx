'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/layout';
import { DocumentGrid } from '@/components/library/document-grid';
import { UploadDropzone } from '@/components/library/upload-dropzone';
import { createClient } from '@/lib/supabase/client';
import type { Document } from '@/types';

export default function LibraryPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadDocuments = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('documents')
        .select('*')
        .order('updated_at', { ascending: false });

      if (data) {
        setDocuments(data);
      }
      setIsLoading(false);
    };

    loadDocuments();
  }, []);

  const handleUploadComplete = (newDoc: Document) => {
    setDocuments((prev) => [newDoc, ...prev]);
  };

  // Filter documents based on search query
  const filteredDocuments = documents.filter((doc) =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.file_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <Header
        activeTab="documents"
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />
      <div className="flex-1 overflow-auto p-6">
        {documents.length === 0 && !isLoading ? (
          <UploadDropzone onUploadComplete={handleUploadComplete} />
        ) : (
          <DocumentGrid documents={filteredDocuments} isLoading={isLoading} />
        )}
      </div>
    </>
  );
}
