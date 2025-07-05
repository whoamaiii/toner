import { Button } from '@/components/ui/button';
import { Image, Edit, Newspaper, Users, ChevronDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ActionButtons() {
  const { toast } = useToast();

  const exampleQueries = [
    { query: "Canon PIXMA MG3650S blekk", icon: Image },
    { query: "HP LaserJet toner", icon: Edit },
    { query: "Epson EcoTank påfyll", icon: Newspaper },
    { query: "Brother DCP-L2530DW toner", icon: Users }
  ];

  const handleExampleQuery = (query: string) => {
    const searchInput = document.querySelector('input[placeholder*="Search for Canon"]') as HTMLInputElement;
    if (searchInput) {
      searchInput.value = query;
      searchInput.dispatchEvent(new Event('input', { bubbles: true }));
      searchInput.focus();
    }
  };

  return (
    <div>
      <p className="text-center text-gray-400 text-sm mb-4">Prøv disse eksempelsøkene:</p>
      <div className="grid grid-cols-2 gap-4">
        {exampleQueries.map((example, index) => (
          <Button
            key={index}
            variant="outline"
            className="flex items-center justify-center space-x-2 p-6 bg-gray-900/50 border-gray-800 rounded-xl hover:bg-purple-500/10 hover:border-purple-500/50 transition-all duration-200 h-auto group"
            onClick={() => handleExampleQuery(example.query)}
          >
            <example.icon className="h-5 w-5 text-purple-400 group-hover:text-purple-300" />
            <span className="text-gray-300 font-medium group-hover:text-white text-sm">{example.query}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}
