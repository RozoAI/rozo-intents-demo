"use client";

import { AnalyticsCard } from "@/components/new-bridge/AnalyticsCard";
import { BridgeMain } from "@/components/new-bridge/BridgeMain";
import { BridgeProvider } from "@/components/new-bridge/providers/BridgeProvider";
import { useStellarWallet } from "@/contexts/StellarWalletContext";
import { useRozoConnectStellar } from "@rozoai/intent-pay";
import { Trophy } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

export default function NewPage() {
  const { stellarAddress, stellarConnected, selectedWallet } =
    useStellarWallet();
  const { setConnector, disconnect, setPublicKey } = useRozoConnectStellar();

  useEffect(() => {
    if (stellarAddress && selectedWallet) {
      setPublicKey(stellarAddress);
      setConnector(selectedWallet);
    } else {
      disconnect();
    }
  }, [stellarAddress, selectedWallet, setPublicKey, setConnector, disconnect]);

  return (
    <BridgeProvider>
      <div className="flex flex-col items-center gap-6 w-full">
        <div className="w-full rounded-md bg-primary py-2 px-4 text-primary-foreground text-center">
          <Link
            href={`https://app.rozo.ai/leaderboard${stellarConnected && stellarAddress ? `?address=${stellarAddress}` : ""}`}
            className="flex items-center justify-center gap-2 text-sm font-medium"
            target="_blank"
          >
            <Trophy className="size-4" />
            Bonus Leaderboard!
          </Link>
        </div>
        <BridgeMain />
        <div className="w-full max-w-xl">
          <AnalyticsCard />
        </div>
      </div>
    </BridgeProvider>
  );
}
