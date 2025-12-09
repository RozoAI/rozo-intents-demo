import { cn } from "@/lib/utils";
import {
  base,
  bsc,
  ethereum,
  polygon,
  rozoSolana,
  rozoStellar,
  TokenLogo,
} from "@rozoai/intent-common";
import Image from "next/image";
import ChainsStacked from "../ChainStacked";

// isSwitched = false -> Base/Solana/Polygon to Stellar
// isSwitched = true -> Stellar to Base (ONLY BASE)
interface ChainBadgeProps {
  isSwitched: boolean;
  isFrom: boolean;
  className?: string;
}

export function ChainBadge({ isSwitched, isFrom, className }: ChainBadgeProps) {
  // Determine which chains to show based on position and switch state
  const getExcludeChains = () => {
    if (!isSwitched) {
      // From: Base/Solana/Polygon, To: Stellar
      return isFrom
        ? [rozoStellar.chainId]
        : [
            base.chainId,
            rozoSolana.chainId,
            ethereum.chainId,
            bsc.chainId,
            polygon.chainId,
          ];
    } else {
      // From: Stellar, To: Base (ONLY)
      return isFrom
        ? [
            base.chainId,
            rozoSolana.chainId,
            ethereum.chainId,
            bsc.chainId,
            polygon.chainId,
          ]
        : [
            rozoStellar.chainId,
            rozoSolana.chainId,
            ethereum.chainId,
            bsc.chainId,
            polygon.chainId,
          ];
    }
  };

  const getTokenSymbol = () => {
    return !isSwitched && isFrom ? "USDC/USDT" : "USDC";
  };

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 sm:gap-2 bg-neutral-200/70 rounded-full px-2 sm:px-3 py-1.5 sm:py-2 border border-neutral-300/50 dark:bg-neutral-700/50 dark:border-neutral-600/30",
        className
      )}
    >
      <Image
        src={TokenLogo.USDC}
        alt="USDC"
        width={20}
        height={20}
        className="w-5 h-5 sm:w-6 sm:h-6 z-10"
      />
      {!isSwitched && isFrom && (
        <Image
          src={TokenLogo.USDT}
          alt="USDT"
          width={20}
          height={20}
          className="w-5 h-5 sm:w-6 sm:h-6 -ml-4"
        />
      )}
      <span className="font-medium text-neutral-900 dark:text-white text-xs sm:text-sm">
        {getTokenSymbol()}
      </span>
      <span className="text-neutral-500 dark:text-neutral-400 text-[10px] sm:text-xs">
        on
      </span>
      <ChainsStacked excludeChains={getExcludeChains()} />
    </div>
  );
}
