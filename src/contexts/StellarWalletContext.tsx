"use client";

import { EURC_ASSET, USDC_ASSET } from "@/lib/stellar";
import { setupCryptoPolyfill } from "@/utils/polyfills";
import {
  allowAllModules,
  FREIGHTER_ID,
  ISupportedWallet,
  StellarWalletsKit,
  WalletNetwork,
} from "@creit.tech/stellar-wallets-kit";
import {
  WalletConnectAllowedMethods,
  WalletConnectModule,
} from "@creit.tech/stellar-wallets-kit/modules/walletconnect.module";
import {
  Asset,
  BASE_FEE,
  Horizon,
  Networks,
  Operation,
  TransactionBuilder,
} from "@stellar/stellar-sdk";
import { useSearchParams } from "next/navigation";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";

interface TrustlineStatus {
  exists: boolean;
  balance: string;
  checking: boolean;
  creating: boolean;
}

interface XlmBalance {
  balance: string;
  checking: boolean;
}

interface StellarWalletContextType {
  server: Horizon.Server;
  stellarAddress: string;
  stellarConnected: boolean;
  stellarConnecting: boolean;
  connectStellarWallet: () => Promise<void>;
  disconnectStellarWallet: () => void;
  stellarKit: StellarWalletsKit | null;
  stellarWalletName: string | null;
  // Token trustline management (USDC and EURC)
  currency: "USDC" | "EURC";
  trustlineStatus: TrustlineStatus;
  usdcTrustline: TrustlineStatus;
  eurcTrustline: TrustlineStatus;
  checkTrustline: () => Promise<void>;
  createTrustline: (targetCurrency?: "USDC" | "EURC") => Promise<void>;
  // XLM balance management
  xlmBalance: XlmBalance;
  checkXlmBalance: () => Promise<void>;
  selectedWallet: ISupportedWallet | null;

  // External wallet sync
  syncExternalWallet: (
    address: string,
    walletName?: string,
    wallet?: ISupportedWallet | null
  ) => void;

  /** Register SDK setConnector so connect flow uses it (avoids double confirmation). Set by component inside RozoPayProvider. */
  registerSetConnector: (
    fn: ((wallet: ISupportedWallet) => Promise<void>) | null
  ) => void;

  // Error management
  stellarError: string | null;
  setStellarError: (error: string | null) => void;
}

const StellarWalletContext = createContext<
  StellarWalletContextType | undefined
>(undefined);

const STORAGE_KEY = "rozo-stellar-wallet";

// Helper function to initialize StellarWalletsKit only in browser environment
const createStellarKit = (): StellarWalletsKit | null => {
  if (typeof window === "undefined") {
    return null;
  }

  return new StellarWalletsKit({
    network: WalletNetwork.PUBLIC,
    selectedWalletId: FREIGHTER_ID,
    modules: [
      ...allowAllModules(),
      new WalletConnectModule({
        url: window.location.origin,
        projectId: "7440dd8acf85933ffcc775ec6675d4a9",
        // Use SIGN so wallets only need to support stellar_signXDR.
        // The kit / SDK will handle submission, avoiding unsupported
        // stellar_signAndSubmitXDR requests that cause WC errors.
        method: WalletConnectAllowedMethods.SIGN,
        description: "ROZO Intents - Transfer USDC across chains",
        name: "ROZO Intents",
        icons: [
          "https://imagedelivery.net/AKLvTMvIg6yc9W08fHl1Tg/fdfef53e-91c2-4abc-aec0-6902a26d6c00/80x",
        ],
        network: WalletNetwork.PUBLIC,
      }),
    ],
  });
};

interface StoredWalletData {
  publicKey: string; // The public key of the wallet (address)
  walletId: string; // e.g. "freighter"
  walletName: string; // e.g. "Freighter"
  walletIcon?: string; // Optional: the wallet's icon URL
  ckStoreKey?: string; // Optional: cross-key store key, if any
  timestamp: string; // Timestamp in ISO format, e.g. "2025-12-26T16:16:22.176Z"
}

