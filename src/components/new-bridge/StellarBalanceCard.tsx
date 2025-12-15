"use client";

import { useStellarWallet } from "@/contexts/StellarWalletContext";
import { cn } from "@/lib/utils";
import { RefreshCw } from "lucide-react";

export function StellarBalanceCard() {
  const { stellarConnected, trustlineStatus, checkTrustline } =
    useStellarWallet();

  if (!stellarConnected) return null;

  return (
    <div className="mb-3 sm:mb-4 flex items-center justify-between bg-neutral-100 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-neutral-200 dark:bg-neutral-800/30 dark:border-neutral-700/30">
      <div className="flex items-center gap-2 sm:gap-3">
        <div>
          <div className="text-xs text-neutral-500 dark:text-neutral-400 mb-0.5 sm:mb-1">
            Your Balance
          </div>
          <div className="text-xl sm:text-2xl font-semibold text-neutral-900 dark:text-white">
            <span
              className={cn(
                "inline-flex items-end gap-1",
                trustlineStatus.checking ? "animate-pulse" : ""
              )}
            >
              {parseFloat(trustlineStatus.balance).toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{" "}
              <span className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
                USDC
              </span>
            </span>
          </div>
        </div>
      </div>
      <button
        onClick={checkTrustline}
        disabled={trustlineStatus.checking}
        className="p-1.5 sm:p-2 rounded-lg bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-700 dark:hover:bg-neutral-600 transition-colors disabled:opacity-50 cursor-pointer"
      >
        <RefreshCw
          className={`w-4 h-4 sm:w-5 sm:h-5 text-neutral-900 dark:text-white ${
            trustlineStatus.checking ? "animate-spin" : ""
          }`}
        />
      </button>
    </div>
  );
}
