"use client";

import {
  arbitrum,
  base,
  bsc,
  Chain,
  ethereum,
  FeeType,
  polygon,
  rozoSolana,
  rozoStellar,
  Token,
  TokenSymbol,
  validateAddressForChain,
} from "@rozoai/intent-common";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

const CHAIN_ALIASES: Record<string, number> = {
  base: base.chainId,
  stellar: rozoStellar.chainId,
  "rozo-stellar": rozoStellar.chainId,
  ethereum: ethereum.chainId,
  eth: ethereum.chainId,
  arbitrum: arbitrum.chainId,
  arb: arbitrum.chainId,
  bnb: bsc.chainId,
  bsc: bsc.chainId,
  polygon: polygon.chainId,
  matic: polygon.chainId,
  solana: rozoSolana.chainId,
  sol: rozoSolana.chainId,
};

function resolveChain(value: string | null, available: Chain[]): Chain | null {
  if (!value) return null;
  const lower = value.trim().toLowerCase();
  const maybeId = Number(value.trim());

  const targetId = !Number.isNaN(maybeId)
    ? maybeId
    : (CHAIN_ALIASES[lower] ?? NaN);

  if (!Number.isNaN(targetId)) {
    return available.find((c) => c.chainId === targetId) ?? null;
  }

  return available.find((c) => c.name?.toLowerCase() === lower) ?? null;
}

interface UseUrlQueryInitParams {
  availableSourceChains: Chain[];
  availableDestinationChains: Chain[];
  availableSourceTokens: Token[];
  availableDestinationTokens: Token[];
  setSourceChain: (c: Chain) => void;
  setDestinationChain: (c: Chain) => void;
  setSourceToken: (t: Token) => void;
  setDestinationToken: (t: Token) => void;
  setFromAmount: (v: string) => void;
  setFeeType: (t: FeeType) => void;
  setDebouncedAmount: (v: string) => void;
  setDestinationAddress: (v: string) => void;
  setInitializedFromQueryCurrency: (v: boolean) => void;
}

export function useUrlQueryInit({
  availableSourceChains,
  availableDestinationChains,
  availableSourceTokens,
  availableDestinationTokens,
  setSourceChain,
  setDestinationChain,
  setSourceToken,
  setDestinationToken,
  setFromAmount,
  setFeeType,
  setDebouncedAmount,
  setDestinationAddress,
  setInitializedFromQueryCurrency,
}: UseUrlQueryInitParams): void {
  const searchParams = useSearchParams();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (initialized) return;

    const sourceChainParam = searchParams.get("sourceChain");
    const sourceTokenParam = searchParams.get("sourceToken");
    const destinationChainParam = searchParams.get("destinationChain");
    const destinationTokenParam = searchParams.get("destinationToken");
    const amountParam = searchParams.get("amount");
    const destinationAddressParam = searchParams.get("destinationAddress");

    const hasAnyParam =
      sourceChainParam ||
      sourceTokenParam ||
      destinationChainParam ||
      destinationTokenParam ||
      amountParam ||
      destinationAddressParam;

    if (!hasAnyParam) return;

    let didApply = false;

    const allChains = [
      ...availableSourceChains,
      ...availableDestinationChains.filter(
        (c) => !availableSourceChains.some((s) => s.chainId === c.chainId),
      ),
    ];

    const resolvedSourceChain = resolveChain(sourceChainParam, allChains);
    if (resolvedSourceChain) {
      setSourceChain(resolvedSourceChain);
      didApply = true;
    }

    const resolvedDestinationChain = resolveChain(
      destinationChainParam,
      allChains,
    );
    if (resolvedDestinationChain) {
      setDestinationChain(resolvedDestinationChain);
      didApply = true;
    }

    if (sourceTokenParam) {
      const symbol = sourceTokenParam.trim().toUpperCase();
      const validSymbols = [TokenSymbol.USDC, TokenSymbol.EURC];
      const targetSymbol = validSymbols.find(
        (s) => s.toString().toUpperCase() === symbol,
      );
      if (targetSymbol) {
        const token = availableSourceTokens.find(
          (t) => t.symbol === targetSymbol,
        );
        if (token) {
          setSourceToken(token);
          didApply = true;
        }
      }
    }

    if (destinationTokenParam) {
      const symbol = destinationTokenParam.trim().toUpperCase();
      const validSymbols = [TokenSymbol.USDC, TokenSymbol.EURC];
      const targetSymbol = validSymbols.find(
        (s) => s.toString().toUpperCase() === symbol,
      );
      if (targetSymbol) {
        const token = availableDestinationTokens.find(
          (t) => t.symbol === targetSymbol,
        );
        if (token) {
          setDestinationToken(token);
          didApply = true;
        }
      }
    }

    if (amountParam) {
      const trimmed = amountParam.trim();
      const numeric = parseFloat(trimmed);
      if (!Number.isNaN(numeric) && numeric > 0) {
        setFromAmount(trimmed);
        setFeeType(FeeType.ExactIn);
        setDebouncedAmount(trimmed);
        didApply = true;
      }
    }

    if (destinationAddressParam) {
      const address = destinationAddressParam.trim();
      // Validate against resolved destination chain, or accept if we can't check
      const chainId = resolvedDestinationChain?.chainId;
      try {
        const isValid = chainId
          ? validateAddressForChain(chainId, address)
          : address.length > 0;
        if (isValid) {
          setDestinationAddress(address);
          didApply = true;
        }
      } catch {
        // Invalid address for this chain — ignore
      }
    }

    if (didApply) {
      setInitialized(true);
      setInitializedFromQueryCurrency(true);
    }
  }, [
    availableDestinationChains,
    availableDestinationTokens,
    availableSourceChains,
    availableSourceTokens,
    initialized,
    searchParams,
    setDebouncedAmount,
    setDestinationAddress,
    setDestinationChain,
    setDestinationToken,
    setFeeType,
    setFromAmount,
    setInitializedFromQueryCurrency,
    setSourceChain,
    setSourceToken,
  ]);
}
