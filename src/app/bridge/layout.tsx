import { BridgeFooter } from "@/components/new-bridge/BridgeFooter";
import { Providers } from "@/components/Providers";
import { RewardsBadge } from "@/components/RewardsBadge";
import { StellarWalletConnect } from "@/components/StellarWalletConnect";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { StellarWalletProvider } from "@/contexts/StellarWalletContext";
import { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "ROZO Intents - Stellar",
  description:
    "Transfer USDC between Stellar and other chains with fast, secure, and gasless transactions",
};

export default function NewPageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <StellarWalletProvider>
      <Providers>
        <div className="min-h-screen flex flex-col p-4 sm:p-8">
          {/* Header */}
          <div className="container mx-auto flex items-start justify-between h-min mb-8">
            <div className="flex items-center gap-2">
              <Image
                src="/rozo-logo.png"
                alt="Rozo Logo"
                width={28}
                height={28}
                className="rounded-md"
              />
              <span className="text-2xl font-bold">ROZO</span>
            </div>

            <div className="flex items-center gap-2">
              <ThemeSwitcher />
              <RewardsBadge />
              <StellarWalletConnect />
            </div>
          </div>

          <div className="mx-auto mb-4 flex w-fit max-w-xl items-center justify-center gap-2 rounded-lg">
            {children}
          </div>

          <BridgeFooter />
        </div>
      </Providers>
    </StellarWalletProvider>
  );
}
