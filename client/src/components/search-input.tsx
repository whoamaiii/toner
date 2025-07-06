import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Search, Image, X } from 'lucide-react';
import { Message, ChatState } from '@/types/chat';
import { aiService } from '@/services/ai-service';

interface SearchInputProps {
  chatState: ChatState;
  updateChatState: (updates: Partial<ChatState>) => void;
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
}

export default function SearchInput({ chatState, updateChatState, addMessage }: SearchInputProps) {
  const [query, setQuery] = useState('');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check if it's an image
    if (!file.type.startsWith('image/')) {
      alert('Vennligst velg en bildefil.');
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Bildet er for stort. Maksimal størrelse er 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64String = e.target?.result as string;
      setUploadedImage(base64String);
      setImagePreview(base64String);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setUploadedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async () => {
    if (!query.trim() && !uploadedImage) return;

    const userMessage = {
      content: uploadedImage 
        ? `${query.trim() || 'Analyser dette bildet og finn produkter'}` 
        : query,
      role: 'user' as const
    };

    addMessage(userMessage);
    setQuery('');
    
    // Clear image after sending
    const imageToSend = uploadedImage;
    setUploadedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    updateChatState({ isTyping: true });

    try {
      const response = await aiService.sendMessage(
        query.trim() || 'Identifiser dette produktet og finn det på tonerweb.no',
        'DeepSearch',
        imageToSend || undefined
      );
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
      {/* Image Preview */}
      {imagePreview && (
        <div className="mb-4 relative">
          <div className="relative bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-2xl p-[1px]">
            <div className="bg-gray-900/80 backdrop-blur-sm rounded-2xl p-4">
              <div className="flex items-center space-x-3">
                <img 
                  src={imagePreview} 
                  alt="Uploaded toner"
                  className="w-16 h-16 object-cover rounded-lg border border-gray-700"
                />
                <div className="flex-1">
                  <p className="text-white text-sm font-medium">Bilde lastet opp</p>
                  <p className="text-gray-400 text-xs">AI vil identifisere produkttype og finne på tonerweb.no</p>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={handleRemoveImage}
                  className="text-gray-400 hover:text-red-400 transition-colors"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

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
              placeholder={uploadedImage ? "Beskriv bildet eller la AI analysere det..." : "Last opp bilde av blekk/toner eller beskriv hva du leter etter..."}
              className="flex-1 bg-transparent text-white placeholder:text-gray-500 text-lg border-none focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            
            {/* Image Upload Button */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-gray-400 hover:text-purple-300 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Image className="h-5 w-5" />
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon" 
              className={`transition-all duration-200 ${
                query.trim() || uploadedImage
                  ? 'text-purple-400 hover:text-purple-300 hover:bg-purple-500/10' 
                  : 'text-gray-500'
              }`}
              onClick={handleSubmit}
              disabled={!query.trim() && !uploadedImage}
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
