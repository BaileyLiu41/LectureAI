'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

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
      setSelection({
        startX: Math.min(startPoint.current.x, currentX),
        startY: Math.min(startPoint.current.y, currentY),
        width: Math.abs(currentX - startPoint.current.x),
        height: Math.abs(currentY - startPoint.current.y),
      });
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

    const overlay = overlayRef.current;
    // react-pdf renders a <canvas> inside the same parent div as the overlay
    const pageCanvas = overlay?.parentElement?.querySelector('canvas');
    if (!overlay || !pageCanvas) {
      onCancel();
      return;
    }

    try {
      // The canvas buffer may be larger than its CSS size (devicePixelRatio scaling).
      // Scale selection coords from CSS pixels → canvas buffer pixels.
      const scaleX = pageCanvas.width / overlay.clientWidth;
      const scaleY = pageCanvas.height / overlay.clientHeight;

      const srcX = Math.round(selection.startX * scaleX);
      const srcY = Math.round(selection.startY * scaleY);
      const srcW = Math.round(selection.width * scaleX);
      const srcH = Math.round(selection.height * scaleY);

      const cropCanvas = document.createElement('canvas');
      cropCanvas.width = srcW;
      cropCanvas.height = srcH;
      const ctx = cropCanvas.getContext('2d');
      if (!ctx) { onCancel(); return; }

      ctx.drawImage(pageCanvas, srcX, srcY, srcW, srcH, 0, 0, srcW, srcH);
      onCapture(cropCanvas.toDataURL('image/png'), pageNumber);
    } catch (err) {
      console.error('Screenshot error:', err);
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
          <div className="absolute -left-1 -top-1 w-2 h-2 bg-primary rounded-full" />
          <div className="absolute -right-1 -top-1 w-2 h-2 bg-primary rounded-full" />
          <div className="absolute -left-1 -bottom-1 w-2 h-2 bg-primary rounded-full" />
          <div className="absolute -right-1 -bottom-1 w-2 h-2 bg-primary rounded-full" />
        </div>
      )}

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
