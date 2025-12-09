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
      <div className="text-center text-sm sm:text-base">
        <p
          className="text-sm leading-relaxed"
          style={{ color: "var(--color-warning-text)" }}
        >
          This bridge is currently in <b>Beta Phase</b> and may contain unexpected
          behavior. Start with a small amount. Please contact us if you
          encounter issues.
        </p>
      </div>
      <NewBridge />
    </div>
  );
}
