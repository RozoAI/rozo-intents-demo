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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
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

interface TokenSelectorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  selectedChain: Chain | null;
  selectedToken: Token | null;
  onSelectChain: (chain: Chain) => void;
  onSelectToken: (token: Token) => void;
  availableChains?: Chain[];
  availableTokens?: Token[];
}

const defaultListChains = Array.from(supportedTokens.keys())
  .filter((chainId) => ![solana.chainId].includes(chainId))
  .map((chainId) => getChainById(chainId));

const chainToLogo = {
  [arbitrum.chainId]: <Arbitrum width={20} height={20} />,
  [base.chainId]: <Base width={20} height={20} />,
  [bsc.chainId]: <BinanceSmartChain width={20} height={20} />,
  [ethereum.chainId]: <Ethereum width={20} height={20} />,
  [polygon.chainId]: <Polygon width={20} height={20} />,
  [rozoSolana.chainId]: <Solana width={20} height={20} />,
  [rozoStellar.chainId]: <Stellar width={20} height={20} />,
};

export function TokenSelectorModal({
  open,
  onOpenChange,
  title = "Select a Token",
  selectedChain,
  selectedToken,
  onSelectChain,
  onSelectToken,
  availableChains,
  availableTokens,
}: TokenSelectorModalProps) {
  const handleSelectChain = (chain: Chain) => {
    onSelectChain(chain);
  };

  const handleSelectToken = (token: Token) => {
    onSelectToken(token);
  };

  // Use available chains if provided, otherwise use default list
  const displayChains = availableChains || defaultListChains;

  // Use available tokens for the selected chain if provided, otherwise get from supportedTokens
  const displayTokens = selectedChain
    ? availableTokens || supportedTokens.get(selectedChain.chainId) || []
    : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl" showCloseButton={false}>
        <DialogHeader className="flex flex-row justify-between items-center w-full">
          <DialogTitle>{title}</DialogTitle>
          <Button size="sm" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </DialogHeader>

        <div className="flex flex-row w-ful">
          <div className="md:w-1/3 w-full border-r border-neutral-200 dark:border-neutral-700 pr-2">
            <div className="flex flex-col gap-2">
              {displayChains.map((chain) => (
                <Item
                  key={chain.chainId}
                  variant={
                    selectedChain?.chainId === chain.chainId
                      ? "outline"
                      : "default"
                  }
                  className={cn(
                    "cursor-pointer",
                    selectedChain?.chainId === chain.chainId
                      ? "bg-accent/50"
                      : "hover:bg-accent/50"
                  )}
                  onClick={() => handleSelectChain(chain)}
                >
                  <ItemMedia>{chainToLogo[chain.chainId]}</ItemMedia>
                  <ItemContent>
                    <ItemTitle>{chain.name}</ItemTitle>
                  </ItemContent>
                  {selectedChain?.chainId === chain.chainId && (
                    <ItemActions>
                      <CheckIcon className="size-4" />
                    </ItemActions>
                  )}
                </Item>
              ))}
            </div>
          </div>
          <div className="md:w-2/3 w-full pl-2">
            {selectedChain && (
              <div className="flex flex-col gap-2">
                {displayTokens.map((token) => (
                  <Item
                    key={`${selectedChain.chainId}-${token.symbol}`}
                    variant={
                      selectedToken?.symbol === token.symbol
                        ? "outline"
                        : "default"
                    }
                    className={cn(
                      "w-full flex items-center gap-2 cursor-pointer",
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
                      <ItemTitle>{token.name || token.symbol}</ItemTitle>
                    </ItemContent>
                    {selectedToken?.symbol === token.symbol && (
                      <ItemActions>
                        <CheckIcon className="size-4" />
                      </ItemActions>
                    )}
                  </Item>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
