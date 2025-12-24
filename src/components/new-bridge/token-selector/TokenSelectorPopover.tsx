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
import {
  Item,
  ItemActions,
  ItemContent,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  arbitrum,
  base,
  bsc,
  Chain,
  ethereum,
  getChainById,
  polygon,
  rozoSolana,
  rozoStellar,
  solana,
  supportedTokens,
  Token,
} from "@rozoai/intent-common";
import { CheckIcon } from "lucide-react";
import Image from "next/image";
import { ReactNode, useEffect, useState } from "react";

interface TokenSelectorPopoverProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title?: string;
  selectedChain: Chain | null;
  selectedToken: Token | null;
  onSelectChain: (chain: Chain) => void;
  onSelectToken: (token: Token) => void;
  availableChains?: Chain[];
  availableTokens?: Token[];
  trigger?: ReactNode;
  align?: "start" | "center" | "end";
  side?: "top" | "right" | "bottom" | "left";
}

const defaultListChains = Array.from(supportedTokens.keys())
  .filter((chainId) => ![solana.chainId].includes(chainId))
  .map((chainId) => getChainById(chainId));

const chainToLogo = {
  [arbitrum.chainId]: <Arbitrum width={20} height={20} />,
  [base.chainId]: <Base width={20} height={20} />,
  [bsc.chainId]: <BinanceSmartChain width={20} height={20} />,
  [ethereum.chainId]: (
    <Ethereum width={20} height={20} className="rounded-full" />
  ),
  [polygon.chainId]: <Polygon width={20} height={20} />,
  [rozoSolana.chainId]: <Solana width={20} height={20} />,
  [rozoStellar.chainId]: (
    <Stellar width={20} height={20} className="rounded-full" />
  ),
};

export function TokenSelectorPopover({
  open,
  onOpenChange,
  title = "Select a Token",
  selectedChain,
  selectedToken,
  onSelectChain,
  onSelectToken,
  availableChains,
  availableTokens,
  trigger,
  align = "start",
  side = "right",
}: TokenSelectorPopoverProps) {
  const handleSelectChain = (chain: Chain) => {
    onSelectChain(chain);
  };

  const handleSelectToken = (token: Token) => {
    onSelectToken(token);
    onOpenChange?.(false);
  };

  // Use available chains if provided, otherwise use default list
  const displayChains = availableChains || defaultListChains;

  // Use available tokens for the selected chain if provided, otherwise get from supportedTokens
  const displayTokens = selectedChain
    ? availableTokens || supportedTokens.get(selectedChain.chainId) || []
    : [];

  // Detect mobile screen size
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Prevent body scroll when popover is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Use center align on mobile, otherwise use provided align
  const computedAlign = isMobile ? "center" : align;
  const computedSide = isMobile ? "bottom" : side;

  return (
    <>
      <Popover open={open} onOpenChange={onOpenChange}>
        {trigger && <PopoverTrigger asChild>{trigger}</PopoverTrigger>}
        <PopoverContent
          align={computedAlign}
          side={computedSide}
          className="w-[calc(100vw-2rem)] sm:w-[400px] p-0 z-50 max-w-[calc(100vw-2rem)]"
          sideOffset={8}
        >
          <div className="p-2 border-b border-neutral-200 dark:border-neutral-700">
            <div className="flex flex-row justify-between items-center w-full">
              <h3 className="font-semibold text-sm">{title}</h3>
              {onOpenChange && (
                <Button
                  size="sm"
                  // className="h-7 px-2 text-xs"
                  onClick={() => onOpenChange(false)}
                >
                  Done
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 w-full max-h-[400px] overflow-y-auto">
            <div className="border-b md:border-b-0 md:border-r border-neutral-200 dark:border-neutral-700 p-2 pb-4 md:pb-2">
              <div className="grid grid-cols-2 md:grid-cols-1 gap-1">
                {displayChains.map((chain) => (
                  <Item
                    key={chain.chainId}
                    variant={
                      selectedChain?.chainId === chain.chainId
                        ? "outline"
                        : "default"
                    }
                    className={cn(
                      "cursor-pointer p-2",
                      selectedChain?.chainId === chain.chainId
                        ? "bg-accent/50"
                        : "hover:bg-accent/50"
                    )}
                    onClick={() => handleSelectChain(chain)}
                  >
                    <ItemMedia>{chainToLogo[chain.chainId]}</ItemMedia>
                    <ItemContent>
                      <ItemTitle className="text-sm">{chain.name}</ItemTitle>
                    </ItemContent>
                    {selectedChain?.chainId === chain.chainId && (
                      <ItemActions>
                        <CheckIcon className="size-3" />
                      </ItemActions>
                    )}
                  </Item>
                ))}
              </div>
            </div>
            <div className="p-2 pt-4 md:pt-2">
              {selectedChain && (
                <div className="grid grid-cols-2 md:grid-cols-1 gap-0.5 md:gap-1">
                  {displayTokens.map((token) => (
                    <Item
                      key={`${selectedChain.chainId}-${token.symbol}`}
                      variant={
                        selectedToken?.symbol === token.symbol
                          ? "outline"
                          : "default"
                      }
                      className={cn(
                        "w-full flex items-center gap-2 cursor-pointer p-2",
                        selectedToken?.symbol === token.symbol
                          ? "bg-accent/50"
                          : "hover:bg-accent/50"
                      )}
                      onClick={() => handleSelectToken(token)}
                    >
                      <ItemMedia>
                        <Image
                          src={token.logoURI}
                          alt={token.symbol}
                          width={20}
                          height={20}
                        />
                      </ItemMedia>
                      <ItemContent>
                        <ItemTitle className="text-sm">
                          {token.name || token.symbol}
                        </ItemTitle>
                      </ItemContent>
                      {selectedToken?.symbol === token.symbol && (
                        <ItemActions>
                          <CheckIcon className="size-3" />
                        </ItemActions>
                      )}
                    </Item>
                  ))}
                </div>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </>
  );
}
