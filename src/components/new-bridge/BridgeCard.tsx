import { ReactNode } from "react";

interface BridgeCardProps {
  children: ReactNode;
}

export function BridgeCard({ children }: BridgeCardProps) {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-neutral-200 dark:bg-neutral-800/50 dark:border-neutral-600 transition-all duration-300 relative">
      <div className="flex items-start justify-between gap-3 sm:gap-4">{children}</div>
    </div>
  );
}
