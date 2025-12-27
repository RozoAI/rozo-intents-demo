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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
  supportedPayoutTokens,
  Token,
  TokenSymbol,
} from "@rozoai/intent-common";
import { CheckIcon } from "lucide-react";
import Image from "next/image";
import React, { ReactNode, useCallback, useEffect, useState } from "react";

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
  oppositeToken?: Token | null; // Source token for destination selector, destination token for source selector
  isDestination?: boolean; // true for destination selector, false for source selector
}

const defaultListChains = Array.from(supportedPayoutTokens.keys())
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
  oppositeToken,
  isDestination = false,
}: TokenSelectorPopoverProps) {
  // Determine if a token should be disabled
  // Only disable tokens in destination selector, never in source selector
  const isTokenDisabled = useCallback(
    (token: Token): boolean => {
      // Never disable tokens in source selector - users should always be able to choose any token as source
      if (!isDestination) return false;

      // Only apply restrictions in destination selector
      if (!oppositeToken) return false;

      const oppositeSymbol = oppositeToken.symbol;
      const tokenSymbol = token.symbol;

      // If source token is USDC or USDT, disable EURC in destination
      if (
        (oppositeSymbol === TokenSymbol.USDC ||
          oppositeSymbol === TokenSymbol.USDT) &&
        tokenSymbol === TokenSymbol.EURC
      ) {
        return true;
      }

      // If source token is EURC, disable USDC and USDT in destination
      if (
        oppositeSymbol === TokenSymbol.EURC &&
        (tokenSymbol === TokenSymbol.USDC || tokenSymbol === TokenSymbol.USDT)
      ) {
        return true;
      }

      return false;
    },
    [oppositeToken, isDestination]
  );

  // Get disabled reason message
  const getDisabledReason = useCallback(
    (token: Token): string | null => {
      // Only show disabled reason in destination selector
      if (!isDestination || !oppositeToken) return null;

      const oppositeSymbol = oppositeToken.symbol;
      const tokenSymbol = token.symbol;

      if (
        (oppositeSymbol === TokenSymbol.USDC ||
          oppositeSymbol === TokenSymbol.USDT) &&
        tokenSymbol === TokenSymbol.EURC
      ) {
        return "EURC can only be transferred from EURC";
      }

      if (
        oppositeSymbol === TokenSymbol.EURC &&
        (tokenSymbol === TokenSymbol.USDC || tokenSymbol === TokenSymbol.USDT)
      ) {
        return "EURC can only be transferred to EURC";
      }

      return null;
    },
    [oppositeToken, isDestination]
  );

  const handleSelectChain = (chain: Chain) => {
    onSelectChain(chain);
  };

  const handleSelectToken = (token: Token) => {
    // Prevent selection of disabled tokens
    if (isTokenDisabled(token)) {
      return;
    }
    onSelectToken(token);
    onOpenChange?.(false);
  };

  // Use available chains if provided, otherwise use default list
  const displayChains = availableChains || defaultListChains;

  // Use available tokens for the selected chain if provided, otherwise get from supportedTokens
  const displayTokens = selectedChain
    ? availableTokens || supportedPayoutTokens.get(selectedChain.chainId) || []
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
                  {displayTokens.map((token) => {
                    const disabled = isTokenDisabled(token);
                    const disabledReason = getDisabledReason(token);
                    const tokenKey = `${selectedChain.chainId}-${token.symbol}`;

                    const tokenItem = (
                      <Item
                        variant={
                          selectedToken?.symbol === token.symbol
                            ? "outline"
                            : "default"
                        }
                        className={cn(
                          "w-full flex items-center gap-2 p-2",
                          disabled
                            ? "opacity-50 cursor-not-allowed"
                            : "cursor-pointer",
                          selectedToken?.symbol === token.symbol
                            ? "bg-accent/50"
                            : !disabled && "hover:bg-accent/50"
                        )}
                        onClick={
                          disabled ? undefined : () => handleSelectToken(token)
                        }
                      >
                        <ItemMedia>
                          <Image
                            src={token.logoURI}
                            alt={token.symbol}
                            width={20}
                            height={20}
                          />
                        </ItemMedia>
                        <ItemContent className="flex-1 min-w-0">
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
                    );

                    if (disabled && disabledReason) {
                      return (
                        <Tooltip key={tokenKey}>
                          <TooltipTrigger asChild>{tokenItem}</TooltipTrigger>
                          <TooltipContent>
                            <p>{disabledReason}</p>
                          </TooltipContent>
                        </Tooltip>
                      );
                    }

                    return (
                      <React.Fragment key={tokenKey}>
                        {tokenItem}
                      </React.Fragment>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </>
  );
}
