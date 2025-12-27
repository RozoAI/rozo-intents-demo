"use client";

import { getChainLogoUrl, getTokenLogoUrl } from "@/lib/crypto-logos";
import { formatAddress } from "@/lib/utils";
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
  clearBridgeHistoryForWallet,
  getBridgeHistoryForWallet,
  removeDuplicateBridgePayments,
  ROZO_BRIDGE_HISTORY_STORAGE_KEY,
} from "./utils/bridgeHistory";

interface BridgeHistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  walletAddress: string;
}

export function BridgeHistoryModal({
  open,
  onOpenChange,
  walletAddress,
}: BridgeHistoryModalProps) {
  const [history, setHistory] = useState<BridgeHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadHistory = useCallback(() => {
    try {
      // First, clean up any existing duplicates
      removeDuplicateBridgePayments(walletAddress);

      const bridgeHistory = getBridgeHistoryForWallet(walletAddress);

      setHistory(bridgeHistory);
    } catch (error) {
      console.error("Error loading bridge history:", error);
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
      clearBridgeHistoryForWallet(walletAddress);
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

  const getExplorerUrl = (chainId: number, txHash?: string) => {
    if (!txHash) return null;

    // Map chain IDs to explorer URLs
    const explorerMap: Record<number, string> = {
      1: `https://etherscan.io/tx/${txHash}`, // Ethereum
      8453: `https://basescan.org/tx/${txHash}`, // Base
      42161: `https://arbiscan.io/tx/${txHash}`, // Arbitrum
      10: `https://optimistic.etherscan.io/tx/${txHash}`, // Optimism
      137: `https://polygonscan.com/tx/${txHash}`, // Polygon
      56: `https://bscscan.com/tx/${txHash}`, // BSC
      900: `https://explorer.solana.com/tx/${txHash}`, // Solana
      1500: `https://stellar.expert/explorer/public/tx/${txHash}`, // Stellar
    };

    return explorerMap[chainId] || null;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
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
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <Image
                            src={getTokenLogoUrl(item.sourceTokenSymbol)}
                            alt={item.sourceTokenSymbol}
                            width={24}
                            height={24}
                            className="w-6 h-6 rounded-full"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = "/globe.svg";
                            }}
                          />
                          <span className="text-base font-semibold text-neutral-900 dark:text-white">
                            {item.amount} {item.sourceTokenSymbol}
                          </span>
                        </div>
                        {getStatusBadge(item.status)}
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-muted-foreground block">
                          {formatDate(item.completedAt)}
                        </span>
                      </div>
                    </div>

                    {/* Bridge Flow: Source -> Destination */}
                    <div className="flex items-center gap-3 py-2">
                      {/* Source Chain */}
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="relative">
                          <Image
                            src={getChainLogoUrl(item.sourceChainId)}
                            alt={item.sourceChainName}
                            width={32}
                            height={32}
                            className="w-8 h-8 rounded-full"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = "/globe.svg";
                            }}
                          />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-medium text-neutral-900 dark:text-white truncate">
                            {item.sourceChainName}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {item.sourceTokenSymbol}
                          </span>
                        </div>
                      </div>

                      {/* Arrow */}
                      <ArrowRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />

                      {/* Destination Chain */}
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="relative">
                          <Image
                            src={getChainLogoUrl(item.destinationChainId)}
                            alt={item.destinationChainName}
                            width={32}
                            height={32}
                            className="w-8 h-8 rounded-full"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = "/globe.svg";
                            }}
                          />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-medium text-neutral-900 dark:text-white truncate">
                            {item.destinationChainName}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {item.destinationTokenSymbol}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Footer: Destination Address, Transaction Links, Receipt */}
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-neutral-200 dark:border-neutral-800">
                      <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            To:
                          </span>
                          <span className="text-xs font-medium text-neutral-900 dark:text-neutral-100 truncate">
                            {formatAddress(item.destinationAddress)}
                          </span>
                        </div>
                        {/* Transaction Hashes */}
                        <div className="flex items-center gap-3 flex-wrap">
                          {item.sourceTxHash && (
                            <a
                              href={
                                getExplorerUrl(
                                  item.sourceChainId,
                                  item.sourceTxHash
                                ) || "#"
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                            >
                              <ExternalLink className="h-3 w-3" />
                              Source TX
                            </a>
                          )}
                          {item.destinationTxHash && (
                            <a
                              href={
                                getExplorerUrl(
                                  item.destinationChainId,
                                  item.destinationTxHash
                                ) || "#"
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                            >
                              <ExternalLink className="h-3 w-3" />
                              Destination TX
                            </a>
                          )}
                        </div>
                      </div>
                      {item.rozoPaymentId && (
                        <Link
                          href={`https://invoice.rozo.ai/receipt?id=${item.rozoPaymentId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 text-xs transition-colors whitespace-nowrap px-3 py-2 rounded-md hover:bg-neutral-200 dark:hover:bg-neutral-800"
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
