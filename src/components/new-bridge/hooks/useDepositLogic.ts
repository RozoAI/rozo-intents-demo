"use client";

import { useStellarWallet } from "@/contexts/StellarWalletContext";
import { IntentPayConfig } from "@/lib/intentPay";
import {
  FeeType,
  PaymentCompletedEvent,
  rozoStellarEURC,
  rozoStellarUSDC,
  TokenSymbol,
} from "@rozoai/intent-common";
import { useRozoPayUI } from "@rozoai/intent-pay";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { saveStellarHistory } from "../utils/history";

interface UseDepositLogicProps {
  appId: string;
  isAdmin: boolean;
  amount: string | undefined;
  memo?: string;
  feeType: FeeType;
  destinationStellarAddress?: string;
  manualTrustlineExists?: boolean;
  currency: TokenSymbol[];
}

export function useDepositLogic({
  appId,
  amount,
  memo,
  feeType,
  destinationStellarAddress,
  manualTrustlineExists = false,
  isAdmin = false,
  currency = [TokenSymbol.USDC, TokenSymbol.USDT],
}: UseDepositLogicProps) {
  const {
    stellarConnected,
    stellarAddress,
    trustlineStatus,
    checkTrustline,
    checkXlmBalance,
  } = useStellarWallet();

  const { resetPayment } = useRozoPayUI();
  const queryClient = useQueryClient();

  const [intentConfig, setIntentConfig] = useState<IntentPayConfig | null>(
    null
  );
  const [isPreparingConfig, setIsPreparingConfig] = useState(false);

  // Determine which address and trustline status to use
  const targetAddress = destinationStellarAddress || stellarAddress;
  const hasTrustline = destinationStellarAddress
    ? manualTrustlineExists
    : trustlineStatus.exists;

  // Check if able to pay
  const ableToPay =
    !!amount &&
    parseFloat(amount) > 0 &&
    !!targetAddress &&
    hasTrustline &&
    !!intentConfig &&
    !isPreparingConfig;

  // Config preparation (no debounce needed - handled in parent)
  useEffect(() => {
    // If no amount or trustline doesn't exist, clear config
    if (!amount || parseFloat(amount) <= 0 || !hasTrustline || !targetAddress) {
      setIntentConfig(null);
      setIsPreparingConfig(false);
      return;
    }

    // Set preparing state and prepare config
    setIsPreparingConfig(true);

    const prepareConfig = async () => {
      try {
        const config: IntentPayConfig = {
          appId: appId,
          feeType: feeType,
          toChain: currency.includes(TokenSymbol.EURC)
            ? rozoStellarEURC.chainId
            : rozoStellarUSDC.chainId,
          toAddress: targetAddress,
          toToken: currency.includes(TokenSymbol.EURC)
            ? rozoStellarEURC.token
            : rozoStellarUSDC.token,
          toUnits: amount,
          preferredSymbol: currency,
          metadata: {
            intent: "Deposit",
            items: [
              {
                name: "ROZO Intents",
                description: `Transfer ${
                  currency.includes(TokenSymbol.EURC) ? "EURC" : "USDC"
                } to Stellar`,
              },
            ],
          },
          ...(memo ? { receiverMemo: memo } : {}),
        };

        await resetPayment(config as any);
        setIntentConfig(config);
      } catch (error) {
        console.error("Failed to prepare payment config:", error);
        setIntentConfig(null);
      } finally {
        setIsPreparingConfig(false);
      }
    };

    prepareConfig();
  }, [amount, memo, targetAddress, hasTrustline, isAdmin, appId, feeType]);

  const handlePaymentCompleted = (paymentData: PaymentCompletedEvent) => {
    toast.success(`Deposit is in progress! 🎉`, {
      description: `Your ${
        currency.includes(TokenSymbol.EURC) ? "EURC" : "USDC"
      } is being transferred. It may take a moment to appear in your wallet.`,
      duration: 5000,
    });

    // Save transaction history (only if wallet is connected)
    if (
      stellarConnected &&
      stellarAddress &&
      paymentData.rozoPaymentId &&
      amount
    ) {
      try {
        saveStellarHistory({
          walletAddress: stellarAddress,
          paymentId: paymentData.rozoPaymentId,
          amount: amount,
          destinationAddress: targetAddress,
          type: "deposit",
          fromChain: "Base", // From Base (or other chains)
          toChain: "Stellar", // To Stellar
          currency: currency.includes(TokenSymbol.EURC) ? "EURC" : "USDC",
        });

        // Dispatch custom event to update history
        window.dispatchEvent(new CustomEvent("stellar-payment-completed"));
      } catch (error) {
        console.error("Failed to save transaction history:", error);
      }
    }

    // Refresh balances (only if wallet is connected)
    if (stellarConnected) {
      checkTrustline();
      checkXlmBalance();
    }

    // Refresh analytics data
    queryClient.invalidateQueries({ queryKey: ["analytics"] });
  };

  return {
    intentConfig,
    ableToPay,
    isPreparingConfig,
    stellarConnected,
    handlePaymentCompleted,
  };
}
