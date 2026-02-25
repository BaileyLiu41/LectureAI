'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { PdfViewer } from '@/components/pdf-viewer';
import { AiSidebar } from '@/components/chat';
import { Button } from '@/components/ui/button';
import { MessageSquare, Loader2, ArrowLeft, GripVertical } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import type { Document as DocumentType, ChatContext } from '@/types';

export default function DocumentPage() {
  const params = useParams();
  const documentId = params.documentId as string;

  const [document, setDocument] = useState<DocumentType | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedContext, setSelectedContext] = useState<ChatContext | null>(null);
  const [pdfText, setPdfText] = useState<string | null>(null);

  useEffect(() => {
    const loadDocument = async () => {
      const supabase = createClient();

      const { data: doc, error } = await supabase
        .from('documents')
        .select('*')
        .eq('id', documentId)
        .single();

      if (error || !doc) {
        console.error('Error loading document:', error);
        setIsLoading(false);
        return;
      }

      const typedDoc = doc as unknown as DocumentType;
      setDocument(typedDoc);

      const { data: urlData } = await supabase.storage
        .from('documents')
        .createSignedUrl(typedDoc.file_path, 3600);

      if (urlData) setPdfUrl(urlData.signedUrl);

      await supabase
        .from('documents')
        .update({ last_viewed_at: new Date().toISOString() } as never)
        .eq('id', documentId);

      setIsLoading(false);
    };

    loadDocument();
  }, [documentId]);

  const handleAddToChat = (context: ChatContext) => {
    setSelectedContext(context);
    setSidebarOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!document || !pdfUrl) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p className="text-muted-foreground">Document not found</p>
        <Link href="/library">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Library
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Document header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-background flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/library">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="font-medium truncate" title={document.title}>
            {document.title}
          </h1>
        </div>
        {!sidebarOpen && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSidebarOpen(true)}
            className="gap-2"
          >
            <MessageSquare className="h-4 w-4" />
            Open Chat
          </Button>
        )}
      </div>

      {/* Resizable panels */}
      <PanelGroup direction="horizontal" className="flex-1 min-h-0">
        {/* PDF panel */}
        <Panel defaultSize={65} minSize={30}>
          <div className="h-full min-w-0">
            <PdfViewer
              url={pdfUrl}
              documentId={documentId}
              onAddToChat={handleAddToChat}
              onPdfTextExtracted={setPdfText}
            />
          </div>
        </Panel>

        {/* Drag handle + AI sidebar */}
        {sidebarOpen && (
          <>
            <PanelResizeHandle className="group relative flex items-center justify-center w-1.5 bg-border hover:bg-primary/40 transition-colors cursor-col-resize">
              <GripVertical className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </PanelResizeHandle>

            <Panel defaultSize={35} minSize={20} maxSize={60}>
              <div className="h-full overflow-hidden">
                <AiSidebar
                  documentId={documentId}
                  selectedContext={selectedContext}
                  onClearContext={() => setSelectedContext(null)}
                  onClose={() => setSidebarOpen(false)}
                  pdfText={pdfText}
                />
              </div>
            </Panel>
          </>
        )}
      </PanelGroup>
    </div>
  );
}
