"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useStellarWallet } from "@/contexts/StellarWalletContext";
import { cn } from "@/lib/utils";
import { TokenLogo } from "@rozoai/intent-common";
import {
  AlertTriangle,
  ChevronDown,
  Copy,
  Loader2,
  LogOut,
  Plus,
  RefreshCw,
  Wallet,
} from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { Stellar } from "./icons/chains";

interface StellarWalletConnectProps {
  className?: string;
  disabled?: boolean;
}

export function StellarWalletConnect({
  className,
  disabled,
}: StellarWalletConnectProps) {
  const {
    stellarAddress,
    stellarConnected,
    stellarConnecting,
    connectStellarWallet,
    disconnectStellarWallet,
    stellarWalletName,
    usdcTrustline,
    eurcTrustline,
    xlmBalance,
    createTrustline,
    checkXlmBalance,
    checkTrustline,
  } = useStellarWallet();

  const handleConnect = async () => {
    try {
      await connectStellarWallet();
    } catch (error) {
      console.error("Failed to connect Stellar wallet:", error);
    }
  };

  const handleDisconnect = async () => {
    try {
      disconnectStellarWallet();
      toast.success("Stellar wallet disconnected successfully");
    } catch (error) {
      console.error("Failed to disconnect Stellar wallet:", error);
      toast.error("Failed to disconnect wallet. Please try again.");
    }
  };

  const formatStellarAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  const copyAddress = async () => {
    if (stellarAddress) {
      try {
        await navigator.clipboard.writeText(stellarAddress);
        toast.success("Stellar address copied to clipboard");
      } catch (error) {
        console.warn("Failed to copy Stellar address:", error);
      }
    }
  };

  const handleCreateTrustline = async (currency?: "USDC" | "EURC") => {
    try {
      await createTrustline(currency);
    } catch (error) {
      console.error(
        `Failed to create ${currency || "token"} trustline:`,
        error
      );
    }
  };

  const handleRefreshBalances = async () => {
    try {
      await Promise.all([checkXlmBalance(), checkTrustline()]);
      toast.success("Balances refreshed");
    } catch (error) {
      console.error("Failed to refresh balances:", error);
      toast.error("Failed to refresh balances");
    }
  };

  if (!stellarConnected) {
    return (
      <Button
        className={cn("flex items-center gap-1.5 sm:gap-2", className)}
        onClick={handleConnect}
        disabled={stellarConnecting || disabled}
      >
        <Wallet className="size-3.5 sm:size-4" />
        <span className="text-xs sm:text-base">
          {stellarConnecting ? "Connecting..." : "Connect Stellar Wallet"}
        </span>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          className={cn("flex items-center gap-1.5 sm:gap-2", className)}
          disabled={disabled}
        >
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Wallet className="size-3.5 sm:size-4" />
            <span className="font-mono text-xs sm:text-base">
              {formatStellarAddress(stellarAddress)}
            </span>
          </div>
          <ChevronDown className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72 sm:w-80">
        {/* Account Info */}
        <div className="p-2.5 sm:p-3 border-b">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-sm sm:text-base">
                Stellar Connected
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground font-mono mt-0.5 sm:mt-1 font-medium">
                {formatStellarAddress(stellarAddress)}
              </div>
              <div className="text-[10px] sm:text-xs text-muted-foreground font-mono mt-0.5 sm:mt-1">
                {stellarWalletName}
              </div>
            </div>
            <div className="flex items-center gap-0.5 sm:gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefreshBalances}
                className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                disabled={
                  xlmBalance.checking ||
                  usdcTrustline.checking ||
                  eurcTrustline.checking
                }
              >
                <RefreshCw
                  className={cn(
                    "size-3.5 sm:size-4",
                    (xlmBalance.checking ||
                      usdcTrustline.checking ||
                      eurcTrustline.checking) &&
                      "animate-spin"
                  )}
                />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={copyAddress}
                className="h-7 w-7 sm:h-8 sm:w-8 p-0"
              >
                <Copy className="size-3.5 sm:size-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Balances */}
        <div className="p-2.5 sm:p-3 border-b space-y-2.5 sm:space-y-4">
          {/* XLM Balance */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Stellar className="size-[18px] sm:size-[20px] rounded-full" />
              <span className="text-xs sm:text-sm font-medium">XLM</span>
            </div>
            <span className="text-xs sm:text-sm font-mono">
              {xlmBalance.checking ? (
                <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
              ) : (
                `${Number(xlmBalance.balance).toFixed(2)} XLM`
              )}
            </span>
          </div>

          {/* USDC Trustline Status */}
          <div className="space-y-1.5 sm:space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Image
                  src={TokenLogo.USDC}
                  alt="USDC"
                  width={18}
                  height={18}
                  className="w-[18px] h-[18px] sm:w-5 sm:h-5 rounded-full"
                />
                <span className="text-xs sm:text-sm font-medium">USDC</span>
              </div>
              {usdcTrustline.checking ? (
                <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
              ) : usdcTrustline.exists ? (
                <span className="text-xs sm:text-sm font-mono">
                  {Number(usdcTrustline.balance).toFixed(2)} USDC
                </span>
              ) : (
                <div className="text-[10px] sm:text-xs text-yellow-600 flex items-center gap-0.5 sm:gap-1">
                  <AlertTriangle className="inline w-3 h-3 sm:w-4 sm:h-4 text-yellow-500" />
                  Trustline required
                </div>
              )}
            </div>

            {!usdcTrustline.checking && !usdcTrustline.exists && (
              <div className="space-y-1.5 sm:space-y-2">
                {xlmBalance.checking ? (
                  <div className="text-[10px] sm:text-xs text-gray-500 flex items-center gap-1">
                    <Loader2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 animate-spin" />
                    Checking XLM...
                  </div>
                ) : parseFloat(xlmBalance.balance) >= 1.5 ? (
                  <Button
                    size="sm"
                    onClick={() => handleCreateTrustline("USDC")}
                    className="w-full h-6 sm:h-7 text-[10px] sm:text-xs"
                    disabled={usdcTrustline.creating}
                  >
                    {usdcTrustline.creating ? (
                      <Loader2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 animate-spin" />
                    ) : (
                      <Plus className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    )}
                    {usdcTrustline.creating
                      ? "Adding USDC..."
                      : "Add USDC Trustline"}
                  </Button>
                ) : (
                  <div className="text-[10px] sm:text-xs text-red-600">
                    Need 1.5 XLM for trustline
                  </div>
                )}
              </div>
            )}
          </div>

          {/* EURC Trustline Status */}
          <div className="space-y-1.5 sm:space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Image
                  src={TokenLogo.EURC}
                  alt="EURC"
                  width={18}
                  height={18}
                  className="w-[18px] h-[18px] sm:w-5 sm:h-5 rounded-full"
                />
                <span className="text-xs sm:text-sm font-medium">EURC</span>
              </div>
              {eurcTrustline.checking ? (
                <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
              ) : eurcTrustline.exists ? (
                <span className="text-xs sm:text-sm font-mono">
                  {Number(eurcTrustline.balance).toFixed(2)} EURC
                </span>
              ) : (
                <div className="text-[10px] sm:text-xs text-yellow-600 flex items-center gap-0.5 sm:gap-1">
                  <AlertTriangle className="inline w-3 h-3 sm:w-4 sm:h-4 text-yellow-500" />
                  Trustline required
                </div>
              )}
            </div>

            {!eurcTrustline.checking && !eurcTrustline.exists && (
              <div className="space-y-1.5 sm:space-y-2">
                {xlmBalance.checking ? (
                  <div className="text-[10px] sm:text-xs text-gray-500 flex items-center gap-1">
                    <Loader2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 animate-spin" />
                    Checking XLM...
                  </div>
                ) : parseFloat(xlmBalance.balance) >= 1.5 ? (
                  <Button
                    size="sm"
                    onClick={() => handleCreateTrustline("EURC")}
                    className="w-full h-6 sm:h-7 text-[10px] sm:text-xs"
                    disabled={eurcTrustline.creating}
                  >
                    {eurcTrustline.creating ? (
                      <Loader2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 animate-spin" />
                    ) : (
                      <Plus className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    )}
                    {eurcTrustline.creating
                      ? "Adding EURC..."
                      : "Add EURC Trustline"}
                  </Button>
                ) : (
                  <div className="text-[10px] sm:text-xs text-red-600">
                    Need 1.5 XLM for trustline
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Disconnect */}
        <DropdownMenuItem
          onClick={handleDisconnect}
          variant="destructive"
          className="text-xs sm:text-sm"
        >
          <LogOut className="size-3.5 sm:size-4" />
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
