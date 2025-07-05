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
            <div className="flex flex-col items-center mb-8">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-pink-600 rounded-3xl blur-2xl opacity-30 animate-pulse"></div>
                <div className="relative w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl flex items-center justify-center shadow-2xl">
                  <Zap className="h-10 w-10 text-white" />
                </div>
              </div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent mb-8 animate-gradient">
                TonerWeb AI
              </h1>

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
