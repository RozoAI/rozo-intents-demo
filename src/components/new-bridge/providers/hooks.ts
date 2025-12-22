"use client";

import { Chain, Token } from "@rozoai/intent-common";
import { useBridge } from "./BridgeProvider";

export interface SourceSelector {
  selectedChain: Chain | null;
  selectedToken: Token | null;
  availableChains: Chain[];
  availableTokens: Token[];
  onSelectChain: (chain: Chain) => void;
  onSelectToken: (token: Token) => void;
}

export interface DestinationSelector {
  selectedChain: Chain | null;
  selectedToken: Token | null;
  availableChains: Chain[];
  availableTokens: Token[];
  onSelectChain: (chain: Chain) => void;
  onSelectToken: (token: Token) => void;
}

/**
 * Hook for source chain/token selection
 */
export function useSourceSelector(): SourceSelector {
  const {
    sourceChain,
    sourceToken,
    availableSourceChains,
    availableSourceTokens,
    setSourceChain,
    setSourceToken,
  } = useBridge();

  return {
    selectedChain: sourceChain,
    selectedToken: sourceToken,
    availableChains: availableSourceChains,
    availableTokens: availableSourceTokens,
    onSelectChain: setSourceChain,
    onSelectToken: setSourceToken,
  };
}

/**
 * Hook for destination chain/token selection
 */
export function useDestinationSelector(): DestinationSelector {
  const {
    destinationChain,
    destinationToken,
    availableDestinationChains,
    availableDestinationTokens,
    setDestinationChain,
    setDestinationToken,
  } = useBridge();

  return {
    selectedChain: destinationChain,
    selectedToken: destinationToken,
    availableChains: availableDestinationChains,
    availableTokens: availableDestinationTokens,
    onSelectChain: setDestinationChain,
    onSelectToken: setDestinationToken,
  };
}
