import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { GooglePhotoPicker } from "./GooglePhotoPicker";
import { 
  CalendarIcon, 
  ImagePlus, 
  Hash, 
  Users, 
  MapPin, 
  Smile,
  X,
  Save
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface JournalPhoto {
  googlePhotoId: string;
  mediaItemId?: string;
  baseUrl?: string;
  thumbnailUrl?: string;
  filename?: string;
  position: number;
  caption?: string;
}

interface JournalEditorProps {
  entryId?: string;
  initialData?: {
    title: string;
    content: string;
    date: Date;
    category?: string;
    mood?: { emoji: string; value: number };
    tags?: string[];
    people?: Array<{ name: string }>;
    photos?: JournalPhoto[];
  };
  onSave?: () => void;
  onCancel?: () => void;
}

const categories = [
  "Aktuella händelser",
  "Träning", 
  "Familj",
  "Ekonomi",
  "Mat",
  "Vänner",
  "Hälsa",
  "Husdjur",
  "Fritidsaktiviteter",
  "Relationer",
  "Skola"
];

const moods = [
  { emoji: "😊", value: 5, label: "Mycket glad" },
  { emoji: "🙂", value: 4, label: "Glad" },
  { emoji: "😐", value: 3, label: "Neutral" },
  { emoji: "😔", value: 2, label: "Ledsen" },
  { emoji: "😢", value: 1, label: "Mycket ledsen" }
];

export function JournalEditor({ 
  entryId, 
  initialData, 
  onSave, 
  onCancel 
}: JournalEditorProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form state
  const [title, setTitle] = useState(initialData?.title || "");
  const [content, setContent] = useState(initialData?.content || "");
  const [date, setDate] = useState<Date>(initialData?.date || new Date());
  const [category, setCategory] = useState(initialData?.category || "Familj");
  const [mood, setMood] = useState(initialData?.mood || { emoji: "😊", value: 5 });
  const [tags, setTags] = useState<string[]>(initialData?.tags || []);
  const [people, setPeople] = useState<Array<{ name: string }>>(initialData?.people || []);
  const [photos, setPhotos] = useState<JournalPhoto[]>(initialData?.photos || []);
  const [location, setLocation] = useState<string>("");
  
  // UI state
  const [showPhotoPicker, setShowPhotoPicker] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [newPerson, setNewPerson] = useState("");

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const url = entryId 
        ? `/api/journal-entries/${entryId}`
        : "/api/journal-entries";
      
      const method = entryId ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      
      if (!res.ok) throw new Error("Failed to save entry");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["journal-entries"] });
      toast({
        title: entryId ? "Inlägg uppdaterat" : "Inlägg skapat",
        description: "Ditt dagboksinlägg har sparats."
      });
      onSave?.();
    },
    onError: () => {
      toast({
        title: "Fel",
        description: "Kunde inte spara inlägget. Försök igen.",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = () => {
    if (!title.trim() && !content.trim()) {
      toast({
        title: "Tomt inlägg",
        description: "Lägg till en titel eller innehåll.",
        variant: "destructive"
      });
      return;
    }

    saveMutation.mutate({
      title: title || `Dagbok ${format(date, "d MMMM yyyy", { locale: sv })}`,
      content,
      date: date.toISOString(),
      category,
      mood,
      tags,
      people,
      photos: photos.map((photo, index) => ({
        ...photo,
        position: index
      }))
    });
  };

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const handleAddPerson = () => {
    if (newPerson.trim()) {
      setPeople([...people, { name: newPerson.trim() }]);
      setNewPerson("");
    }
  };

  const handlePhotosSelected = (selectedPhotos: any[]) => {
    const newPhotos = selectedPhotos.map((photo, index) => ({
      googlePhotoId: photo.id,
      mediaItemId: photo.mediaItemId,
      baseUrl: photo.baseUrl,
      thumbnailUrl: `${photo.baseUrl}?w=200&h=200&fit=crop`,
      filename: photo.filename,
      position: photos.length + index
    }));
    setPhotos([...photos, ...newPhotos]);
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  return (
    <Card className="p-6 space-y-6">
      {/* Date selector */}
      <div className="flex items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn("justify-start text-left font-normal")}>
              <CalendarIcon className="mr-2 h-4 w-4" />
              {format(date, "d MMMM yyyy", { locale: sv })}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(d) => d && setDate(d)}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Title */}
      <Input
        placeholder="Lägg till titel..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="text-xl font-semibold border-none px-0 focus-visible:ring-0"
      />

      {/* Content */}
      <Textarea
        placeholder="Vad hände idag?"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="min-h-[200px] resize-none border-none px-0 focus-visible:ring-0"
      />

      {/* Photos */}
      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {photos.map((photo, index) => (
            <div key={index} className="relative aspect-square rounded-lg overflow-hidden">
              <img
                src={photo.thumbnailUrl || photo.baseUrl}
                alt={photo.filename}
                className="w-full h-full object-cover"
              />
              <Button
                size="icon"
                variant="destructive"
                className="absolute top-2 right-2 h-6 w-6"
                onClick={() => removePhoto(index)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Add photos button */}
      <Button
        variant="outline"
        onClick={() => setShowPhotoPicker(true)}
        className="w-full"
      >
        <ImagePlus className="mr-2 h-4 w-4" />
        Lägg till foton från Google Photos
      </Button>

      {/* Metadata section */}
      <div className="space-y-4">
        {/* Mood selector */}
        <div className="flex items-center gap-2">
          <Smile className="h-4 w-4 text-muted-foreground" />
          <div className="flex gap-2">
            {moods.map((m) => (
              <Button
                key={m.value}
                variant={mood.value === m.value ? "default" : "outline"}
                size="sm"
                onClick={() => setMood(m)}
                title={m.label}
              >
                {m.emoji}
              </Button>
            ))}
          </div>
        </div>

        {/* Category selector */}
        <div className="flex items-center gap-2">
          <Hash className="h-4 w-4 text-muted-foreground" />
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tags */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Hash className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Lägg till tagg..."
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
              className="flex-1"
            />
            <Button size="sm" onClick={handleAddTag}>
              Lägg till
            </Button>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag, index) => (
                <Badge key={index} variant="secondary">
                  {tag}
                  <button
                    onClick={() => setTags(tags.filter((_, i) => i !== index))}
                    className="ml-2 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* People */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Lägg till person..."
              value={newPerson}
              onChange={(e) => setNewPerson(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddPerson())}
              className="flex-1"
            />
            <Button size="sm" onClick={handleAddPerson}>
              Lägg till
            </Button>
          </div>
          {people.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {people.map((person, index) => (
                <Badge key={index} variant="secondary">
                  {person.name}
                  <button
                    onClick={() => setPeople(people.filter((_, i) => i !== index))}
                    className="ml-2 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          Avbryt
        </Button>
        <Button onClick={handleSubmit} disabled={saveMutation.isPending}>
          <Save className="mr-2 h-4 w-4" />
          {saveMutation.isPending ? "Sparar..." : "Spara"}
        </Button>
      </div>

      {/* Photo picker dialog */}
      <GooglePhotoPicker
        open={showPhotoPicker}
        onOpenChange={setShowPhotoPicker}
        onSelectPhotos={handlePhotosSelected}
        date={date}
        existingPhotos={[]}
      />
    </Card>
  );
}