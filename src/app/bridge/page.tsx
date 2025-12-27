import { AnalyticsCard } from "@/components/new-bridge/AnalyticsCard";
import { BridgeMain } from "@/components/new-bridge/BridgeMain";
import { BridgeProvider } from "@/components/new-bridge/providers/BridgeProvider";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "ROZO Intents - Stellar",
  description:
    "Transfer USDC between Stellar and other chains with fast, secure, and gasless transactions",
};

export default function NewPage() {
  return (
    <BridgeProvider>
      <div className="flex flex-col items-center gap-6 w-full">
        <BridgeMain />
        <div className="w-full max-w-xl">
          <AnalyticsCard />
        </div>
      </div>
    </BridgeProvider>
  );
}
