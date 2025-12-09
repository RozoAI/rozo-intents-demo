"use client";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  baseUSDC,
  getChainById,
  rozoStellar,
  solana,
  supportedPayoutTokens,
  TokenLogo,
} from "@rozoai/intent-common";
import { Check, ChevronDown } from "lucide-react";
import Image from "next/image";
import React, { useMemo } from "react";
import { chainToLogo } from "../ChainStacked";

interface ChainSelectorProps {
  value: number;
  onChange: (chainId: number) => void;
  className?: string;
}

export const supportedPayoutChains = Array.from(supportedPayoutTokens.entries())
  .filter(
    ([chainId, _tokens]) =>
      ![rozoStellar.chainId, solana.chainId].includes(chainId)
  )
  .map(([chainId, _tokens]) => getChainById(chainId));

export function ChainSelector({
  value,
  onChange,
  className,
}: ChainSelectorProps) {
  const [open, setOpen] = React.useState(false);

  const selectedChain = useMemo(() => {
    return (
      supportedPayoutChains.find((c) => c?.chainId === value)?.chainId ||
      baseUSDC.chainId
    );
  }, [value]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "inline-flex items-center gap-1.5 sm:gap-2",
            "bg-neutral-200/70 dark:bg-neutral-700/50",
            "border border-neutral-300/50 dark:border-neutral-600/30",
            "rounded-full px-2 sm:px-3 py-1.5 sm:py-2",
            "transition-all hover:bg-neutral-300/70 dark:hover:bg-neutral-600/50",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            "cursor-pointer select-none",
            className
          )}
        >
          <Image
            src={TokenLogo.USDC}
            alt="USDC"
            width={20}
            height={20}
            className="w-5 h-5 sm:w-6 sm:h-6 z-10"
          />
          <span className="font-medium text-neutral-900 dark:text-white text-xs sm:text-sm">
            USDC
          </span>
          <span className="text-neutral-500 dark:text-neutral-400 text-[10px] sm:text-xs">
            on
          </span>
          <div className="overflow-hidden rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center">
            {chainToLogo[selectedChain]}
          </div>
          <ChevronDown className="w-4 h-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-52 p-1" align="start">
        <div className="flex flex-col gap-0.5">
          {supportedPayoutChains.map((chain) => (
            <button
              key={chain.chainId}
              onClick={() => {
                onChange(chain.chainId);
                setOpen(false);
              }}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm",
                "transition-colors hover:bg-muted",
                selectedChain === chain.chainId && "bg-muted"
              )}
            >
              <div className="w-5 h-5 rounded-full overflow-hidden border border-neutral-300/50 dark:border-neutral-600/30 flex items-center justify-center">
                {chainToLogo[chain.chainId]}
              </div>
              <span className="flex-1 text-left">{chain.name}</span>
              {selectedChain === chain.chainId && (
                <Check className="size-4 text-primary" />
              )}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
