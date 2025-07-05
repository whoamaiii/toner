import { Button } from '@/components/ui/button';
import { Image, Edit, Newspaper, Users, ChevronDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ActionButtons() {
  const { toast } = useToast();

  const handleAction = (action: string) => {
    toast({
      title: `${action} Feature`,
      description: `The ${action.toLowerCase()} feature is coming soon!`,
    });
  };

  return (
    <div className="grid grid-cols-2 gap-4 mt-8">
      <Button
        variant="outline"
        className="flex items-center justify-center space-x-2 p-4 grok-surface border-grok-border rounded-xl hover:grok-input transition-colors duration-150 h-auto"
        onClick={() => handleAction('Create Images')}
      >
        <Image className="h-5 w-5 text-blue-500" />
        <span className="grok-text font-medium">Create Images</span>
      </Button>
      
      <Button
        variant="outline"
        className="flex items-center justify-center space-x-2 p-4 grok-surface border-grok-border rounded-xl hover:grok-input transition-colors duration-150 h-auto"
        onClick={() => handleAction('Edit Image')}
      >
        <Edit className="h-5 w-5 text-blue-500" />
        <span className="grok-text font-medium">Edit Image</span>
      </Button>
      
      <Button
        variant="outline"
        className="flex items-center justify-center space-x-2 p-4 grok-surface border-grok-border rounded-xl hover:grok-input transition-colors duration-150 h-auto"
        onClick={() => handleAction('Latest News')}
      >
        <Newspaper className="h-5 w-5 text-blue-500" />
        <span className="grok-text font-medium">Latest News</span>
      </Button>
      
      <Button
        variant="outline"
        className="flex items-center justify-center space-x-2 p-4 grok-surface border-grok-border rounded-xl hover:grok-input transition-colors duration-150 h-auto"
        onClick={() => handleAction('Personas')}
      >
        <Users className="h-5 w-5 text-blue-500" />
        <span className="grok-text font-medium">Personas</span>
        <ChevronDown className="h-3 w-3 grok-text-secondary" />
      </Button>
    </div>
  );
}
