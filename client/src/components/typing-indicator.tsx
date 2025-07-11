import React from 'react';
import { Zap } from 'lucide-react';

/**
 * TypingIndicator component for the TonerWeb AI Assistant.
 *
 * Displays an animated status bar indicating that the AI assistant is currently
 * searching tonerweb.no or processing the user's request. The component is purely
 * presentational and does not maintain any local state.
 *
 * Visual Elements:
 * - Gradient lightning icon with pulse animation
 * - Descriptive text informing the user of ongoing search
 * - Three bouncing dots with staggered delays to mimic typing activity
 *
 * Tailwind CSS utilities are used for layout, animation, and color styles.
 *
 * @component
 * @example
 * <TypingIndicator />
 */

const TypingIndicator: React.FC = () => {
  return (
    <div className="mt-4">
      <div className="flex items-center space-x-4 p-6 bg-gray-900/50 rounded-xl border border-gray-800">
        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20 animate-pulse">
          <Zap className="h-5 w-5 text-white" />
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-gray-400">Søker på tonerweb.no etter produkter</span>
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;
