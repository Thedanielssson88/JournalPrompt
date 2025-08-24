import { Search } from "lucide-react";
import { type User } from "@shared/schema";

interface HeaderProps {
  user?: User;
}

export default function Header({ user }: HeaderProps) {
  return (
    <header className="flex items-center justify-between px-4 py-4 bg-dark-primary">
      <button className="p-2" data-testid="button-search">
        <Search className="text-xl text-white" />
      </button>
      
      <h1 className="text-xl font-medium text-white" data-testid="text-title">Dagbok</h1>
      
      <div className="relative">
        <div className="w-10 h-10 rounded-full border-2 border-red-500 p-0.5">
          <img 
            src={user?.profileImage || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=100&h=100"} 
            alt="Profile picture" 
            className="w-full h-full rounded-full object-cover"
            data-testid="img-profile"
          />
        </div>
      </div>
    </header>
  );
}
