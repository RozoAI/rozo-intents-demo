"use client";

import { useStellarWallet } from "@/contexts/StellarWalletContext";
import { useRozoConnectStellar } from "@rozoai/intent-pay";
import { useEffect } from "react";

/** Registers SDK setConnector with StellarWalletContext so connect flow uses it (single confirmation). Must render inside RozoPayProvider. */
export function RegisterRozoSetConnector() {
  const { setConnector } = useRozoConnectStellar();
  const { registerSetConnector } = useStellarWallet();

  useEffect(() => {
    registerSetConnector(setConnector);
    return () => registerSetConnector(null);
  }, [setConnector, registerSetConnector]);

  return null;
}
