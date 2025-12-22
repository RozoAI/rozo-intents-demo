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
import { TokenSelectorModal } from "./TokenSelectorModal";

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
      <Button
        variant="outline"
        size="lg"
        className={cn(className, "px-3! w-36 h-12!")}
        onClick={() => setOpen(true)}
      >
        <div className="flex items-center gap-2 relative flex-1">
          {selector.selectedToken ? (
            <>
              <div className="relative">
                <Image
                  src={selector.selectedToken.logoURI}
                  alt={selector.selectedToken.symbol}
                  width={24}
                  height={24}
                />
                <div className="absolute -bottom-0.5 -right-1 rounded-full">
                  {selector.selectedChain &&
                    chainToLogo[selector.selectedChain.chainId]}
                </div>
              </div>

              <div className="flex-1 ml-0.5">
                <p className="font-medium text-left text-sm">
                  {selector.selectedToken.symbol}
                </p>
                <p className="text-xs text-muted-foreground text-left">
                  {selector.selectedChain?.name}
                </p>
              </div>
            </>
          ) : (
            buttonLabel
          )}
        </div>
        <ChevronDown className="size-4" />
      </Button>
      <TokenSelectorModal
        open={open}
        onOpenChange={setOpen}
        title={modalTitle}
        selectedChain={selector.selectedChain}
        selectedToken={selector.selectedToken}
        onSelectChain={selector.onSelectChain}
        onSelectToken={selector.onSelectToken}
        availableChains={selector.availableChains}
        availableTokens={selector.availableTokens}
      />
    </>
  );
}
