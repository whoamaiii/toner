import React, { useState } from 'react';
import ChatInterface from '@/components/chat-interface';
import { Message, ChatState } from '@/types/chat';

/**
 * Home page for the TonerWeb AI Assistant.
 *
 * Serves as the root view that hosts the `ChatInterface` component along with
 * chat state management helpers. All chat messages and typing indicators are
 * delegated to nested components so that this page remains lean.
 *
 * @component
 * @example
 * // Rendered by the React router at path "/"
 * <Home />
 */

const Home: React.FC = () => {
  const [chatState, setChatState] = useState<ChatState>({
    messages: [],
    isTyping: false
  });

  const updateChatState = (updates: Partial<ChatState>) => {
    setChatState(prev => ({ ...prev, ...updates }));
  };

  const addMessage = (message: Omit<Message, 'id' | 'timestamp'>) => {
    const newMessage: Message = {
      ...message,
      id: crypto.randomUUID(),
      timestamp: new Date()
    };
    
    setChatState(prev => ({
      ...prev,
      messages: [...prev.messages, newMessage]
    }));
  };

  return (
    <div className="flex min-h-screen grok-bg">
      <div className="flex-1 flex flex-col">
        <ChatInterface 
          chatState={chatState}
          updateChatState={updateChatState}
          addMessage={addMessage}
        />
      </div>
    </div>
  );
};

export default Home;
