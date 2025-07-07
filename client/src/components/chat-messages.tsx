/**
 * Chat messages display component for the TonerWeb AI Assistant.
 * 
 * This component handles the display and interaction with chat messages including:
 * - Message rendering with role-based styling
 * - Markdown support for formatted AI responses
 * - Interactive action buttons (like, dislike, copy, share)
 * - Responsive design with gradient styling
 * - Link handling for external URLs
 * - Toast notifications for user feedback
 * 
 * The component supports both user and assistant messages with distinct
 * visual styling and interactive features for assistant responses.
 * 
 * @author TonerWeb Team
 * @version 1.0.0
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { ThumbsUp, ThumbsDown, Copy, Share2, Zap } from 'lucide-react';
import { Message } from '@/types/chat';
import { useToast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/**
 * Props interface for the ChatMessages component.
 * 
 * @interface ChatMessagesProps
 * @property {Message[]} messages - Array of messages to display
 */
interface ChatMessagesProps {
  messages: Message[];
}

/**
 * ChatMessages component that displays a list of chat messages with interactive features.
 * 
 * This component provides:
 * - **Message Display**: Renders messages with role-based styling
 * - **Markdown Support**: Formatted AI responses with links, lists, and emphasis
 * - **Interactive Actions**: Like, dislike, copy, and share buttons for assistant messages
 * - **Responsive Design**: Adapts to different screen sizes
 * - **Toast Notifications**: User feedback for actions
 * 
 * **Message Types:**
 * - **User Messages**: Simple text display with purple accent
 * - **Assistant Messages**: Markdown-rendered content with action buttons
 * 
 * **Features:**
 * - Automatic link detection and external link handling
 * - Copy to clipboard functionality
 * - Feedback collection (like/dislike)
 * - Share functionality (planned)
 * - Proper markdown formatting (lists, emphasis, links)
 * 
 * @param {ChatMessagesProps} props - Component props
 * @returns {JSX.Element} The chat messages interface
 * 
 * @example
 * <ChatMessages messages={[
 *   { id: 1, content: 'Find Canon ink', role: 'user' },
 *   { id: 2, content: 'Found [Canon PG-540](https://tonerweb.no/...)', role: 'assistant' }
 * ]} />
 */
const ChatMessages: React.FC<ChatMessagesProps> = ({ messages }) => {
  const { toast } = useToast();

  /**
   * Handles user actions on messages (copy, like, dislike, share).
   * 
   * This function provides a centralized handler for all message actions:
   * - **Copy**: Copies message content to clipboard
   * - **Like/Dislike**: Placeholder for feedback collection
   * - **Share**: Placeholder for sharing functionality
   * 
   * @param {string} action - The action to perform ('copy', 'like', 'dislike', 'share')
   * @param {string} [content] - Optional content for copy action
   * 
   * @example
   * // Copy message content
   * handleAction('copy', 'Message content here');
   * 
   * // Like a message
   * handleAction('like');
   */
  const handleAction = (action: string, content?: string) => {
    if (action === 'copy' && content) {
      navigator.clipboard.writeText(content);
      toast({
        title: 'Copied to clipboard',
        description: 'Message content has been copied.',
      });
    } else {
      toast({
        title: `${action} action`,
        description: `${action} feature is coming soon!`,
      });
    }
  };

  return (
    <div className="space-y-4">
      {messages.map((message) => (
        <div key={message.id} className={`flex items-start space-x-4 p-6 rounded-xl ${
          message.role === 'assistant' 
            ? 'bg-gray-900/50 border border-gray-800' 
            : 'bg-purple-500/10 border border-purple-500/20'
        }`}>
          {/* Message Avatar */}
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
            message.role === 'assistant'
              ? 'bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg shadow-purple-500/20'
              : 'bg-purple-500/20'
          }`}>
            {message.role === 'assistant' ? (
              <Zap className="h-5 w-5 text-white" />
            ) : (
              <span className="text-sm text-purple-400 font-medium">U</span>
            )}
          </div>
          
          {/* Message Content */}
          <div className="flex-1">
            {message.role === 'assistant' ? (
              <div className="text-gray-200">
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}
                  components={{
                    /**
                     * Custom link component for external URLs.
                     * 
                     * Ensures all links open in new tabs for security and UX.
                     * 
                     * @param {Object} props - Link props
                     * @param {string} props.href - The link URL
                     * @param {React.ReactNode} props.children - Link content
                     * @returns {JSX.Element} Styled external link
                     */
                    a: ({ href, children }) => (
                      <a 
                        href={href} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-blue-400 hover:text-blue-300 underline transition-colors"
                      >
                        {children}
                      </a>
                    ),
                    /**
                     * Custom paragraph component with proper spacing.
                     * 
                     * @param {Object} props - Paragraph props
                     * @param {React.ReactNode} props.children - Paragraph content
                     * @returns {JSX.Element} Styled paragraph
                     */
                    p: ({ children }) => <p className="mb-3">{children}</p>,
                    /**
                     * Custom unordered list component.
                     * 
                     * @param {Object} props - List props
                     * @param {React.ReactNode} props.children - List content
                     * @returns {JSX.Element} Styled unordered list
                     */
                    ul: ({ children }) => <ul className="list-disc list-inside mb-3 space-y-1">{children}</ul>,
                    /**
                     * Custom ordered list component.
                     * 
                     * @param {Object} props - List props
                     * @param {React.ReactNode} props.children - List content
                     * @returns {JSX.Element} Styled ordered list
                     */
                    ol: ({ children }) => <ol className="list-decimal list-inside mb-3 space-y-1">{children}</ol>,
                    /**
                     * Custom list item component.
                     * 
                     * @param {Object} props - List item props
                     * @param {React.ReactNode} props.children - List item content
                     * @returns {JSX.Element} Styled list item
                     */
                    li: ({ children }) => <li className="ml-2">{children}</li>,
                    /**
                     * Custom strong/bold text component.
                     * 
                     * @param {Object} props - Strong text props
                     * @param {React.ReactNode} props.children - Strong text content
                     * @returns {JSX.Element} Styled strong text
                     */
                    strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
            ) : (
              <div className="text-gray-300 whitespace-pre-wrap">
                {message.content}
              </div>
            )}
            
            {/* Action Buttons for Assistant Messages */}
            {message.role === 'assistant' && (
              <div className="flex items-center space-x-4 mt-4">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="grok-text-secondary hover:grok-text"
                  onClick={() => handleAction('like')}
                >
                  <ThumbsUp className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="grok-text-secondary hover:grok-text"
                  onClick={() => handleAction('dislike')}
                >
                  <ThumbsDown className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="grok-text-secondary hover:grok-text"
                  onClick={() => handleAction('copy', message.content)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="grok-text-secondary hover:grok-text"
                  onClick={() => handleAction('share')}
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ChatMessages;
