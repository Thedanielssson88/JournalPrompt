import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Image, ExternalLink, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { googlePhotosPicker } from '@/lib/googlePhotosPicker';

interface RealGooglePhotosPickerProps {
  onSelectPhotos: (photos: any[]) => void;
  onClose: () => void;
}

export function RealGooglePhotosPicker({ onSelectPhotos, onClose }: RealGooglePhotosPickerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  // Get the current user to get their access token
  const { data: user } = useQuery({
    queryKey: ['/api/user']
  });

  // Get API key and client ID from server
  const { data: config } = useQuery({
    queryKey: ['/api/config']
  });

  const openGooglePhotosPicker = async () => {
    if (!user?.googleAccessToken) {
      toast({
        title: "Fel",
        description: "Du måste logga in med Google först",
        variant: "destructive"
      });
      return;
    }

    if (!config?.apiKey || !config?.clientId) {
      toast({
        title: "Fel",
        description: "API-konfiguration inte tillgänglig",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      // Set the auth token from our OAuth login
      googlePhotosPicker.setAuthToken(user.googleAccessToken);

      // Open the picker
      await googlePhotosPicker.openPicker({
        clientId: config.clientId,
        appId: config.apiKey, // Developer key
        scope: 'https://www.googleapis.com/auth/photoslibrary.readonly',
        onPick: (photos: any[]) => {
          console.log('Selected photos:', photos);
          
          // Transform picker results to our format
          const transformedPhotos = photos.map((photo: any) => ({
            id: photo.id,
            name: photo.name || 'Photo',
            url: photo.url || photo.thumbnails?.[0]?.url,
            thumbnails: photo.thumbnails || [{ url: photo.url }],
            mimeType: photo.mimeType || 'image/jpeg',
            description: photo.description || '',
            isVideo: photo.mimeType?.startsWith('video/') || false,
          }));
          
          onSelectPhotos(transformedPhotos);
          toast({
            title: "Foton valda",
            description: `${transformedPhotos.length} foto${transformedPhotos.length !== 1 ? 'n' : ''} har lagts till`,
          });
          
          setIsLoading(false);
          onClose();
        },
        onCancel: () => {
          console.log('Picker cancelled');
          setIsLoading(false);
        }
      });
      
      toast({
        title: "Google Photos Picker öppnad",
        description: "Välj dina foton i det nya fönstret",
      });
      
    } catch (error) {
      console.error('Picker error:', error);
      toast({
        title: "Fel",
        description: `Kunde inte öppna Google Photos Picker: ${error.message}`,
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-4 p-8">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">Google Photos Picker</h3>
        <p className="text-sm text-muted-foreground">
          {isLoading 
            ? "Väntar på att du väljer foton i det nya fönstret..." 
            : "Öppna Google Photos för att välja foton"}
        </p>
      </div>
      
      {isLoading ? (
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-500" />
          <p className="text-sm text-muted-foreground">
            Välj foton i Google Photos-fönstret
          </p>
        </div>
      ) : (
        <Button 
          onClick={openGooglePhotosPicker}
          size="lg"
          className="w-full max-w-xs"
          disabled={isLoading}
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          Öppna Google Photos Picker
        </Button>
      )}
      
      <Button
        variant="outline"
        onClick={onClose}
        className="w-full max-w-xs"
        disabled={isLoading}
      >
        Avbryt
      </Button>
    </div>
  );
}