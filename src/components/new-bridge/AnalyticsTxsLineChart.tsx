"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface TransactionData {
  timestamp: string;
  duration: number;
  color: "green" | "yellow" | "red";
}

interface AnalyticsTxsLineChartProps {
  txs: TransactionData[];
}

const getColorClass = (color: "green" | "yellow" | "red") => {
  switch (color) {
    case "green":
      return "bg-green-500";
    case "yellow":
      return "bg-yellow-500";
    case "red":
      return "bg-red-500";
    default:
      return "bg-gray-300";
  }
};

const formatDateTime = (timestamp: string) => {
  const date = new Date(timestamp);
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

export function AnalyticsTxsLineChart({ txs }: AnalyticsTxsLineChartProps) {
  if (!txs || txs.length === 0) {
    return null;
  }

  // Calculate percentage for each color
  const total = txs.length;
  const greenCount = txs.filter((tx) => tx.color === "green").length;
  const yellowCount = txs.filter((tx) => tx.color === "yellow").length;
  const redCount = txs.filter((tx) => tx.color === "red").length;
  const greenPercentage = Math.round((greenCount / total) * 100);

  return (
    <TooltipProvider>
      <div className="w-full space-y-2">
        {/* Status bar - horizontal timeline of transactions */}
        <div className="flex items-center gap-0.5 h-8 w-full overflow-hidden rounded-sm">
          {txs.map((tx, index) => {
            const dateTime = formatDateTime(tx.timestamp);
            return (
              <Tooltip key={index}>
                <TooltipTrigger asChild>
                  <div
                    className={cn(
                      "flex-1 min-w-[2px] h-full transition-colors cursor-pointer hover:opacity-80",
                      getColorClass(tx.color)
                    )}
                  />
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  <div>
                    <div>{dateTime}</div>
                    <div>Execution: {tx.duration}s</div>
                  </div>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>

        {/* Status summary */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-sm bg-green-500" />
              <span>Fast: {greenCount}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-sm bg-yellow-500" />
              <span>Medium: {yellowCount}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-sm bg-red-500" />
              <span>Slow: {redCount}</span>
            </div>
          </div>
          <div className="text-right">
            <span className="font-medium text-foreground">
              {greenPercentage}% fast
            </span>
            <span className="ml-1">on the last {total} transactions</span>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
