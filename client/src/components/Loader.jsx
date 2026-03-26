import { motion } from 'framer-motion';

export function BookSkeleton() {
  return (
    <div className="flex flex-col h-full bg-card rounded-xl border border-border overflow-hidden animate-pulse">
      <div className="aspect-[3/4] bg-muted w-full" />
      <div className="p-4 flex flex-col flex-grow gap-3">
        <div className="h-5 bg-muted rounded-md w-3/4" />
        <div className="h-4 bg-muted rounded-md w-1/2" />
        <div className="h-4 bg-muted rounded-md w-2/3" />
        <div className="h-10 bg-muted rounded-md w-full mt-auto" />
      </div>
    </div>
  );
}

export function GridSkeleton({ count = 8 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <BookSkeleton key={`skeleton-${i}`} />
      ))}
    </div>
  );
}

export default function Loader({ fullPage = false }) {
  const spinner = (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 border-4 border-muted rounded-full" />
        <motion.div
          className="absolute inset-0 border-4 border-primary-500 rounded-full border-t-transparent"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
      </div>
      <p className="text-muted-foreground font-medium animate-pulse">Loading...</p>
    </div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
        {spinner}
      </div>
    );
  }

  return <div className="py-12 flex justify-center">{spinner}</div>;
}
