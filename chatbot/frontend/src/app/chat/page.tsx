'use client';

import { useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Info } from 'lucide-react';
import { ChatSidebar } from '@/components/chat/ChatSidebar';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { ChatInput } from '@/components/chat/ChatInput';
import { useAuthStore } from '@/stores/auth-store';
import { useAuthModalStore } from '@/stores/auth-modal-store';
import { useChatStore } from '@/stores/chat-store';
import { streamMessage } from '@/lib/api/chat';
import { createConversation } from '@/lib/api/conversations';

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

  const handleSend = useCallback(
    async (message: string) => {
      if (isStreaming) return;

      // Add user message
      addMessage({
        id: uuidv4(),
        role: 'user',
        content: message,
        createdAt: new Date(),
      });

      // Add placeholder assistant message
      const assistantId = uuidv4();
      addMessage({
        id: assistantId,
        role: 'assistant',
        content: '',
        createdAt: new Date(),
      });

      setIsStreaming(true);

      let convId = activeConversationId;

      // If logged in and no conversation, create one
      if (user && token && !convId) {
        try {
          const data = await createConversation(token, message.slice(0, 60));
          addConversation(data.conversation);
          setActiveConversation(data.conversation.id);
          convId = data.conversation.id;
        } catch (err) {
          console.error('Failed to create conversation:', err);
        }
      }

      await streamMessage(
        message,
        convId,
        token,
        (delta) => appendToLastMessage(delta),
        () => setIsStreaming(false),
        (err) => {
          appendToLastMessage(`\n\n[Hata: ${err}]`);
          setIsStreaming(false);
        }
      );
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
      {/* Sidebar — only for logged in users */}
      {user && <ChatSidebar />}

      {/* Main chat area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Anonymous banner */}
        {!user && (
          <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 border-b border-primary/20 text-sm text-primary">
            <Info className="h-4 w-4 flex-shrink-0" />
            <span>
              Sohbet geçmişini kaydetmek için{' '}
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
