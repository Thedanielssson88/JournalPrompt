import { type JournalEntry } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Hash, Users, MapPin, Calendar } from "lucide-react";

interface JournalEntryCardProps {
  entry: JournalEntry & { photos?: any[] };
}

export default function JournalEntryCard({ entry }: JournalEntryCardProps) {
  const entryDate = new Date(entry.date);
  const month = entryDate.toLocaleDateString('sv-SE', { month: 'short' });
  const day = entryDate.getDate();

  return (
    <div className="bg-dark-card rounded-2xl p-4 mb-4" data-testid={`card-journal-${entry.id}`}>
      {/* Entry header with date and mood */}
      <div className="flex items-baseline mb-3">
        <span className="text-sm text-dark-text-muted mr-1" data-testid="text-month">{month}.</span>
        <span className="text-2xl font-medium text-accent-blue mr-3" data-testid="text-day">{day}</span>
        <h3 className="text-lg text-white flex-1" data-testid="text-entry-title">{entry.title}</h3>
        {entry.mood && (
          <span className="text-2xl ml-2" title={`Humör: ${entry.mood.value}/5`}>
            {entry.mood.emoji}
          </span>
        )}
      </div>

      {/* Content preview */}
      {entry.content && (
        <p className="text-dark-text-muted text-sm mb-3 line-clamp-2">
          {entry.content}
        </p>
      )}

      {/* Photo grid - Updated to handle new photo structure */}
      {entry.photos && entry.photos.length > 0 && (
        <div className="grid grid-cols-2 gap-2 rounded-xl overflow-hidden mb-3">
          {entry.photos.length >= 3 && (
            <>
              {/* Large photo on left */}
              <img 
                src={entry.photos[0].thumbnailUrl || entry.photos[0].baseUrl || entry.photos[0]} 
                alt="Journal entry photo" 
                className="col-span-1 row-span-2 w-full h-full object-cover aspect-square"
                data-testid={`img-entry-photo-0-${entry.id}`}
              />
              
              {/* Top right photo */}
              <img 
                src={entry.photos[1].thumbnailUrl || entry.photos[1].baseUrl || entry.photos[1]} 
                alt="Journal entry photo" 
                className="w-full h-full object-cover"
                data-testid={`img-entry-photo-1-${entry.id}`}
              />
              
              {/* Bottom right photo with overlay for more photos */}
              <div className="relative">
                <img 
                  src={entry.photos[2].thumbnailUrl || entry.photos[2].baseUrl || entry.photos[2]} 
                  alt="Journal entry photo" 
                  className="w-full h-full object-cover"
                  data-testid={`img-entry-photo-2-${entry.id}`}
                />
                {entry.photos.length > 3 && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="text-white text-lg font-medium">
                      +{entry.photos.length - 3}
                    </span>
                  </div>
                )}
              </div>
            </>
          )}
          
          {entry.photos.length === 2 && (
            <>
              <img 
                src={entry.photos[0].thumbnailUrl || entry.photos[0].baseUrl || entry.photos[0]} 
                alt="Journal entry photo" 
                className="w-full h-full object-cover"
                data-testid={`img-entry-photo-0-${entry.id}`}
              />
              <img 
                src={entry.photos[1].thumbnailUrl || entry.photos[1].baseUrl || entry.photos[1]} 
                alt="Journal entry photo" 
                className="w-full h-full object-cover"
                data-testid={`img-entry-photo-1-${entry.id}`}
              />
            </>
          )}
          
          {entry.photos.length === 1 && (
            <img 
              src={entry.photos[0].thumbnailUrl || entry.photos[0].baseUrl || entry.photos[0]} 
              alt="Journal entry photo" 
              className="col-span-2 w-full h-48 object-cover"
              data-testid={`img-entry-photo-0-${entry.id}`}
            />
          )}
        </div>
      )}

      {/* Metadata badges */}
      <div className="flex flex-wrap gap-2 text-xs">
        {entry.category && entry.category !== 'general' && (
          <Badge variant="secondary" className="bg-dark-primary/50">
            <Hash className="h-3 w-3 mr-1" />
            {entry.category}
          </Badge>
        )}
        
        {entry.tags && entry.tags.length > 0 && (
          <>
            {entry.tags.slice(0, 2).map((tag, i) => (
              <Badge key={i} variant="outline" className="text-dark-text-muted">
                #{tag}
              </Badge>
            ))}
            {entry.tags.length > 2 && (
              <Badge variant="outline" className="text-dark-text-muted">
                +{entry.tags.length - 2}
              </Badge>
            )}
          </>
        )}
        
        {entry.people && entry.people.length > 0 && (
          <Badge variant="secondary" className="bg-dark-primary/50">
            <Users className="h-3 w-3 mr-1" />
            {entry.people.map(p => p.name).join(", ")}
          </Badge>
        )}
        
        {entry.location && (
          <Badge variant="secondary" className="bg-dark-primary/50">
            <MapPin className="h-3 w-3 mr-1" />
            {entry.location.name}
          </Badge>
        )}
      </div>
    </div>
  );
}