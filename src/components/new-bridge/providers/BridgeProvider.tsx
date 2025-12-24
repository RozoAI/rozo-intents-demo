"use client";

import { useStellarWallet } from "@/contexts/StellarWalletContext";
import {
  base,
  baseUSDC,
  Chain,
  getChainById,
  rozoStellar,
  rozoStellarUSDC,
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
  const { stellarAddress, stellarConnected } = useStellarWallet();

  const [state, setState] = useState<BridgeState>(() => {
    const defaultSourceChainValue = defaultSourceChain || base;
    const defaultDestinationChainValue = defaultDestinationChain || rozoStellar;
    const defaultSourceToken = baseUSDC;
    const defaultDestinationToken = rozoStellarUSDC;

    return {
      sourceChain: defaultSourceChainValue,
      sourceToken: defaultSourceToken,
      destinationChain: defaultDestinationChainValue,
      destinationToken: defaultDestinationToken,
      destinationAddress: stellarConnected ? stellarAddress : null,
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
    try {
      if (!state.destinationAddress || !state.destinationChain?.chainId)
        return false;

      return validateAddressForChain(
        state.destinationChain?.chainId,
        state.destinationAddress
      );
    } catch {
      return false;
    }
  }, [state.destinationAddress, state.destinationChain?.chainId]);

  // Helper function to find first non-EURC token, or return first token if no non-EURC found
  const findFirstNonEURCToken = useCallback((tokens: Token[]): Token | null => {
    if (tokens.length === 0) return null;
    return (
      tokens.find((token) => token.symbol !== TokenSymbol.EURC) ||
      tokens[0] ||
      null
    );
  }, []);

  // Set source chain with automatic token selection
  const setSourceChain = useCallback((chain: Chain) => {
    setState((prev) => {
      const chainTokens = supportedTokens.get(chain.chainId) || [];
      let defaultToken: Token | null = chainTokens[0] || null;

      // If source token is EURC, check if EURC exists in new chain
      // If EURC doesn't exist, select first available token (source tokens should always be selectable)
      if (prev.sourceToken?.symbol === TokenSymbol.EURC) {
        const eurcToken = chainTokens.find(
          (token) => token.symbol === TokenSymbol.EURC
        );
        defaultToken = eurcToken || chainTokens[0] || null;
      }

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
  // Users should always be able to choose any token as source (no restrictions)
  // Automatically update destination token based on source token selection
  const setSourceToken = useCallback(
    (token: Token) => {
      setState((prev) => {
        let newDestinationToken = prev.destinationToken;
        let newDestinationChain = prev.destinationChain;

        // If destination token is null and source is not EURC, set default destination
        if (!newDestinationToken && token.symbol !== TokenSymbol.EURC) {
          // Set destination chain to Stellar if not set
          if (!newDestinationChain) {
            newDestinationChain = rozoStellar;
          }
          // Set destination token to USDC Stellar
          newDestinationToken = rozoStellarUSDC;
        } else if (prev.destinationChain) {
          // If destination chain is selected, update destination token based on source token
          const destinationChainTokens =
            supportedTokens.get(prev.destinationChain.chainId) || [];

          if (token.symbol === TokenSymbol.EURC) {
            // If source is EURC, MUST select EURC in destination (or null if not available)
            const eurcToken = destinationChainTokens.find(
              (t) => t.symbol === TokenSymbol.EURC
            );
            newDestinationToken = eurcToken || null; // Only EURC or null, no fallback
          } else if (
            token.symbol === TokenSymbol.USDC ||
            token.symbol === TokenSymbol.USDT
          ) {
            // If source is USDC/USDT, select first non-EURC token in destination
            newDestinationToken = findFirstNonEURCToken(destinationChainTokens);
          }
        }

        return {
          ...prev,
          sourceToken: token,
          destinationToken: newDestinationToken,
          destinationChain: newDestinationChain,
        };
      });
    },
    [findFirstNonEURCToken]
  );

  // Set destination chain with automatic token selection
  const setDestinationChain = useCallback(
    (chain: Chain) => {
      setState((prev) => {
        const chainTokens = supportedTokens.get(chain.chainId) || [];
        let newDestinationToken: Token | null = chainTokens[0] || null;

        // If source token is EURC, MUST select EURC in destination (or null if not available)
        if (prev.sourceToken?.symbol === TokenSymbol.EURC) {
          const eurcToken = chainTokens.find(
            (token) => token.symbol === TokenSymbol.EURC
          );
          newDestinationToken = eurcToken || null; // Only EURC or null, no fallback
        } else if (
          prev.sourceToken &&
          (prev.sourceToken.symbol === TokenSymbol.USDC ||
            prev.sourceToken.symbol === TokenSymbol.USDT)
        ) {
          // If source is USDC/USDT, select first non-EURC token
          newDestinationToken = findFirstNonEURCToken(chainTokens);
        }

        // Clear incompatible source if needed
        let newSourceChain = prev.sourceChain;
        let newSourceToken = prev.sourceToken;

        // If source is the same as destination, clear it
        if (prev.sourceChain?.chainId === chain.chainId) {
          newSourceChain = null;
          newSourceToken = null;
        }

        // Handle destination address based on new chain
        let newDestinationAddress = prev.destinationAddress;
        if (chain.chainId === rozoStellar.chainId) {
          // If switching to Stellar and connected, auto-fill with Stellar address
          if (stellarConnected && stellarAddress) {
            newDestinationAddress = stellarAddress;
          }
        } else {
          // If switching to non-Stellar, check if current address is valid
          // If not valid, clear it
          if (prev.destinationAddress) {
            try {
              const isValid = validateAddressForChain(
                chain.chainId,
                prev.destinationAddress
              );
              if (!isValid) {
                newDestinationAddress = null;
              }
            } catch {
              newDestinationAddress = null;
            }
          }
        }

        return {
          ...prev,
          destinationChain: chain,
          destinationToken: newDestinationToken,
          sourceChain: newSourceChain,
          sourceToken: newSourceToken,
          destinationAddress: newDestinationAddress,
        };
      });
    },
    [stellarConnected, stellarAddress, findFirstNonEURCToken]
  );

  // Set destination token
  const setDestinationToken = useCallback((token: Token) => {
    setState((prev) => {
      // Validate: if source token is USDC/USDT, prevent selecting EURC as destination
      if (prev.sourceToken) {
        const sourceSymbol = prev.sourceToken.symbol;
        const destSymbol = token.symbol;

        // If source is USDC/USDT and trying to select EURC as destination, reject
        if (
          (sourceSymbol === TokenSymbol.USDC ||
            sourceSymbol === TokenSymbol.USDT) &&
          destSymbol === TokenSymbol.EURC
        ) {
          return prev; // Don't update state
        }

        // If source is EURC and trying to select USDC/USDT as destination, reject
        if (
          sourceSymbol === TokenSymbol.EURC &&
          (destSymbol === TokenSymbol.USDC || destSymbol === TokenSymbol.USDT)
        ) {
          return prev; // Don't update state
        }
      }

      return {
        ...prev,
        destinationToken: token,
      };
    });
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
    setState((prev) => {
      const newDestinationChain = prev.sourceChain;
      let newDestinationAddress = prev.destinationAddress;

      // Handle destination address based on new destination chain after swap
      if (newDestinationChain) {
        if (newDestinationChain.chainId === rozoStellar.chainId) {
          // If new destination is Stellar and connected, auto-fill with Stellar address
          if (stellarConnected && stellarAddress) {
            newDestinationAddress = stellarAddress;
          }
        } else {
          // If new destination is NOT Stellar, check if current address is valid
          // If not valid, clear it
          if (prev.destinationAddress) {
            try {
              const isValid = validateAddressForChain(
                newDestinationChain.chainId,
                prev.destinationAddress
              );
              if (!isValid) {
                newDestinationAddress = null;
              }
            } catch {
              newDestinationAddress = null;
            }
          }
        }
      }

      return {
        ...prev,
        sourceChain: prev.destinationChain,
        sourceToken: prev.destinationToken,
        destinationChain: newDestinationChain,
        destinationToken: prev.sourceToken,
        destinationAddress: newDestinationAddress,
      };
    });
  }, [stellarConnected, stellarAddress]);

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
