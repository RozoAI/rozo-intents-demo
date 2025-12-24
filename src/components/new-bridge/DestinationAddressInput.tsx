"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  arbitrum,
  base,
  bsc,
  ethereum,
  polygon,
  rozoSolana,
  validateAddressForChain,
} from "@rozoai/intent-common";
import { useMemo } from "react";

interface DestinationAddressInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  onErrorChange?: (error: string) => void;
  chainId?: number;
}

export function DestinationAddressInput({
  value,
  onChange,
  error,
  onErrorChange,
  chainId,
}: DestinationAddressInputProps) {
  const handleChange = (inputValue: string) => {
    onChange(inputValue);

    if (inputValue.trim() === "") {
      onErrorChange?.("");
      return;
    }
  };

  const handleBlur = () => {
    try {
      if (value.trim() === "") {
        onErrorChange?.("");
        return;
      }

      const validation = validateAddressForChain(Number(chainId), value);
      if (!validation) {
        onErrorChange?.("Invalid address");
      } else {
        onErrorChange?.("");
      }
    } catch {
      onErrorChange?.("Invalid address");
    }
  };

  const placeholder = useMemo(() => {
    const chainMap = {
      [rozoSolana.chainId]: "Solana address...",
      [base.chainId]: "Base address...",
      [polygon.chainId]: "Polygon address...",
      [ethereum.chainId]: "Ethereum address...",
      [bsc.chainId]: "BSC address...",
      [arbitrum.chainId]: "Arbitrum address...",
    };
    return chainMap[chainId as keyof typeof chainMap] || "Address...";
  }, [chainId]);

  return (
    <div className="space-y-2">
      <Label
        htmlFor="base-address"
        className="text-neutral-600 dark:text-neutral-400"
      >
        Destination Address
        <span className="text-red-500 dark:text-red-400">*</span>
      </Label>
      <Input
        id="base-address"
        placeholder={placeholder}
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={handleBlur}
        className={`h-10 sm:h-12 bg-white border-neutral-300 text-base text-neutral-900 placeholder:text-neutral-400 dark:bg-neutral-800 dark:border-neutral-700 dark:text-white dark:placeholder:text-neutral-500 ${
          error
            ? "border-red-500 focus-visible:border-red-500 dark:border-red-500 dark:focus-visible:border-red-500"
            : ""
        }`}
        style={{ fontSize: "16px" }} // Prevent iOS zoom
      />
      {error && (
        <p className="text-xs text-red-500 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
