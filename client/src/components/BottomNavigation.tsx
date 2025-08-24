import { Grid3X3, TrendingUp } from "lucide-react";

interface BottomNavigationProps {
  activeTab: 'notes' | 'insights';
  onTabChange: (tab: 'notes' | 'insights') => void;
}

export default function BottomNavigation({ activeTab, onTabChange }: BottomNavigationProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-dark-secondary border-t border-gray-700">
      {/* Navigation tabs */}
      <div className="flex">
        {/* Anteckningar tab (active) */}
        <button 
          className={`flex-1 flex flex-col items-center py-3 transition-colors ${
            activeTab === 'notes' ? 'text-accent-blue' : 'text-dark-text-muted hover:text-white'
          }`}
          onClick={() => onTabChange('notes')}
          data-testid="button-tab-anteckningar"
        >
          <Grid3X3 className="text-lg mb-1" />
          <span className="text-xs font-medium">Anteckningar</span>
        </button>
        
        {/* Insikter tab */}
        <button 
          className={`flex-1 flex flex-col items-center py-3 transition-colors ${
            activeTab === 'insights' ? 'text-accent-blue' : 'text-dark-text-muted hover:text-white'
          }`}
          onClick={() => onTabChange('insights')}
          data-testid="button-tab-insikter"
        >
          <TrendingUp className="text-lg mb-1" />
          <span className="text-xs">Insikter</span>
        </button>
      </div>
      
      {/* Home indicator */}
      <div className="flex justify-center pb-1">
        <div className="w-32 h-1 bg-white rounded-full"></div>
      </div>
    </nav>
  );
}
