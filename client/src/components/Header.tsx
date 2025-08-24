import { Search } from "lucide-react";
import { type User } from "@shared/schema";
import { AuthButton } from "./AuthButton";

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
      
      <AuthButton />
    </header>
  );
}
