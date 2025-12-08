"use client";

import { useCallback, useState } from "react";

interface ManualStellarAddressState {
  address: string;
  trustlineExists: boolean;
  trustlineBalance: string;
  addressError: string;
}

export function useManualStellarAddress() {
  const [state, setState] = useState<ManualStellarAddressState>({
    address: "",
    trustlineExists: false,
    trustlineBalance: "0",
    addressError: "",
  });

  const setAddress = useCallback((address: string) => {
    setState((prev) => ({ ...prev, address }));
  }, []);

  const setTrustlineStatus = useCallback((exists: boolean, balance: string) => {
    setState((prev) => ({
      ...prev,
      trustlineExists: exists,
      trustlineBalance: balance,
    }));
  }, []);

  const setAddressError = useCallback((error: string) => {
    setState((prev) => ({ ...prev, addressError: error }));
  }, []);

  const reset = useCallback(() => {
    setState({
      address: "",
      trustlineExists: false,
      trustlineBalance: "0",
      addressError: "",
    });
  }, []);

  return {
    ...state,
    setAddress,
    setTrustlineStatus,
    setAddressError,
    reset,
  };
}
