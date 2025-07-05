import { Button } from '@/components/ui/button';
import { ThumbsUp, ThumbsDown, Copy, Share2, Zap } from 'lucide-react';
import { Message } from '@/types/chat';
import { useToast } from '@/hooks/use-toast';

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
        <div key={message.id} className="flex items-start space-x-4 p-4 grok-surface rounded-xl border grok-border">
          <div className="w-8 h-8 grok-accent rounded-full flex items-center justify-center flex-shrink-0">
            {message.role === 'assistant' ? (
              <Zap className="h-4 w-4 text-white" />
            ) : (
              <div className="w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center">
                <span className="text-xs text-white font-medium">U</span>
              </div>
            )}
          </div>
          <div className="flex-1">
            <div className="grok-text whitespace-pre-wrap">
              {message.content}
            </div>
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
