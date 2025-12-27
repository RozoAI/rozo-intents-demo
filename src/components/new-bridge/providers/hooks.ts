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
  oppositeToken: Token | null; // Destination token for source selector
  isDestination: false; // Always false for source selector
}

export interface DestinationSelector {
  selectedChain: Chain | null;
  selectedToken: Token | null;
  availableChains: Chain[];
  availableTokens: Token[];
  onSelectChain: (chain: Chain) => void;
  onSelectToken: (token: Token) => void;
  oppositeToken: Token | null; // Source token for destination selector
  isDestination: true; // Always true for destination selector
}

/**
 * Hook for source chain/token selection
 */
export function useSourceSelector(): SourceSelector {
  const {
    sourceChain,
    sourceToken,
    destinationToken,
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
    oppositeToken: destinationToken, // Destination token for source selector
    isDestination: false,
  };
}

/**
 * Hook for destination chain/token selection
 */
export function useDestinationSelector(): DestinationSelector {
  const {
    sourceToken,
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
    oppositeToken: sourceToken, // Source token for destination selector
    isDestination: true,
  };
}
