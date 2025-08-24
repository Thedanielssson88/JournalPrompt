import { useQuery } from "@tanstack/react-query";
import { type JournalEntry, type User } from "@shared/schema";
import StatusBar from "@/components/StatusBar";
import Header from "@/components/Header";
import JournalEntryCard from "@/components/JournalEntryCard";
import PreviousEntryCard from "@/components/PreviousEntryCard";
import BottomNavigation from "@/components/BottomNavigation";
import { JournalEditor } from "@/components/JournalEditor";
import { OAuthErrorHandler } from "@/components/OAuthErrorHandler";
import { DemoNotice } from "@/components/DemoNotice";
import { Plus } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export default function Journal() {
  const [activeTab, setActiveTab] = useState<'notes' | 'insights'>('notes');
  const [showEditor, setShowEditor] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);

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

  const handleNewEntry = () => {
    setEditingEntry(null);
    setShowEditor(true);
  };

  const handleEditEntry = (entry: JournalEntry) => {
    setEditingEntry(entry);
    setShowEditor(true);
  };

  const handleCloseEditor = () => {
    setShowEditor(false);
    setEditingEntry(null);
  };

  return (
    <div className="bg-dark-primary text-white min-h-screen">
      <OAuthErrorHandler />
      <StatusBar />
      <Header user={user} />
      <DemoNotice />
      
      <main className="px-4 pb-20">
        {/* Senaste Section */}
        <section className="mb-6">
          <h2 className="text-lg font-medium text-accent-blue mb-4" data-testid="text-senaste">Senaste</h2>
          
          {latestEntry && (
            <div onClick={() => handleEditEntry(latestEntry)} className="cursor-pointer">
              <JournalEntryCard entry={latestEntry} />
            </div>
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
                <div key={entry.id} onClick={() => handleEditEntry(entry)} className="cursor-pointer">
                  <PreviousEntryCard entry={entry} />
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Floating Action Button */}
      <button 
        className="fixed bottom-24 right-4 w-14 h-14 bg-accent-blue rounded-full shadow-lg flex items-center justify-center hover:bg-blue-500 transition-colors"
        data-testid="button-add-entry"
        onClick={handleNewEntry}
      >
        <Plus className="text-white" size={24} />
      </button>

      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Journal Editor Dialog */}
      <Dialog open={showEditor} onOpenChange={setShowEditor}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <JournalEditor
            entryId={editingEntry?.id}
            initialData={editingEntry ? {
              title: editingEntry.title,
              content: editingEntry.content || "",
              date: new Date(editingEntry.date),
              category: editingEntry.category || undefined,
              mood: editingEntry.mood || undefined,
              tags: editingEntry.tags || undefined,
              people: editingEntry.people || undefined,
              photos: (editingEntry as any).photos || undefined
            } : undefined}
            onSave={handleCloseEditor}
            onCancel={handleCloseEditor}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}