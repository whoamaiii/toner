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
        className="flex items-center justify-center space-x-2 p-6 bg-gray-900/50 border-gray-800 rounded-xl hover:bg-gray-800 hover:border-blue-500/50 transition-all duration-200 h-auto group"
        onClick={() => handleAction('Find Toner')}
      >
        <Image className="h-5 w-5 text-blue-400 group-hover:text-blue-300" />
        <span className="text-gray-300 font-medium group-hover:text-white">Find Toner</span>
      </Button>
      
      <Button
        variant="outline"
        className="flex items-center justify-center space-x-2 p-6 bg-gray-900/50 border-gray-800 rounded-xl hover:bg-gray-800 hover:border-cyan-500/50 transition-all duration-200 h-auto group"
        onClick={() => handleAction('Compare Prices')}
      >
        <Edit className="h-5 w-5 text-cyan-400 group-hover:text-cyan-300" />
        <span className="text-gray-300 font-medium group-hover:text-white">Compare Prices</span>
      </Button>
      
      <Button
        variant="outline"
        className="flex items-center justify-center space-x-2 p-6 bg-gray-900/50 border-gray-800 rounded-xl hover:bg-gray-800 hover:border-green-500/50 transition-all duration-200 h-auto group"
        onClick={() => handleAction('Printer Guide')}
      >
        <Newspaper className="h-5 w-5 text-green-400 group-hover:text-green-300" />
        <span className="text-gray-300 font-medium group-hover:text-white">Printer Guide</span>
      </Button>
      
      <Button
        variant="outline"
        className="flex items-center justify-center space-x-2 p-6 bg-gray-900/50 border-gray-800 rounded-xl hover:bg-gray-800 hover:border-purple-500/50 transition-all duration-200 h-auto group"
        onClick={() => handleAction('Support')}
      >
        <Users className="h-5 w-5 text-purple-400 group-hover:text-purple-300" />
        <span className="text-gray-300 font-medium group-hover:text-white">Support</span>
        <ChevronDown className="h-3 w-3 text-gray-500" />
      </Button>
    </div>
  );
}
