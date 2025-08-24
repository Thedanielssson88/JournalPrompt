import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, Search, Image, FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface GooglePhoto {
  id: string;
  mediaItemId: string;
  baseUrl: string;
  filename: string;
  mimeType: string;
  creationTime: Date;
  width: number;
  height: number;
  description?: string;
}

interface PhotoPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectPhotos: (photos: GooglePhoto[]) => void;
  date?: Date;
  existingPhotos?: GooglePhoto[];
}

export function PhotoPicker({ open, onOpenChange, onSelectPhotos, date = new Date(), existingPhotos = [] }: PhotoPickerProps) {
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(
    new Set(existingPhotos.map(p => p.id))
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("date");

  // Fetch photos by date
  const { data: datePhotos, isLoading: dateLoading } = useQuery({
    queryKey: ["photos", "by-date", format(date, "yyyy-MM-dd")],
    queryFn: async () => {
      const res = await fetch(`/api/photos/by-date?date=${date.toISOString()}`);
      if (!res.ok) throw new Error("Failed to fetch photos");
      return res.json() as Promise<GooglePhoto[]>;
    },
    enabled: open && activeTab === "date"
  });

  // Fetch suggested photos
  const { data: suggestedPhotos, isLoading: suggestedLoading } = useQuery({
    queryKey: ["photos", "suggested", format(date, "yyyy-MM-dd")],
    queryFn: async () => {
      const res = await fetch(`/api/photos/suggested?date=${date.toISOString()}`);
      if (!res.ok) throw new Error("Failed to fetch suggested photos");
      return res.json() as Promise<GooglePhoto[]>;
    },
    enabled: open && activeTab === "suggested"
  });

  // Fetch albums
  const { data: albums, isLoading: albumsLoading } = useQuery({
    queryKey: ["photos", "albums"],
    queryFn: async () => {
      const res = await fetch("/api/photos/albums");
      if (!res.ok) throw new Error("Failed to fetch albums");
      return res.json();
    },
    enabled: open && activeTab === "albums"
  });

  // Search photos
  const { data: searchResults, isLoading: searchLoading, refetch: searchPhotos } = useQuery({
    queryKey: ["photos", "search", searchQuery],
    queryFn: async () => {
      if (!searchQuery) return [];
      const res = await fetch(`/api/photos/search?q=${encodeURIComponent(searchQuery)}`);
      if (!res.ok) throw new Error("Failed to search photos");
      return res.json() as Promise<GooglePhoto[]>;
    },
    enabled: false
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setActiveTab("search");
      searchPhotos();
    }
  };

  const togglePhotoSelection = (photoId: string) => {
    const newSelection = new Set(selectedPhotos);
    if (newSelection.has(photoId)) {
      newSelection.delete(photoId);
    } else {
      newSelection.add(photoId);
    }
    setSelectedPhotos(newSelection);
  };

  const handleConfirm = () => {
    const photos = getDisplayedPhotos().filter(p => selectedPhotos.has(p.id));
    onSelectPhotos(photos);
    onOpenChange(false);
  };

  const getDisplayedPhotos = (): GooglePhoto[] => {
    switch (activeTab) {
      case "date":
        return datePhotos || [];
      case "suggested":
        return suggestedPhotos || [];
      case "search":
        return searchResults || [];
      default:
        return [];
    }
  };

  const renderPhotoGrid = (photos: GooglePhoto[], loading: boolean) => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Laddar foton...</div>
        </div>
      );
    }

    if (!photos || photos.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
          <Image className="h-12 w-12 mb-2 opacity-50" />
          <p>Inga foton hittades</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-3 gap-2">
        {photos.map((photo) => (
          <div
            key={photo.id}
            className={cn(
              "relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all",
              selectedPhotos.has(photo.id) 
                ? "border-primary ring-2 ring-primary/20" 
                : "border-transparent hover:border-gray-600"
            )}
            onClick={() => togglePhotoSelection(photo.id)}
          >
            <img
              src={`${photo.baseUrl}?w=200&h=200&fit=crop`}
              alt={photo.filename}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute top-2 right-2">
              <Checkbox
                checked={selectedPhotos.has(photo.id)}
                onCheckedChange={() => togglePhotoSelection(photo.id)}
                className="bg-background/80 backdrop-blur-sm"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            {photo.description && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                <p className="text-xs text-white truncate">{photo.description}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Välj foton från Google Photos</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              placeholder="Sök foton..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" size="icon">
              <Search className="h-4 w-4" />
            </Button>
          </form>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="date">
                <Calendar className="h-4 w-4 mr-2" />
                {format(date, "d MMM")}
              </TabsTrigger>
              <TabsTrigger value="suggested">
                <Image className="h-4 w-4 mr-2" />
                Förslag
              </TabsTrigger>
              <TabsTrigger value="albums">
                <FolderOpen className="h-4 w-4 mr-2" />
                Album
              </TabsTrigger>
              <TabsTrigger value="search">
                <Search className="h-4 w-4 mr-2" />
                Sök
              </TabsTrigger>
            </TabsList>

            <ScrollArea className="h-[400px] w-full rounded-md border p-4">
              <TabsContent value="date" className="mt-0">
                {renderPhotoGrid(datePhotos || [], dateLoading)}
              </TabsContent>

              <TabsContent value="suggested" className="mt-0">
                {renderPhotoGrid(suggestedPhotos || [], suggestedLoading)}
              </TabsContent>

              <TabsContent value="albums" className="mt-0">
                {albumsLoading ? (
                  <div className="text-center text-muted-foreground">Laddar album...</div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    {albums?.map((album: any) => (
                      <div
                        key={album.id}
                        className="border rounded-lg p-4 hover:bg-accent cursor-pointer"
                      >
                        <h4 className="font-medium">{album.title}</h4>
                        <p className="text-sm text-muted-foreground">{album.mediaItemsCount} foton</p>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="search" className="mt-0">
                {renderPhotoGrid(searchResults || [], searchLoading)}
              </TabsContent>
            </ScrollArea>
          </Tabs>

          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">
              {selectedPhotos.size} foto{selectedPhotos.size !== 1 ? "n" : ""} valda
            </span>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Avbryt
              </Button>
              <Button onClick={handleConfirm} disabled={selectedPhotos.size === 0}>
                Lägg till valda foton
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}