'use client';

import { useState, useRef, useCallback } from 'react';
import html2canvas from 'html2canvas';

interface ScreenshotOverlayProps {
  pageNumber: number;
  onCapture: (imageData: string, pageNumber: number) => void;
  onCancel: () => void;
}

interface SelectionArea {
  startX: number;
  startY: number;
  width: number;
  height: number;
}

export function ScreenshotOverlay({
  pageNumber,
  onCapture,
  onCancel,
}: ScreenshotOverlayProps) {
  const [selection, setSelection] = useState<SelectionArea | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const startPoint = useRef<{ x: number; y: number } | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!overlayRef.current) return;

    const rect = overlayRef.current.getBoundingClientRect();
    startPoint.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    setIsSelecting(true);
    setSelection(null);
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isSelecting || !startPoint.current || !overlayRef.current) return;

      const rect = overlayRef.current.getBoundingClientRect();
      const currentX = e.clientX - rect.left;
      const currentY = e.clientY - rect.top;

      const x = Math.min(startPoint.current.x, currentX);
      const y = Math.min(startPoint.current.y, currentY);
      const width = Math.abs(currentX - startPoint.current.x);
      const height = Math.abs(currentY - startPoint.current.y);

      setSelection({ startX: x, startY: y, width, height });
    },
    [isSelecting]
  );

  const handleMouseUp = useCallback(async () => {
    if (!selection || selection.width < 10 || selection.height < 10) {
      setIsSelecting(false);
      setSelection(null);
      return;
    }

    setIsSelecting(false);

    // Find the page canvas element
    const pageElement = overlayRef.current?.parentElement?.querySelector('canvas');
    if (!pageElement) {
      onCancel();
      return;
    }

    try {
      // Capture the selected region
      const canvas = await html2canvas(pageElement, {
        x: selection.startX,
        y: selection.startY,
        width: selection.width,
        height: selection.height,
        useCORS: true,
        allowTaint: true,
        logging: false,
      });

      const imageData = canvas.toDataURL('image/png');
      onCapture(imageData, pageNumber);
    } catch (error) {
      console.error('Screenshot error:', error);
      onCancel();
    }
  }, [selection, pageNumber, onCapture, onCancel]);

  return (
    <div
      ref={overlayRef}
      className="absolute inset-0 cursor-crosshair bg-black/10"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => {
        if (isSelecting) {
          setIsSelecting(false);
          setSelection(null);
        }
      }}
    >
      {/* Selection rectangle */}
      {selection && (
        <div
          className="absolute border-2 border-primary bg-primary/20 pointer-events-none"
          style={{
            left: selection.startX,
            top: selection.startY,
            width: selection.width,
            height: selection.height,
          }}
        >
          {/* Corner indicators */}
          <div className="absolute -left-1 -top-1 w-2 h-2 bg-primary rounded-full" />
          <div className="absolute -right-1 -top-1 w-2 h-2 bg-primary rounded-full" />
          <div className="absolute -left-1 -bottom-1 w-2 h-2 bg-primary rounded-full" />
          <div className="absolute -right-1 -bottom-1 w-2 h-2 bg-primary rounded-full" />
        </div>
      )}

      {/* Instructions */}
      {!selection && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-background/90 px-4 py-2 rounded-lg shadow-lg text-sm">
            Click and drag to select an area
          </div>
        </div>
      )}
    </div>
  );
}
