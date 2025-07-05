import { Button } from '@/components/ui/button';
import { ThumbsUp, ThumbsDown, Copy, Share2, Zap } from 'lucide-react';
import { Message } from '@/types/chat';
import { useToast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ChatMessagesProps {
  messages: Message[];
}

export default function ChatMessages({ messages }: ChatMessagesProps) {
  const { toast } = useToast();

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
          <div className="flex-1">
            {message.role === 'assistant' ? (
              <div className="text-gray-200">
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}
                  components={{
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
                    p: ({ children }) => <p className="mb-3">{children}</p>,
                    ul: ({ children }) => <ul className="list-disc list-inside mb-3 space-y-1">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal list-inside mb-3 space-y-1">{children}</ol>,
                    li: ({ children }) => <li className="ml-2">{children}</li>,
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
}
