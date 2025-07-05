import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Menu, Search, History, Settings, HelpCircle, User } from 'lucide-react';

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
    <div className="w-16 grok-surface border-r grok-border flex flex-col items-center py-4 space-y-4">
      {sidebarItems.map((item, index) => (
        <Tooltip key={index}>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="p-3 hover:grok-input grok-text-secondary hover:grok-text transition-colors duration-150"
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
