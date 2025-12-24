import {
  ExternalPaymentOptions,
  ExternalPaymentOptionsString,
  FeeType,
  RozoPayUserMetadata,
  rozoSolana,
  rozoStellar,
  Token,
  TokenSymbol,
} from "@rozoai/intent-common";
import { RozoPayButton, useRozoPayUI } from "@rozoai/intent-pay";
import { Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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
  const [isPreparingPayment, setIsPreparingPayment] = useState(false);

  const intentConfig: PayParams | null = useMemo(() => {
    if (
      !bridge.sourceToken ||
      !bridge.destinationChain ||
      !bridge.destinationToken ||
      !bridge.sourceChain
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

    return {
      appId,
      toChain: bridge.destinationChain.chainId,
      toToken: bridge.destinationToken.token,
      toUnits: amount,
      toAddress: bridge.destinationAddress || "",
      feeType: feeType,
      preferredTokens: [bridge.sourceToken],
      connectedWalletOnly: bridge.sourceChain.chainId === rozoStellar.chainId,
      paymentOptions,
      intent: `${bridge.sourceToken?.symbol} to ${bridge.destinationToken?.symbol}`,
      metadata: {
        intent: `${amount} ${bridge.sourceToken?.symbol} ${bridge.sourceChain?.name} to ${bridge.destinationToken?.symbol} ${bridge.destinationChain?.name}`,
        items: [
          {
            name: "ROZO Intents",
            description: `Bridge ${amount} ${bridge.sourceToken?.symbol} to ${bridge.destinationToken?.symbol}`,
          },
        ],
      } as unknown as RozoPayUserMetadata,
    };
  }, [
    appId,
    amount,
    bridge.sourceToken,
    bridge.destinationChain,
    bridge.destinationToken,
    bridge.sourceChain,
  ]);

  useEffect(() => {
    const preparePayment = async () => {
      if (intentConfig && parseFloat(intentConfig.toUnits || "0") > 0) {
        setIsPreparingPayment(true);
        console.log("[BridgePayButton] intentConfig", intentConfig);
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

  if (intentConfig === null || intentConfig.toAddress === "") {
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
      onPaymentCompleted={() => {}}
      onPayoutCompleted={() => {}}
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
