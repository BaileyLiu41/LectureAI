'use client';

import { useState, useCallback } from 'react';
import type { ChatContext, ModelProvider } from '@/types';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  selectedText?: string;
  screenshot?: string;
  pageNumber?: number;
}

interface UseChatStreamOptions {
  documentId: string;
  modelProvider: ModelProvider;
  modelName: string;
}

export function useChatStream({
  documentId,
  modelProvider,
  modelName,
}: UseChatStreamOptions) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(
    async (content: string, context?: ChatContext) => {
      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: 'user',
        content,
        selectedText: context?.text,
        screenshot: context?.screenshot,
        pageNumber: context?.pageNumber,
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [...messages, userMessage].map((m) => ({
              role: m.role,
              content: m.content,
            })),
            model_provider: modelProvider,
            model_name: modelName,
            document_id: documentId,
            selected_text: context?.text,
            screenshot_base64: context?.screenshot?.replace(
              /^data:image\/\w+;base64,/,
              ''
            ),
            page_number: context?.pageNumber,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to send message');
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        const assistantMessage: Message = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: '',
        };

        setMessages((prev) => [...prev, assistantMessage]);

        if (reader) {
          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') continue;

                try {
                  const { text } = JSON.parse(data);
                  if (text) {
                    assistantMessage.content += text;
                    setMessages((prev) =>
                      prev.map((msg) =>
                        msg.id === assistantMessage.id
                          ? { ...msg, content: assistantMessage.content }
                          : msg
                      )
                    );
                  }
                } catch {
                  // Skip invalid JSON
                }
              }
            }
          }
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'An error occurred';
        setError(errorMessage);
        // Remove the empty assistant message if there was an error
        setMessages((prev) =>
          prev.filter((m) => m.role !== 'assistant' || m.content)
        );
      } finally {
        setIsLoading(false);
      }
    },
    [messages, documentId, modelProvider, modelName]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    sendMessage,
    clearMessages,
    isLoading,
    error,
  };
}
