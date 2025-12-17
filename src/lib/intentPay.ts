// Intent Pay SDK integration
// Real implementation using @rozoai/intent-pay for gasless, commission-free transfers

import { FeeType, TokenSymbol } from "@rozoai/intent-common";
import { Address } from "viem";

// Base chain configuration for Stellar transfers
export const BASE_USDC = {
  chainId: 8453, // Base chain ID
  token: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // Base USDC address
} as const;

// Re-export Intent Pay SDK components and types
export {
  RozoPayButton,
  RozoPayProvider,
  type RozoPayButtonProps,
} from "@rozoai/intent-pay";

// Unified Intent Pay configuration for all transfer types
export interface IntentPayConfig {
  appId: string;
  toChain: number;
  toToken: string; // USDC token address on destination chain
  toAddress: string; // Destination EVM address
  toUnits: string; // Amount in USDC units
  intent?: string; // e.g., "Transfer USDC"
  preferredSymbol?: TokenSymbol[];
  preferredChains?: number[]; // Preferred source chains
  externalId?: string; // Correlation ID
  feeType: FeeType;
  memo?: {
    type: "text" | "id" | "hash";
    value: string;
  }; // Optional memo for Stellar transfers
  receiverMemo?: string; // Optional receiver memo for deposits
  metadata?: object;
}

// Get USDC token address for a given chain (EVM chains only)
export const getUSDCAddress = (chainId: number): Address => {
  const usdcAddresses: Record<number, Address> = {
    // Payin supported EVM chains
    1: "0xA0b86a33E6441b8C4e6b2b0f6a2b1b8C4e6b2b0f", // Ethereum Mainnet - USDC
    11155111: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238", // Sepolia Testnet - USDC
    8453: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // Base - USDC
    42161: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831", // Arbitrum - USDC
    10: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85", // Optimism - USDC
    137: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174", // Polygon - USDC
    56: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d", // BSC - USDC
    80001: "0x0FA8781a83E46826621b3BC094Ea2A0212e71B23", // Mumbai Testnet - USDC
    // Note: Solana and Stellar chains don't use EVM addresses
  };

  const address = usdcAddresses[chainId];
  if (!address) {
    throw new Error(`USDC not supported on EVM chain ${chainId}`);
  }
  return address;
};

// Supported chains for Intent Pay (payin supported chains only)
export const SUPPORTED_INTENT_CHAINS = [
  // EVM chains (payin supported)
  1, // Ethereum Mainnet
  8453, // Base
  42161, // Arbitrum
  10, // Optimism
  137, // Polygon
  56, // BSC (Binance Smart Chain)
  80001, // Mumbai Testnet (Polygon testnet)
  // Non-EVM chains (payin supported)
  900, // Solana Mainnet
  901, // Solana Devnet
  1500, // Stellar Mainnet
];

// Check if a chain is supported by Intent Pay
export const isChainSupported = (chainId: number): boolean => {
  return SUPPORTED_INTENT_CHAINS.includes(chainId);
};

// Check if a transfer route is supported
export const isRouteSupported = (
  fromChainId: number,
  toChainId: number
): boolean => {
  return (
    isChainSupported(fromChainId) &&
    isChainSupported(toChainId) &&
    fromChainId !== toChainId
  );
};

// Default app configuration (you should replace with your actual app ID)
export const DEFAULT_INTENT_PAY_CONFIG = {
  appId: process.env.NEXT_PUBLIC_INTENT_PAY_APP_ID || "rozoBridgeStellar",
};
