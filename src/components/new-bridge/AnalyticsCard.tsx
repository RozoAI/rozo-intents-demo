"use client";

import { Badge } from "@/components/ui/badge";
import { useAnalytics } from "@/hooks/use-analytics";
import { Clock, DollarSign, Loader2, TrendingUp } from "lucide-react";
import { useState } from "react";

export function AnalyticsCard() {
  const { data, isLoading, error } = useAnalytics();
  const [view, setView] = useState<"today" | "last_7_days">("last_7_days");

  if (error) {
    return null;
  }

  const currentData = view === "today" ? data?.today : data?.last_7_days;

  return (
    <div className="w-full">
      {isLoading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      ) : data ? (
        <>
          <div className="flex justify-center gap-2 mb-3 min-w-fit">
            {/* @NOTE: Use Yesterday cause data is in past day, but response is for today */}
            {/* <Badge
              variant={view === "today" ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setView("today")}
            >
              Yesterday
            </Badge> */}
            <Badge
              variant={view === "last_7_days" ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setView("last_7_days")}
            >
              Last 7 Days
            </Badge>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <div className="flex flex-col gap-0.5 items-center text-center">
              <div className="flex items-center justify-center gap-1.5 text-muted-foreground">
                <DollarSign className="h-3 w-3" />
                <span className="text-xs">Volume</span>
              </div>
              <p className="text-base sm:text-lg font-semibold">
                $
                {currentData?.total_volume_usdc.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>

            <div className="flex flex-col gap-0.5 items-center text-center">
              <div className="flex items-center justify-center gap-1.5 text-muted-foreground">
                <TrendingUp className="h-3 w-3" />
                <span className="text-xs">Transfer</span>
              </div>
              <p className="text-base sm:text-lg font-semibold">
                {currentData?.total_payments.toLocaleString()}
              </p>
            </div>

            <div className="flex flex-col gap-0.5 items-center text-center">
              <div className="flex items-center justify-center gap-1.5 text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span className="text-xs">Avg Time</span>
              </div>
              <p className="text-base sm:text-lg font-semibold">
                {currentData?.avg_seconds}s
              </p>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
