"use client";

import { useStellarWallet } from "@/contexts/StellarWalletContext";
import { GetFeeError, useGetFee } from "@/hooks/use-get-fee";
import { formatNumber } from "@/lib/formatNumber";
import { DEFAULT_INTENT_PAY_CONFIG } from "@/lib/intentPay";
import {
  base,
  FeeType,
  PaymentCompletedEvent,
  TokenSymbol,
} from "@rozoai/intent-common";
import { AlertTriangle, Clock, Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { StellarWalletConnect } from "../StellarWalletConnect";
import { Button } from "../ui/button";
import { AmountLimitWarning } from "./AmountLimitWarning";
import { BridgeCard } from "./BridgeCard";
import { BridgeSwapButton } from "./BridgeSwapButton";
import { ChainBadge } from "./ChainBadge";
import { ChainSelector, supportedPayoutChains } from "./ChainSelector";
import { DepositButton } from "./DepositButton";
import { DestinationAddressInput } from "./DestinationAddressInput";
import { HistoryDialog } from "./HistoryDialog";
import { useDepositLogic } from "./hooks/useDepositLogic";
import { useManualStellarAddress } from "./hooks/useManualStellarAddress";
import { useWithdrawLogic } from "./hooks/useWithdrawLogic";
import { MemoInput } from "./MemoInput";
import { StellarAddressInput } from "./StellarAddressInput";
import { StellarBalanceCard } from "./StellarBalanceCard";
import { TokenAmountInput } from "./TokenAmountInput";
import { getStellarHistoryForWallet } from "./utils/history";

import { TokenSelector } from "./TokenSelector";

export function NewBridge() {
  const [feeType, setFeeType] = useState<FeeType>(FeeType.ExactIn);
  const [fromAmount, setFromAmount] = useState<string | undefined>("");
  const [toAmount, setToAmount] = useState<string | undefined>("");
  const [debouncedAmount, setDebouncedAmount] = useState<string | undefined>(
    ""
  );
  const [isSwitched, setIsSwitched] = useState(false);
  const [isWithdrawLoading, setIsWithdrawLoading] = useState(false);
  const [balanceError, setBalanceError] = useState<string>("");
  const [destinationAddress, setDestinationAddress] = useState<string>("");
  const [addressError, setAddressError] = useState<string>("");
  const [memo, setMemo] = useState<string>("");
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  // Manual Stellar address for deposits (when wallet not connected)
  const manualStellarAddress = useManualStellarAddress();
  // State to track history updates
  const [historyUpdateTrigger, setHistoryUpdateTrigger] = useState(0);
  // Destination chain for withdrawal (default to Base)
  const [destinationChainId, setDestinationChainId] = useState<number>(
    base.chainId
  );

  const {
    currency: stellarCurrency,
    stellarConnected,
    stellarAddress,
    trustlineStatus,
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

  // Check if there's any history for the current wallet
  const hasHistory = useMemo(() => {
    if (!stellarConnected || !stellarAddress) return false;
    const history = getStellarHistoryForWallet(stellarAddress);
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

    return `${formatNumber(feeData.fee.toString())} ${currency}`;
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

  const toUnitsWithFees = useMemo(() => {
    if (!calculatedAmount || calculatedAmount === "" || !validFeeData)
      return "";
    return String(
      feeType === FeeType.ExactIn
        ? validFeeData.amountIn
        : validFeeData.amountOut
    );
  }, [calculatedAmount, validFeeData, feeType]);

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

  const isWithdrawDisabled = useMemo(() => {
    return (
      !!balanceError ||
      !!addressError ||
      isWithdrawLoading ||
      isFeeLoading ||
      !!feeErrorData ||
      !destinationAddress ||
      !!addressError
    );
  }, [
    balanceError,
    addressError,
    isWithdrawLoading,
    isFeeLoading,
    feeErrorData,
    destinationAddress,
    addressError,
  ]);

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

    window.addEventListener("stellar-payment-completed", handleHistoryUpdate);

    return () => {
      window.removeEventListener(
        "stellar-payment-completed",
        handleHistoryUpdate
      );
    };
  }, []);

  // Clear manual address when wallet connects (user preference for connected wallet)
  useEffect(() => {
    if (stellarConnected && manualStellarAddress.address) {
      manualStellarAddress.reset();
    }
  }, [stellarConnected]);

  // Get destination chain name for button text
  const destinationChainName = useMemo(() => {
    return (
      supportedPayoutChains.find((c) => c?.chainId === destinationChainId)
        ?.name || "Base"
    );
  }, [destinationChainId]);

  // Use withdraw logic hook (when isSwitched = true)
  const { handleWithdraw: baseHandleWithdraw } = useWithdrawLogic({
    currency,
    amount: fromAmount,
    feeAmount: feeData?.fee.toFixed(2) || "0",
    destinationAddress,
    destinationChainId,
    feeType,
    onLoadingChange: setIsWithdrawLoading,
    isAdmin,
  });

  const handleWithdraw = async () => {
    const success = await baseHandleWithdraw();
    if (success) {
      setFromAmount("");
      setToAmount("");
      setDestinationAddress("");
    }
  };

  // Use deposit logic hook (when isSwitched = false)
  const {
    intentConfig,
    ableToPay,
    isPreparingConfig,
    handlePaymentCompleted: baseHandlePaymentCompleted,
  } = useDepositLogic({
    appId,
    amount: fromAmount,
    memo,
    feeType,
    isAdmin,
    // Only pass destinationStellarAddress when using manual address (not connected)
    destinationStellarAddress: stellarConnected
      ? undefined
      : manualStellarAddress.address,
    manualTrustlineExists: manualStellarAddress.trustlineExists,
    currency: isCurrencyEUR
      ? [TokenSymbol.EURC]
      : [TokenSymbol.USDC, TokenSymbol.USDT],
  });

  // Wrap payment completed to clear amount
  const handlePaymentCompleted = (paymentData: PaymentCompletedEvent) => {
    baseHandlePaymentCompleted(paymentData);
    setFromAmount("");
    setToAmount("");
    setMemo("");
  };

  const handleSwitch = () => {
    setIsSwitched(!isSwitched);
    setBalanceError("");
    setAddressError("");
    setDestinationAddress("");
    setMemo("");
    setDestinationChainId(base.chainId);
    manualStellarAddress.reset();
    // setFromAmount("");
    // setToAmount("");
    // setFeeType(FeeType.ExactIn);
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

  // Validate balance when amount changes and user is bridging from Stellar
  useEffect(() => {
    if (isSwitched && stellarConnected && fromAmount && fromAmount !== "") {
      const amountNum = parseFloat(fromAmount);
      const balanceNum = parseFloat(trustlineStatus.balance);

      if (!isNaN(amountNum) && !isNaN(balanceNum)) {
        if (amountNum > balanceNum) {
          setBalanceError(
            `Insufficient balance. You have ${balanceNum.toLocaleString(
              "en-US",
              {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }
            )} USDC`
          );
        } else {
          setBalanceError("");
        }
      }
    } else {
      setBalanceError("");
    }
  }, [fromAmount, isSwitched, stellarConnected, trustlineStatus.balance]);

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

  // Lock destination chain to Base when EURC is active in withdraw mode
  useEffect(() => {
    if (isCurrencyEUR && isSwitched) {
      setDestinationChainId(base.chainId);
    }
  }, [isCurrencyEUR, isSwitched]);

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
            {stellarConnected && hasHistory ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setHistoryDialogOpen(true)}
                className="text-xs sm:text-sm h-9"
              >
                <Clock className="size-4 sm:mr-2" />
                <span className="hidden sm:inline">Show History</span>
              </Button>
            ) : stellarConnected ? (
              <span className="text-xs sm:text-sm text-muted-foreground">
                No history found
              </span>
            ) : null}

            <TokenSelector />
          </div>
        </div>

        {/* Stellar USDC Balance */}
        <StellarBalanceCard currency={currency} />

        {/* From Section */}
        <BridgeCard>
          <div className="flex-1">
            <TokenAmountInput
              currency={currency}
              label="From"
              amount={fromAmount}
              setAmount={(value) => {
                setFromAmount(value);
                setFeeType(FeeType.ExactIn);
              }}
            />
            {balanceError && (
              <div className="text-xs text-red-500 dark:text-red-400 mt-1">
                {balanceError}
              </div>
            )}
          </div>
          <ChainBadge
            isSwitched={isSwitched}
            isFrom={true}
            preferredSymbol={
              isCurrencyEUR
                ? [TokenSymbol.EURC]
                : [TokenSymbol.USDC, TokenSymbol.USDT]
            }
            className="absolute top-2 right-2"
          />
        </BridgeCard>

        {/* Swap Button */}
        <BridgeSwapButton isSwitched={isSwitched} onSwitch={handleSwitch} />

        {/* To Section */}
        <BridgeCard>
          <TokenAmountInput
            currency={currency}
            label="To"
            amount={toAmount}
            setAmount={(value) => {
              setToAmount(value);
              setFeeType(FeeType.ExactOut);
            }}
          />

          {!isSwitched || isCurrencyEUR ? (
            <ChainBadge
              isSwitched={isSwitched}
              isFrom={false}
              preferredSymbol={
                isCurrencyEUR
                  ? [TokenSymbol.EURC]
                  : [TokenSymbol.USDC, TokenSymbol.USDT]
              }
              className="absolute top-2 right-2"
            />
          ) : (
            <ChainSelector
              value={destinationChainId}
              className="absolute top-2 right-2"
              onChange={(chainId) => {
                setDestinationChainId(chainId);
                // Clear address when chain changes
                setDestinationAddress("");
                setAddressError("");
              }}
            />
          )}
        </BridgeCard>

        {((fromAmount && parseFloat(fromAmount) > 0) ||
          (toAmount && parseFloat(toAmount) > 0)) &&
          !limitError && (
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

        {/* Chain Selector & Address Input - Only show when withdrawing (Stellar to multi-chain) */}
        {isSwitched && (
          <div className="mt-3 border-t border-neutral-200 dark:border-neutral-700 pt-3">
            <DestinationAddressInput
              value={destinationAddress}
              onChange={setDestinationAddress}
              error={addressError}
              onErrorChange={setAddressError}
              chainId={destinationChainId}
            />
          </div>
        )}

        {/* Deposit Configuration - Only show when depositing (multi-chain to Stellar) */}
        {!isSwitched && (
          <div className="mt-3 border-t border-neutral-200 dark:border-neutral-700 pt-3">
            {stellarConnected ? (
              // Show trustline warning if wallet is connected
              <>
                {!hideTrustlineWarning && hasEnoughXLM ? (
                  <div className="p-4 rounded-xl border border-yellow-500/20 bg-yellow-50 dark:bg-yellow-500/10">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 shrink-0" />
                      <div className="space-y-3 flex-1">
                        <div>
                          <p className="font-medium text-yellow-900 dark:text-yellow-100 text-sm">
                            {stellarCurrency} Trustline Required
                          </p>
                          <p className="text-xs text-yellow-700 dark:text-yellow-200/80 mt-1">
                            Your Stellar wallet needs to establish a trustline
                            for {stellarCurrency} to receive deposits. This is a
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
                          You need at least 1.5 XLM to create a{" "}
                          {stellarCurrency} trustline. Current balance:{" "}
                          {xlmBalance.balance} XLM
                        </p>
                      </div>
                    </div>
                  </div>
                ) : null}
              </>
            ) : (
              // Show manual Stellar address input if wallet is not connected
              <>
                <StellarAddressInput
                  currency={stellarCurrency}
                  value={manualStellarAddress.address}
                  onChange={manualStellarAddress.setAddress}
                  onTrustlineStatusChange={(address, exists, balance) => {
                    manualStellarAddress.setTrustlineStatus(exists, balance);
                  }}
                  error={manualStellarAddress.addressError}
                  onErrorChange={manualStellarAddress.setAddressError}
                />
                {/* Show memo input only if address is valid and trustline exists */}
                {manualStellarAddress.address &&
                  manualStellarAddress.trustlineExists &&
                  !manualStellarAddress.addressError && (
                    <MemoInput
                      value={memo}
                      onChange={setMemo}
                      className="mt-4"
                    />
                  )}
              </>
            )}
          </div>
        )}

        {/* Amount Limit Warning */}
        {limitError && (
          <div className="mt-3 sm:mt-6">
            <AmountLimitWarning
              limit={limitError.maxAllowed}
              message={limitError.message}
            />
          </div>
        )}

        {!stellarConnected &&
          !manualStellarAddress.trustlineExists &&
          !limitError && (
            <div className="flex items-center gap-3 mt-3">
              <div className="grow border-t border-neutral-200 dark:border-neutral-700" />
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                Or
              </span>
              <div className="grow border-t border-neutral-200 dark:border-neutral-700" />
            </div>
          )}

        {/* Connect Wallet / Bridge Button */}
        <div className="mt-3">
          {isSwitched ? (
            // Withdraw Button - Requires wallet connection
            stellarConnected ? (
              <Button
                onClick={handleWithdraw}
                disabled={isWithdrawDisabled}
                size="lg"
                className="w-full h-10 sm:h-14 text-sm sm:text-lg rounded-xl sm:rounded-2xl"
              >
                {(isWithdrawLoading || isFeeLoading) && (
                  <Loader2 className="size-4 sm:size-5 animate-spin" />
                )}
                {isFeeLoading
                  ? "Loading fee..."
                  : `Bridge ${stellarCurrency} to ${destinationChainName}`}
              </Button>
            ) : (
              <StellarWalletConnect
                disabled={!!limitError}
                className="w-full h-10 sm:h-14 text-sm sm:text-lg rounded-xl sm:rounded-2xl"
              />
            )
          ) : (
            // Deposit Button - Can work with or without wallet connection
            <>
              {stellarConnected && stellarAddress ? (
                // User is connected - show deposit button
                <DepositButton
                  intentConfig={intentConfig}
                  ableToPay={
                    ableToPay &&
                    toUnitsWithFees !== "" &&
                    parseFloat(toUnitsWithFees) > 0
                  }
                  isPreparingConfig={isPreparingConfig}
                  isFeeLoading={isFeeLoading}
                  hasFeeError={!!feeErrorData}
                  onPaymentCompleted={handlePaymentCompleted}
                />
              ) : manualStellarAddress.address &&
                manualStellarAddress.trustlineExists ? (
                // User not connected, but has filled Stellar address and trustline exists
                <DepositButton
                  intentConfig={intentConfig}
                  ableToPay={
                    ableToPay &&
                    toUnitsWithFees !== "" &&
                    parseFloat(toUnitsWithFees) > 0 &&
                    !!fromAmount &&
                    parseFloat(fromAmount) > 0
                  }
                  isPreparingConfig={isPreparingConfig}
                  isFeeLoading={isFeeLoading}
                  hasFeeError={!!feeErrorData}
                  onPaymentCompleted={handlePaymentCompleted}
                />
              ) : (
                // User not connected and conditions not met - show connect wallet
                <StellarWalletConnect
                  disabled={!!limitError}
                  className="w-full h-10 sm:h-14 text-sm sm:text-lg rounded-xl sm:rounded-2xl"
                />
              )}
            </>
          )}
        </div>
      </div>

      {/* History Dialog */}
      {stellarConnected && stellarAddress && (
        <HistoryDialog
          open={historyDialogOpen}
          onOpenChange={setHistoryDialogOpen}
          walletAddress={stellarAddress}
        />
      )}
    </div>
  );
}
