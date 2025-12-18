"use client";

import { formatAddress } from "@/lib/utils";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Clock,
  ExternalLink,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  clearStellarHistoryForWallet,
  getStellarHistoryForWallet,
  removeDuplicateStellarPayments,
  ROZO_STELLAR_HISTORY_STORAGE_KEY,
  StellarHistoryItem,
} from "./utils/history";

interface HistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  walletAddress: string;
}

export function HistoryDialog({
  open,
  onOpenChange,
  walletAddress,
}: HistoryDialogProps) {
  const [history, setHistory] = useState<StellarHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadHistory = useCallback(() => {
    try {
      // First, clean up any existing duplicates
      removeDuplicateStellarPayments(walletAddress);

      const stellarHistory = getStellarHistoryForWallet(walletAddress);

      // Sort by date descending (newest first)
      const sortedHistory = stellarHistory.sort(
        (a, b) =>
          new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
      );

      setHistory(sortedHistory);
    } catch (error) {
      console.error("Error loading history:", error);
    } finally {
      setIsLoading(false);
    }
  }, [walletAddress]);

  // Load history when dialog opens
  useEffect(() => {
    if (open) {
      setIsLoading(true);
      loadHistory();
    }
  }, [open, loadHistory]);

  // Listen for storage changes to refetch when payment is completed
  useEffect(() => {
    if (!open) return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === ROZO_STELLAR_HISTORY_STORAGE_KEY) {
        loadHistory();
      }
    };

    const handleCustomEvent = () => {
      loadHistory();
    };

    // Listen for storage changes (works across tabs)
    window.addEventListener("storage", handleStorageChange);

    // Listen for custom payment completed events (works within same tab)
    window.addEventListener("stellar-payment-completed", handleCustomEvent);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener(
        "stellar-payment-completed",
        handleCustomEvent
      );
    };
  }, [open, loadHistory]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleClearHistory = () => {
    try {
      clearStellarHistoryForWallet(walletAddress);
      setHistory([]);
    } catch (error) {
      console.error("Error clearing history:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Transaction History</DialogTitle>
          <DialogDescription>
            Your completed bridge transactions
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground text-sm">
                Loading history...
              </div>
            </div>
          ) : history.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8">
              <Clock className="text-muted-foreground h-10 w-10" />
              <p className="text-muted-foreground text-sm font-medium">
                No transaction history yet
              </p>
              <p className="text-muted-foreground text-xs text-center max-w-sm">
                Your completed deposits and withdrawals will appear here
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-muted-foreground">
                  {history.length} transaction{history.length !== 1 ? "s" : ""}
                </p>
                <button
                  onClick={handleClearHistory}
                  className="text-muted-foreground hover:text-destructive flex cursor-pointer items-center gap-1.5 text-xs transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Clear History
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="bg-neutral-100 hover:bg-neutral-200 border-neutral-200 dark:bg-neutral-900/50 dark:hover:bg-neutral-900 dark:border-neutral-800 flex flex-col gap-3 rounded-lg border p-2 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        {item.type === "deposit" ? (
                          <div className="rounded-full bg-green-500/20 dark:bg-green-500/10 p-2">
                            <ArrowUpRight className="h-4 w-4 text-green-600 dark:text-green-500" />
                          </div>
                        ) : (
                          <div className="rounded-full bg-blue-500/20 dark:bg-blue-500/10 p-2">
                            <ArrowDownLeft className="h-4 w-4 text-blue-600 dark:text-blue-500" />
                          </div>
                        )}
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-neutral-900 dark:text-white">
                            {item.amount} {item.currency || "USDC"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {item.type === "deposit" ? "Deposit" : "Withdraw"}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-muted-foreground block">
                          {formatDate(item.completedAt)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-neutral-200 dark:border-neutral-800">
                      <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            To:
                          </span>
                          <span className="text-xs font-medium text-neutral-900 dark:text-neutral-100 truncate">
                            {formatAddress(item.destinationAddress)} on{" "}
                            {item.toChain}
                          </span>
                        </div>
                      </div>
                      <Link
                        href={`https://invoice.rozo.ai/receipt?id=${item.paymentId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 text-xs transition-colors whitespace-nowrap px-3 py-2 rounded-md hover:bg-neutral-200 dark:hover:bg-neutral-800"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        View Receipt
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
