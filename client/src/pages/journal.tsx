import { useQuery } from "@tanstack/react-query";
import { type JournalEntry, type User } from "@shared/schema";
import StatusBar from "@/components/StatusBar";
import Header from "@/components/Header";
import JournalEntryCard from "@/components/JournalEntryCard";
import PreviousEntryCard from "@/components/PreviousEntryCard";
import BottomNavigation from "@/components/BottomNavigation";
import { Plus } from "lucide-react";
import { useState } from "react";

export default function Journal() {
  const [activeTab, setActiveTab] = useState<'notes' | 'insights'>('notes');

  const { data: user, isLoading: userLoading } = useQuery<User>({
    queryKey: ['/api/user']
  });

  const { data: entries, isLoading: entriesLoading } = useQuery<JournalEntry[]>({
    queryKey: ['/api/journal-entries']
  });

  if (userLoading || entriesLoading) {
    return (
      <div className="bg-dark-primary text-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-blue mx-auto mb-4"></div>
          <p className="text-dark-text-muted">Laddar...</p>
        </div>
      </div>
    );
  }

  const latestEntry = entries?.[0];
  const previousEntries = entries?.slice(1) || [];

  return (
    <div className="bg-dark-primary text-white min-h-screen">
      <StatusBar />
      <Header user={user} />
      
      <main className="px-4 pb-20">
        {/* Senaste Section */}
        <section className="mb-6">
          <h2 className="text-lg font-medium text-accent-blue mb-4" data-testid="text-senaste">Senaste</h2>
          
          {latestEntry && (
            <JournalEntryCard entry={latestEntry} />
          )}
        </section>

        {/* Tidigare poster Section */}
        {previousEntries.length > 0 && (
          <section>
            <h2 className="text-lg font-medium text-dark-text-muted mb-4" data-testid="text-tidigare-poster">
              Tidigare poster
            </h2>
            
            <div className="space-y-3">
              {previousEntries.map((entry) => (
                <PreviousEntryCard key={entry.id} entry={entry} />
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Floating Action Button */}
      <button 
        className="fixed bottom-24 right-4 w-14 h-14 bg-accent-blue rounded-full shadow-lg flex items-center justify-center hover:bg-blue-500 transition-colors"
        data-testid="button-add-entry"
      >
        <Plus className="text-white" size={24} />
      </button>

      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
