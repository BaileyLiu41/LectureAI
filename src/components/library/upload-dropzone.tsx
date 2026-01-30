'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import type { Document } from '@/types';

interface UploadDropzoneProps {
  folderId?: string;
  onUploadComplete?: (document: Document) => void;
  compact?: boolean;
}

export function UploadDropzone({
  folderId,
  onUploadComplete,
  compact = false,
}: UploadDropzoneProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file || file.type !== 'application/pdf') {
        alert('Please upload a PDF file');
        return;
      }

      setIsUploading(true);
      setUploadProgress(10);

      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          throw new Error('Not authenticated');
        }

        setUploadProgress(30);

        // Generate unique file path
        const fileExt = file.name.split('.').pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(filePath, file);

        if (uploadError) {
          throw uploadError;
        }

        setUploadProgress(70);

        // Create document record
        const { data: doc, error: dbError } = await supabase
          .from('documents')
          .insert({
            user_id: user.id,
            folder_id: folderId || null,
            title: file.name.replace(/\.pdf$/i, ''),
            file_name: file.name,
            file_path: filePath,
            file_size: file.size,
          } as never)
          .select()
          .single();

        if (dbError) {
          throw dbError;
        }

        setUploadProgress(100);
        onUploadComplete?.(doc as unknown as Document);
      } catch (error) {
        console.error('Upload error:', error);
        alert('Failed to upload file. Please try again.');
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
      }
    },
    [folderId, onUploadComplete]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
    },
    maxFiles: 1,
    disabled: isUploading,
  });

  if (compact) {
    return (
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors',
          isDragActive
            ? 'border-primary bg-accent'
            : 'border-border hover:border-primary hover:bg-accent/50',
          isUploading && 'pointer-events-none opacity-50'
        )}
      >
        <input {...getInputProps()} />
        {isUploading ? (
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">Uploading... {uploadProgress}%</span>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Upload className="h-5 w-5" />
            <span className="text-sm">Drop PDF or click to upload</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      {...getRootProps()}
      className={cn(
        'flex flex-col items-center justify-center h-[60vh] border-2 border-dashed rounded-xl cursor-pointer transition-all',
        isDragActive
          ? 'border-primary bg-accent scale-[1.02]'
          : 'border-border hover:border-primary hover:bg-accent/30',
        isUploading && 'pointer-events-none'
      )}
    >
      <input {...getInputProps()} />

      {isUploading ? (
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <div className="text-center">
            <p className="font-medium">Uploading...</p>
            <p className="text-sm text-muted-foreground">{uploadProgress}%</p>
          </div>
          <div className="w-48 h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="p-4 bg-accent rounded-full">
            {isDragActive ? (
              <FileText className="h-12 w-12 text-primary" />
            ) : (
              <Upload className="h-12 w-12 text-primary" />
            )}
          </div>
          <div>
            <p className="font-medium text-lg">
              {isDragActive ? 'Drop your PDF here' : 'Upload your first document'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Drag and drop a PDF file, or click to browse
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
