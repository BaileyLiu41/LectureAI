'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Camera,
  X,
} from 'lucide-react';

interface PdfToolbarProps {
  currentPage: number;
  totalPages: number;
  scale: number;
  onPageChange: (page: number) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  onScreenshotMode: () => void;
  isScreenshotMode: boolean;
}

export function PdfToolbar({
  currentPage,
  totalPages,
  scale,
  onPageChange,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onScreenshotMode,
  isScreenshotMode,
}: PdfToolbarProps) {
  const handlePageInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const page = parseInt(e.target.value, 10);
    if (page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
  };

  return (
    <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-background">
      {/* Page navigation */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage <= 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-1">
          <Input
            type="number"
            min={1}
            max={totalPages}
            value={currentPage}
            onChange={handlePageInput}
            className="w-14 h-8 text-center text-sm"
          />
          <span className="text-sm text-muted-foreground">
            / {totalPages || '—'}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage >= totalPages}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Zoom controls */}
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" onClick={onZoomOut}>
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onZoomReset}
          className="min-w-[60px]"
        >
          {Math.round(scale * 100)}%
        </Button>
        <Button variant="ghost" size="icon" onClick={onZoomIn}>
          <ZoomIn className="h-4 w-4" />
        </Button>
      </div>

      {/* Screenshot tool */}
      <div>
        {isScreenshotMode ? (
          <Button
            variant="destructive"
            size="sm"
            onClick={onScreenshotMode}
            className="gap-2"
          >
            <X className="h-4 w-4" />
            Cancel
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={onScreenshotMode}
            className="gap-2"
          >
            <Camera className="h-4 w-4" />
            Screenshot
          </Button>
        )}
      </div>
    </div>
  );
}
