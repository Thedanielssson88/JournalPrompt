import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Image } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

interface RealGooglePhotosPickerProps {
  onSelectPhotos: (photos: any[]) => void;
  onClose: () => void;
}

export function RealGooglePhotosPicker({ onSelectPhotos, onClose }: RealGooglePhotosPickerProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [pickerInited, setPickerInited] = useState(false);
  const { toast } = useToast();
  
  // Get the current user to get their access token
  const { data: user } = useQuery({
    queryKey: ['/api/user']
  });

  const API_KEY = 'AIzaSyDsMlEViH_82upx2OxHcxOAtMEtbwyNpbo';
  const CLIENT_ID = '736316971406-m0dk8bqvakpu4s09vmmo15uo6e2u62ma.apps.googleusercontent.com';

  useEffect(() => {
    // Load Google API
    const loadGoogleAPI = () => {
      if (window.gapi) {
        window.gapi.load('auth2:picker', () => {
          setIsLoaded(true);
        });
      } else {
        // Retry after a short delay if gapi is not yet available
        setTimeout(loadGoogleAPI, 100);
      }
    };

    loadGoogleAPI();
  }, []);

  const openPicker = () => {
    if (!isLoaded) {
      toast({
        title: "Vänta",
        description: "Google Photos Picker laddas...",
      });
      return;
    }

    if (!user?.googleAccessToken) {
      toast({
        title: "Fel",
        description: "Du måste logga in med Google först",
        variant: "destructive"
      });
      return;
    }

    try {
      // Create and render the Google Picker
      const picker = new window.google.picker.PickerBuilder()
        .addView(window.google.picker.ViewId.PHOTOS)
        .addView(window.google.picker.ViewId.PHOTO_ALBUMS)
        .addView(window.google.picker.ViewId.PHOTO_UPLOAD)
        .setOAuthToken(user.googleAccessToken)
        .setDeveloperKey(API_KEY)
        .setCallback((data: any) => {
          if (data.action === window.google.picker.Action.PICKED) {
            const photos = data.docs.map((doc: any) => ({
              id: doc.id,
              name: doc.name,
              url: doc.url,
              thumbnails: doc.thumbnails,
              mimeType: doc.mimeType,
              description: doc.description,
              isVideo: doc.mimeType?.startsWith('video/'),
            }));
            onSelectPhotos(photos);
            onClose();
          } else if (data.action === window.google.picker.Action.CANCEL) {
            onClose();
          }
        })
        .setTitle('Välj foton från Google Photos')
        .setLocale('sv')
        .build();

      picker.setVisible(true);
    } catch (error) {
      console.error('Error opening picker:', error);
      toast({
        title: "Fel",
        description: "Kunde inte öppna Google Photos Picker",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-4 p-8">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">Google Photos Picker</h3>
        <p className="text-sm text-muted-foreground">
          Öppna Google Photos för att välja foton
        </p>
      </div>
      
      <Button 
        onClick={openPicker}
        size="lg"
        className="w-full max-w-xs"
      >
        <Image className="h-4 w-4 mr-2" />
        Öppna Google Photos
      </Button>
      
      <Button
        variant="outline"
        onClick={onClose}
        className="w-full max-w-xs"
      >
        Avbryt
      </Button>
    </div>
  );
}