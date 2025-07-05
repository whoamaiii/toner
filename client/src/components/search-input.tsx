import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Search } from 'lucide-react';
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
      const response = await aiService.sendMessage(query, 'DeepSearch');
      addMessage({
        content: response,
        role: 'assistant'
      });
    } catch (error) {
      addMessage({
        content: 'Beklager, jeg støtte på en feil under behandling av forespørselen din. Vennligst prøv igjen.',
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
      <div className="relative bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-2xl p-[1px]">
        <div className="bg-gray-900/80 backdrop-blur-sm rounded-2xl p-4 focus-within:shadow-xl focus-within:shadow-purple-500/20 transition-all duration-300">
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-purple-300 transition-colors">
              <Search className="h-5 w-5" />
            </Button>
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Søk etter Canon, HP, Epson skrivere eller tonerkassetter..."
              className="flex-1 bg-transparent text-white placeholder:text-gray-500 text-lg border-none focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            <Button 
              variant="ghost" 
              size="icon" 
              className={`transition-all duration-200 ${
                query.trim() 
                  ? 'text-purple-400 hover:text-purple-300 hover:bg-purple-500/10' 
                  : 'text-gray-500'
              }`}
              onClick={handleSubmit}
              disabled={!query.trim()}
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>


    </div>
  );
}
