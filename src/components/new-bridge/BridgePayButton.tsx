import { useStellarWallet } from "@/contexts/StellarWalletContext";
import {
  ExternalPaymentOptions,
  ExternalPaymentOptionsString,
  FeeType,
  generateIntentTitle,
  PaymentCompletedEvent,
  PaymentPayoutCompletedEvent,
  RozoPayUserMetadata,
  rozoSolana,
  rozoStellar,
  Token,
  TokenSymbol,
} from "@rozoai/intent-common";
import { RozoPayButton, useRozoPayUI } from "@rozoai/intent-pay";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useAccount } from "wagmi";
import { Button } from "../ui/button";
import { useBridge } from "./providers/BridgeProvider";

interface PayParams {
  /** App ID, for authentication. */
  appId: string;
  /** Destination chain ID. */
  toChain: number;
  /** The destination token to send. Address for EVM, string for non-EVM. */
  toToken: string;
  /**
   * The amount of the token to send.
   * If not provided, the user will be prompted to enter an amount.
   */
  toUnits?: string;
  /** The final EVM address to transfer to or contract to call. */
  toAddress?: string;
  /** The intent verb, such as Pay, Deposit, or Purchase. Default: Pay */
  intent?: string;
  /** Payment options. By default, all are enabled. */
  paymentOptions?: ExternalPaymentOptionsString[];
  /** Preferred chain IDs. */
  preferredChains?: number[];
  /** Preferred tokens. These appear first in the token list. */
  preferredTokens?: Token[];
  /** Preferred token symbols to filter. Only tokens with these symbols will be shown. Default: ["USDC", "USDT"] */
  preferredSymbol?: TokenSymbol[];
  /** Developer metadata. E.g. correlation ID. */
  metadata?: RozoPayUserMetadata;
  /** The fee type to use for the payment. */
  feeType?: FeeType;
  /** The memo to use for the payment. Only used for rozoSolana (900) and rozoStellar (1500). */
  receiverMemo?: string;
  connectedWalletOnly?: boolean;
}

interface BridgePayButtonProps {
  appId: string;
  amount: string;
  feeType: FeeType;
}

