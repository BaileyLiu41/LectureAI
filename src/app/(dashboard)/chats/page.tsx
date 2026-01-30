'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/layout';
import { createClient } from '@/lib/supabase/client';
import { MessageSquare, FileText, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import type { Chat, Document } from '@/types';

interface ChatWithDocument extends Chat {
  document?: Document;
}

export default function ChatsPage() {
  const [chats, setChats] = useState<ChatWithDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadChats = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('chats')
        .select(`
          *,
          document:documents(id, title)
        `)
        .order('updated_at', { ascending: false });

      if (data) {
        setChats(data as ChatWithDocument[]);
      }
      setIsLoading(false);
    };

    loadChats();
  }, []);

  return (
    <>
      <Header activeTab="chats" />
      <div className="flex-1 overflow-auto p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : chats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mb-4 opacity-50" />
            <p>No chats yet</p>
            <p className="text-sm">Open a document and start asking questions</p>
          </div>
        ) : (
          <div className="space-y-2 max-w-3xl mx-auto">
            {chats.map((chat) => (
              <Link
                key={chat.id}
                href={chat.document_id ? `/document/${chat.document_id}` : '#'}
                className="block p-4 bg-white rounded-lg border border-border hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-accent rounded-lg">
                    <MessageSquare className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{chat.title}</h3>
                    {chat.document && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <FileText className="h-3 w-3" />
                        {chat.document.title}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(chat.updated_at), { addSuffix: true })}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground capitalize">
                    {chat.model_provider}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
