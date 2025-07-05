import { Zap } from 'lucide-react';

export default function TypingIndicator() {
  return (
    <div className="mt-4">
      <div className="flex items-center space-x-4 p-4 grok-surface rounded-xl border grok-border">
        <div className="w-8 h-8 grok-accent rounded-full flex items-center justify-center">
          <Zap className="h-4 w-4 text-white" />
        </div>
        <div className="flex items-center space-x-2">
          <span className="grok-text-secondary">TonerWeb AI is thinking</span>
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse-dots"></div>
            <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse-dots"></div>
            <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse-dots"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
