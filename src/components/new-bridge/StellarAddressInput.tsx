"use client";

import { Label } from "@/components/ui/label";
import { checkUSDCTrustline, isValidStellarAddress } from "@/lib/stellar";
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { useCallback, useState } from "react";
import { Textarea } from "../ui/textarea";

interface StellarAddressInputProps {
  value: string;
  onChange: (value: string) => void;
  onTrustlineStatusChange?: (exists: boolean, balance: string) => void;
  error?: string;
  onErrorChange?: (error: string) => void;
}

export function StellarAddressInput({
  value,
  onChange,
  onTrustlineStatusChange,
  error,
  onErrorChange,
}: StellarAddressInputProps) {
  const [isCheckingTrustline, setIsCheckingTrustline] = useState(false);
  const [trustlineExists, setTrustlineExists] = useState(false);

  const checkTrustline = useCallback(
    async (address: string) => {
      if (!isValidStellarAddress(address)) {
        return;
      }

      setIsCheckingTrustline(true);
      try {
        const result = await checkUSDCTrustline(address);
        setTrustlineExists(result.exists);
        onTrustlineStatusChange?.(result.exists, result.balance);

        if (!result.exists) {
          onErrorChange?.(
            "This Stellar address doesn't have a USDC trustline. The recipient needs to create one first."
          );
        } else {
          onErrorChange?.("");
        }
      } catch (err) {
        console.error("Failed to check trustline:", err);
        setTrustlineExists(false);
        onTrustlineStatusChange?.(false, "0");
        onErrorChange?.(
          "Failed to check trustline. Please verify the address is correct."
        );
      } finally {
        setIsCheckingTrustline(false);
      }
    },
    [onTrustlineStatusChange, onErrorChange]
  );

  const handleChange = (inputValue: string) => {
    onChange(inputValue);

    // Reset trustline status when address changes
    setTrustlineExists(false);
    onTrustlineStatusChange?.(false, "0");

    if (inputValue.trim() === "") {
      onErrorChange?.("");
      return;
    }
  };

  const handleBlur = () => {
    if (value.trim() === "") {
      onErrorChange?.("");
      return;
    }

    if (!isValidStellarAddress(value)) {
      onErrorChange?.("Invalid Stellar address");
      setTrustlineExists(false);
      onTrustlineStatusChange?.(false, "0");
      return;
    }

    // Valid address, check trustline
    checkTrustline(value);
  };

  // Status indicator component
  const StatusIndicator = () => {
    if (!value || value.trim() === "") {
      return null;
    }

    if (isCheckingTrustline) {
      return (
        <div className="absolute right-3 top-3">
          <Loader2 className="size-4 animate-spin text-neutral-400" />
        </div>
      );
    }

    if (error && !isCheckingTrustline) {
      return (
        <div className="absolute right-3 top-3">
          <AlertTriangle className="size-4 text-red-500" />
        </div>
      );
    }

    if (trustlineExists) {
      return (
        <div className="absolute right-3 top-3">
          <CheckCircle2 className="size-4 text-green-500" />
        </div>
      );
    }

    return null;
  };

  return (
    <div className="space-y-2">
      <Label
        htmlFor="stellar-address"
        className="text-neutral-600 dark:text-neutral-400"
      >
        Stellar Address
      </Label>
      <div className="relative">
        <Textarea
          id="stellar-address"
          placeholder="G..."
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={handleBlur}
          rows={2}
          className={`min-h-[40px] sm:min-h-[48px] max-h-[72px] py-2 sm:py-3 pr-10 resize-none overflow-y-auto break-all text-base leading-tight bg-white border-neutral-300 text-neutral-900 placeholder:text-neutral-400 dark:bg-neutral-800 dark:border-neutral-700 dark:text-white dark:placeholder:text-neutral-500 ${
            error
              ? "border-red-500 focus-visible:border-red-500 dark:border-red-500 dark:focus-visible:border-red-500"
              : trustlineExists
              ? "border-green-500 focus-visible:border-green-500 dark:border-green-500 dark:focus-visible:border-green-500"
              : ""
          }`}
          style={{ fontSize: '16px' }} // Prevent iOS zoom
        />
        <StatusIndicator />
      </div>
      {error && (
        <p className="text-xs text-red-500 dark:text-red-400 break-words">
          {error}
        </p>
      )}
      {trustlineExists && !error && (
        <p className="text-xs text-green-600 dark:text-green-400">
          ✓ USDC trustline verified
        </p>
      )}
    </div>
  );
}
