'use client';

import { useState, useEffect, useRef } from 'react';
import { ChatHeader } from './chat-header';
import { ChatMessages } from './chat-messages';
import { ChatInput } from './chat-input';
import { ContextBadge } from './context-badge';
import { useChatStream } from '@/hooks/use-chat-stream';
import { X, MessageSquare, PanelRightClose } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { ChatContext, ModelProvider } from '@/types';

interface AiSidebarProps {
  documentId: string;
  selectedContext: ChatContext | null;
  onClearContext: () => void;
  onClose: () => void;
}

export function AiSidebar({
  documentId,
  selectedContext,
  onClearContext,
  onClose,
}: AiSidebarProps) {
  const [modelProvider, setModelProvider] = useState<ModelProvider>('openai');
  const [modelName, setModelName] = useState('gpt-4o');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    sendMessage,
    isLoading,
    error,
  } = useChatStream({
    documentId,
    modelProvider,
    modelName,
  });

  const handleSendMessage = async (content: string) => {
    await sendMessage(content, selectedContext || undefined);
    onClearContext();
  };

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col h-full bg-background border-l border-border">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">AI Assistant</h2>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <PanelRightClose className="h-5 w-5" />
        </Button>
      </div>

      {/* Model selector */}
      <ChatHeader
        modelProvider={modelProvider}
        modelName={modelName}
        onModelChange={(provider, name) => {
          setModelProvider(provider);
          setModelName(name);
        }}
      />

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
            <MessageSquare className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-sm">
              Select text or capture a screenshot to ask questions about this document
            </p>
          </div>
        ) : (
          <>
            <ChatMessages messages={messages} isLoading={isLoading} />
            <div ref={messagesEndRef} />
          </>
        )}
      </ScrollArea>

      {/* Error display */}
      {error && (
        <div className="mx-4 mb-2 p-3 text-sm text-destructive bg-destructive/10 rounded-md">
          {error}
        </div>
      )}

      {/* Context badge */}
      {selectedContext && (
        <ContextBadge
          text={selectedContext.text}
          hasScreenshot={!!selectedContext.screenshot}
          pageNumber={selectedContext.pageNumber}
          onClear={onClearContext}
        />
      )}

      {/* Input */}
      <ChatInput
        onSend={handleSendMessage}
        disabled={isLoading}
        placeholder={
          selectedContext
            ? 'Ask about the selected content...'
            : 'Ask a question about this document...'
        }
      />
    </div>
  );
}
