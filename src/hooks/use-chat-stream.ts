'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { formatChunksAsContext } from '@/lib/rag';
import type { ChatContext, ModelProvider } from '@/types';

/** Extract a single page's text from the full PDF text blob. */
function extractPageContent(pdfText: string, pageNum: number): string {
  const startMarker = `--- Page ${pageNum} ---`;
  const endMarker = `--- Page ${pageNum + 1} ---`;
  const startIdx = pdfText.indexOf(startMarker);
  if (startIdx === -1) return '';
  const endIdx = pdfText.indexOf(endMarker);
  const raw = endIdx === -1 ? pdfText.slice(startIdx) : pdfText.slice(startIdx, endIdx);
  return raw.trim();
}

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  selectedText?: string;
  screenshot?: string;
  hasScreenshot?: boolean; // persisted flag: true if this message had a screenshot
  pageNumber?: number;
}

interface UseChatStreamOptions {
  documentId: string;
  modelProvider: ModelProvider;
  modelName: string;
  pdfText?: string; // Still needed to trigger indexing
}

export function useChatStream({
  documentId,
  modelProvider,
  modelName,
  pdfText,
}: UseChatStreamOptions) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chatId, setChatId] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isIndexing, setIsIndexing] = useState(false);
  const [isIndexed, setIsIndexed] = useState(false);
  const initRef = useRef(false);
  const indexingRef = useRef(false);
  const pdfTextRef = useRef<string | undefined>(pdfText);

  useEffect(() => {
    pdfTextRef.current = pdfText;
  }, [pdfText]);

  // Load existing chat and messages from Supabase on mount
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const loadExistingChat = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setIsInitialized(true);
        return;
      }

      // Check if document is already indexed
      const { data: existingChunks } = await supabase
        .from('document_chunks')
        .select('id')
        .eq('document_id', documentId)
        .limit(1);

      if (existingChunks && existingChunks.length > 0) {
        setIsIndexed(true);
      }

      // Find existing chat for this document
      const { data: existingChat } = await supabase
        .from('chats')
        .select('*')
        .eq('document_id', documentId)
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      if (existingChat) {
        const chat = existingChat as unknown as { id: string };
        setChatId(chat.id);

        // Load messages for this chat (excluding system messages with document context)
        const { data: existingMessages } = await supabase
          .from('messages')
          .select('*')
          .eq('chat_id', chat.id)
          .neq('role', 'system') // Don't load old full-PDF system messages
          .order('created_at', { ascending: true });

        if (existingMessages && existingMessages.length > 0) {
          const msgs = existingMessages as unknown as Array<{
            id: string;
            role: string;
            content: string;
            selected_text: string | null;
            screenshot_path: string | null;
            page_number: number | null;
          }>;
          const loadedMessages: Message[] = msgs.map((msg) => ({
            id: msg.id,
            role: msg.role as 'user' | 'assistant' | 'system',
            content: msg.content,
            selectedText: msg.selected_text || undefined,
            hasScreenshot: !!msg.screenshot_path,
            pageNumber: msg.page_number || undefined,
          }));
          setMessages(loadedMessages);
        }
      }

      setIsInitialized(true);
    };

    loadExistingChat();
  }, [documentId]);

  // Index document when PDF text becomes available
  useEffect(() => {
    if (!pdfText || isIndexed || indexingRef.current) return;
    indexingRef.current = true;

    const indexDocument = async () => {
      setIsIndexing(true);
      try {
        const response = await fetch('/api/embeddings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            document_id: documentId,
            pdf_text: pdfText,
          }),
        });

        if (response.ok) {
          setIsIndexed(true);
        } else {
          const data = await response.json();
          console.error('Indexing error:', data.error);
        }
      } catch (err) {
        console.error('Failed to index document:', err);
      } finally {
        setIsIndexing(false);
      }
    };

    indexDocument();
  }, [pdfText, documentId, isIndexed]);

  // Helper function to create a chat if it doesn't exist
  const ensureChatExists = async (): Promise<string | null> => {
    if (chatId) return chatId;

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: newChat, error: chatError } = await supabase
      .from('chats')
      .insert({
        user_id: user.id,
        document_id: documentId,
        title: 'New Chat',
        model_provider: modelProvider,
        model_name: modelName,
      } as never)
      .select()
      .single();

    if (chatError || !newChat) {
      console.error('Error creating chat:', chatError);
      return null;
    }

    const chat = newChat as unknown as { id: string };
    setChatId(chat.id);
    return chat.id;
  };

  // Helper function to save a message to Supabase
  const saveMessage = async (
    currentChatId: string,
    message: Message
  ): Promise<void> => {
    const supabase = createClient();

    const { error: msgError } = await supabase.from('messages').insert({
      id: message.id,
      chat_id: currentChatId,
      role: message.role,
      content: message.content,
      selected_text: message.selectedText || null,
      screenshot_path: message.hasScreenshot ? 'captured' : null,
      page_number: message.pageNumber || null,
    } as never);

    if (msgError) {
      console.error('Error saving message:', msgError);
    }

    // Update chat's updated_at timestamp
    await supabase
      .from('chats')
      .update({ updated_at: new Date().toISOString() } as never)
      .eq('id', currentChatId);
  };

  // Retrieve relevant chunks for a query
  const retrieveContext = async (query: string): Promise<string> => {
    try {
      // Extract explicit slide/page number from the query so the retrieval
      // can supplement vector search with a direct page lookup.
      const pageMatch = query.match(/(?:slide|page)\s*#?\s*(\d+)/i);
      const mentionedPage = pageMatch ? parseInt(pageMatch[1], 10) : undefined;

      const response = await fetch('/api/embeddings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document_id: documentId,
          query,
          match_count: 5,
          page_number: mentionedPage,
        }),
      });

      if (!response.ok) {
        console.error('Failed to retrieve context');
        return '';
      }

      const { chunks } = await response.json();
      return formatChunksAsContext(chunks || []);
    } catch (err) {
      console.error('Error retrieving context:', err);
      return '';
    }
  };

  const sendMessage = useCallback(
    async (content: string, context?: ChatContext) => {
      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: 'user',
        content,
        selectedText: context?.text,
        screenshot: context?.screenshot,
        hasScreenshot: !!context?.screenshot,
        pageNumber: context?.pageNumber,
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);
      setError(null);

      try {
        // Ensure chat exists and get chat ID
        const currentChatId = await ensureChatExists();

        // Save user message to Supabase
        if (currentChatId) {
          await saveMessage(currentChatId, userMessage);
        }

        // Retrieve relevant document chunks for this query (RAG)
        let ragContext = '';
        if (isIndexed) {
          ragContext = await retrieveContext(content);
        }

        // Fallback: extract content directly from pdfText when RAG is unavailable
        // (first visit before indexing, indexing failed, or no OpenAI key for embeddings)
        if (!ragContext && pdfTextRef.current) {
          const pageMatch = content.match(/(?:slide|page)\s*#?\s*(\d+)/i);
          if (pageMatch) {
            const pageNum = parseInt(pageMatch[1], 10);
            const pageContent = extractPageContent(pdfTextRef.current, pageNum);
            if (pageContent) {
              ragContext = `--- RELEVANT DOCUMENT SECTIONS ---\n\n[Page ${pageNum}]:\n${pageContent}`;
            }
          } else {
            // For general queries use the first 6000 characters of the document
            const truncated = pdfTextRef.current.slice(0, 6000);
            ragContext = `--- DOCUMENT CONTENT (partial) ---\n\n${truncated}`;
          }
        }

        // Build messages array for API, re-injecting stored context for historical messages.
        const allMessages = [...messages, userMessage];

        // Token budget: keep recent messages within ~12,000 content chars,
        // always preserving at least the last 4 messages.
        const MAX_HISTORY_CHARS = 12000;
        const MIN_KEEP = 4;
        let charCount = 0;
        let historyStart = 0;
        for (let i = allMessages.length - 1; i >= 0; i--) {
          charCount += allMessages[i].content.length;
          if (charCount > MAX_HISTORY_CHARS && allMessages.length - i >= MIN_KEEP) {
            historyStart = i + 1;
            break;
          }
        }
        const trimmed = allMessages.slice(historyStart);

        const apiMessages = trimmed.map((m, idx) => {
          let content = m.content;
          // For historical user messages, re-append any stored context so the model
          // retains memory of what text/screenshot was being discussed.
          // The current (last) message's context is handled server-side.
          const isCurrentMessage = idx === trimmed.length - 1;
          if (!isCurrentMessage && m.role === 'user') {
            if (m.selectedText) {
              content += `\n\n[User selected this text from page ${m.pageNumber ?? 'unknown'}]: "${m.selectedText}"`;
            }
            if (m.screenshot || m.hasScreenshot) {
              content += `\n\n[User shared a screenshot from the document (page ${m.pageNumber ?? 'unknown'})]`;
            }
          }
          return { role: m.role, content };
        });

        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: apiMessages,
            model_provider: modelProvider,
            model_name: modelName,
            document_id: documentId,
            selected_text: context?.text,
            screenshot_base64: context?.screenshot?.replace(
              /^data:image\/\w+;base64,/,
              ''
            ),
            page_number: context?.pageNumber,
            rag_context: ragContext, // Send RAG context instead of full PDF
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

          // Save assistant message to Supabase after streaming completes
          if (currentChatId && assistantMessage.content) {
            await saveMessage(currentChatId, assistantMessage);
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
    [messages, documentId, modelProvider, modelName, chatId, isIndexed]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
    setChatId(null);
  }, []);

  return {
    messages,
    sendMessage,
    clearMessages,
    isLoading,
    error,
    isInitialized,
    isIndexing,
    isIndexed,
  };
}
