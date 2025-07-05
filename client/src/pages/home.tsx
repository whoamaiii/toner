import { useState } from 'react';
import Sidebar from '@/components/sidebar';
import Header from '@/components/header';
import ChatInterface from '@/components/chat-interface';
import { Message, ChatState } from '@/types/chat';

export default function Home() {
  const [chatState, setChatState] = useState<ChatState>({
    messages: [],
    isTyping: false,
    searchMode: 'DeepSearch',
    selectedModel: 'o3-mini'
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
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <ChatInterface 
          chatState={chatState}
          updateChatState={updateChatState}
          addMessage={addMessage}
        />
      </div>
    </div>
  );
}
