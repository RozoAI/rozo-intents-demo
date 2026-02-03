// Wagmi configuration using Intent Pay SDK
import { getDefaultConfig } from "@rozoai/intent-pay";
import { createConfig } from "wagmi";
import {
  arbitrum,
  base,
  bsc,
  celo,
  linea,
  mainnet,
  mantle,
  optimism,
  polygon,
  polygonMumbai,
  sepolia,
} from "wagmi/chains";

// World Chain definition (if not available in wagmi/chains)
const worldChain = {
  id: 480,
  name: "World Chain",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://worldchain-mainnet.g.alchemy.com/public"] },
  },
  blockExplorers: {
    default: {
      name: "World Chain Explorer",
      url: "https://worldchain-mainnet.explorer.alchemy.com",
    },
  },
} as const;

// All chains required by Rozo Pay (must include all for RozoPayProvider to work)
const requiredChains = [
  mainnet, // Ethereum
  base, // Base
  polygon, // Polygon
  optimism, // OP Mainnet
  arbitrum, // Arbitrum One
  linea, // Linea Mainnet
  bsc, // BNB Smart Chain
  sepolia, // Sepolia
  worldChain, // World Chain
  mantle, // Mantle
  celo, // Celo
] as const;

// Currently supported chains for UI (USDC only)
// Sepolia, Base, Arbitrum, Optimism, Polygon
const currentlySupportedChains = [
  sepolia, // Sepolia Testnet (11155111)
  base, // Base (8453)
  arbitrum, // Arbitrum (42161)
  optimism, // Optimism (10)
  polygon, // Polygon (137)
] as const;

// EVM chains supported by payin service (subset of required chains)
const payinSupportedChains = [
  mainnet, // Ethereum Mainnet (1)
  sepolia, // Sepolia Testnet (11155111)
  base, // Base (8453)
  arbitrum, // Arbitrum (42161)
  optimism, // Optimism (10)
  polygon, // Polygon (137)
  bsc, // BSC - Binance Smart Chain (56)
  polygonMumbai, // Mumbai Testnet (80001)
] as const;

// Use Intent Pay SDK's default configuration with Wagmi's createConfig
export const config = createConfig(
  getDefaultConfig({
    appName: "ROZO Intents",
    appDescription: "Intent-based USDC transfers between Base and Stellar",
    appUrl: "https://intents.rozo.ai",
    appIcon:
      "https://imagedelivery.net/AKLvTMvIg6yc9W08fHl1Tg/fdfef53e-91c2-4abc-aec0-6902a26d6c00/80x",
    chains: requiredChains,
    ssr: true,
  })
);

// Export currently supported chains for UI (USDC only)
export const getCurrentlySupportedChainIds = (): number[] => {
  return currentlySupportedChains.map((chain) => chain.id);
};

// Export payin supported chains for filtering in UI
export const getPayinSupportedChainIds = (): number[] => {
  return payinSupportedChains.map((chain) => chain.id);
};

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
