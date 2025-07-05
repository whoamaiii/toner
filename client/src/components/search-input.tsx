import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Paperclip, Send, Search, Brain, ChevronDown, ArrowUp } from 'lucide-react';
import { Message, ChatState } from '@/types/chat';
import { aiService } from '@/services/ai-service';

interface SearchInputProps {
  chatState: ChatState;
  updateChatState: (updates: Partial<ChatState>) => void;
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
}

export default function SearchInput({ chatState, updateChatState, addMessage }: SearchInputProps) {
  const [query, setQuery] = useState('');

  const handleSubmit = async () => {
    if (!query.trim()) return;

    const userMessage = {
      content: query,
      role: 'user' as const
    };

    addMessage(userMessage);
    setQuery('');
    updateChatState({ isTyping: true });

    try {
      const response = await aiService.sendMessage(query, chatState.searchMode);
      addMessage({
        content: response,
        role: 'assistant'
      });
    } catch (error) {
      addMessage({
        content: 'Sorry, I encountered an error while processing your request. Please try again.',
        role: 'assistant'
      });
    } finally {
      updateChatState({ isTyping: false });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="relative">
      <div className="relative bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-2xl p-[1px]">
        <div className="bg-gray-900 rounded-2xl p-4 focus-within:shadow-lg focus-within:shadow-blue-500/20 transition-all duration-300">
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-200 transition-colors">
              <Paperclip className="h-5 w-5" />
            </Button>
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about printers, toners, or compatible cartridges..."
              className="flex-1 bg-transparent text-white placeholder:text-gray-500 text-lg border-none focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-gray-400 hover:text-gray-200 transition-colors"
              onClick={handleSubmit}
              disabled={!query.trim()}
            >
              <Send className={`h-5 w-5 ${query.trim() ? 'text-blue-400' : ''}`} />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center space-x-2">
          <div className="flex grok-surface rounded-lg p-1">
            <Button
              variant={chatState.searchMode === 'DeepSearch' ? 'default' : 'ghost'}
              size="sm"
              className={`px-3 py-1 text-sm font-medium transition-colors duration-150 ${
                chatState.searchMode === 'DeepSearch' 
                  ? 'grok-input grok-text' 
                  : 'grok-text-secondary hover:grok-input'
              }`}
              onClick={() => updateChatState({ searchMode: 'DeepSearch' })}
            >
              <Search className="h-3 w-3 mr-1" />
              DeepSearch
            </Button>
            <Button
              variant={chatState.searchMode === 'Think' ? 'default' : 'ghost'}
              size="sm"
              className={`px-3 py-1 text-sm font-medium transition-colors duration-150 ${
                chatState.searchMode === 'Think' 
                  ? 'grok-input grok-text' 
                  : 'grok-text-secondary hover:grok-input'
              }`}
              onClick={() => updateChatState({ searchMode: 'Think' })}
            >
              <Brain className="h-3 w-3 mr-1" />
              Think
            </Button>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className="grok-text-secondary text-sm">{chatState.selectedModel}</span>
          <Button variant="ghost" size="icon" className="grok-text-secondary hover:grok-text">
            <ChevronDown className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="icon" className="grok-text-secondary hover:grok-text">
            <ArrowUp className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}
