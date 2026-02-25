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

export function ScreenshotOverlay({ pageNumber, onCapture, onCancel }: ScreenshotOverlayProps) {
  const [isSelecting, setIsSelecting] = useState(false);
  const [selection, setSelection] = useState<SelectionArea | null>(null);
  const [error, setError] = useState<string | null>(null);

  const overlayRef = useRef<HTMLDivElement>(null);
  const startPoint = useRef<{ x: number; y: number } | null>(null);
  // Keep a ref in sync with selection state so the window mouseup closure always
  // reads the latest value without needing it in its dependency array.
  const selectionRef = useRef<SelectionArea | null>(null);
  useEffect(() => { selectionRef.current = selection; }, [selection]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onCancel]);

  // ── Crop & emit ────────────────────────────────────────────────────────────
  const doCapture = useCallback(async (sel: SelectionArea) => {
    const overlay = overlayRef.current;
    // Prefer the specific react-pdf canvas class; fall back to any canvas sibling.
    const pageCanvas =
      (overlay?.parentElement?.querySelector('canvas.react-pdf__Page__canvas') as HTMLCanvasElement | null)
      ?? (overlay?.parentElement?.querySelector('canvas') as HTMLCanvasElement | null);

    if (!overlay || !pageCanvas) {
      setError('Page canvas not found — try again.');
      setTimeout(() => { setError(null); onCancel(); }, 3000);
      return;
    }

    try {
      // canvas.width/height are the buffer dimensions (may include devicePixelRatio).
      const scaleX = pageCanvas.width / overlay.clientWidth;
      const scaleY = pageCanvas.height / overlay.clientHeight;

      const srcX = Math.round(sel.startX * scaleX);
      const srcY = Math.round(sel.startY * scaleY);
      const srcW = Math.round(sel.width * scaleX);
      const srcH = Math.round(sel.height * scaleY);

      const crop = document.createElement('canvas');
      crop.width = srcW;
      crop.height = srcH;
      const ctx = crop.getContext('2d');
      if (!ctx) { onCancel(); return; }

      ctx.drawImage(pageCanvas, srcX, srcY, srcW, srcH, 0, 0, srcW, srcH);
      onCapture(crop.toDataURL('image/png'), pageNumber);
      setSelection(null);
    } catch (err) {
      console.error('Screenshot capture failed:', err);
      const msg = err instanceof Error && err.message.toLowerCase().includes('security')
        ? 'Canvas blocked by browser security (cross-origin). Try refreshing.'
        : 'Screenshot failed — please try again.';
      setError(msg);
      setTimeout(() => { setError(null); onCancel(); }, 4000);
    }
  }, [onCapture, onCancel, pageNumber]);

  // ── Drag start ─────────────────────────────────────────────────────────────
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault(); // prevent browser text-selection during drag
    if (!overlayRef.current) return;
    const rect = overlayRef.current.getBoundingClientRect();
    startPoint.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    setIsSelecting(true);
    setSelection(null);
    setError(null);
  }, []);

  // ── Window-level drag tracking ─────────────────────────────────────────────
  // Attaching to window means mouseup fires even if the cursor leaves the overlay,
  // and movement is clamped to the overlay bounds so the selection stays valid.
  useEffect(() => {
    if (!isSelecting) return;

    const onMove = (e: MouseEvent) => {
      if (!overlayRef.current || !startPoint.current) return;
      const rect = overlayRef.current.getBoundingClientRect();
      const cx = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
      const cy = Math.max(0, Math.min(e.clientY - rect.top, rect.height));
      setSelection({
        startX: Math.min(startPoint.current.x, cx),
        startY: Math.min(startPoint.current.y, cy),
        width:  Math.abs(cx - startPoint.current.x),
        height: Math.abs(cy - startPoint.current.y),
      });
    };

    const onUp = () => {
      setIsSelecting(false);
      const sel = selectionRef.current;
      if (sel && sel.width >= 10 && sel.height >= 10) {
        doCapture(sel);
      } else {
        setSelection(null);
      }
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [isSelecting, doCapture]);

  return (
    // z-50 puts the overlay above the react-pdf text layer (z-2) and annotation layer
    <div
      ref={overlayRef}
      className="absolute inset-0 z-50 cursor-crosshair bg-black/10"
      onMouseDown={handleMouseDown}
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
          <div className="absolute -left-1 -top-1    w-2 h-2 bg-primary rounded-full" />
          <div className="absolute -right-1 -top-1   w-2 h-2 bg-primary rounded-full" />
          <div className="absolute -left-1 -bottom-1 w-2 h-2 bg-primary rounded-full" />
          <div className="absolute -right-1 -bottom-1 w-2 h-2 bg-primary rounded-full" />
        </div>
      )}

      {/* Instructions (only when not actively dragging) */}
      {!selection && !isSelecting && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-background/90 px-4 py-2 rounded-lg shadow-lg text-sm">
            Click and drag to select an area
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-destructive text-destructive-foreground px-4 py-2 rounded-lg shadow-lg text-sm pointer-events-none">
          {error}
        </div>
      )}
    </div>
  );
}
