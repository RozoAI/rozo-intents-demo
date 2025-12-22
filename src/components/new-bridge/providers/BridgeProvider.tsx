"use client";

import {
  base,
  Chain,
  getChainById,
  rozoStellar,
  solana,
  supportedTokens,
  Token,
  TokenSymbol,
  validateAddressForChain,
} from "@rozoai/intent-common";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

export interface BridgeState {
  // Source chain/token (where funds come from)
  sourceChain: Chain | null;
  sourceToken: Token | null;

  // Destination chain/token (where funds go to)
  destinationChain: Chain | null;
  destinationToken: Token | null;
  destinationAddress: string | null;
}

export interface BridgeContextType extends BridgeState {
  // Destination address
  isDestinationAddressValid: boolean;
  setDestinationAddress: (address: string) => void;

  // Source selectors
  setSourceChain: (chain: Chain) => void;
  setSourceToken: (token: Token) => void;

  // Destination selectors
  setDestinationChain: (chain: Chain) => void;
  setDestinationToken: (token: Token) => void;

  // Utility functions
  resetSelection: () => void;
  swapSourceAndDestination: () => void;

  // Available options
  availableSourceChains: Chain[];
  availableDestinationChains: Chain[];
  availableSourceTokens: Token[];
  availableDestinationTokens: Token[];
}

const BridgeContext = createContext<BridgeContextType | null>(null);

export function useBridge() {
  const context = useContext(BridgeContext);
  if (!context) {
    throw new Error("useBridge must be used within a BridgeProvider");
  }
  return context;
}

interface BridgeProviderProps {
  children: ReactNode;
  defaultSourceChain?: Chain;
  defaultDestinationChain?: Chain;
}