export function BridgePayButton({
  appId,
  amount,
  feeType,
}: BridgePayButtonProps) {
  const bridge = useBridge();
  const { resetPayment } = useRozoPayUI();
  const { stellarConnected, stellarAddress, checkTrustline } =
    useStellarWallet();
  const { address: evmAddress, isConnected: evmConnected } = useAccount();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const [isPreparingPayment, setIsPreparingPayment] = useState(false);

  // Extract referral code from URL query parameter
  const referralCode = searchParams.get("ref");

  // Get wallet address based on source chain (returns null for unauthenticated users)
  const getWalletAddress = useCallback((): string | null => {
    if (!bridge.sourceChain) return null;

    // If source is Stellar, use Stellar address
    if (bridge.sourceChain.chainId === rozoStellar.chainId) {
      return stellarConnected && stellarAddress ? stellarAddress : null;
    }

    // For EVM chains, use EVM address
    if (evmConnected && evmAddress) {
      return evmAddress;
    }

    // Return null for unauthenticated users (no fallback to timestamp)
    return null;
  }, [
    bridge.sourceChain,
    stellarConnected,
    stellarAddress,
    evmConnected,
    evmAddress,
  ]);

  // Check if bridge state is valid for saving transaction
  const isBridgeStateValid = useCallback((): boolean => {
    return !!(
      bridge.sourceChain &&
      bridge.sourceToken &&
      bridge.destinationChain &&
      bridge.destinationToken &&
      bridge.destinationAddress
    );
  }, [
    bridge.sourceChain,
    bridge.sourceToken,
    bridge.destinationChain,
    bridge.destinationToken,
    bridge.destinationAddress,
  ]);

  // Handle payment completed
  const handlePaymentCompleted = useCallback(
    (event: PaymentCompletedEvent) => {
      if (isBridgeStateValid()) {
        try {
          toast.success("Payment completed!", {
            description: `Your ${bridge.sourceToken?.symbol} (${bridge.sourceChain?.name}) payment has been started. It may take a moment to complete.`,
            duration: 5000,
          });
          const walletAddress = getWalletAddress();

          bridge.saveTransaction({
            walletAddress,
            paymentId: event.paymentId,
            rozoPaymentId: event.rozoPaymentId,
            amount: amount,
            sourceTxHash: event.txHash,
            status: "completed",
          });
        } catch (error) {
          console.error("Failed to save bridge transaction:", error);
        }
      }
    },
    [amount, isBridgeStateValid, getWalletAddress, bridge]
  );

  // Handle payout completed
  const handlePayoutCompleted = useCallback(
    (event: PaymentPayoutCompletedEvent) => {
      if (isBridgeStateValid()) {
        try {
          toast.success("Payout completed!", {
            description: `Your ${bridge.destinationToken?.symbol} (${bridge.destinationChain?.name}) payout has been completed successfully.`,
            duration: 5000,
          });

          const walletAddress = getWalletAddress();

          bridge.saveTransaction({
            walletAddress,
            paymentId: event.paymentId,
            rozoPaymentId: event.rozoPaymentId,
            amount: amount,
            sourceTxHash: event.paymentTx?.hash,
            destinationTxHash: event.payoutTx?.hash,
            status: "completed",
          });

          if (walletAddress) {
            checkTrustline().catch((error) => {
              console.error("Failed to check trustline:", error);
            });
            queryClient.invalidateQueries({
              queryKey: ["rewards", walletAddress],
            });
          }
        } catch (error) {
          console.error("Failed to save bridge transaction:", error);
        }
      }
    },
    [amount, isBridgeStateValid, getWalletAddress, bridge, checkTrustline, queryClient]
  );

  const intentConfig: PayParams | null = useMemo(() => {
    if (
      !bridge.sourceToken ||
      !bridge.destinationChain ||
      !bridge.destinationToken ||
      !bridge.sourceChain ||
      !bridge.destinationAddress
    ) {
      return null;
    }

    const paymentOptions: ExternalPaymentOptionsString[] = [];

    if (bridge.sourceChain.chainId === rozoSolana.chainId) {
      paymentOptions.push(ExternalPaymentOptions.Solana);
    } else if (bridge.sourceChain.chainId === rozoStellar.chainId) {
      paymentOptions.push(ExternalPaymentOptions.Stellar);
    } else {
      paymentOptions.push(ExternalPaymentOptions.Ethereum);
    }

    const intent = generateIntentTitle({
      toChainId: bridge.destinationChain.chainId,
      toTokenAddress: bridge.destinationToken.token,
      preferredChainId: bridge.sourceChain.chainId,
      preferredTokenAddress: bridge.sourceToken.token,
    });
    return {
      appId,
      toChain: bridge.destinationChain.chainId,
      toToken: bridge.destinationToken.token,
      toUnits: amount,
      toAddress: bridge.destinationAddress,
      feeType: feeType,
      preferredTokens: [bridge.sourceToken],
      connectedWalletOnly:
        bridge.sourceChain.chainId === rozoStellar.chainId && stellarConnected,
      paymentOptions,
      intent,
      metadata: {
        intent,
        ...(referralCode && { referral: referralCode }),
        items: [
          {
            name: "ROZO Intents",
            description: `Bridge ${amount} ${bridge.sourceToken.symbol} (${bridge.sourceChain.name}) to ${bridge.destinationToken.symbol} (${bridge.destinationChain.name})`,
          },
        ],
      } as unknown as RozoPayUserMetadata,
    };
  }, [
    appId,
    amount,
    feeType,
    bridge.destinationAddress,
    stellarConnected,
    bridge.sourceChain,
    bridge.sourceToken,
    bridge.destinationChain,
    bridge.destinationToken,
  ]);

  useEffect(() => {
    const preparePayment = async () => {
      if (intentConfig && parseFloat(intentConfig.toUnits || "0") > 0) {
        setIsPreparingPayment(true);

        try {
          await resetPayment(intentConfig as any);
        } catch (error) {
          console.error("[BridgePayButton] error", error);
        } finally {
          setTimeout(() => {
            setIsPreparingPayment(false);
          }, 500);
        }
      }
    };
    preparePayment();
  }, [intentConfig]);

  if (isPreparingPayment) {
    return (
      <Button
        size="lg"
        className="w-full h-10 sm:h-14 text-sm sm:text-lg rounded-xl sm:rounded-2xl cursor-pointer"
        disabled
      >
        <Loader2 className="size-4 sm:size-5 animate-spin" />
        Preparing Bridge...
      </Button>
    );
  }

  if (parseFloat(amount) <= 0) {
    return (
      <Button
        size="lg"
        className="w-full h-10 sm:h-14 text-sm sm:text-lg rounded-xl sm:rounded-2xl cursor-pointer"
        disabled
      >
        Enter an amount to continue
      </Button>
    );
  }

  if (bridge.destinationAddress === null) {
    return (
      <Button
        size="lg"
        className="w-full h-10 sm:h-14 text-sm sm:text-lg rounded-xl sm:rounded-2xl cursor-pointer"
        disabled
      >
        Enter a destination address to continue
      </Button>
    );
  }

  if (!bridge.sourceToken || !bridge.destinationToken) {
    return (
      <Button
        size="lg"
        className="w-full h-10 sm:h-14 text-sm sm:text-lg rounded-xl sm:rounded-2xl cursor-pointer"
        disabled
      >
        Enter a source and destination token to continue
      </Button>
    );
  }

  if (intentConfig === null) {
    return (
      <Button
        size="lg"
        className="w-full h-10 sm:h-14 text-sm sm:text-lg rounded-xl sm:rounded-2xl cursor-pointer"
        disabled
      >
        Confirm Bridge
      </Button>
    );
  }

  if (parseFloat(intentConfig.toUnits || "0") <= 0) {
    return (
      <Button
        size="lg"
        className="w-full h-10 sm:h-14 text-sm sm:text-lg rounded-xl sm:rounded-2xl cursor-pointer"
        disabled
      >
        Enter an amount to bridge
      </Button>
    );
  }

  return (
    <RozoPayButton.Custom
      appId={intentConfig.appId}
      toChain={intentConfig.toChain}
      toToken={intentConfig.toToken}
      toAddress={intentConfig.toAddress || ""}
      toUnits={intentConfig.toUnits}
      metadata={intentConfig.metadata || undefined}
      feeType={intentConfig.feeType}
      receiverMemo={intentConfig.receiverMemo || ""}
      preferredSymbol={intentConfig.preferredSymbol}
      preferredTokens={intentConfig.preferredTokens}
      paymentOptions={intentConfig.paymentOptions}
      intent={intentConfig.intent}
      onPaymentCompleted={handlePaymentCompleted}
      onPayoutCompleted={handlePayoutCompleted}
      connectedWalletOnly={intentConfig.connectedWalletOnly}
      showProcessingPayout
      resetOnSuccess
    >
      {({ show }) => (
        <Button
          onClick={show}
          size="lg"
          className="w-full h-10 sm:h-14 text-sm sm:text-lg rounded-xl sm:rounded-2xl cursor-pointer"
        >
          Confirm Bridge
        </Button>
      )}
    </RozoPayButton.Custom>
  );
}
