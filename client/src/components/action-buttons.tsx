import React from 'react';
import { Button } from '@/components/ui/button';
import { Image, Edit, Newspaper, Users, ChevronDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

/**
 * Interface for example query objects.
 * 
 * @interface ExampleQuery
 * @property {string} query - The example query text
 * @property {React.ComponentType} icon - The icon component to display
 * @property {boolean} [isImageUpload] - Whether this query triggers image upload
 */
interface ExampleQuery {
  query: string;
  icon: React.ComponentType<any>;
  isImageUpload?: boolean;
}

export default function ActionButtons() {
  const { toast } = useToast();

  const exampleQueries: ExampleQuery[] = [
    { query: "Canon PIXMA MG3650S blekk", icon: Edit },
    { query: "HP LaserJet toner", icon: Newspaper },
    { query: "Epson EcoTank påfyll", icon: Users },
    { query: "Last opp tonerbilde for analyse", icon: Image, isImageUpload: true }
  ];

  const handleExampleQuery = (query: string, isImageUpload?: boolean) => {
    if (isImageUpload) {
      // Trigger the file input click
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) {
        fileInput.click();
      }
    } else {
      const searchInput = document.querySelector('input[placeholder*="Søk etter Canon"]') as HTMLInputElement;
      if (searchInput) {
        searchInput.value = query;
        searchInput.dispatchEvent(new Event('input', { bubbles: true }));
        searchInput.focus();
      }
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
            onClick={() => handleExampleQuery(example.query, example.isImageUpload)}
          >
            <example.icon className="h-5 w-5 text-purple-400 group-hover:text-purple-300" />
            <span className="text-gray-300 font-medium group-hover:text-white text-sm">{example.query}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}
