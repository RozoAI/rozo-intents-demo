import { useStellarWallet } from "@/contexts/StellarWalletContext";
import { useRozoConnectStellar } from "@rozoai/intent-pay";
import { useEffect, useRef } from "react";

export function StellarWalletRozoSync({
  children,
}: {
  children: React.ReactNode;
}) {
  const {
    stellarAddress,
    stellarConnected,
    selectedWallet,
    syncExternalWallet,
  } = useStellarWallet();
  const { isConnected, publicKey, connector, setConnector, disconnect } =
    useRozoConnectStellar();

  // Use refs to track previous values and prevent infinite loops
  const prevInternalState = useRef({
    stellarAddress,
    stellarConnected,
    selectedWallet,
  });
  const prevExternalState = useRef({ isConnected, publicKey, connector });

  // Sync from internal context to external kit (intent-pay). Only call setConnector when external is not already connected to the same wallet (avoids infinite confirmation loop).
  useEffect(() => {
    const hasInternalChanged =
      prevInternalState.current.stellarAddress !== stellarAddress ||
      prevInternalState.current.stellarConnected !== stellarConnected ||
      prevInternalState.current.selectedWallet !== selectedWallet;

    if (hasInternalChanged) {
      if (stellarConnected && stellarAddress && selectedWallet) {
        const alreadySame =
          isConnected &&
          connector?.id === selectedWallet.id &&
          publicKey === stellarAddress;
        if (!alreadySame) {
          setConnector(selectedWallet);
        }
      } else if (!stellarConnected && !stellarAddress) {
        if (isConnected || publicKey) {
          disconnect();
        }
      }

      prevInternalState.current = {
        stellarAddress,
        stellarConnected,
        selectedWallet,
      };
    }
  }, [
    stellarConnected,
    stellarAddress,
    selectedWallet,
    isConnected,
    publicKey,
    connector?.id,
    setConnector,
    disconnect,
  ]);

  // Sync from external kit (intent-pay) to internal context
  useEffect(() => {
    const hasExternalChanged =
      prevExternalState.current.isConnected !== isConnected ||
      prevExternalState.current.publicKey !== publicKey ||
      prevExternalState.current.connector !== connector;

    if (hasExternalChanged) {
      if (isConnected && publicKey) {
        // External kit connected - sync to internal context
        // Only sync if internal context is not already connected or has different address
        if (!stellarConnected || stellarAddress !== publicKey) {
          syncExternalWallet(
            publicKey,
            connector?.name || "External Wallet",
            connector || null
          );
        }
      } else if (!isConnected && !publicKey) {
        // External kit disconnected - clear internal context only if it was synced from external
        // Check if current internal state matches external state to avoid clearing user's manual connection
        if (stellarAddress === prevExternalState.current.publicKey) {
          syncExternalWallet("", undefined, null);
        }
      }

      prevExternalState.current = { isConnected, publicKey, connector };
    }
  }, [
    isConnected,
    publicKey,
    connector,
    stellarConnected,
    stellarAddress,
    syncExternalWallet,
  ]);

  return <>{children}</>;
}
