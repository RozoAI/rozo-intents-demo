import { Token, TokenSymbol } from "@rozoai/intent-common";

export function getBridgeTokenPairError(
  sourceToken: Token | null,
  destinationToken: Token | null,
): string | null {
  if (!sourceToken || !destinationToken) {
    return null;
  }

  const sourceSymbol = sourceToken.symbol;
  const destinationSymbol = destinationToken.symbol;

  if (
    (sourceSymbol === TokenSymbol.USDC || sourceSymbol === TokenSymbol.USDT) &&
    destinationSymbol === TokenSymbol.EURC
  ) {
    return "Select a compatible destination token";
  }

  if (
    sourceSymbol === TokenSymbol.EURC &&
    (destinationSymbol === TokenSymbol.USDC ||
      destinationSymbol === TokenSymbol.USDT)
  ) {
    return "Select a compatible destination token";
  }

  return null;
}