export function BridgeProvider({
  children,
  defaultSourceChain,
  defaultDestinationChain,
}: BridgeProviderProps) {
  const [state, setState] = useState<BridgeState>(() => {
    // Default to USDC Base -> USDC Stellar
    const baseChain = defaultSourceChain || getChainById(base.chainId);
    const stellarChain =
      defaultDestinationChain || getChainById(rozoStellar.chainId);

    const baseTokens = baseChain
      ? supportedTokens.get(baseChain.chainId) || []
      : [];
    const stellarTokens = stellarChain
      ? supportedTokens.get(stellarChain.chainId) || []
      : [];

    const defaultSourceToken =
      baseTokens.find((token) => token.symbol === TokenSymbol.USDC) ||
      baseTokens[0] ||
      null;
    const defaultDestinationToken =
      stellarTokens.find((token) => token.symbol === TokenSymbol.USDC) ||
      stellarTokens[0] ||
      null;

    return {
      sourceChain: baseChain,
      sourceToken: defaultSourceToken,
      destinationChain: stellarChain,
      destinationToken: defaultDestinationToken,
      destinationAddress: null,
    };
  });

  // Get all supported chains
  const allChains = useMemo(() => {
    return Array.from(supportedTokens.keys())
      .map((chainId) => getChainById(chainId))
      .filter(
        (chain) => ![solana.chainId].includes(chain.chainId) && Boolean(chain)
      );
  }, []);

  // Available chains - all chains for both source and destination
  const availableSourceChains = useMemo(() => {
    return allChains.filter(
      (chain) => chain.chainId !== state.destinationChain?.chainId
    );
  }, [allChains, state.destinationChain]);

  const availableDestinationChains = useMemo(() => {
    return allChains.filter(
      (chain) => chain.chainId !== state.sourceChain?.chainId
    );
  }, [allChains, state.sourceChain]);

  // Get available tokens for selected chains
  const availableSourceTokens = useMemo(() => {
    if (!state.sourceChain) return [];
    return supportedTokens.get(state.sourceChain.chainId) || [];
  }, [state.sourceChain]);

  const availableDestinationTokens = useMemo(() => {
    if (!state.destinationChain) return [];
    return supportedTokens.get(state.destinationChain.chainId) || [];
  }, [state.destinationChain]);

  const isDestinationAddressValid = useMemo(() => {
    if (!state.destinationAddress || !state.destinationChain?.chainId)
      return false;

    return validateAddressForChain(
      state.destinationChain?.chainId,
      state.destinationAddress
    );
  }, [state.destinationAddress, state.destinationChain?.chainId]);

  // Set source chain with automatic token selection
  const setSourceChain = useCallback((chain: Chain) => {
    setState((prev) => {
      const chainTokens = supportedTokens.get(chain.chainId) || [];
      const defaultToken = chainTokens[0] || null;

      // Clear incompatible destination if needed
      let newDestinationChain = prev.destinationChain;
      let newDestinationToken = prev.destinationToken;

      // If destination is the same as source, clear it
      if (prev.destinationChain?.chainId === chain.chainId) {
        newDestinationChain = null;
        newDestinationToken = null;
      }

      return {
        ...prev,
        sourceChain: chain,
        sourceToken: defaultToken,
        destinationChain: newDestinationChain,
        destinationToken: newDestinationToken,
      };
    });
  }, []);

  // Set source token
  const setSourceToken = useCallback((token: Token) => {
    setState((prev) => ({
      ...prev,
      sourceToken: token,
    }));
  }, []);

  // Set destination chain with automatic token selection
  const setDestinationChain = useCallback((chain: Chain) => {
    setState((prev) => {
      const chainTokens = supportedTokens.get(chain.chainId) || [];
      const defaultToken = chainTokens[0] || null;

      // Clear incompatible source if needed
      let newSourceChain = prev.sourceChain;
      let newSourceToken = prev.sourceToken;

      // If source is the same as destination, clear it
      if (prev.sourceChain?.chainId === chain.chainId) {
        newSourceChain = null;
        newSourceToken = null;
      }

      return {
        ...prev,
        destinationChain: chain,
        destinationToken: defaultToken,
        sourceChain: newSourceChain,
        sourceToken: newSourceToken,
      };
    });
  }, []);

  // Set destination token
  const setDestinationToken = useCallback((token: Token) => {
    setState((prev) => ({
      ...prev,
      destinationToken: token,
    }));
  }, []);

  // Toggle bridge direction (swap source and destination)
  const toggleDirection = useCallback(() => {
    setState((prev) => ({
      ...prev,
      sourceChain: prev.destinationChain,
      sourceToken: prev.destinationToken,
      destinationChain: prev.sourceChain,
      destinationToken: prev.sourceToken,
    }));
  }, []);

  // Reset all selections
  const resetSelection = useCallback(() => {
    setState((prev) => ({
      ...prev,
      sourceChain: null,
      sourceToken: null,
      destinationChain: null,
      destinationToken: null,
    }));
  }, []);

  // Swap source and destination
  const swapSourceAndDestination = useCallback(() => {
    setState((prev) => ({
      ...prev,
      sourceChain: prev.destinationChain,
      sourceToken: prev.destinationToken,
      destinationChain: prev.sourceChain,
      destinationToken: prev.sourceToken,
    }));
  }, []);

  // Set destination address
  const setDestinationAddress = useCallback((address: string) => {
    setState((prev) => ({
      ...prev,
      destinationAddress: address,
    }));
  }, []);

  const contextValue: BridgeContextType = useMemo(
    () => ({
      ...state,
      isDestinationAddressValid,
      setDestinationAddress,
      setSourceChain,
      setSourceToken,
      setDestinationChain,
      setDestinationToken,
      toggleDirection,
      resetSelection,
      swapSourceAndDestination,
      availableSourceChains,
      availableDestinationChains,
      availableSourceTokens,
      availableDestinationTokens,
    }),
    [
      state,
      setSourceChain,
      setSourceToken,
      setDestinationChain,
      setDestinationToken,
      toggleDirection,
      resetSelection,
      swapSourceAndDestination,
      availableSourceChains,
      availableDestinationChains,
      availableSourceTokens,
      availableDestinationTokens,
    ]
  );

  return (
    <BridgeContext.Provider value={contextValue}>
      {children}
    </BridgeContext.Provider>
  );
}
