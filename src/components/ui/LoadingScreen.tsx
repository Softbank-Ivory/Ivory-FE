import { Loader2 } from 'lucide-react';

export function LoadingScreen() {
  return (
    <div className="flex h-full w-full items-center justify-center p-8">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
          <div className="relative rounded-full bg-card p-4 shadow-lg border border-border">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
        <p className="text-sm font-bold text-muted-foreground animate-pulse">
          Loading...
        </p>
      </div>
    </div>
  );
}
