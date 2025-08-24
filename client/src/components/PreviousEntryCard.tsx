import { type JournalEntry } from "@shared/schema";
import { FileText, Heart, Camera, Music, Users, MapPin } from "lucide-react";
import { MoreHorizontal } from "lucide-react";

interface PreviousEntryCardProps {
  entry: JournalEntry;
}

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'sport':
      return <div className="w-16 h-16 bg-green-500 rounded-xl flex items-center justify-center">
        <Heart className="text-white" size={20} />
      </div>;
    case 'musik':
      return <div className="w-16 h-16 bg-accent-blue rounded-xl flex items-center justify-center">
        <FileText className="text-white" size={20} />
      </div>;
    case 'familj':
      return <div className="w-16 h-16 bg-green-500 rounded-xl flex items-center justify-center">
        <Heart className="text-white" size={20} />
      </div>;
    case 'utflykt':
      return <div className="w-16 h-16 bg-purple-500 rounded-xl flex items-center justify-center">
        <Camera className="text-white" size={20} />
      </div>;
    default:
      return <div className="w-16 h-16 bg-accent-blue rounded-xl flex items-center justify-center">
        <FileText className="text-white" size={20} />
      </div>;
  }
};

export default function PreviousEntryCard({ entry }: PreviousEntryCardProps) {
  const entryDate = new Date(entry.date);
  const formattedDate = entryDate.toLocaleDateString('sv-SE', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });

  return (
    <div className="bg-dark-card rounded-2xl p-4 flex items-center space-x-4" data-testid={`card-previous-${entry.id}`}>
      {/* Entry icon/thumbnail */}
      {getCategoryIcon(entry.category || 'general')}
      
      {/* Entry details */}
      <div className="flex-1">
        <p className="text-sm text-dark-text-muted mb-1" data-testid="text-entry-date">{formattedDate}</p>
        <h3 className="text-white font-medium" data-testid="text-entry-title">{entry.title}</h3>
      </div>
      
      {/* More options */}
      <button className="p-2" data-testid="button-more-options">
        <MoreHorizontal className="text-dark-text-muted" size={20} />
      </button>
    </div>
  );
}
