"use client";

import { Badge } from "@/components/ui/badge";
import { useStellarWallet } from "@/contexts/StellarWalletContext";
import { useGetRewards } from "@/hooks/use-get-rewards";
import { LeafIcon, Loader } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

export function RewardsBadge() {
  const { stellarConnected, stellarAddress } = useStellarWallet();

  const { data: rewards, isLoading } = useGetRewards(stellarAddress, {
    enabled: stellarConnected && !!stellarAddress,
  });

  if (!stellarConnected || !stellarAddress) {
    return null;
  }

  return (
    <Tooltip>
      <TooltipTrigger>
        <Badge className="h-9">
          {isLoading ? (
            <Loader className="size-3.5 sm:size-4 animate-spin" />
          ) : (
            <>
              <LeafIcon className="size-3.5 sm:size-4" />
              <span className="font-semibold text-xs md:text-sm">
                {rewards?.seeds?.toLocaleString() ?? 0}
              </span>
            </>
          )}
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        {isLoading ? (
          <Loader className="size-4 animate-spin" />
        ) : (
          <p>You have {rewards?.seeds?.toLocaleString() ?? 0} ROZO seeds.</p>
        )}
      </TooltipContent>
    </Tooltip>
  );
}
