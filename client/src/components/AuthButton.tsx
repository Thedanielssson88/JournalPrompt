import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogIn, LogOut, User, Camera } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function AuthButton() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery({
    queryKey: ['/api/user']
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/auth/logout', { method: 'POST' });
      if (!res.ok) throw new Error('Logout failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      toast({
        title: "Utloggad",
        description: "Du har loggats ut från Google Photos"
      });
      // Reload to reset app state
      window.location.reload();
    },
    onError: () => {
      toast({
        title: "Fel",
        description: "Kunde inte logga ut",
        variant: "destructive"
      });
    }
  });

  if (isLoading) {
    return (
      <Button variant="ghost" size="sm" disabled>
        <User className="h-4 w-4" />
      </Button>
    );
  }

  const handleGoogleLogin = async () => {
    try {
      // First check if OAuth is configured
      const response = await fetch('/auth/google');
      if (!response.ok) {
        const error = await response.json();
        toast({
          title: "Google OAuth inte konfigurerat",
          description: "Se GOOGLE_PHOTOS_SETUP.md för instruktioner om hur du ställer in Google Photos integration.",
          variant: "destructive"
        });
        return;
      }
      
      // Redirect to Google OAuth
      window.location.href = '/auth/google';
    } catch (error) {
      toast({
        title: "Fel",
        description: "Kunde inte ansluta till Google",
        variant: "destructive"
      });
    }
  };

  if (!user?.googleAccessToken) {
    return (
      <Button 
        variant="outline" 
        size="sm"
        onClick={handleGoogleLogin}
      >
        <LogIn className="h-4 w-4 mr-2" />
        Logga in med Google
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarImage 
              src={user.profileImage} 
              alt={user.username}
            />
            <AvatarFallback>
              {user.username?.[0]?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <span className="hidden sm:inline">{user.username}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.profileImage} alt={user.username} />
              <AvatarFallback>
                {user.username?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{user.username}</p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Camera className="h-3 w-3 text-green-500" />
                Google Photos ansluten
              </div>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={() => logoutMutation.mutate()}
          disabled={logoutMutation.isPending}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Logga ut
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}