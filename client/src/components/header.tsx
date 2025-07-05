import { Button } from '@/components/ui/button';
import { Zap, Lock } from 'lucide-react';

export default function Header() {
  return (
    <header className="border-b grok-border grok-surface">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 grok-accent rounded-full flex items-center justify-center">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="text-xl font-semibold grok-text">SuperGrok</span>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <Button 
            variant="outline" 
            size="sm"
            className="grok-input grok-text-secondary hover:grok-border border-grok-border"
          >
            <Lock className="h-3 w-3 mr-1" />
            Private
          </Button>
        </div>
      </div>
    </header>
  );
}
