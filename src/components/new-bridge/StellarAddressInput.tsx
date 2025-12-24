"use client";

import { checkTokenTrustline, isContractAddress } from "@/lib/stellar";
import { cn } from "@/lib/utils";
import { isValidStellarAddress } from "@rozoai/intent-common";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Stellar } from "../icons/chains";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "../ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupTextarea,
} from "../ui/input-group";

interface StellarAddressInputProps {
  value: string;
  onChange?: (value: string) => void;
  onTrustlineStatusChange?: (
    address: string,
    exists: boolean,
    balance: string
  ) => void;
  error?: string;
  onErrorChange?: (error: string) => void;
  currency?: "USDC" | "EURC";
}

export function StellarAddressInput({
  value,
  onChange,
  onTrustlineStatusChange,
  error,
  onErrorChange,
  currency = "USDC",
}: StellarAddressInputProps) {
  const [address, setAddress] = useState(value);
  const [isCheckingTrustline, setIsCheckingTrustline] = useState(false);
  const [trustlineExists, setTrustlineExists] = useState(false);

  // Sync local state with value prop when it changes externally
  useEffect(() => {
    setAddress(value);
    // Reset trustline status when value is cleared externally
    if (!value || value.trim() === "") {
      setTrustlineExists(false);
      setIsCheckingTrustline(false);
    }
  }, [value]);

  const checkTrustline = useCallback(
    async (address: string) => {
      try {
        if (!isValidStellarAddress(address)) {
          return;
        }
      } catch (err) {
        // Invalid or unsupported address type - don't proceed with trustline check
        onErrorChange?.("Invalid or unsupported Stellar address format");
        return;
      }

      // Skip trustline checking for contract addresses (C addresses)
      if (isContractAddress(address)) {
        setTrustlineExists(true);
        onTrustlineStatusChange?.(address, true, "0");
        onErrorChange?.("");
        return;
      }

      setIsCheckingTrustline(true);
      try {
        const result = await checkTokenTrustline(address, currency);
        setTrustlineExists(result.exists);
        onTrustlineStatusChange?.(address, result.exists, result.balance);

        if (!result.exists) {
          onErrorChange?.(
            `This Stellar address doesn't have a ${currency} trustline. The recipient needs to create one first.`
          );
        } else {
          onErrorChange?.("");
        }
      } catch (err) {
        console.error("Failed to check trustline:", err);
        setTrustlineExists(false);
        onTrustlineStatusChange?.(address, false, "0");
        onErrorChange?.(
          "Failed to check trustline. Please verify the address is correct."
        );
      } finally {
        setIsCheckingTrustline(false);
      }
    },
    [currency, onTrustlineStatusChange, onErrorChange]
  );

  // Re-check trustline when currency changes (if address is already entered)
  useEffect(() => {
    if (!value) {
      return;
    }

    // Validate address first, catch any errors from unsupported address types
    let isValid = false;
    try {
      isValid = isValidStellarAddress(address);
    } catch (err) {
      // Invalid or unsupported address type
      onErrorChange?.("Invalid or unsupported Stellar address format");
      setTrustlineExists(false);
      onTrustlineStatusChange?.(address, false, "0");
      return;
    }

    if (!isValid) {
      return;
    }

    // Skip trustline checking for contract addresses (C addresses)
    if (isContractAddress(address)) {
      setTrustlineExists(true);
      onTrustlineStatusChange?.(address, true, "0");
      onErrorChange?.("");
      return;
    }

    let cancelled = false;
    setIsCheckingTrustline(true);

    const performCheck = async () => {
      try {
        const result = await checkTokenTrustline(address, currency);
        if (cancelled) return;

        setTrustlineExists(result.exists);
        onTrustlineStatusChange?.(address, result.exists, result.balance);

        if (!result.exists) {
          onErrorChange?.(
            `This Stellar address doesn't have a ${currency} trustline. The recipient needs to create one first.`
          );
        } else {
          onErrorChange?.("");
        }
      } catch (err) {
        if (cancelled) return;
        console.error("Failed to check trustline:", err);
        setTrustlineExists(false);
        onTrustlineStatusChange?.(address, false, "0");
        onErrorChange?.(
          "Failed to check trustline. Please verify the address is correct."
        );
      } finally {
        if (!cancelled) {
          setIsCheckingTrustline(false);
        }
      }
    };

    performCheck();

    return () => {
      cancelled = true;
    };
  }, [currency, address]);

  const handleChange = (inputValue: string) => {
    onChange?.(inputValue);
    setAddress(inputValue);

    // Reset trustline status when address changes
    setTrustlineExists(false);
    // Use inputValue instead of address (which is the old value)
    onTrustlineStatusChange?.(inputValue, false, "0");

    if (inputValue.trim() === "") {
      onErrorChange?.("");
      return;
    }
  };

  const handleBlur = () => {
    try {
      if (trustlineExists || isCheckingTrustline) {
        return;
      }

      if (address.trim() === "") {
        onErrorChange?.("");
        return;
      }

      let isValid = false;
      try {
        isValid = isValidStellarAddress(address);
      } catch (err) {
        // Invalid or unsupported address type
        onErrorChange?.("Invalid or unsupported Stellar address format");
        setTrustlineExists(false);
        onTrustlineStatusChange?.(address, false, "0");
        return;
      }

      if (!isValid) {
        onErrorChange?.("Invalid Stellar address");
        setTrustlineExists(false);
        onTrustlineStatusChange?.(address, false, "0");
        return;
      }

      // Valid address, check trustline (or skip for contract addresses)
      checkTrustline(address);
    } catch (err) {
      // Catch any other unexpected errors
      onErrorChange?.("Invalid Stellar address");
      setTrustlineExists(false);
      onTrustlineStatusChange?.(address, false, "0");
    }
  };

  // Status indicator component
  const StatusIndicator = () => {
    if (!address || address.trim() === "") {
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

    return null;
  };

  return (
    <FieldSet>
      <FieldGroup>
        <Field>
          <InputGroup
            className={cn(
              "rounded-xl bg-background",
              error
                ? "border-red-500 focus-visible:border-red-500 dark:border-red-500 dark:focus-visible:border-red-500"
                : ""
            )}
          >
            <InputGroupTextarea
              id="stellar-address"
              placeholder="Enter your address"
              value={address}
              onChange={(e) => handleChange(e.target.value)}
              onBlur={handleBlur}
              rows={2}
              className={`resize-none`}
              style={{ fontSize: "16px" }} // Prevent iOS zoom
            />

            <InputGroupAddon align="block-start" className="border-b">
              <Stellar width={20} height={20} className="rounded-full" />
              <FieldLabel
                htmlFor="feedback"
                className="text-neutral-500 dark:text-neutral-400 text-xs sm:text-sm"
              >
                Destination Address{" "}
                <span className="text-red-500 dark:text-red-400">*</span>
              </FieldLabel>
              <div className="flex items-center gap-2 ml-auto">
                <StatusIndicator />
                {!isCheckingTrustline && trustlineExists && !error && (
                  <p className="text-xs text-green-600 dark:text-green-400">
                    {isContractAddress(value)
                      ? "✓ Valid Stellar contract address"
                      : `✓ ${currency} trustline verified`}
                  </p>
                )}
              </div>
            </InputGroupAddon>
          </InputGroup>
          {error && (
            <FieldDescription>
              <p className="text-xs text-red-500 dark:text-red-400 wrap-break-word">
                {error}
              </p>
            </FieldDescription>
          )}
        </Field>
      </FieldGroup>
    </FieldSet>
  );
}
