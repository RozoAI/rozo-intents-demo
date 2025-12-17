"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useStellarWallet } from "@/contexts/StellarWalletContext";
import { checkTokenTrustline } from "@/lib/stellar";
import { formatStellarAddress } from "@/utils/address";
import { isValidStellarAddress } from "@rozoai/intent-common";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle,
  Copy,
  Loader2,
  Wallet,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

interface TopupButtonsProps {
  onAddressSelected: (
    chainId: number,
    address: string,
    stellarAddress?: string,
    amount?: number
  ) => void;
}

const PRESET_AMOUNTS = [1, 100, 1000];

export function TopupButtons({ onAddressSelected }: TopupButtonsProps) {
  const {
    stellarAddress,
    stellarConnected,
    stellarConnecting,
    connectStellarWallet,
    disconnectStellarWallet,
  } = useStellarWallet();

  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [manualStellarAddress, setManualStellarAddress] = useState("");
  const [useManualEntry, setUseManualEntry] = useState(false);

  // Trustline checking state
  const [trustlineChecking, setTrustlineChecking] = useState(false);
  const [trustlineResult, setTrustlineResult] = useState<{
    exists: boolean;
    balance: string;
  } | null>(null);
  const [trustlineError, setTrustlineError] = useState<string | null>(null);

  // Debounced USDC trustline check
  const checkTrustline = useCallback(async (address: string) => {
    if (!isValidStellarAddress(address)) {
      setTrustlineResult(null);
      setTrustlineError(null);
      return;
    }

    setTrustlineChecking(true);
    setTrustlineError(null);

    try {
      const result = await checkTokenTrustline(address, "USDC");
      setTrustlineResult(result);
    } catch (error) {
      console.error("Failed to check USDC trustline:", error);
      setTrustlineError(
        error instanceof Error ? error.message : "Failed to check trustline"
      );
      setTrustlineResult(null);
    } finally {
      setTrustlineChecking(false);
    }
  }, []);

  // Debounced effect for checking trustline when address changes
  useEffect(() => {
    const currentAddress = useManualEntry
      ? manualStellarAddress
      : stellarAddress;

    if (!currentAddress) {
      setTrustlineResult(null);
      setTrustlineError(null);
      return;
    }

    const timeoutId = setTimeout(() => {
      checkTrustline(currentAddress);
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [manualStellarAddress, stellarAddress, useManualEntry, checkTrustline]);

  const handleProceedWithTopup = () => {
    const amount = customAmount ? parseFloat(customAmount) : selectedAmount;

    if (!amount || amount <= 0) {
      toast.error("Please select or enter a valid amount");
      return;
    }

    const addressToUse = useManualEntry ? manualStellarAddress : stellarAddress;

    if (!addressToUse) {
      toast.error("Please connect your Stellar wallet or enter an address");
      return;
    }

    // Validate manual Stellar address format (starts with G and is 56 characters)
    if (
      useManualEntry &&
      (!manualStellarAddress.startsWith("G") ||
        manualStellarAddress.length !== 56)
    ) {
      toast.error("Invalid Stellar address format");
      return;
    }

    // Emit selection for Stellar (chainId 1500 for Stellar testnet or 1501 for mainnet) with amount
    onAddressSelected(1500, "", addressToUse, amount);
    toast.success(
      `Stellar address configured! Proceeding with ${amount} USDC payment...`
    );
  };

  const handleAmountSelection = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount(""); // Clear custom amount when selecting a preset
  };

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value);
    setSelectedAmount(null); // Clear preset selection when typing custom amount
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <img src="/logos/stellar.svg" alt="Stellar" className="h-6 w-6" />
            Top up your Stellar Wallet
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Stellar Wallet Connection */}
          <div className="space-y-4">
            {!stellarConnected && !useManualEntry ? (
              <div className="space-y-4">
                <Button
                  onClick={connectStellarWallet}
                  disabled={stellarConnecting}
                  className="w-full"
                >
                  {stellarConnecting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Wallet className="h-4 w-4 mr-2" />
                      Connect Stellar Wallet
                    </>
                  )}
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      or
                    </span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  onClick={() => setUseManualEntry(true)}
                  className="w-full"
                >
                  Enter Stellar Address
                </Button>
              </div>
            ) : useManualEntry && !stellarConnected ? (
              <div className="space-y-4">
                <Input
                  type="text"
                  placeholder="Enter Stellar address (e.g., G...)"
                  value={manualStellarAddress}
                  onChange={(e) => setManualStellarAddress(e.target.value)}
                  className="w-full font-mono text-sm"
                />
                {manualStellarAddress && (
                  <div className="space-y-2">
                    <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="text-sm text-blue-700 dark:text-blue-300">
                          Address entered:{" "}
                          {formatStellarAddress(manualStellarAddress)}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 p-0"
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(
                                manualStellarAddress
                              );
                              toast.success("Address copied!");
                            } catch {
                              toast.error("Failed to copy address");
                            }
                          }}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Trustline Status */}
                    {isValidStellarAddress(manualStellarAddress) && (
                      <div className="p-3 border rounded-lg">
                        {trustlineChecking ? (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Checking USDC trustline...
                          </div>
                        ) : trustlineError ? (
                          <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                            <XCircle className="h-4 w-4" />
                            {trustlineError}
                          </div>
                        ) : trustlineResult ? (
                          <div className="space-y-1">
                            {trustlineResult.exists ? (
                              <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                                <CheckCircle className="h-4 w-4" />
                                USDC trustline active
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 text-sm text-yellow-600 dark:text-yellow-400">
                                <AlertCircle className="h-4 w-4" />
                                No USDC trustline found
                              </div>
                            )}
                            {trustlineResult.exists && (
                              <div className="text-xs text-muted-foreground">
                                Balance:{" "}
                                {parseFloat(
                                  trustlineResult.balance
                                ).toLocaleString()}{" "}
                                USDC
                              </div>
                            )}
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>
                )}
                <Button
                  variant="ghost"
                  onClick={() => {
                    setUseManualEntry(false);
                    setManualStellarAddress("");
                    setTrustlineResult(null);
                    setTrustlineError(null);
                  }}
                  className="w-full"
                >
                  Back to wallet connection
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <div className="text-sm min-w-0 flex-1">
                        <div className="font-medium text-green-900 dark:text-green-100">
                          Wallet Connected
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-green-700 dark:text-green-300 font-mono text-xs">
                            {formatStellarAddress(stellarAddress)}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 w-5 p-0"
                            onClick={async () => {
                              try {
                                await navigator.clipboard.writeText(
                                  stellarAddress
                                );
                                toast.success("Address copied!");
                              } catch {
                                toast.error("Failed to copy address");
                              }
                            }}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        disconnectStellarWallet();
                        setSelectedAmount(null);
                        setCustomAmount("");
                        setUseManualEntry(false);
                        setManualStellarAddress("");
                        setTrustlineResult(null);
                        setTrustlineError(null);
                      }}
                      className="flex-shrink-0"
                    >
                      Disconnect
                    </Button>
                  </div>
                </div>

                {/* Trustline Status for connected wallet */}
                {stellarAddress && (
                  <div className="p-3 border rounded-lg">
                    {trustlineChecking ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Checking USDC trustline...
                      </div>
                    ) : trustlineError ? (
                      <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                        <XCircle className="h-4 w-4" />
                        {trustlineError}
                      </div>
                    ) : trustlineResult ? (
                      <div className="space-y-1">
                        {trustlineResult.exists ? (
                          <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                            <CheckCircle className="h-4 w-4" />
                            USDC trustline active
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-sm text-yellow-600 dark:text-yellow-400">
                            <AlertCircle className="h-4 w-4" />
                            No USDC trustline found
                          </div>
                        )}
                        {trustlineResult.exists && (
                          <div className="text-xs text-muted-foreground">
                            Balance:{" "}
                            {parseFloat(
                              trustlineResult.balance
                            ).toLocaleString()}{" "}
                            USDC
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Amount Selection - Show after wallet is connected or address is entered */}
          {(stellarConnected || (useManualEntry && manualStellarAddress)) && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-3">
                  Step 2: Select Amount (USDC)
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {PRESET_AMOUNTS.map((amount) => (
                    <Button
                      key={amount}
                      variant={
                        selectedAmount === amount && !customAmount
                          ? "default"
                          : "outline"
                      }
                      onClick={() => handleAmountSelection(amount)}
                      className="h-12"
                    >
                      {amount} USDC
                    </Button>
                  ))}
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Other amount:
                  </span>
                  <Input
                    type="number"
                    placeholder="Enter amount in USDC"
                    value={customAmount}
                    onChange={(e) => handleCustomAmountChange(e.target.value)}
                    min="0.1"
                    step="0.01"
                    className="flex-1"
                  />
                </div>
              </div>

              <p className="text-xs text-muted-foreground font-mono font-semibold">
                Note: Add a USDC trustline to your Stellar wallet before
                receiving funds.
              </p>

              <Button
                onClick={handleProceedWithTopup}
                className="w-full"
                size="lg"
                disabled={!selectedAmount && !customAmount}
              >
                <ArrowRight className="h-4 w-4 mr-2" />
                Proceed with {customAmount || selectedAmount} USDC Top Up
              </Button>
            </div>
          )}

          <div className="space-y-2">
            <div className="text-xs text-center text-muted-foreground">
              ✨ Powered by Rozo - Visa for stablecoins
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
