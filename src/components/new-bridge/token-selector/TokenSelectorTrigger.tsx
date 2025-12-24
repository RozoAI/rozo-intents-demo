"use client";

import {
  Arbitrum,
  Base,
  BinanceSmartChain,
  Ethereum,
  Polygon,
  Solana,
  Stellar,
} from "@/components/icons/chains";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  arbitrum,
  base,
  bsc,
  ethereum,
  polygon,
  rozoSolana,
  rozoStellar,
} from "@rozoai/intent-common";
import { ChevronDown } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { DestinationSelector, SourceSelector } from "../providers/hooks";
import { TokenSelectorPopover } from "./TokenSelectorPopover";

interface TokenSelectorTriggerProps {
  buttonLabel?: string;
  modalTitle?: string;
  className?: string;
  selector: SourceSelector | DestinationSelector;
}

const chainToLogo = {
  [arbitrum.chainId]: <Arbitrum width={12} height={12} />,
  [base.chainId]: <Base width={12} height={12} />,
  [bsc.chainId]: <BinanceSmartChain width={12} height={12} />,
  [ethereum.chainId]: (
    <Ethereum width={12} height={12} className="rounded-full" />
  ),
  [polygon.chainId]: <Polygon width={12} height={12} />,
  [rozoSolana.chainId]: <Solana width={12} height={12} />,
  [rozoStellar.chainId]: (
    <Stellar width={12} height={12} className="rounded-full" />
  ),
};

export function TokenSelectorTrigger({
  buttonLabel = "Select Token",
  modalTitle,
  className,
  selector,
}: TokenSelectorTriggerProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <TokenSelectorPopover
        open={open}
        onOpenChange={setOpen}
        title={modalTitle}
        selectedChain={selector.selectedChain}
        selectedToken={selector.selectedToken}
        onSelectChain={selector.onSelectChain}
        onSelectToken={selector.onSelectToken}
        availableChains={selector.availableChains}
        availableTokens={selector.availableTokens}
        oppositeToken={selector.oppositeToken}
        isDestination={selector.isDestination}
        trigger={
          <Button
            variant="outline"
            size="sm"
            className={cn(
              className,
              "px-3 py-1! sm:px-3.5 h-10 sm:h-10 w-full sm:w-[150px]"
            )}
            onClick={() => setOpen(true)}
          >
            <div className="flex items-center gap-2 relative flex-1 min-w-0">
              {selector.selectedToken ? (
                <>
                  <div className="relative shrink-0">
                    <Image
                      src={selector.selectedToken.logoURI}
                      alt={selector.selectedToken.symbol}
                      width={27}
                      height={27}
                      className="size-6"
                    />
                    <div className="absolute -bottom-0.5 -right-1 rounded-full">
                      {selector.selectedChain &&
                        chainToLogo[selector.selectedChain.chainId]}
                    </div>
                  </div>

                  <div className="flex-1 ml-1.5 min-w-0">
                    <p className="font-medium text-left md:text-sm text-xs truncate">
                      {selector.selectedToken.symbol}
                    </p>
                    <p className="text-xs text-muted-foreground text-left truncate">
                      {selector.selectedChain?.name}
                    </p>
                  </div>
                </>
              ) : (
                <span className="truncate text-sm">{buttonLabel}</span>
              )}
            </div>
            <ChevronDown className="size-4 shrink-0 ml-1.5" />
          </Button>
        }
      />
    </>
  );
}
