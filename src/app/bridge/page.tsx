"use client";

import { AnalyticsCard } from "@/components/new-bridge/AnalyticsCard";
import { BridgeMain } from "@/components/new-bridge/BridgeMain";
import { BridgeProvider } from "@/components/new-bridge/providers/BridgeProvider";
import { useStellarWallet } from "@/contexts/StellarWalletContext";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export default function NewPage() {
  const { stellarAddress, stellarConnected } = useStellarWallet();
  return (
    <BridgeProvider>
      <div className="flex flex-col items-center gap-6 w-full">
        {stellarConnected && (
          <div className="w-full rounded-md bg-primary py-2 px-4 text-white text-center">
            <Link
              href={`https://app.rozo.ai/leaderboard?address=${stellarAddress}`}
              className="flex items-center justify-center gap-2 text-sm font-medium"
              target="_blank"
            >
              Wave 2 Leaderboard!
              <ArrowRight className="size-4" />
            </Link>
          </div>
        )}
        <BridgeMain />
        <div className="w-full max-w-xl">
          <AnalyticsCard />
        </div>
      </div>
    </BridgeProvider>
  );
}
