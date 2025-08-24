import { type JournalEntry } from "@shared/schema";

interface JournalEntryCardProps {
  entry: JournalEntry;
}

export default function JournalEntryCard({ entry }: JournalEntryCardProps) {
  const entryDate = new Date(entry.date);
  const month = entryDate.toLocaleDateString('sv-SE', { month: 'short' });
  const day = entryDate.getDate();

  return (
    <div className="bg-dark-card rounded-2xl p-4 mb-4" data-testid={`card-journal-${entry.id}`}>
      {/* Entry header with date */}
      <div className="flex items-baseline mb-3">
        <span className="text-sm text-dark-text-muted mr-1" data-testid="text-month">{month}.</span>
        <span className="text-2xl font-medium text-accent-blue mr-3" data-testid="text-day">{day}</span>
        <h3 className="text-lg text-white" data-testid="text-entry-title">{entry.title}</h3>
      </div>

      {/* Photo grid */}
      {entry.photos && entry.photos.length > 0 && (
        <div className="grid grid-cols-2 gap-2 rounded-xl overflow-hidden">
          {entry.photos.length >= 3 && (
            <>
              {/* Large photo on left */}
              <img 
                src={entry.photos[0]} 
                alt="Journal entry photo" 
                className="col-span-1 row-span-2 w-full h-full object-cover aspect-square"
                data-testid={`img-entry-photo-0-${entry.id}`}
              />
              
              {/* Top right photo */}
              <img 
                src={entry.photos[1]} 
                alt="Journal entry photo" 
                className="w-full h-full object-cover"
                data-testid={`img-entry-photo-1-${entry.id}`}
              />
              
              {/* Bottom right photo */}
              <img 
                src={entry.photos[2]} 
                alt="Journal entry photo" 
                className="w-full h-full object-cover"
                data-testid={`img-entry-photo-2-${entry.id}`}
              />
            </>
          )}
          
          {entry.photos.length === 2 && (
            <>
              <img 
                src={entry.photos[0]} 
                alt="Journal entry photo" 
                className="w-full h-full object-cover"
                data-testid={`img-entry-photo-0-${entry.id}`}
              />
              <img 
                src={entry.photos[1]} 
                alt="Journal entry photo" 
                className="w-full h-full object-cover"
                data-testid={`img-entry-photo-1-${entry.id}`}
              />
            </>
          )}
          
          {entry.photos.length === 1 && (
            <img 
              src={entry.photos[0]} 
              alt="Journal entry photo" 
              className="col-span-2 w-full h-48 object-cover"
              data-testid={`img-entry-photo-0-${entry.id}`}
            />
          )}
        </div>
      )}
    </div>
  );
}
