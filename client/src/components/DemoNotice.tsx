import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { X, Settings, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function DemoNotice() {
  const [dismissed, setDismissed] = useState(
    localStorage.getItem('demo-notice-dismissed') === 'true'
  );

  const { data: user } = useQuery({
    queryKey: ['/api/user']
  });

  // Don't show if user is authenticated with Google or if dismissed
  if (user?.googleAccessToken || dismissed) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('demo-notice-dismissed', 'true');
  };

  return (
    <Alert className="mx-4 mt-4 border-blue-200 bg-blue-50 text-blue-900">
      <Settings className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            Demo Mode
          </Badge>
          <span className="text-sm">
            Google Photos inte konfigurerat. Ser mockdata just nu.
          </span>
          <Button
            variant="link"
            size="sm"
            className="p-0 h-auto text-blue-700 hover:text-blue-900"
            onClick={() => window.open('/GOOGLE_PHOTOS_SETUP.md', '_blank')}
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            Setup Guide
          </Button>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-auto p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-100"
          onClick={handleDismiss}
        >
          <X className="h-4 w-4" />
        </Button>
      </AlertDescription>
    </Alert>
  );
}