import { AnalyticsCard } from "@/components/new-bridge/AnalyticsCard";
import { NewBridge } from "@/components/new-bridge/NewBridge";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "ROZO Intents - Stellar",
  description:
    "Transfer USDC between Stellar and other chains with fast, secure, and gasless transactions",
};

export default function NewPage() {
  return (
    <div className="flex flex-col items-center gap-6 w-full">
      <NewBridge />
      <div className="w-full max-w-xl">
        <AnalyticsCard />
      </div>
    </div>
  );
}
