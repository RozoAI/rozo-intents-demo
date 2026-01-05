"use client";

import { formatAddress } from "@/lib/utils";
import {
  arbitrum,
  base,
  bsc,
  ethereum,
  polygon,
  rozoSolana,
  rozoStellar,
  TokenLogo,
} from "@rozoai/intent-common";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  ExternalLink,
  Loader2,
  Trash2,
  XCircle,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  Arbitrum,
  Base,
  BinanceSmartChain,
  Ethereum,
  Polygon,
  Solana,
  Stellar,
} from "../icons/chains";
import { Badge } from "../ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  BridgeHistoryItem,
  clearAllBridgeHistory,
  getAllBridgeHistory,
  ROZO_BRIDGE_HISTORY_STORAGE_KEY,
} from "./utils/bridgeHistory";

interface BridgeHistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  walletAddress?: string | null;
}

const chainToLogo = {
  [arbitrum.chainId]: <Arbitrum width={16} height={16} />,
  [base.chainId]: <Base width={16} height={16} />,
  [bsc.chainId]: <BinanceSmartChain width={16} height={16} />,
  [ethereum.chainId]: (
    <Ethereum width={16} height={16} className="rounded-full" />
  ),
  [polygon.chainId]: <Polygon width={16} height={16} />,
  [rozoSolana.chainId]: <Solana width={16} height={16} />,
  [rozoStellar.chainId]: (
    <Stellar width={16} height={16} className="rounded-full" />
  ),
};

export function BridgeHistoryModal({
  open,
  onOpenChange,
  walletAddress,
}: BridgeHistoryModalProps) {
  const [history, setHistory] = useState<BridgeHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadHistory = useCallback(() => {
    try {
      // Get all bridge history (flat array structure)
      const bridgeHistory = getAllBridgeHistory();

      setHistory(bridgeHistory);
    } catch (error) {
      console.error("Error loading bridge history:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

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
      if (e.key === ROZO_BRIDGE_HISTORY_STORAGE_KEY) {
        loadHistory();
      }
    };

    const handleCustomEvent = () => {
      loadHistory();
    };

    // Listen for storage changes (works across tabs)
    window.addEventListener("storage", handleStorageChange);

    // Listen for custom bridge payment completed events (works within same tab)
    window.addEventListener("bridge-payment-completed", handleCustomEvent);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("bridge-payment-completed", handleCustomEvent);
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
      clearAllBridgeHistory();
      setHistory([]);
    } catch (error) {
      console.error("Error clearing bridge history:", error);
    }
  };

  const getStatusBadge = (status: BridgeHistoryItem["status"]) => {
    switch (status) {
      case "completed":
        return (
          <Badge
            variant="default"
            className="bg-green-500/20 text-green-600 dark:text-green-500"
          >
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        );
      case "pending":
        return (
          <Badge
            variant="default"
            className="bg-yellow-500/20 text-yellow-600 dark:text-yellow-500"
          >
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Pending
          </Badge>
        );
      case "failed":
        return (
          <Badge
            variant="default"
            className="bg-red-500/20 text-red-600 dark:text-red-500"
          >
            <XCircle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md! max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Bridge Transaction History</DialogTitle>
          <DialogDescription>
            Your completed bridge transactions across all chains
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
                No bridge transactions yet
              </p>
              <p className="text-muted-foreground text-xs text-center max-w-sm">
                Your completed bridge transactions will appear here
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

              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="bg-neutral-100 hover:bg-neutral-200 border-neutral-200 dark:bg-neutral-900/50 dark:hover:bg-neutral-900 dark:border-neutral-800 flex flex-col gap-3 rounded-lg border p-4 transition-colors"
                  >
                    {/* Header: Amount, Status, Date */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-neutral-900 dark:text-white">
                          {item.amount} {item.sourceTokenSymbol}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-muted-foreground block">
                          {formatDate(item.completedAt)}
                        </span>
                      </div>
                    </div>

                    {/* Bridge Flow: Source -> Destination */}
                    <div className="flex items-center gap-2 py-1.5">
                      {/* Source */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <div className="relative">
                          <Image
                            src={
                              item.sourceTokenSymbol === "USDC"
                                ? TokenLogo.USDC
                                : item.sourceTokenSymbol === "EURC"
                                ? TokenLogo.EURC
                                : TokenLogo.USDT
                            }
                            alt={item.sourceTokenSymbol}
                            width={24}
                            height={24}
                            className="size-6"
                          />
                          <div className="absolute -bottom-0.5 -right-0.5 rounded-full scale-90">
                            {chainToLogo[item.sourceChainId]}
                          </div>
                        </div>
                        <span className="text-xs font-medium text-neutral-900 dark:text-white">
                          {item.sourceChainName}
                        </span>
                      </div>

                      {/* Arrow */}
                      <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 mx-1" />

                      {/* Destination */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <div className="relative">
                          <Image
                            src={
                              item.destinationTokenSymbol === "USDC"
                                ? TokenLogo.USDC
                                : item.destinationTokenSymbol === "EURC"
                                ? TokenLogo.EURC
                                : TokenLogo.USDT
                            }
                            alt={item.destinationTokenSymbol}
                            width={24}
                            height={24}
                            className="size-6"
                          />
                          <div className="absolute -bottom-0.5 -right-0.5 rounded-full scale-90">
                            {chainToLogo[item.destinationChainId]}
                          </div>
                        </div>
                        <span className="text-xs font-medium text-neutral-900 dark:text-white">
                          {item.destinationChainName}
                        </span>
                      </div>

                      <div className="ml-auto">
                        {getStatusBadge(item.status)}
                      </div>
                    </div>

                    {/* Footer: Destination Address, Transaction Links, Receipt */}
                    <div className="flex items-end justify-between">
                      <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            To:
                          </span>
                          <span className="text-xs font-medium text-neutral-900 dark:text-neutral-100 truncate">
                            {formatAddress(item.destinationAddress)}
                          </span>
                        </div>
                      </div>
                      {item.rozoPaymentId && (
                        <Link
                          href={`https://invoice.rozo.ai/receipt?id=${item.rozoPaymentId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 text-xs whitespace-nowrap"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          View Receipt
                        </Link>
                      )}
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
