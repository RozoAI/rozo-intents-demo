"use client";

import { formatNumber } from "@/lib/formatNumber";
import { TokenSymbol } from "@rozoai/intent-common";
import { useMemo } from "react";

interface TokenAmountInputProps {
  label?: string;
  labelContent?: React.ReactNode;
  amount: string | undefined;
  setAmount?: (v: string | undefined) => void;
  readonly?: boolean;
  currency: TokenSymbol;
}

export function TokenAmountInput({
  label,
  labelContent,
  amount,
  setAmount,
  readonly = false,
  currency,
}: TokenAmountInputProps) {
  // Remove all non-numeric characters except decimal point
  const cleanValue = (value: string): string => {
    return value.replace(/[^\d.]/g, "");
  };

  const handleAmountChange = (value: string) => {
    if (!setAmount) return;

    const rawValue = cleanValue(value);
    // Allow only numbers and decimal point
    if (rawValue === "" || /^\d*\.?\d*$/.test(rawValue)) {
      if (rawValue === "") {
        setAmount(undefined);
      } else {
        // Store as string to preserve typing state (like "0." while typing "0.5")
        setAmount(rawValue);
      }
    }
  };

  const currencySymbol = useMemo(() => {
    return currency === TokenSymbol.EURC ? "€" : "$";
  }, [currency]);

  // Calculate USD value (USDC is 1:1 with USD)
  const getUsdValue = () => {
    if (!amount || amount === "") return `${currencySymbol}0.00`;
    const numValue = parseFloat(amount);
    if (isNaN(numValue)) return `${currencySymbol}0.00`;
    return `${currencySymbol}${numValue.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <div className="flex-1">
      <div className="flex items-start gap-2 text-xs sm:text-sm">
        {label && (
          <label className="text-neutral-600 dark:text-neutral-400">
            {label}
          </label>
        )}
        {labelContent}
      </div>
      <input
        type="text"
        value={amount !== undefined ? formatNumber(amount) : ""}
        onChange={(e) => handleAmountChange(e.target.value)}
        placeholder="0"
        className="text-3xl sm:text-5xl font-medium text-neutral-900 dark:text-white w-full outline-none bg-transparent placeholder:text-neutral-300 dark:placeholder:text-neutral-600"
        readOnly={readonly}
        style={{ fontSize: "clamp(1.875rem, 8vw, 3rem)" }} // Responsive: 30px mobile, scales up, max 48px
      />
      <div className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-500 mt-1.5 sm:mt-2">
        {getUsdValue()}
      </div>
    </div>
  );
}
