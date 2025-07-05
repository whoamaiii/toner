import { Button } from '@/components/ui/button';
import { Zap, Lock } from 'lucide-react';

export default function Header() {
  return (
    <header className="border-b border-gray-800/50 bg-gray-900/50 backdrop-blur-sm">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="text-xl font-semibold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                TonerWeb AI
              </span>
              <p className="text-xs text-gray-500">Perplexity-Powered Search</p>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            <span className="text-xs text-gray-400">Connected to tonerweb.no</span>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            className="bg-gray-800/50 text-gray-300 hover:bg-gray-700 hover:text-white border-gray-700"
          >
            <Lock className="h-3 w-3 mr-1" />
            Private
          </Button>
        </div>
      </div>
    </header>
  );
}
