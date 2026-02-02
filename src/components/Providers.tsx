"use client";

import { Toaster } from "@/components/ui/sonner";
import { useStellarWallet } from "@/contexts/StellarWalletContext";
import { RegisterRozoSetConnector } from "@/components/new-bridge/providers/RegisterRozoSetConnector";
import { StellarWalletRozoSync } from "@/components/new-bridge/providers/StellarWalletRozoSync";
import { config } from "@/lib/wagmi";
import { setupCryptoPolyfill } from "@/utils/polyfills";
import { RozoPayProvider, RozoWagmiProvider } from "@rozoai/intent-pay";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useTheme } from "next-themes";
import { useState } from "react";

// Setup polyfill immediately for mobile browsers
if (typeof window !== "undefined") {
  setupCryptoPolyfill();
}

export function Providers({ children }: { children: React.ReactNode }) {
  const { stellarKit } = useStellarWallet();

  const { resolvedTheme } = useTheme();

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  if (!stellarKit) return null;

  return (
    <RozoWagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RozoPayProvider
          stellarKit={stellarKit}
          stellarWalletPersistence={false}
          mode={resolvedTheme === "dark" ? "dark" : "light"}
          debugMode={false}
        >
          <RegisterRozoSetConnector />
          <StellarWalletRozoSync>
            {children}
          </StellarWalletRozoSync>
          <Toaster
            position="bottom-center"
            toastOptions={{
              duration: 4000,
            }}
          />
        </RozoPayProvider>
      </QueryClientProvider>
    </RozoWagmiProvider>
  );
}
