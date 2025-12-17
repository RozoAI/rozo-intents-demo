"use client";

import { Button } from "@/components/ui/button";
import { useStellarWallet } from "@/contexts/StellarWalletContext";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export function TrustlineWarning() {
  const {
    createTrustline,
    trustlineStatus,
    xlmBalance,
    stellarConnected,
    currency,
  } = useStellarWallet();

  const handleCreateTrustline = async () => {
    // Check XLM balance before creating trustline
    const xlmBalanceNum = parseFloat(xlmBalance.balance);
    if (xlmBalanceNum < 1.5) {
      toast.error("Insufficient XLM balance", {
        description: `You need at least 1.5 XLM to create a ${currency} trustline. Please add more XLM to your wallet.`,
        duration: 5000,
      });
      return;
    }

    // If balance is sufficient, proceed with trustline creation
    await createTrustline();
  };

  // Don't show if checking, has trustline, or not connected
  if (!stellarConnected || trustlineStatus.checking || trustlineStatus.exists) {
    return null;
  }

  const hasEnoughXLM = parseFloat(xlmBalance.balance) >= 1.5;

  if (hasEnoughXLM) {
    return (
      <div className="p-4 rounded-xl border border-red-500/20 bg-red-50 dark:bg-red-500/10">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
          <div className="space-y-3 flex-1">
            <div>
              <p className="font-medium text-red-900 dark:text-red-100 text-sm">
                {currency} Trustline Required
              </p>
              <p className="text-xs text-red-700 dark:text-red-200/80 mt-1">
                Your Stellar wallet needs to establish a trustline for{" "}
                {currency} to receive deposits. This is a one-time setup.
              </p>
            </div>
            <Button
              onClick={handleCreateTrustline}
              disabled={trustlineStatus.checking}
              size="sm"
              className="bg-red-600 hover:bg-red-700 text-white h-9"
            >
              {trustlineStatus.checking
                ? "Creating..."
                : `Create ${currency} Trustline`}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-xl border border-orange-500/20 bg-orange-50 dark:bg-orange-500/10">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400 mt-0.5" />
        <div className="space-y-1">
          <p className="font-medium text-orange-900 dark:text-orange-100 text-sm">
            Insufficient XLM Balance
          </p>
          <p className="text-xs text-orange-700 dark:text-orange-200/80">
            You need at least 1.5 XLM to create a {currency} trustline. Current
            balance: {xlmBalance.balance} XLM
          </p>
        </div>
      </div>
    </div>
  );
}
