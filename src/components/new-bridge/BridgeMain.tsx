"use client";

import { useStellarWallet } from "@/contexts/StellarWalletContext";
import { GetFeeError, useGetFee } from "@/hooks/use-get-fee";
import { formatNumber } from "@/lib/formatNumber";
import { DEFAULT_INTENT_PAY_CONFIG } from "@/lib/intentPay";
import {
  base,
  FeeType,
  isValidStellarAddress,
  rozoStellar,
  TokenSymbol,
} from "@rozoai/intent-common";
import { AlertTriangle, Clock, Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { AmountLimitWarning } from "./AmountLimitWarning";
import { BridgeCard } from "./BridgeCard";
import { BridgeSwapButton } from "./BridgeSwapButton";
import { DestinationAddressInput } from "./DestinationAddressInput";
import { MemoInput } from "./MemoInput";
import { StellarAddressInput } from "./StellarAddressInput";
import { TokenAmountInput } from "./TokenAmountInput";

import { cn, formatAddress } from "@/lib/utils";
import { BridgeHistoryModal } from "./BridgeHistoryModal";
import { BridgePayButton } from "./BridgePayButton";
import { useBridge } from "./providers/BridgeProvider";
import { useDestinationSelector, useSourceSelector } from "./providers/hooks";
import { TokenSelectorTrigger } from "./token-selector/TokenSelectorTrigger";
import { getMergedBridgeHistories } from "./utils/bridgeHistory";

export function BridgeMain() {
  const {
    swapSourceAndDestination,
    isDestinationAddressValid,
    setDestinationAddress,
    destinationAddress,
    destinationChain,
    destinationToken,
    sourceChain,
    sourceToken,
  } = useBridge();

  const sourceSelector = useSourceSelector();
  const destinationSelector = useDestinationSelector();
  // Manual Stellar address for deposits (when wallet not connected)
  // const manualStellarAddress = useManualStellarAddress();

  const [feeType, setFeeType] = useState<FeeType>(FeeType.ExactIn);
  const [fromAmount, setFromAmount] = useState<string | undefined>("");
  const [toAmount, setToAmount] = useState<string | undefined>("");
  const [debouncedAmount, setDebouncedAmount] = useState<string | undefined>(
    ""
  );
  const [isSwitched, setIsSwitched] = useState(false);
  const [balanceError, setBalanceError] = useState<string>("");
  const [addressError, setAddressError] = useState<string>("");
  const [memo, setMemo] = useState<string>("");
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  // State to track history updates
  const [historyUpdateTrigger, setHistoryUpdateTrigger] = useState(0);
  // Destination chain for withdrawal (default to Base)
  const [destinationChainId, setDestinationChainId] = useState<number>(
    base.chainId
  );
  // State for destination address popover
  const [destinationAddressPopoverOpen, setDestinationAddressPopoverOpen] =
    useState(false);

  // Sync destinationChainId with bridge's destinationChain
  useEffect(() => {
    if (destinationChain?.chainId) {
      setDestinationChainId(destinationChain.chainId);
    }
  }, [destinationChain?.chainId]);

  const {
    currency: stellarCurrency,
    stellarConnected,
    stellarAddress,
    stellarError,
    trustlineStatus,
    usdcTrustline,
    eurcTrustline,
    xlmBalance,
    createTrustline,
  } = useStellarWallet();

  const isCurrencyEUR = useMemo(
    () => stellarCurrency === "EURC",
    [stellarCurrency]
  );

  const searchParams = useSearchParams();
  const isAdmin = searchParams.get("admin") === "rozo";

  const hideTrustlineWarning = useMemo(() => {
    return (
      !stellarConnected || trustlineStatus.checking || trustlineStatus.exists
    );
  }, [stellarConnected, trustlineStatus.checking, trustlineStatus.exists]);

  const hasEnoughXLM = useMemo(
    () => parseFloat(xlmBalance.balance) >= 1.5,
    [xlmBalance.balance]
  );

  // Determine appId based on isAdmin
  const appId =
    stellarCurrency === "EURC"
      ? "rozoEURC"
      : isAdmin
      ? "rozoBridgeStellarAdmin"
      : DEFAULT_INTENT_PAY_CONFIG.appId;

  // Fetch fee from API using debounced amount
  const {
    data: feeData,
    isLoading: isFeeLoading,
    error: feeError,
  } = useGetFee(
    {
      amount: parseFloat(debouncedAmount || "0"),
      appId,
      currency: isCurrencyEUR ? "EUR" : "USD",
      type: feeType,
    },
    {
      enabled: !!debouncedAmount && parseFloat(debouncedAmount) > 0,
      debounceMs: 0,
    }
  );

  // Extract fee error details
  const feeErrorData = feeError as GetFeeError | null;

  const currency = isCurrencyEUR ? TokenSymbol.EURC : TokenSymbol.USDC;

  // Check if there's any history for the current user (wallet or session)
  const hasHistory = useMemo(() => {
    const history = getMergedBridgeHistories();
    return history.length > 0;
  }, [stellarConnected, stellarAddress, historyUpdateTrigger]);

  const fees = useMemo(() => {
    if (isFeeLoading) {
      return "Calculating...";
    }
    if (!feeData) {
      return `0 ${currency}`;
    }

    if (feeData.fee === 0) {
      return "Free";
    }

    return `$${formatNumber(feeData.fee.toString())}`;
  }, [feeData, isFeeLoading]);

  // Only show fee data if it matches the current input
  const validFeeData = useMemo(() => {
    // Check if feeData matches the current debounced amount
    if (
      feeData &&
      debouncedAmount &&
      parseFloat(debouncedAmount) > 0 &&
      feeData.amount === parseFloat(debouncedAmount)
    ) {
      return feeData;
    }
    return null;
  }, [feeData, debouncedAmount]);

  const calculatedAmount = useMemo(() => {
    const inputAmount = feeType === FeeType.ExactIn ? fromAmount : toAmount;

    // If no amount, clear the output
    if (!inputAmount || inputAmount === "" || parseFloat(inputAmount) === 0) {
      return "";
    }

    // If amount is different from debounced amount, don't show anything (user is still typing)
    if (inputAmount !== debouncedAmount) {
      return "";
    }

    // Only show result if we have valid fee data that matches
    if (validFeeData) {
      return String(
        feeType === FeeType.ExactIn
          ? validFeeData.amountOut
          : validFeeData.amountIn
      );
    }

    // Still loading or no data yet
    return "";
  }, [fromAmount, toAmount, debouncedAmount, validFeeData, feeType]);

  // Determine if amount exceeds limit based on fee error
  const limitError = useMemo(() => {
    const inputAmount = feeType === FeeType.ExactIn ? fromAmount : toAmount;
    if (!inputAmount || parseFloat(inputAmount) === 0) return null;

    // Check if fee error is a limit error
    if (feeErrorData) {
      return {
        maxAllowed: feeErrorData.maxAllowed,
        received: feeErrorData.received,
        message: feeErrorData.message,
      };
    }

    return null;
  }, [fromAmount, toAmount, feeErrorData, feeType]);

  const currentBalance = useMemo(() => {
    if (stellarConnected) {
      if (sourceChain?.chainId === rozoStellar.chainId) {
        return sourceToken?.symbol === TokenSymbol.USDC
          ? parseFloat(usdcTrustline.balance)
          : parseFloat(eurcTrustline.balance);
      }
      if (destinationChain?.chainId === rozoStellar.chainId) {
        return destinationToken?.symbol === TokenSymbol.USDC
          ? parseFloat(usdcTrustline.balance)
          : parseFloat(eurcTrustline.balance);
      }
      return null;
    }
    return null;
  }, [
    stellarConnected,
    sourceChain?.chainId,
    sourceToken?.symbol,
    destinationChain?.chainId,
    destinationToken?.symbol,
    usdcTrustline.balance,
    eurcTrustline.balance,
  ]);

  const handleSwitch = () => {
    setIsSwitched(!isSwitched);
    setDestinationAddress("");
    setBalanceError("");
    setAddressError("");
    setMemo("");
    setDestinationChainId(base.chainId);
    swapSourceAndDestination();
  };

  const handleCreateTrustline = async () => {
    // Check XLM balance before creating trustline
    const xlmBalanceNum = parseFloat(xlmBalance.balance);
    if (xlmBalanceNum < 1.5) {
      toast.error("Insufficient XLM balance", {
        description: `You need at least 1.5 XLM to create a ${stellarCurrency} trustline. Please add more XLM to your wallet.`,
        duration: 5000,
      });
      return;
    }

    // If balance is sufficient, proceed with trustline creation
    await createTrustline();
  };

  // Debounce amount input
  useEffect(() => {
    const inputAmount = feeType === FeeType.ExactIn ? fromAmount : toAmount;

    // If amount is empty or zero, update immediately
    if (!inputAmount || inputAmount === "" || parseFloat(inputAmount) === 0) {
      setDebouncedAmount(inputAmount);
      return;
    }

    // Otherwise, debounce the update
    setDebouncedAmount(inputAmount);
  }, [fromAmount, toAmount, feeType]);

  // Listen for history updates
  useEffect(() => {
    const handleHistoryUpdate = () => {
      setHistoryUpdateTrigger((prev) => prev + 1);
    };

    window.addEventListener("bridge-payment-completed", handleHistoryUpdate);

    return () => {
      window.removeEventListener(
        "bridge-payment-completed",
        handleHistoryUpdate
      );
    };
  }, []);

  // Clear manual address when wallet connects (user preference for connected wallet)
  useEffect(() => {
    if (stellarConnected) {
      // Only set Stellar address if destination chain is Stellar
      if (destinationChain?.chainId === rozoStellar.chainId) {
        setDestinationAddress(stellarAddress);

        if (!isDestinationAddressValid) {
          setAddressError("Invalid address");
        } else {
          setAddressError("");
        }
      }
    }
  }, [
    stellarConnected,
    destinationChain?.chainId,
    stellarAddress,
    isDestinationAddressValid,
  ]);

  // Auto-set destination address to Stellar address when destination chain changes to Stellar
  useEffect(() => {
    if (
      destinationChain?.chainId === rozoStellar.chainId &&
      stellarConnected &&
      stellarAddress &&
      (!destinationAddress || !isDestinationAddressValid)
    ) {
      setDestinationAddress(stellarAddress);
      setAddressError("");
    }
  }, [
    destinationChain?.chainId,
    stellarConnected,
    stellarAddress,
    destinationAddress,
    isDestinationAddressValid,
  ]);

  // Close popover when address becomes valid
  useEffect(() => {
    if (
      destinationAddressPopoverOpen &&
      destinationAddress &&
      isDestinationAddressValid &&
      !addressError
    ) {
      setDestinationAddressPopoverOpen(false);
    }
  }, [
    destinationAddressPopoverOpen,
    destinationAddress,
    isDestinationAddressValid,
    addressError,
  ]);

  const handleManualAddressErrorChange = useCallback((error: string) => {
    setAddressError(error);
  }, []);

  const handleManualDestinationAddressChange = useCallback(
    (address: string) => {
      // Clear destination address if input is empty
      if (!address || address.trim() === "") {
        setDestinationAddress("");
        setAddressError("");
      } else {
        setDestinationAddress(address);
      }
    },
    [setDestinationAddress]
  );

  // Handle trustline status change - only set address if valid and trustline exists
  const handleTrustlineStatusChange = useCallback(
    (address: string, exists: boolean) => {
      // Only proceed if trustline exists
      if (!exists) {
        return;
      }

      // Validate the address before setting
      try {
        if (!isValidStellarAddress(address)) {
          return;
        }
      } catch {
        // Invalid address format
        return;
      }

      setDestinationAddress(address);
    },
    []
  );

  // Validate balance when amount changes and user is bridging from Stellar
  useEffect(() => {
    if (stellarConnected && fromAmount && fromAmount !== "") {
      if (sourceChain?.chainId === rozoStellar.chainId) {
        const amountNum = parseFloat(fromAmount);

        const usdcBalance = usdcTrustline.balance;
        const eurcBalance = eurcTrustline.balance;

        const balanceNum =
          sourceToken?.symbol === TokenSymbol.USDC
            ? parseFloat(usdcBalance)
            : parseFloat(eurcBalance);

        if (!isNaN(amountNum) && !isNaN(balanceNum)) {
          if (amountNum > balanceNum) {
            setBalanceError(
              `Insufficient balance. You have ${balanceNum.toLocaleString(
                "en-US",
                {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }
              )} ${sourceToken?.symbol}`
            );
          } else {
            setBalanceError("");
          }
        }
      }
    } else {
      setBalanceError("");
    }
  }, [
    fromAmount,
    stellarConnected,
    trustlineStatus.balance,
    sourceToken,
    sourceChain,
  ]);

  // Sync the calculated amount to the opposite field
  useEffect(() => {
    if (feeType === FeeType.ExactIn) {
      // User filled "From", update "To"
      setToAmount(calculatedAmount);
    } else {
      // User filled "To", update "From"
      setFromAmount(calculatedAmount);
    }
  }, [calculatedAmount, feeType]);

  return (
    <div className="w-full max-w-xl mx-auto">
      <div
        className="rounded-2xl sm:rounded-3xl p-3 sm:p-6 md:p-8 bg-neutral-50 border border-neutral-200 dark:bg-neutral-900 dark:border-neutral-800 shadow-lg transition-[grid-template-rows] duration-300 ease-in-out grid"
        style={{ gridTemplateRows: "1fr" }}
      >
        <div className="flex items-center justify-between mb-3 sm:mb-6">
          <h1 className="text-lg sm:text-2xl font-bold text-neutral-900 dark:text-neutral-50">
            Bridge
          </h1>
          <div className="flex items-center justify-between gap-3">
            {hasHistory ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setHistoryDialogOpen(true)}
                className="text-xs sm:text-sm h-9"
              >
                <Clock className="size-4 sm:mr-2" />
                <span className="hidden sm:inline">Show History</span>
              </Button>
            ) : (
              <span className="text-xs sm:text-sm text-muted-foreground">
                No history found
              </span>
            )}

            {/* <TokenSelector /> */}
          </div>
        </div>

        {/* Stellar USDC Balance */}
        {/* <StellarBalanceCard currency={currency} /> */}

        {/* From Section */}
        <BridgeCard>
          <TokenAmountInput
            currency={currency}
            labelContent={
              <span className="text-neutral-600 dark:text-neutral-400">
                From{""}
                {sourceChain?.chainId === rozoStellar.chainId &&
                stellarConnected &&
                stellarAddress
                  ? `: ${formatAddress(stellarAddress)}`
                  : ""}
              </span>
            }
            amount={fromAmount}
            setAmount={(value) => {
              setFromAmount(value);
              setFeeType(FeeType.ExactIn);
            }}
          />

          <div className="flex flex-col justify-between items-end h-full">
            <TokenSelectorTrigger
              selector={sourceSelector}
              modalTitle="Select Source Token"
            />
            {balanceError ? (
              <div className="text-xs text-red-500 dark:text-red-400 mt-auto">
                {balanceError}
              </div>
            ) : currentBalance &&
              currentBalance > 0 &&
              sourceChain?.chainId === rozoStellar.chainId ? (
              <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-auto">
                Balance:{" "}
                {currentBalance.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{" "}
                {sourceToken?.symbol}
              </div>
            ) : null}
          </div>
        </BridgeCard>

        {/* Swap Button */}
        <BridgeSwapButton isSwitched={isSwitched} onSwitch={handleSwitch} />

        {/* To Section */}
        <BridgeCard>
          <TokenAmountInput
            currency={currency}
            labelContent={
              <span className="text-neutral-600 dark:text-neutral-400">
                To{""}
                {destinationAddress && isDestinationAddressValid
                  ? `: ${formatAddress(destinationAddress)}`
                  : ""}
              </span>
            }
            amount={toAmount}
            setAmount={(value) => {
              setToAmount(value);
              setFeeType(FeeType.ExactOut);
            }}
          />

          <div className="flex flex-col justify-between items-end h-full">
            <TokenSelectorTrigger
              selector={destinationSelector}
              modalTitle="Select Destination Token"
            />

            {currentBalance &&
              currentBalance > 0 &&
              destinationChain?.chainId === rozoStellar.chainId && (
                <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-auto">
                  Balance:{" "}
                  {currentBalance.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{" "}
                  {sourceToken?.symbol}
                </div>
              )}
          </div>
        </BridgeCard>

        {!limitError && (
          <div className="flex items-center justify-between mt-3">
            <div className="text-xs sm:text-sm">
              <p className="text-neutral-500 dark:text-neutral-400">Fees:</p>
              <b className="text-neutral-900 dark:text-neutral-50">
                {isFeeLoading ? "Calculating..." : fees}
              </b>
            </div>
            <div className="text-xs sm:text-sm text-right">
              <p className="text-neutral-500 dark:text-neutral-400">
                Estimated time:
              </p>
              <b className="text-neutral-900 dark:text-neutral-50">
                {"<"}1 minute
              </b>
            </div>
          </div>
        )}

        {/* Chain Selector & Address Input - Show when address is invalid for non-Stellar chains or when switched */}
        {destinationChain?.chainId !== rozoStellar.chainId && (
          <div className={cn("mt-3")}>
            <DestinationAddressInput
              value={destinationAddress || ""}
              onChange={handleManualDestinationAddressChange}
              error={addressError}
              onErrorChange={handleManualAddressErrorChange}
              chainId={destinationChainId}
            />
          </div>
        )}

        {stellarConnected ? (
          // Show trustline warning if wallet is connected
          <div className="mt-3">
            {stellarError ? (
              <div className="p-4 rounded-xl border border-red-500/20 bg-red-50 dark:bg-red-500/10">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
                  <div className="space-y-1">
                    <p className="font-medium text-red-900 dark:text-red-100 text-sm">
                      {stellarError}
                    </p>
                  </div>
                </div>
              </div>
            ) : !hideTrustlineWarning && hasEnoughXLM ? (
              <div className="p-4 rounded-xl border border-yellow-500/20 bg-yellow-50 dark:bg-yellow-500/10">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 shrink-0" />
                  <div className="space-y-3 flex-1">
                    <div>
                      <p className="font-medium text-yellow-900 dark:text-yellow-100 text-sm">
                        {stellarCurrency} Trustline Required
                      </p>
                      <p className="text-xs text-yellow-700 dark:text-yellow-200/80 mt-1">
                        Your Stellar wallet needs to establish a trustline for{" "}
                        {stellarCurrency} to receive deposits. This is a
                        one-time setup.
                      </p>
                    </div>
                    <Button
                      onClick={handleCreateTrustline}
                      disabled={
                        trustlineStatus.checking || trustlineStatus.creating
                      }
                      size="sm"
                      className="bg-yellow-600 hover:bg-yellow-700 text-white h-9"
                    >
                      {trustlineStatus.creating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Adding...
                        </>
                      ) : (
                        `Add ${stellarCurrency} Trustline`
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ) : !hideTrustlineWarning && !hasEnoughXLM ? (
              <div className="p-4 rounded-xl border border-orange-500/20 bg-orange-50 dark:bg-orange-500/10">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400 mt-0.5 shrink-0" />
                  <div className="space-y-1">
                    <p className="font-medium text-orange-900 dark:text-orange-100 text-sm">
                      Insufficient XLM Balance
                    </p>
                    <p className="text-xs text-orange-700 dark:text-orange-200/80">
                      You need at least 1.5 XLM to create a {stellarCurrency}{" "}
                      trustline. Current balance: {xlmBalance.balance} XLM
                    </p>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        ) : destinationChain?.chainId === rozoStellar.chainId &&
          !stellarConnected ? (
          // Show manual Stellar address input if wallet is not connected
          <div className="mt-3">
            <StellarAddressInput
              currency={stellarCurrency}
              value={destinationAddress || ""}
              onChange={handleManualDestinationAddressChange}
              onTrustlineStatusChange={handleTrustlineStatusChange}
              error={addressError}
              onErrorChange={handleManualAddressErrorChange}
            />
            {/* Show memo input only if address is valid and trustline exists */}
            {destinationAddress &&
              isDestinationAddressValid &&
              !addressError && (
                <MemoInput value={memo} onChange={setMemo} className="mt-4" />
              )}
          </div>
        ) : null}

        <div className="mt-3">
          <BridgePayButton
            appId={appId}
            amount={fromAmount || "0"}
            feeType={feeType as FeeType}
          />
        </div>

        {/* Amount Limit Warning */}
        {limitError && (
          <div className="mt-3 sm:mt-6">
            <AmountLimitWarning
              limit={limitError.maxAllowed}
              message={limitError.message}
            />
          </div>
        )}
      </div>

      {/* History Dialog */}
      <BridgeHistoryModal
        open={historyDialogOpen}
        onOpenChange={setHistoryDialogOpen}
        walletAddress={stellarAddress}
      />
    </div>
  );
}
