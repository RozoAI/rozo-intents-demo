"use client";

import { useAnalytics } from "@/hooks/use-analytics";
import { Clock, DollarSign, Loader2 } from "lucide-react";
import { AnalyticsTxsLineChart } from "./AnalyticsTxsLineChart";

export function AnalyticsCard() {
  const { data, isLoading, error } = useAnalytics();

  if (error) {
    return null;
  }

  return (
    <div className="w-full">
      {isLoading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      ) : data ? (
        <>
          <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-3">
            <div className="flex flex-col gap-0.5 items-center text-center">
              <div className="flex items-center justify-center gap-1.5 text-muted-foreground">
                <DollarSign className="h-3 w-3" />
                <span className="text-xs">Volume</span>
              </div>
              <p className="text-base sm:text-lg font-semibold">
                $
                {data?.last_50_txs?.total_volume_usdc.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>

            <div className="flex flex-col gap-0.5 items-center text-center">
              <div className="flex items-center justify-center gap-1.5 text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span className="text-xs">Avg Time</span>
              </div>
              <p className="text-base sm:text-lg font-semibold">
                {data?.last_50_txs?.avg_seconds}s
              </p>
            </div>
          </div>

          {data.txs && data.txs.length > 0 && (
            <div className="mt-3">
              <AnalyticsTxsLineChart txs={data.txs} />
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
