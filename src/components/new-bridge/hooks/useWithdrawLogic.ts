"use client";

import { useStellarWallet } from "@/contexts/StellarWalletContext";
import { useStellarTransfer } from "@/hooks/use-stellar-transfer";
import { useToastQueue } from "@/hooks/use-toast-queue";
import { FeeType } from "@rozoai/intent-common";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { saveStellarHistory } from "../utils/history";

interface UseWithdrawLogicProps {
  currency: "USDC" | "EURC";
  amount: string | undefined;
  feeAmount: string | undefined;
  destinationAddress: string;
  destinationChainId: number;
  onLoadingChange: (loading: boolean) => void;
  feeType: FeeType;
  isAdmin?: boolean;
}

export function useWithdrawLogic({
  currency = "USDC",
  amount,
  feeAmount,
  destinationAddress,
  destinationChainId,
  onLoadingChange,
  feeType,
  isAdmin = false,
}: UseWithdrawLogicProps) {
  const { stellarAddress, checkTrustline, checkXlmBalance } =
    useStellarWallet();
  const { transfer, step, paymentId, setStep } = useStellarTransfer(
    isAdmin,
    feeType
  );
  const queryClient = useQueryClient();
  const {
    currentToastId,
    updateCurrentToast,
    completeCurrentToast,
    errorCurrentToast,
    dismissCurrentToast,
    clearQueue,
  } = useToastQueue();

  // Store refs for stable callbacks
  const updateToastRef = useRef(updateCurrentToast);
  const completeToastRef = useRef(completeCurrentToast);
  const errorToastRef = useRef(errorCurrentToast);
  const dismissToastRef = useRef(dismissCurrentToast);

  useEffect(() => {
    updateToastRef.current = updateCurrentToast;
    completeToastRef.current = completeCurrentToast;
    errorToastRef.current = errorCurrentToast;
    dismissToastRef.current = dismissCurrentToast;
  });

  // Handle toast progress for withdrawal
  useEffect(() => {
    if (step) {
      if (!currentToastId) {
        updateToastRef.current("Preparing...", {
          position: "bottom-center",
        });
        return;
      }

      if (step === "create-payment") {
        updateToastRef.current("📝 Creating payment order...");
      } else if (step === "sign-transaction") {
        updateToastRef.current("✍️ Sign transaction in wallet");
      } else if (step === "submit-transaction") {
        updateToastRef.current("🚀 Sending to Stellar network...");
      } else if (step === "success") {
        // Save transaction history when withdrawal is successful
        if (stellarAddress && paymentId && amount) {
          try {
            // Get destination chain name
            const destinationChainName = (() => {
              switch (destinationChainId) {
                case 8453:
                  return "Base";
                case 137:
                  return "Polygon";
                case 1:
                  return "Ethereum";
                case 900:
                  return "Solana";
                default:
                  return "Base";
              }
            })();

            saveStellarHistory({
              walletAddress: stellarAddress,
              paymentId: paymentId,
              amount: amount,
              destinationAddress: destinationAddress,
              type: "withdraw",
              fromChain: "Stellar",
              toChain: destinationChainName,
              currency: currency,
            });

            // Dispatch custom event to update history
            window.dispatchEvent(new CustomEvent("stellar-payment-completed"));
          } catch (error) {
            console.error("Failed to save transaction history:", error);
          }
        }

        // Refresh analytics data
        queryClient.invalidateQueries({ queryKey: ["analytics"] });

        // Get destination chain name for toast message
        const destinationChainName = (() => {
          switch (destinationChainId) {
            case 8453:
              return "Base";
            case 137:
              return "Polygon";
            case 1:
              return "Ethereum";
            case 900:
              return "Solana";
            default:
              return "Base";
          }
        })();

        completeToastRef.current("Withdrawal complete!", {
          action: paymentId
            ? {
                label: "See Receipt",
                type: "button",
                onClick: () => {
                  window.open(
                    `https://invoice.rozo.ai/receipt?id=${paymentId}`,
                    "_blank"
                  );
                  dismissToastRef.current();
                  setStep(null);
                },
              }
            : undefined,
          duration: Infinity,
          closeButton: true,
          description: `Funds incoming to ${destinationChainName}. Please check your wallet soon.`,
          dismissible: true,
        });
      } else if (step === "error") {
        errorToastRef.current("❌ Withdrawal failed. Please try again.", {
          duration: 5000,
          closeButton: true,
        });
        setStep(null);
      }
    }
  }, [
    step,
    currentToastId,
    paymentId,
    stellarAddress,
    amount,
    destinationAddress,
    destinationChainId,
    setStep,
  ]);

  const handleWithdraw = async () => {
    if (!amount || amount === "" || !feeAmount || feeAmount === "") return;

    // Clear any existing toasts and reset queue
    clearQueue();

    // Reset step state to ensure clean start
    setStep(null);

    // Small delay to ensure previous toast is dismissed
    await new Promise((resolve) => setTimeout(resolve, 100));

    try {
      onLoadingChange(true);
      const result = await transfer({
        amount,
        feeAmount,
        currency,
        address: destinationAddress,
        chainId: destinationChainId,
      });

      if (result) {
        checkTrustline();
        checkXlmBalance();
      } else {
        errorToastRef.current("Failed to withdraw", {
          duration: 5000,
          closeButton: true,
        });
        setStep(null);
      }
    } catch (error) {
      console.error("Failed to withdraw:", error);

      // Extract meaningful error message
      let errorMessage = "Failed to withdraw";
      if (error && typeof error === "object" && "message" in error) {
        const axiosError = error as any;
        if (axiosError.response?.status === 504) {
          errorMessage = "Request timeout - please try again";
        } else if (axiosError.response?.status) {
          errorMessage = `Request failed (${axiosError.response.status}) - please try again`;
        } else if (axiosError.message) {
          errorMessage = `Withdrawal failed: ${axiosError.message}`;
        }
      }

      errorToastRef.current(errorMessage, {
        duration: 5000,
        closeButton: true,
      });
      setStep(null);
    } finally {
      onLoadingChange(false);
    }
  };

  return { handleWithdraw };
}