export function StellarWalletProvider({ children }: { children: ReactNode }) {
  const server = new Horizon.Server("https://horizon.stellar.org");

  const searchParams = useSearchParams();
  const currency = (searchParams.get("currency") as "USDC" | "EURC") ?? "USDC";

  const [stellarError, setStellarError] = useState<string | null>(null);
  const [stellarAddress, setStellarAddress] = useState("");
  const [stellarConnected, setStellarConnected] = useState(false);
  const [stellarConnecting, setStellarConnecting] = useState(false);
  const [stellarKit, setStellarKit] = useState<StellarWalletsKit | null>(null);
  const [stellarWalletName, setStellarWalletName] = useState<string | null>(
    null
  );
  const [selectedWallet, setSelectedWallet] = useState<ISupportedWallet | null>(
    null
  );

  const setConnectorRef = useRef<
    ((wallet: ISupportedWallet) => Promise<void>) | null
  >(null);
  const registerSetConnector = useCallback(
    (fn: ((wallet: ISupportedWallet) => Promise<void>) | null) => {
      setConnectorRef.current = fn;
    },
    []
  );

  const [trustlineStatus, setTrustlineStatus] = useState<TrustlineStatus>({
    exists: false,
    balance: "0",
    checking: false,
    creating: false,
  });

  const [usdcTrustline, setUsdcTrustline] = useState<TrustlineStatus>({
    exists: false,
    balance: "0",
    checking: false,
    creating: false,
  });

  const [eurcTrustline, setEurcTrustline] = useState<TrustlineStatus>({
    exists: false,
    balance: "0",
    checking: false,
    creating: false,
  });

  // XLM balance state
  const [xlmBalance, setXlmBalance] = useState<XlmBalance>({
    balance: "0",
    checking: false,
  });

  // Save wallet data to localStorage
  // const saveWalletData = (
  //   address: string,
  //   walletId: string,
  //   walletName: string
  // ) => {
  //   try {
  //     const data: StoredWalletData = {
  //       address,
  //       walletId,
  //       walletName,
  //       timestamp: Date.now(),
  //     };
  //     localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  //   } catch (error) {
  //     console.error("Error saving wallet data:", error);
  //   }
  // };

  // Clear stored wallet data
  const clearStoredWallet = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error("Error clearing stored wallet:", error);
    }
  };

  // Unified function to check both trustlines and XLM balance with a single account request
  const checkAllBalances = async () => {
    if (!stellarConnected || !stellarAddress) {
      setTrustlineStatus({
        exists: false,
        balance: "0",
        checking: false,
        creating: false,
      });
      setUsdcTrustline({
        exists: false,
        balance: "0",
        checking: false,
        creating: false,
      });
      setEurcTrustline({
        exists: false,
        balance: "0",
        checking: false,
        creating: false,
      });
      setXlmBalance({ balance: "0", checking: false });
      return;
    }

    setTrustlineStatus((prev) => ({ ...prev, checking: true }));
    setUsdcTrustline((prev) => ({ ...prev, checking: true }));
    setEurcTrustline((prev) => ({ ...prev, checking: true }));
    setXlmBalance((prev) => ({ ...prev, checking: true }));

    try {
      // Fetch account data once and reuse for all balance checks
      const accountData = await server
        .accounts()
        .accountId(stellarAddress)
        .call();

      // Extract XLM balance
      const xlmBalance = accountData.balances.find(
        (balance) => balance.asset_type === "native"
      );

      setXlmBalance({
        balance: xlmBalance?.balance || "0",
        checking: false,
      });

      // Extract trustlines from the account data
      const usdcAsset = USDC_ASSET;
      const eurcAsset = EURC_ASSET;

      const usdcTrustline = accountData.balances.find(
        (balance) =>
          balance.asset_type === "credit_alphanum4" &&
          balance.asset_code === usdcAsset.code &&
          balance.asset_issuer === usdcAsset.issuer
      );

      const eurcTrustline = accountData.balances.find(
        (balance) =>
          balance.asset_type === "credit_alphanum4" &&
          balance.asset_code === eurcAsset.code &&
          balance.asset_issuer === eurcAsset.issuer
      );

      const usdcResult = {
        exists: !!usdcTrustline,
        balance: usdcTrustline?.balance || "0",
      };

      const eurcResult = {
        exists: !!eurcTrustline,
        balance: eurcTrustline?.balance || "0",
      };

      setUsdcTrustline((prev) => ({
        ...prev,
        exists: usdcResult.exists,
        balance: usdcResult.balance,
        checking: false,
      }));

      setEurcTrustline((prev) => ({
        ...prev,
        exists: eurcResult.exists,
        balance: eurcResult.balance,
        checking: false,
      }));

      // Update main trustlineStatus based on current currency
      const target = currency === "EURC" ? eurcResult : usdcResult;
      setTrustlineStatus((prev) => ({
        ...prev,
        exists: target.exists,
        balance: target.balance,
        checking: false,
      }));
    } catch (error) {
      console.error("Failed to check balances:", error);
      setStellarError(
        error instanceof Error ? error.message : "Failed to check balances"
      );
      const errorState = { checking: false, exists: false, balance: "0" };
      setTrustlineStatus((prev) => ({ ...prev, ...errorState }));
      setUsdcTrustline((prev) => ({ ...prev, ...errorState }));
      setEurcTrustline((prev) => ({ ...prev, ...errorState }));
      setXlmBalance({ balance: "0", checking: false });
      toast.error(`Failed to check balances`);
    }
  };

  // Check XLM balance (kept for backward compatibility with other components)
  const checkXlmBalance = async () => {
    if (!stellarConnected || !stellarAddress) {
      setXlmBalance({ balance: "0", checking: false });
      return;
    }

    setXlmBalance((prev) => ({ ...prev, checking: true }));

    try {
      const accountData = await server
        .accounts()
        .accountId(stellarAddress)
        .call();

      const xlmBalance = accountData.balances.find(
        (balance) => balance.asset_type === "native"
      );

      setXlmBalance({
        balance: xlmBalance?.balance || "0",
        checking: false,
      });
    } catch (error) {
      console.error("Failed to check XLM balance:", error);
      setXlmBalance({ balance: "0", checking: false });
    }
  };

  // Check token trustline (USDC and EURC) - optimized to use single account request
  const checkTrustline = async () => {
    if (!stellarConnected || !stellarAddress) {
      setTrustlineStatus({
        exists: false,
        balance: "0",
        checking: false,
        creating: false,
      });
      setUsdcTrustline({
        exists: false,
        balance: "0",
        checking: false,
        creating: false,
      });
      setEurcTrustline({
        exists: false,
        balance: "0",
        checking: false,
        creating: false,
      });
      return;
    }

    setTrustlineStatus((prev) => ({ ...prev, checking: true }));
    setUsdcTrustline((prev) => ({ ...prev, checking: true }));
    setEurcTrustline((prev) => ({ ...prev, checking: true }));

    try {
      // Fetch account data once and reuse for both trustlines
      const accountData = await server
        .accounts()
        .accountId(stellarAddress)
        .call();

      // Extract trustlines from the account data
      const usdcAsset = USDC_ASSET;
      const eurcAsset = EURC_ASSET;

      const usdcTrustline = accountData.balances.find(
        (balance) =>
          balance.asset_type === "credit_alphanum4" &&
          balance.asset_code === usdcAsset.code &&
          balance.asset_issuer === usdcAsset.issuer
      );

      const eurcTrustline = accountData.balances.find(
        (balance) =>
          balance.asset_type === "credit_alphanum4" &&
          balance.asset_code === eurcAsset.code &&
          balance.asset_issuer === eurcAsset.issuer
      );

      const usdcResult = {
        exists: !!usdcTrustline,
        balance: usdcTrustline?.balance || "0",
      };

      const eurcResult = {
        exists: !!eurcTrustline,
        balance: eurcTrustline?.balance || "0",
      };

      setUsdcTrustline((prev) => ({
        ...prev,
        exists: usdcResult.exists,
        balance: usdcResult.balance,
        checking: false,
      }));

      setEurcTrustline((prev) => ({
        ...prev,
        exists: eurcResult.exists,
        balance: eurcResult.balance,
        checking: false,
      }));

      // Update main trustlineStatus based on current currency
      const target = currency === "EURC" ? eurcResult : usdcResult;
      setTrustlineStatus((prev) => ({
        ...prev,
        exists: target.exists,
        balance: target.balance,
        checking: false,
      }));
    } catch (error) {
      console.error("Failed to check trustlines:", error);
      setStellarError(
        error instanceof Error ? error.message : "Failed to check trustlines"
      );
      const errorState = { checking: false, exists: false, balance: "0" };
      setTrustlineStatus((prev) => ({ ...prev, ...errorState }));
      setUsdcTrustline((prev) => ({ ...prev, ...errorState }));
      setEurcTrustline((prev) => ({ ...prev, ...errorState }));
      toast.error(`Failed to check trustlines`);
    }
  };

  // Create token trustline (USDC or EURC)
  const createTrustline = async (
    targetCurrency?: "USDC" | "EURC"
  ): Promise<void> => {
    if (!stellarKit || !stellarAddress) {
      toast.error("Wallet not connected");
      return;
    }

    const finalCurrency = targetCurrency || currency;

    if (finalCurrency === "EURC") {
      setEurcTrustline((prev) => ({ ...prev, creating: true }));
    } else {
      setUsdcTrustline((prev) => ({ ...prev, creating: true }));
    }
    if (finalCurrency === currency) {
      setTrustlineStatus((prev) => ({ ...prev, creating: true }));
    }

    try {
      // Refresh account info to get latest sequence number
      const freshAccount = await server.loadAccount(stellarAddress);

      // Select asset based on currency
      const asset = finalCurrency === "EURC" ? EURC_ASSET : USDC_ASSET;

      // Build transaction with fresh account data
      const transactionBuilder = new TransactionBuilder(freshAccount, {
        fee: BASE_FEE,
        networkPassphrase: Networks.PUBLIC,
      })
        .addOperation(
          Operation.changeTrust({
            asset: new Asset(asset.code, asset.issuer),
          })
        )
        .setTimeout(300)
        .build();

      const xdr = transactionBuilder.toXDR();
      const signedXdr = await stellarKit.signTransaction(xdr);

      // Reconstruct signed transaction from XDR
      const signedTx = TransactionBuilder.fromXDR(
        signedXdr.signedTxXdr,
        Networks.PUBLIC
      );

      // Submit signed transaction to Stellar network
      await server.submitTransaction(signedTx);

      toast.success(`${finalCurrency} trustline created successfully!`);

      // Refresh balances after successful creation
      await checkXlmBalance();
      await checkTrustline();
    } catch (error) {
      console.error("Failed to create trustline:", error);
      setStellarError(
        error instanceof Error ? error.message : "Failed to create trustline"
      );
      toast.error(
        `Failed to create ${finalCurrency} trustline. Please try again.`
      );
    } finally {
      if (finalCurrency === "EURC") {
        setEurcTrustline((prev) => ({ ...prev, creating: false }));
      } else {
        setUsdcTrustline((prev) => ({ ...prev, creating: false }));
      }
      if (finalCurrency === currency) {
        setTrustlineStatus((prev) => ({ ...prev, creating: false }));
      }
    }
  };

  useEffect(() => {
    // Setup crypto polyfill for mobile browsers
    setupCryptoPolyfill();

    // Initialize StellarWalletsKit only in browser
    const kit = createStellarKit();
    if (kit) {
      setStellarKit(kit);
    }
  }, []);

  // Auto-reconnect: rely on SDK stellarWalletPersistence when enabled, or sync from Rozo.
  // Do not call stellarKit.setWallet/getAddress here – use setConnector in a component under RozoPayProvider.

  // Check balances when wallet connects or currency changes
  // Use unified function to make a single account request instead of multiple
  useEffect(() => {
    if (stellarConnected && stellarAddress) {
      checkAllBalances();
    } else {
      // Reset balances when disconnected
      setTrustlineStatus({
        exists: false,
        balance: "0",
        checking: false,
        creating: false,
      });
      setUsdcTrustline({
        exists: false,
        balance: "0",
        checking: false,
        creating: false,
      });
      setEurcTrustline({
        exists: false,
        balance: "0",
        checking: false,
        creating: false,
      });
      setXlmBalance({ balance: "0", checking: false });
    }
  }, [stellarConnected, stellarAddress, currency]);

  const connectStellarWallet = async () => {
    if (!stellarKit) {
      toast.error("Stellar Wallets Kit not initialized");
      return;
    }

    const setConnector = setConnectorRef.current;
    if (!setConnector) {
      toast.error("Stellar connect not ready. Please refresh.");
      return;
    }

    setStellarConnecting(true);

    try {
      await stellarKit.openModal({
        modalTitle: "Select Stellar Wallet",
        onWalletSelected: async (option: ISupportedWallet) => {
          try {
            await setConnector(option);
            toast.success(`Connected to ${option.name}`);
          } catch (error: unknown) {
            console.error("Error connecting to Stellar wallet:", error);
            const errorMessage =
              error instanceof Error ? error.message : String(error);
            if (
              errorMessage.includes("not found") ||
              errorMessage.includes("not installed")
            ) {
              toast.error(
                `${option.name} wallet extension not found. Please install it first.`
              );
            } else {
              toast.error("Failed to connect. Please try again.");
            }
          } finally {
            setStellarConnecting(false);
          }
        },
      });
    } catch (error) {
      console.error("Error connecting to Stellar wallet:", error);
      toast.error("Failed to connect to Stellar wallet");
    } finally {
      setStellarConnecting(false);
    }
  };

  const disconnectStellarWallet = () => {
    setStellarAddress("");
    setStellarConnected(false);
    clearStoredWallet(); // Clear stored wallet data on disconnect
  };

  // Sync external wallet state (e.g., from intent-pay)
  const syncExternalWallet = (
    address: string,
    walletName?: string,
    wallet?: ISupportedWallet | null
  ) => {
    if (address) {
      setStellarAddress(address);
      setStellarConnected(true);
      if (walletName) {
        setStellarWalletName(walletName);
      }
      if (wallet) {
        setSelectedWallet(wallet);
      }
    } else {
      // Clear when address is empty
      setStellarAddress("");
      setStellarConnected(false);
      setStellarWalletName(null);
      setSelectedWallet(null);
    }
  };

  return (
    <StellarWalletContext.Provider
      value={{
        server,
        stellarAddress,
        stellarConnected,
        stellarConnecting,
        connectStellarWallet,
        disconnectStellarWallet,
        stellarKit,
        stellarWalletName,
        // Token trustline management (USDC and EURC)
        currency,
        trustlineStatus,
        usdcTrustline,
        eurcTrustline,
        checkTrustline,
        createTrustline,
        // XLM balance management
        xlmBalance,
        checkXlmBalance,
        selectedWallet,
        // External wallet sync
        syncExternalWallet,
        registerSetConnector,
        stellarError,
        setStellarError,
      }}
    >
      {children}
    </StellarWalletContext.Provider>
  );
}

export function useStellarWallet() {
  const context = useContext(StellarWalletContext);
  if (context === undefined) {
    throw new Error(
      "useStellarWallet must be used within a StellarWalletProvider"
    );
  }
  return context;
}
