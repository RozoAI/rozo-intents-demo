import { useStellarWallet } from "@/contexts/StellarWalletContext";
import { useRozoConnectStellar } from "@rozoai/intent-pay";
import { useEffect } from "react";

export function StellarWalletRozoSync({
  children,
}: {
  children: React.ReactNode;
}) {
  const { stellarAddress, stellarConnected, selectedWallet } =
    useStellarWallet();
  const { setPublicKey, setConnector } = useRozoConnectStellar();

  useEffect(() => {
    if (stellarConnected && stellarAddress) {
      setPublicKey(stellarAddress);
      if (selectedWallet) {
        setConnector(selectedWallet);
      }
    } else {
      // Clear when disconnected
      setPublicKey(undefined as any);
    }
  }, [
    stellarConnected,
    stellarAddress,
    selectedWallet,
    setPublicKey,
    setConnector,
  ]);
  return <>{children}</>;
}
