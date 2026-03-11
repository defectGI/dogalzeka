'use client';

import { useEffect } from 'react';
import { Plus, MessageSquare, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useChatStore } from '@/stores/chat-store';
import { useAuthStore } from '@/stores/auth-store';
import {
  getConversations,
  createConversation,
  deleteConversation,
  getMessages,
} from '@/lib/api/conversations';
import { Message } from '@/stores/chat-store';

export function ChatSidebar() {
  const { token } = useAuthStore();
  const {
    conversations,
    activeConversationId,
    setConversations,
    addConversation,
    removeConversation,
    setActiveConversation,
    setMessages,
    resetChat,
  } = useChatStore();

  useEffect(() => {
    if (!token) return;
    getConversations(token)
      .then((data) => setConversations(data.conversations))
      .catch(console.error);
  }, [token, setConversations]);

  const handleNew = async () => {
    if (!token) return;
    try {
      const data = await createConversation(token);
      addConversation(data.conversation);
      setActiveConversation(data.conversation.id);
      setMessages([]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelect = async (id: number) => {
    if (!token || id === activeConversationId) return;
    setActiveConversation(id);
    try {
      const data = await getMessages(token, id);
      const messages: Message[] = data.messages.map((m: any) => ({
        id: String(m.id),
        role: m.role,
        content: m.content,
        createdAt: new Date(m.created_at),
      }));
      setMessages(messages);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (!token) return;
    try {
      await deleteConversation(token, id);
      removeConversation(id);
      if (activeConversationId === id) resetChat();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <aside className="w-64 flex-shrink-0 border-r border-sidebar-border bg-sidebar flex flex-col">
      <div className="p-3">
        <Button onClick={handleNew} className="w-full gap-2" variant="outline" size="sm">
          <Plus className="h-4 w-4" />
          Yeni Sohbet
        </Button>
      </div>

      <Separator />

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {conversations.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4 px-2">
              Henüz sohbet yok. Yeni bir sohbet başlat!
            </p>
          )}
          {conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => handleSelect(conv.id)}
              className={cn(
                'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors group',
                activeConversationId === conv.id
                  ? 'bg-accent text-accent-foreground'
                  : 'hover:bg-accent/50 text-sidebar-foreground'
              )}
            >
              <MessageSquare className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
              <span className="flex-1 truncate text-xs">{conv.title}</span>
              <button
                onClick={(e) => handleDelete(e, conv.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:text-destructive"
                aria-label="Sil"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </button>
          ))}
        </div>
      </ScrollArea>
    </aside>
  );
}
