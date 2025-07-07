import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Menu, Search, History, Settings, HelpCircle, User } from 'lucide-react';

/**
 * Sidebar component for the TonerWeb AI Assistant.
 *
 * Renders a collapsible vertical navigation bar that houses several shortcut
 * buttons such as search, history, settings, and help. Each button shows a
 * tooltip on hover. The component keeps a simple `isExpanded` piece of state
 * that could be leveraged for future width expansion or additional menu items.
 *
 * Icons are provided by lucide-react, UI primitives by shadcn/ui (Button,
 * Tooltip). Styling relies on Tailwind CSS classes.
 *
 * @component
 * @example
 * <Sidebar />
 */

export default function Sidebar() {
  const [isExpanded, setIsExpanded] = useState(false);

  const sidebarItems = [
    { icon: Menu, label: 'Menu', action: () => setIsExpanded(!isExpanded) },
    { icon: Search, label: 'Search', action: () => {} },
    { icon: History, label: 'History', action: () => {} },
    { icon: Settings, label: 'Settings', action: () => {} },
    { icon: HelpCircle, label: 'Help', action: () => {} },
    { icon: User, label: 'Profile', action: () => {} },
  ];

  return (
    <div className="w-16 bg-gray-900/50 border-r border-gray-800/50 flex flex-col items-center py-4 space-y-2">
      {sidebarItems.map((item, index) => (
        <Tooltip key={index}>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="p-3 text-gray-400 hover:text-white hover:bg-gray-800 transition-all duration-200"
              onClick={item.action}
            >
              <item.icon className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>{item.label}</p>
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}
