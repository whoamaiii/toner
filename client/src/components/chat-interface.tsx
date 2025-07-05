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
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-blue-500/20">
                <Zap className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2">
                TonerWeb AI
              </h1>
              <p className="text-gray-400">Your intelligent printer supply assistant</p>
              <div className="flex items-center gap-2 mt-3">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                  <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
                  Gemini 2.5 Flash
                </span>
                <span className="text-xs text-gray-500">with tonerweb.no search</span>
              </div>
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
