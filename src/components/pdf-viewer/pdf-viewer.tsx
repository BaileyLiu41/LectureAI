'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { PdfToolbar } from './pdf-toolbar';
import { SelectionPopover } from './selection-popover';
import { ScreenshotOverlay } from './screenshot-overlay';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ChatContext } from '@/types';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfViewerProps {
  url: string;
  documentId: string;
  onAddToChat: (context: ChatContext) => void;
  onPdfTextExtracted?: (text: string) => void;
}

interface SelectionData {
  text: string;
  pageNumber: number;
  position: { x: number; y: number };
}

export function PdfViewer({ url, documentId, onAddToChat, onPdfTextExtracted }: PdfViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [isLoading, setIsLoading] = useState(true);
  const [selection, setSelection] = useState<SelectionData | null>(null);
  const [isScreenshotMode, setIsScreenshotMode] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const documentRef = useRef<HTMLDivElement>(null);
  const justSelectedRef = useRef(false);
  const isUserNavigatingRef = useRef(false);
  const scrollingToPageRef = useRef(false);
  // Ref copy of isScreenshotMode so event-handler closures can read it
  // without needing to be recreated whenever the state changes.
  const isScreenshotModeRef = useRef(false);
  useEffect(() => { isScreenshotModeRef.current = isScreenshotMode; }, [isScreenshotMode]);

  const onDocumentLoadSuccess = async ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setIsLoading(false);

    // Extract text from PDF for AI context
    if (onPdfTextExtracted) {
      try {
        const pdf = await pdfjs.getDocument(url).promise;
        let fullText = '';

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items
            .map((item) => ('str' in item ? (item as { str: string }).str : ''))
            .join(' ');
          fullText += `\n--- Page ${i} ---\n${pageText}`;
        }

        onPdfTextExtracted(fullText.trim());
      } catch (err) {
        console.error('Error extracting PDF text:', err);
      }
    }
  };

  const handleTextSelection = useCallback(() => {
    // Never interfere with an active screenshot drag
    if (isScreenshotModeRef.current) return;

    const windowSelection = window.getSelection();
    if (!windowSelection || windowSelection.isCollapsed) {
      return; // Don't clear selection here, let click handler do it
    }

    const text = windowSelection.toString().trim();
    if (!text) {
      return;
    }

    // Find which page the selection is in
    const range = windowSelection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const pageElement = range.startContainer.parentElement?.closest('[data-page-number]');
    const pageNum = pageElement?.getAttribute('data-page-number');

    if (pageNum && containerRef.current) {
      const container = containerRef.current;
      const containerRect = container.getBoundingClientRect();

      // Account for scroll offset when positioning the popover
      setSelection({
        text,
        pageNumber: parseInt(pageNum, 10),
        position: {
          x: rect.left - containerRect.left + rect.width / 2 + container.scrollLeft,
          y: rect.top - containerRect.top - 10 + container.scrollTop,
        },
      });

      // Mark that we just selected text to prevent immediate click from clearing
      justSelectedRef.current = true;
      setTimeout(() => {
        justSelectedRef.current = false;
      }, 200);
    }
  }, []);

  const handleAddSelectionToChat = () => {
    if (selection) {
      onAddToChat({
        text: selection.text,
        pageNumber: selection.pageNumber,
      });
      window.getSelection()?.removeAllRanges();
      setSelection(null);
    }
  };

  const handleScreenshotCapture = (imageData: string, pageNumber: number) => {
    onAddToChat({
      screenshot: imageData,
      pageNumber,
    });
    setIsScreenshotMode(false);
  };

  const handleZoomIn = () => setScale((s) => Math.min(s + 0.25, 3));
  const handleZoomOut = () => setScale((s) => Math.max(s - 0.25, 0.5));
  const handleZoomReset = () => setScale(1);

  const handlePageChange = useCallback((page: number) => {
    isUserNavigatingRef.current = true;
    setCurrentPage(page);
  }, []);

  // Scroll to the target page when user navigates via toolbar
  useEffect(() => {
    if (!isUserNavigatingRef.current) return;
    isUserNavigatingRef.current = false;
    const container = containerRef.current;
    if (!container) return;
    const pageEl = container.querySelector(`[data-page-number="${currentPage}"]`);
    if (pageEl) {
      scrollingToPageRef.current = true;
      pageEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Smooth scroll takes ~500ms; suppress tracking until it settles
      setTimeout(() => { scrollingToPageRef.current = false; }, 800);
    }
  }, [currentPage]);

  // Track current page as user scrolls by finding the most-visible page
  useEffect(() => {
    const container = containerRef.current;
    if (!container || numPages === 0) return;

    let rafId: number;

    const handleScroll = () => {
      if (scrollingToPageRef.current) return;
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const containerRect = container.getBoundingClientRect();
        const pages = container.querySelectorAll('[data-page-number]');
        let bestPage = 1;
        let bestVisibleHeight = 0;

        for (const page of pages) {
          const el = page as HTMLElement;
          const rect = el.getBoundingClientRect();
          const visibleTop = Math.max(rect.top, containerRect.top);
          const visibleBottom = Math.min(rect.bottom, containerRect.bottom);
          const visibleHeight = Math.max(0, visibleBottom - visibleTop);
          if (visibleHeight > bestVisibleHeight) {
            bestVisibleHeight = visibleHeight;
            bestPage = parseInt(el.getAttribute('data-page-number') || '1', 10);
          }
        }

        setCurrentPage(bestPage);
      });
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(rafId);
    };
  }, [numPages]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('mouseup', handleTextSelection);
    return () => container.removeEventListener('mouseup', handleTextSelection);
  }, [handleTextSelection]);

  // Clear selection when clicking elsewhere
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      // Ignore click if we just finished selecting text
      if (justSelectedRef.current) return;

      if (selection && !(e.target as Element).closest('.selection-popover')) {
        setSelection(null);
        window.getSelection()?.removeAllRanges();
      }
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [selection]);

  return (
    <div className="flex flex-col h-full bg-muted/30">
      <PdfToolbar
        currentPage={currentPage}
        totalPages={numPages}
        scale={scale}
        onPageChange={handlePageChange}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onZoomReset={handleZoomReset}
        onScreenshotMode={() => setIsScreenshotMode(prev => !prev)}
        isScreenshotMode={isScreenshotMode}
      />

      <div
        ref={containerRef}
        className="flex-1 overflow-auto relative"
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        <div
          ref={documentRef}
          className="min-h-full flex flex-col items-center py-4 px-8"
        >
          <Document
            file={url}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={null}
            className="flex flex-col items-center gap-4"
          >
            {Array.from({ length: numPages }, (_, index) => (
              <div
                key={`page_${index + 1}`}
                data-page-number={index + 1}
                className={cn(
                  'shadow-lg bg-white relative',
                  // In screenshot mode: suppress pointer events on the text +
                  // annotation layers so they don't steal events from the overlay,
                  // and disable text selection so dragging doesn't highlight text.
                  isScreenshotMode && 'cursor-crosshair select-none [&_.react-pdf__Page__textContent]:pointer-events-none [&_.react-pdf__Page__annotations]:pointer-events-none'
                )}
              >
                <Page
                  pageNumber={index + 1}
                  scale={scale}
                  renderTextLayer={true}
                  renderAnnotationLayer={true}
                  className="select-text"
                />
                {isScreenshotMode && (
                  <ScreenshotOverlay
                    pageNumber={index + 1}
                    onCapture={handleScreenshotCapture}
                    onCancel={() => setIsScreenshotMode(false)}
                  />
                )}
              </div>
            ))}
          </Document>
        </div>

        {/* Selection popover */}
        {selection && (
          <SelectionPopover
            position={selection.position}
            onAddToChat={handleAddSelectionToChat}
            onClose={() => setSelection(null)}
          />
        )}
      </div>
    </div>
  );
}
