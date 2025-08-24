import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Image, ExternalLink, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface RealGooglePhotosPickerProps {
  onSelectPhotos: (photos: any[]) => void;
  onClose: () => void;
}

export function RealGooglePhotosPicker({ onSelectPhotos, onClose }: RealGooglePhotosPickerProps) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [pickerUrl, setPickerUrl] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const { toast } = useToast();
  
  // Get the current user to get their access token
  const { data: user } = useQuery({
    queryKey: ['/api/user']
  });

  const API_KEY = 'AIzaSyDsMlEViH_82upx2OxHcxOAtMEtbwyNpbo';

  const createPickerSession = async () => {
    if (!user?.googleAccessToken) {
      toast({
        title: "Fel",
        description: "Du måste logga in med Google först",
        variant: "destructive"
      });
      return;
    }

    try {
      // Create a new picker session using the Google Photos Picker API
      const response = await fetch('https://photospicker.googleapis.com/v1/sessions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.googleAccessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // Optional: configure picker settings here
        })
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('Session creation failed:', error);
        throw new Error(`Failed to create picker session: ${response.status}`);
      }

      const session = await response.json();
      console.log('Created picker session:', session);
      
      setSessionId(session.id);
      setPickerUrl(session.pickerUri);
      
      // Open the picker in a new window
      if (session.pickerUri) {
        const pickerWindow = window.open(
          session.pickerUri,
          'google-photos-picker',
          'width=800,height=600,scrollbars=yes,resizable=yes'
        );
        
        // Start polling for completion
        startPolling(session.id, pickerWindow);
        
        toast({
          title: "Google Photos Picker öppnad",
          description: "Välj dina foton i det nya fönstret",
        });
      }

    } catch (error) {
      console.error('Picker session error:', error);
      toast({
        title: "Fel",
        description: `Kunde inte skapa Google Photos Picker session: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  const startPolling = (sessionId: string, pickerWindow: Window | null) => {
    setIsPolling(true);
    
    const pollInterval = setInterval(async () => {
      try {
        // Check if picker window is closed
        if (pickerWindow?.closed) {
          clearInterval(pollInterval);
          setIsPolling(false);
          
          // Get the selected media items
          await getSelectedMediaItems(sessionId);
          return;
        }

        // Check session status
        const response = await fetch(`https://photospicker.googleapis.com/v1/sessions/${sessionId}`, {
          headers: {
            'Authorization': `Bearer ${user.googleAccessToken}`,
          }
        });

        if (response.ok) {
          const session = await response.json();
          console.log('Session status:', session);
          
          // Check if user has made selections and closed the picker
          if (session.mediaItemsSet && pickerWindow?.closed) {
            clearInterval(pollInterval);
            setIsPolling(false);
            await getSelectedMediaItems(sessionId);
          }
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 2000); // Poll every 2 seconds

    // Clean up after 5 minutes
    setTimeout(() => {
      clearInterval(pollInterval);
      setIsPolling(false);
    }, 300000);
  };

  const getSelectedMediaItems = async (sessionId: string) => {
    try {
      const response = await fetch(`https://photospicker.googleapis.com/v1/mediaItems?sessionId=${sessionId}`, {
        headers: {
          'Authorization': `Bearer ${user.googleAccessToken}`,
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Selected media items:', data);
        
        if (data.mediaItems && data.mediaItems.length > 0) {
          const photos = data.mediaItems.map((item: any) => ({
            id: item.id,
            name: item.filename || 'Photo',
            url: item.baseUrl,
            thumbnails: [{url: item.baseUrl + '=s200'}],
            mimeType: item.mimeType,
            description: item.description || '',
            isVideo: item.mimeType?.startsWith('video/'),
          }));
          
          onSelectPhotos(photos);
          toast({
            title: "Foton valda",
            description: `${photos.length} foto${photos.length !== 1 ? 'n' : ''} har lagts till`,
          });
        }
      }

      // Clean up session
      await fetch(`https://photospicker.googleapis.com/v1/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${user.googleAccessToken}`,
        }
      });

      onClose();
    } catch (error) {
      console.error('Error getting selected media items:', error);
      toast({
        title: "Fel",
        description: "Kunde inte hämta valda foton",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-4 p-8">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">Google Photos Picker</h3>
        <p className="text-sm text-muted-foreground">
          {isPolling 
            ? "Väntar på att du väljer foton i det nya fönstret..." 
            : "Öppna Google Photos för att välja foton"}
        </p>
      </div>
      
      {sessionId && isPolling ? (
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-500" />
          <p className="text-sm text-muted-foreground">
            Välj foton i Google Photos-fönstret och stäng sedan fönstret
          </p>
        </div>
      ) : (
        <Button 
          onClick={createPickerSession}
          size="lg"
          className="w-full max-w-xs"
          disabled={isPolling}
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          Öppna Google Photos Picker
        </Button>
      )}
      
      <Button
        variant="outline"
        onClick={onClose}
        className="w-full max-w-xs"
        disabled={isPolling}
      >
        Avbryt
      </Button>
    </div>
  );
}