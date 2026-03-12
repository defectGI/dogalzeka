'use client';

import { useCallback, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Info } from 'lucide-react';
import { ChatSidebar } from '@/components/chat/ChatSidebar';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { ChatInput } from '@/components/chat/ChatInput';
import { useAuthStore } from '@/stores/auth-store';
import { useAuthModalStore } from '@/stores/auth-modal-store';
import { useChatStore } from '@/stores/chat-store';
import { sendMessage } from '@/lib/api/chat';
import { createConversation } from '@/lib/api/conversations';

const SESSION_KEY = 'guest_session_id';

function getOrCreateSessionId(): string {
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = uuidv4();
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export default function ChatPage() {
  const { user, token } = useAuthStore();
  const { openLogin } = useAuthModalStore();
  const {
    activeConversationId,
    setActiveConversation,
    addConversation,
    addMessage,
    appendToLastMessage,
    setIsStreaming,
    isStreaming,
  } = useChatStore();

  const sessionIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!user) {
      sessionIdRef.current = getOrCreateSessionId();
    }
  }, [user]);

  const handleSend = useCallback(
    async (message: string) => {
      if (isStreaming) return;

      addMessage({ id: uuidv4(), role: 'user', content: message, createdAt: new Date() });

      const assistantMsgId = uuidv4();
      addMessage({ id: assistantMsgId, role: 'assistant', content: '', createdAt: new Date() });

      setIsStreaming(true);

      let convId = activeConversationId;

      if (user && token && !convId) {
        try {
          const data = await createConversation(token, message.slice(0, 60));
          addConversation(data.conversation);
          setActiveConversation(data.conversation.id);
          convId = data.conversation.id;
        } catch {
          // conversation oluşturulamazsa devam et
        }
      }

      try {
        const sessionId = !user ? (sessionIdRef.current ?? undefined) : undefined;
        const result = await sendMessage(message, convId, token, sessionId);
        appendToLastMessage(result.response);

        // Misafir için backend'den dönen conversationId'yi sakla
        if (!user && result.conversationId && !activeConversationId) {
          setActiveConversation(result.conversationId);
        }
      } catch (err: any) {
        appendToLastMessage(`[Hata: ${err.message}]`);
      } finally {
        setIsStreaming(false);
      }
    },
    [
      isStreaming,
      activeConversationId,
      user,
      token,
      addMessage,
      appendToLastMessage,
      setIsStreaming,
      addConversation,
      setActiveConversation,
    ]
  );

  return (
    <div className="flex flex-1 overflow-hidden">
      {user && <ChatSidebar />}
      <div className="flex flex-col flex-1 overflow-hidden">
        {!user && (
          <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 border-b border-primary/20 text-sm text-primary">
            <Info className="h-4 w-4 flex-shrink-0" />
            <span>
              Oturum boyunca sohbet hafızada tutulur. Kalıcı geçmiş için{' '}
              <button onClick={openLogin} className="underline font-medium hover:text-primary/80">
                giriş yap
              </button>
              .
            </span>
          </div>
        )}
        <ChatWindow />
        <ChatInput onSend={handleSend} disabled={isStreaming} />
      </div>
    </div>
  );
}
