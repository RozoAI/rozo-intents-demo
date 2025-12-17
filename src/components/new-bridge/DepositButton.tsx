"use client";

import { Button } from "@/components/ui/button";
import { useStellarWallet } from "@/contexts/StellarWalletContext";
import { IntentPayConfig } from "@/lib/intentPay";
import { PaymentCompletedEvent } from "@rozoai/intent-common";
import { RozoPayButton } from "@rozoai/intent-pay";
import { Loader2 } from "lucide-react";

interface DepositButtonProps {
  intentConfig: IntentPayConfig | null;
  ableToPay: boolean;
  isPreparingConfig: boolean;
  isFeeLoading?: boolean;
  hasFeeError?: boolean;
  onPaymentCompleted: (paymentData: PaymentCompletedEvent) => void;
}

export function DepositButton({
  intentConfig,
  ableToPay,
  isPreparingConfig,
  isFeeLoading = false,
  hasFeeError = false,
  onPaymentCompleted,
}: DepositButtonProps) {
  const { checkTrustline } = useStellarWallet();

  // Show disabled button while preparing config, loading fee, or has fee error
  if (isPreparingConfig || isFeeLoading || hasFeeError || !intentConfig) {
    return (
      <Button
        size="lg"
        className="w-full h-10 sm:h-14 text-sm sm:text-lg rounded-xl sm:rounded-2xl cursor-not-allowed"
        disabled
      >
        {(isPreparingConfig || isFeeLoading) && (
          <Loader2 className="size-4 sm:size-5 animate-spin" />
        )}
        {isFeeLoading
          ? "Loading fee..."
          : isPreparingConfig
          ? "Preparing..."
          : "Bridge USDC to Stellar"}
      </Button>
    );
  }

  // Show active RozoPayButton when ready
  if (ableToPay && intentConfig) {
    return (
      <RozoPayButton.Custom
        appId={intentConfig.appId}
        toChain={intentConfig.toChain}
        toToken={intentConfig.toToken}
        toAddress={intentConfig.toAddress}
        toUnits={intentConfig.toUnits}
        metadata={intentConfig.metadata as never}
        feeType={intentConfig.feeType}
        receiverMemo={intentConfig.receiverMemo || ""}
        preferredSymbol={intentConfig.preferredSymbol}
        onPaymentCompleted={onPaymentCompleted}
        onPayoutCompleted={checkTrustline}
        showProcessingPayout
        resetOnSuccess
      >
        {({ show }) => (
          <Button
            onClick={show}
            size="lg"
            className="w-full h-10 sm:h-14 text-sm sm:text-lg rounded-xl sm:rounded-2xl cursor-pointer"
          >
            Bridge USDC to Stellar
          </Button>
        )}
      </RozoPayButton.Custom>
    );
  }

  // Show disabled button when not ready
  return (
    <Button
      size="lg"
      className="w-full h-10 sm:h-14 text-sm sm:text-lg rounded-xl sm:rounded-2xl cursor-not-allowed"
      disabled
    >
      Bridge USDC to Stellar
    </Button>
  );
}
