import { Message, ChatState } from '@/types/chat';
import SearchInput from './search-input';
import ActionButtons from './action-buttons';
import ChatMessages from './chat-messages';
import TypingIndicator from './typing-indicator';
import { Zap } from 'lucide-react';

interface ChatInterfaceProps {
  chatState: ChatState;
  updateChatState: (updates: Partial<ChatState>) => void;
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
}

export default function ChatInterface({ chatState, updateChatState, addMessage }: ChatInterfaceProps) {
  const hasMessages = chatState.messages.length > 0;

  return (
    <main className="flex-1 flex flex-col items-center justify-center px-6 py-8">
      <div className="w-full max-w-2xl space-y-6">
        {!hasMessages && (
          <div className="text-center mb-12">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-12 h-12 grok-accent rounded-full flex items-center justify-center">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-3xl font-bold grok-text">SuperGrok</h1>
            </div>
          </div>
        )}

        <SearchInput 
          chatState={chatState}
          updateChatState={updateChatState}
          addMessage={addMessage}
        />

        {!hasMessages && (
          <ActionButtons />
        )}
      </div>

      {hasMessages && (
        <div className="w-full max-w-4xl mt-8">
          <ChatMessages messages={chatState.messages} />
          {chatState.isTyping && <TypingIndicator />}
        </div>
      )}
    </main>
  );
}
