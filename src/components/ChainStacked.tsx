import {
  base,
  bsc,
  ethereum,
  polygon,
  rozoSolana,
  rozoStellar,
} from "@rozoai/intent-common";
import {
  Base,
  BinanceSmartChain,
  Ethereum,
  Polygon,
  Solana,
  Stellar,
} from "./icons/chains";

export const chainToLogo = {
  [base.chainId]: <Base />,
  [bsc.chainId]: <BinanceSmartChain />,
  [ethereum.chainId]: <Ethereum />,
  [polygon.chainId]: <Polygon />,
  [rozoSolana.chainId]: <Solana />,
  [rozoStellar.chainId]: <Stellar />,
};

export default function ChainsStacked({
  excludeChains,
}: {
  excludeChains?: number[];
}) {
  // CSS classes for logo container
  const logoContainerClasses =
    "border overflow-hidden rounded-full border-background w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center";

  // Map symbol to chainId for chainToLogo lookup and ordering
  const chainOrder: number[] = [
    base.chainId,
    bsc.chainId,
    ethereum.chainId,
    polygon.chainId,
    rozoSolana.chainId,
    rozoStellar.chainId,
  ];

  return (
    <div className="-space-x-1.5 sm:-space-x-2 flex *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:ring-background">
      {chainOrder
        .filter((chainId) => !excludeChains?.includes(chainId))
        .map((chainId, index) => {
          const logo = chainToLogo[chainId];
          if (!logo) return null;
          return (
            <div
              key={chainId}
              className={logoContainerClasses}
              style={{ zIndex: chainOrder.length - index }}
            >
              {logo}
            </div>
          );
        })}
    </div>
  );
}
