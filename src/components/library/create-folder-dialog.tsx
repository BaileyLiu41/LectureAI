'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Folder } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { Folder as FolderType } from '@/types';

interface CreateFolderDialogProps {
  open: boolean;
  onClose: () => void;
  onFolderCreated: (folder: FolderType) => void;
}

const folderColors = [
  '#8b5cf6', // Purple (default)
  '#ef4444', // Red
  '#f97316', // Orange
  '#eab308', // Yellow
  '#22c55e', // Green
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
  '#ec4899', // Pink
];

export function CreateFolderDialog({
  open,
  onClose,
  onFolderCreated,
}: CreateFolderDialogProps) {
  const [name, setName] = useState('');
  const [color, setColor] = useState(folderColors[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setName('');
      setColor(folderColors[0]);
      setError(null);
    }
  }, [open]);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Folder name is required');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError('You must be logged in to create a folder');
        setIsLoading(false);
        return;
      }

      // Get the highest position for ordering
      const { data: existingFolders } = await supabase
        .from('folders')
        .select('position')
        .order('position', { ascending: false })
        .limit(1);

      const folders = existingFolders as unknown as { position: number }[] | null;
      const nextPosition =
        folders && folders.length > 0
          ? (folders[0].position || 0) + 1
          : 0;

      const { data, error: insertError } = await supabase
        .from('folders')
        .insert({
          user_id: user.id,
          name: name.trim(),
          color,
          position: nextPosition,
        } as never)
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      if (data) {
        onFolderCreated(data as unknown as FolderType);
        onClose();
      }
    } catch (err) {
      console.error('Error creating folder:', err);
      setError('Failed to create folder. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative bg-background rounded-lg shadow-lg w-full max-w-md mx-4 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Create New Folder</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Folder name input */}
          <div className="mb-4">
            <label
              htmlFor="folder-name"
              className="block text-sm font-medium mb-2"
            >
              Folder Name
            </label>
            <Input
              id="folder-name"
              type="text"
              placeholder="Enter folder name..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          {/* Color picker */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Folder Color
            </label>
            <div className="flex gap-2 flex-wrap">
              {folderColors.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full transition-transform ${
                    color === c ? 'ring-2 ring-offset-2 ring-primary scale-110' : ''
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="mb-4 p-3 bg-muted rounded-md flex items-center gap-3">
            <Folder className="h-5 w-5" style={{ color }} />
            <span className="text-sm">
              {name.trim() || 'Folder preview'}
            </span>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 text-sm text-destructive bg-destructive/10 rounded-md">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Folder'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
