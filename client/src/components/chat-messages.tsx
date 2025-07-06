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

import { Button } from '@/components/ui/button';
import { ThumbsUp, ThumbsDown, Copy, Share2, Zap } from 'lucide-react';
import { Message } from '@/types/chat';
import { useToast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import React, { memo, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

/**
 * Props interface for the ChatMessages component.
 * 
 * @interface ChatMessagesProps
 * @property {Message[]} messages - Array of messages to display
 */
interface ChatMessagesProps {
  messages: Message[];
}

/*
 * Memoised row component so React only re-renders a message when its props
 * actually change. This is important when combined with virtualization.
 */
const MessageRow = memo(function MessageRow({ message, handleAction }: { message: Message; handleAction: (a: string, c?: string) => void }) {
  return (
    <div
      className={`flex items-start space-x-4 p-6 rounded-xl ${
        message.role === 'assistant'
          ? 'bg-gray-900/50 border border-gray-800'
          : 'bg-purple-500/10 border border-purple-500/20'
      }`}
    >
      {/* Avatar */}
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
          message.role === 'assistant'
            ? 'bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg shadow-purple-500/20'
            : 'bg-purple-500/20'
        }`}
      >
        {message.role === 'assistant' ? <Zap className="h-5 w-5 text-white" /> : <span className="text-sm text-purple-400 font-medium">U</span>}
      </div>

      {/* Content */}
      <div className="flex-1">
        {message.role === 'assistant' ? (
          <div className="text-gray-200">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                a: ({ href, children }: any) => (
                  <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline transition-colors">
                    {children}
                  </a>
                ),
                p: ({ children }: any) => <p className="mb-3">{children}</p>,
                ul: ({ children }: any) => <ul className="list-disc list-inside mb-3 space-y-1">{children}</ul>,
                ol: ({ children }: any) => <ol className="list-decimal list-inside mb-3 space-y-1">{children}</ol>,
                li: ({ children }: any) => <li className="ml-2">{children}</li>,
                strong: ({ children }: any) => <strong className="font-semibold text-white">{children}</strong>,
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        ) : (
          <div className="text-gray-300 whitespace-pre-wrap">{message.content}</div>
        )}

        {/* Actions for assistant messages */}
        {message.role === 'assistant' && (
          <div className="flex items-center space-x-4 mt-4">
            <Button variant="ghost" size="icon" className="grok-text-secondary hover:grok-text" onClick={() => handleAction('like')}>
              <ThumbsUp className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="grok-text-secondary hover:grok-text" onClick={() => handleAction('dislike')}>
              <ThumbsDown className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="grok-text-secondary hover:grok-text" onClick={() => handleAction('copy', message.content)}>
              <Copy className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="grok-text-secondary hover:grok-text" onClick={() => handleAction('share')}>
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
});

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
export default function ChatMessages({ messages }: ChatMessagesProps) {
  const { toast } = useToast();
  const parentRef = useRef<HTMLDivElement>(null);

  const handleAction = (action: string, content?: string) => {
    if (action === 'copy' && content) {
      navigator.clipboard.writeText(content);
      toast({ title: 'Copied to clipboard', description: 'Message content has been copied.' });
    } else {
      toast({ title: `${action} action`, description: `${action} feature is coming soon!` });
    }
  };

  // Virtualiser setup
  const rowVirtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 180, // average row height
    overscan: 5,
  });

  return (
    <div ref={parentRef} className="h-full overflow-y-auto">
      <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: 'relative' }}>
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const message = messages[virtualRow.index];
          return (
            <div key={message.id} style={{ position: 'absolute', top: 0, left: 0, width: '100%', transform: `translateY(${virtualRow.start}px)` }}>
              <MessageRow message={message} handleAction={handleAction} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
