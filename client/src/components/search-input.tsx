/**
 * Advanced search input component for the TonerWeb AI Assistant.
 * 
 * This component provides a comprehensive search interface with:
 * - Text input for product queries
 * - Image upload functionality for visual product identification
 * - Real-time image preview and management
 * - AI-powered search submission
 * - Responsive design with gradient styling
 * - File validation and error handling
 * 
 * The component integrates with both text-based and image-based AI services
 * to provide accurate product recommendations from tonerweb.no.
 * 
 * @author TonerWeb Team
 * @version 1.0.0
 */

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Search, Image, X } from 'lucide-react';
import { Message, ChatState } from '@/types/chat';
import { aiService } from '@/services/ai-service';

/**
 * Props interface for the SearchInput component.
 * 
 * @interface SearchInputProps
 * @property {ChatState} chatState - Current chat state including loading indicators
 * @property {Function} updateChatState - Function to update chat state
 * @property {Function} addMessage - Function to add new messages to the chat
 */
interface SearchInputProps {
  chatState: ChatState;
  updateChatState: (updates: Partial<ChatState>) => void;
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
}

/**
 * SearchInput component that provides text and image-based search capabilities.
 * 
 * This component handles:
 * - Text input for product queries
 * - Image upload with drag-and-drop support
 * - File validation (type and size)
 * - Image preview and removal
 * - AI service integration
 * - Error handling and user feedback
 * 
 * **Key Features:**
 * - Supports images up to 5MB
 * - Validates image file types
 * - Provides real-time preview
 * - Keyboard shortcuts (Enter to submit)
 * - Responsive design with gradient styling
 * - Integration with AI services for product identification
 * 
 * @param {SearchInputProps} props - Component props
 * @returns {JSX.Element} The search input interface
 * 
 * @example
 * <SearchInput
 *   chatState={chatState}
 *   updateChatState={updateChatState}
 *   addMessage={addMessage}
 * />
 */
export default function SearchInput({ chatState, updateChatState, addMessage }: SearchInputProps) {
  // State management for input and image handling
  const [query, setQuery] = useState('');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Handles image file upload and validation.
   * 
   * This function:
   * - Validates file type (must be an image)
   * - Checks file size (max 5MB)
   * - Converts file to base64 for API transmission
   * - Updates preview state for UI display
   * - Provides user feedback for validation errors
   * 
   * @param {React.ChangeEvent<HTMLInputElement>} event - File input change event
   * 
   * @example
   * // Automatically called when user selects a file
   * // Validates and processes the uploaded image
   */
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Vennligst velg en bildefil.');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Bildet er for stort. Maksimal størrelse er 5MB.');
      return;
    }

    // Convert file to base64 for API transmission
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64String = e.target?.result as string;
      setUploadedImage(base64String);
      setImagePreview(base64String);
    };
    reader.readAsDataURL(file);
  };

  /**
   * Removes the uploaded image and clears related state.
   * 
   * This function:
   * - Clears the uploaded image state
   * - Removes the image preview
   * - Resets the file input value
   * - Provides clean state for new uploads
   * 
   * @example
   * // Called when user clicks the X button on image preview
   * handleRemoveImage();
   */
  const handleRemoveImage = () => {
    setUploadedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  /**
   * Handles form submission for both text and image-based searches.
   * 
   * This function:
   * - Validates that there's either text or image input
   * - Creates appropriate user messages
   * - Sends requests to AI service
   * - Handles loading states and error scenarios
   * - Clears input after successful submission
   * 
   * **Process Flow:**
   * 1. Validate input (text or image required)
   * 2. Create user message and add to chat
   * 3. Clear input fields and set loading state
   * 4. Send request to AI service with appropriate mode
   * 5. Add AI response to chat
   * 6. Handle errors with user-friendly messages
   * 7. Clear loading state
   * 
   * @async
   * @returns {Promise<void>}
   * 
   * @example
   * // Automatically called when user clicks send or presses Enter
   * await handleSubmit();
   */
  const handleSubmit = async () => {
    if (!query.trim() && !uploadedImage) return;

    // Create user message with appropriate content
    const userMessage = {
      content: uploadedImage 
        ? `${query.trim() || 'Analyser dette bildet og finn produkter'}` 
        : query,
      role: 'user' as const
    };

    // Add user message to chat
    addMessage(userMessage);
    setQuery('');
    
    // Store image for API call and clear from state
    const imageToSend = uploadedImage;
    setUploadedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    // Set loading state
    updateChatState({ isTyping: true });

    try {
      // Send request to AI service
      const response = await aiService.sendMessage(
        query.trim() || 'Identifiser dette produktet og finn det på tonerweb.no',
        'DeepSearch',
        imageToSend || undefined
      );
      
      // Add AI response to chat
      addMessage({
        content: response,
        role: 'assistant'
      });
    } catch (error) {
      console.error('Search error:', error);
      
      // Try to get more specific error information
      let errorMessage = 'Beklager, jeg støtte på en feil under behandling av forespørselen din. Vennligst prøv igjen.';
      
      if (error instanceof Error) {
        // If it's a fetch error with more details, try to extract them
        if (error.message.includes('401')) {
          errorMessage = '🔑 **API-konfigurasjonsfeil**: Kan ikke koble til AI-tjenesten. Vennligst kontakt support.';
        } else if (error.message.includes('429')) {
          errorMessage = '⏱️ **For mange forespørsler**: Vennligst vent et øyeblikk før du prøver igjen.';
        } else if (error.message.includes('503')) {
          errorMessage = '🌐 **Tjenesten er ikke tilgjengelig**: Prøv igjen om litt.';
        }
      }
      
      addMessage({
        content: errorMessage,
        role: 'assistant'
      });
    } finally {
      // Clear loading state
      updateChatState({ isTyping: false });
    }
  };

  /**
   * Handles keyboard events for form submission.
   * 
   * Allows users to submit the form by pressing Enter (without Shift).
   * Shift+Enter can be used for line breaks in future text area implementations.
   * 
   * @param {React.KeyboardEvent} e - Keyboard event
   * 
   * @example
   * // Automatically called when user presses keys in the input
   * // Enter key submits the form
   */
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="relative">
      {/* Image Preview Section */}
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

      {/* Search Input Section */}
      <div className="relative bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-2xl p-[1px]">
        <div className="bg-gray-900/80 backdrop-blur-sm rounded-2xl p-4 focus-within:shadow-xl focus-within:shadow-purple-500/20 transition-all duration-300">
          <div className="flex items-center space-x-3">
            {/* Search Icon */}
            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-purple-300 transition-colors">
              <Search className="h-5 w-5" />
            </Button>
            
            {/* Text Input */}
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={uploadedImage ? "Beskriv bildet eller la AI analysere det..." : "Last opp bilde av blekk/toner eller beskriv hva du leter etter..."}
              className="flex-1 bg-transparent text-white placeholder:text-gray-500 text-lg border-none focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            
            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            
            {/* Image Upload Button */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-gray-400 hover:text-purple-300 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Image className="h-5 w-5" />
            </Button>
            
            {/* Submit Button */}
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
