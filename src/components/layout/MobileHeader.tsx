import { Menu, Sparkles, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface MobileHeaderProps {
  universityName?: string | null;
  logoUrl?: string | null;
  sidebarComponent: React.ReactNode;
}

export function MobileHeader({ universityName, logoUrl, sidebarComponent }: MobileHeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-sidebar border-b border-sidebar-border z-40 lg:hidden flex items-center px-4 justify-between">
      <div className="flex items-center gap-3">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-sidebar-foreground hover:bg-sidebar-accent">
              <Menu className="w-6 h-6" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64 bg-sidebar border-r-sidebar-border">
            {sidebarComponent}
          </SheetContent>
        </Sheet>
        
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0">
            {logoUrl ? (
              <img src={logoUrl} alt="logo" className="w-5 h-5 object-contain" />
            ) : (
              <GraduationCap className="w-4 h-4 text-primary-foreground" />
            )}
          </div>
          <span className="font-display font-semibold text-sidebar-foreground truncate max-w-[180px]">
            {universityName || 'EduChain'}
          </span>
        </div>
      </div>

      <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center text-sidebar-foreground/60">
        <Sparkles className="w-4 h-4" />
      </div>
    </header>
  );
}
