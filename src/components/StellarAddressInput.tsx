"use client";

import { Input } from "@/components/ui/input";
import { useStellarWallet } from "@/contexts/StellarWalletContext";
import {
  checkTokenTrustline,
  isMuxedAddress,
  normalizeStellarAddress,
} from "@/lib/stellar";
import { cn } from "@/lib/utils";
import { isValidStellarAddress } from "@rozoai/intent-common";
import { useEffect, useState } from "react";

interface StellarAddressInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string | null;
  placeholder?: string;
  className?: string;
  required?: boolean;
  showValidation?: boolean;
  disabled?: boolean;
}

export function StellarAddressInput({
  value,
  onChange,
  label = "Stellar Address",
  placeholder = "Enter Stellar address (G... or M...)",
  className,
  required = false,
  showValidation = true,
  disabled = false,
}: StellarAddressInputProps) {
  const { stellarConnected } = useStellarWallet();

  const [validationState, setValidationState] = useState<{
    isValid: boolean;
    isMuxed: boolean;
    normalizedAddress: string | null;
    error: string | null;
  }>({
    isValid: false,
    isMuxed: false,
    normalizedAddress: null,
    error: null,
  });

  const [trustlineState, setTrustlineState] = useState<{
    exists: boolean;
    balance: string;
    checking: boolean;
    error: string | null;
  }>({
    exists: false,
    balance: "0",
    checking: false,
    error: null,
  });

  // Validate address whenever value changes
  useEffect(() => {
    if (!value.trim()) {
      setValidationState({
        isValid: false,
        isMuxed: false,
        normalizedAddress: null,
        error: null,
      });
      return;
    }

    const trimmedValue = value.trim();

    try {
      const isValid = isValidStellarAddress(trimmedValue);
      const isMuxed = isMuxedAddress(trimmedValue);
      const normalizedAddress = isValid
        ? normalizeStellarAddress(trimmedValue)
        : null;

      if (!isValid) {
        setValidationState({
          isValid: false,
          isMuxed: false,
          normalizedAddress: null,
          error: "Invalid Stellar address format",
        });
        return;
      }

      setValidationState({
        isValid: true,
        isMuxed,
        normalizedAddress,
        error: null,
      });
    } catch {
      setValidationState({
        isValid: false,
        isMuxed: false,
        normalizedAddress: null,
        error: "Invalid address format",
      });
    }
  }, [value]);

  // Check trustline when wallet is not connected but address is valid
  useEffect(() => {
    const checkTrustlineForAddress = async () => {
      // Only check if wallet is not connected, address is valid, and we have a normalized address
      if (
        stellarConnected ||
        !validationState.isValid ||
        !validationState.normalizedAddress
      ) {
        setTrustlineState({
          exists: false,
          balance: "0",
          checking: false,
          error: null,
        });
        return;
      }

      setTrustlineState((prev) => ({ ...prev, checking: true, error: null }));

      try {
        const result = await checkTokenTrustline(
          validationState.normalizedAddress,
          "USDC"
        );
        setTrustlineState({
          exists: result.exists,
          balance: result.balance,
          checking: false,
          error: null,
        });
      } catch (error) {
        console.error("Failed to check trustline:", error);
        setTrustlineState({
          exists: false,
          balance: "0",
          checking: false,
          error:
            error instanceof Error
              ? error.message
              : "Failed to check trustline",
        });
      }
    };

    checkTrustlineForAddress();
  }, [
    stellarConnected,
    validationState.isValid,
    validationState.normalizedAddress,
  ]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
  };

  const showError = showValidation && validationState.error && value.trim();

  return (
    <div className={cn("space-y-2", className)}>
      {/* Input */}
      <div className="relative">
        <Input
          id="stellar-address"
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={() => {}}
          onBlur={() => {}}
          placeholder={placeholder}
          disabled={disabled}
        />
      </div>

      {/* Error Message */}
      {showError && (
        <div className="text-xs text-red-600 dark:text-red-400">
          {validationState.error}
        </div>
      )}

      {/* Trustline Information - Only show when wallet is not connected */}
      {!stellarConnected && validationState.isValid && value.trim() && (
        <div className="space-y-1">
          {trustlineState.checking && (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Checking USDC trustline...
            </div>
          )}

          {!trustlineState.checking && !trustlineState.error && (
            <div className="text-xs">
              {trustlineState.exists ? (
                <div className="text-green-600 dark:text-green-400">
                  ✓ USDC trustline exists (Balance:{" "}
                  {Number(trustlineState.balance).toFixed(2)} USDC)
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="text-yellow-600 dark:text-yellow-400">
                    ⚠ No USDC trustline found
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    To receive USDC, this address needs to establish a trustline
                    with USDC issuer. Connect your wallet to create the
                    trustline.
                  </div>
                </div>
              )}
            </div>
          )}

          {!trustlineState.checking && trustlineState.error && (
            <div className="text-xs text-orange-600 dark:text-orange-400">
              ⚠ Could not check trustline: {trustlineState.error}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
