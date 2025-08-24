import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

export function OAuthErrorHandler() {
  const { toast } = useToast();

  useEffect(() => {
    // Check for OAuth error parameters in URL
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    
    if (error) {
      let title = "Inloggningsfel";
      let description = "Ett fel uppstod under inloggningen";
      
      switch (error) {
        case 'oauth_not_configured':
          title = "Google OAuth inte konfigurerat";
          description = "Google Photos integration är inte konfigurerat. Se GOOGLE_PHOTOS_SETUP.md för instruktioner.";
          break;
        case 'login_failed':
          title = "Inloggning misslyckades";
          description = "Kunde inte logga in med Google. Försök igen.";
          break;
        case 'access_denied':
          title = "Åtkomst nekad";
          description = "Du nekade åtkomst till Google Photos. Appen fungerar fortfarande utan denna integration.";
          break;
      }
      
      toast({
        title,
        description,
        variant: "destructive",
        duration: 8000
      });
      
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [toast]);

  return null; // This component doesn't render anything
}