import { SignClient } from "@walletconnect/sign-client";
import { SessionTypes } from "@walletconnect/types";

// WalletConnect configuration with both EVM and Stellar namespaces
export const WALLETCONNECT_CONFIG = {
  projectId: "7440dd8acf85933ffcc775ec6675d4a9",
  metadata: {
    name: "ROZO Intents",
    description: "Intent-based USDC transfers between Base and Stellar",
    url: "https://intents.rozo.ai",
    icons: [
      "https://imagedelivery.net/AKLvTMvIg6yc9W08fHl1Tg/fdfef53e-91c2-4abc-aec0-6902a26d6c00/80x",
    ],
  },
  // Required namespaces for both EVM and Stellar
  requiredNamespaces: {
    eip155: {
      chains: [
        "eip155:1",
        "eip155:8453",
        "eip155:137",
        "eip155:42161",
        "eip155:10",
        "eip155:43114",
      ],
      methods: [
        "eth_sendTransaction",
        "personal_sign",
        "eth_signTypedData",
        "eth_signTypedData_v4",
        "wallet_switchEthereumChain",
        "wallet_addEthereumChain",
      ],
      events: ["accountsChanged", "chainChanged"],
    },
    stellar: {
      chains: ["stellar:pubnet", "stellar:testnet"],
      methods: ["stellar_signXDR", "stellar_signAndSubmitXDR"],
      events: [],
    },
  },
};

// WalletConnect client instance
let walletConnectClient: InstanceType<typeof SignClient> | null = null;

// Initialize WalletConnect client
export const initWalletConnect = async (): Promise<
  InstanceType<typeof SignClient>
> => {
  if (walletConnectClient) {
    return walletConnectClient;
  }

  try {
    walletConnectClient = await SignClient.init({
      projectId: WALLETCONNECT_CONFIG.projectId,
      metadata: WALLETCONNECT_CONFIG.metadata,
    });

    return walletConnectClient;
  } catch (error) {
    console.error("Failed to initialize WalletConnect:", error);
    throw error;
  }
};

// Get WalletConnect client
export const getWalletConnectClient = (): InstanceType<
  typeof SignClient
> | null => {
  return walletConnectClient;
};

// Connect to WalletConnect with both namespaces
export const connectWalletConnect = async (): Promise<SessionTypes.Struct> => {
  const client = await initWalletConnect();

  try {
    const { approval } = await client.connect({
      requiredNamespaces: WALLETCONNECT_CONFIG.requiredNamespaces,
    });

    const session = await approval();
    return session;
  } catch (error) {
    console.error("Failed to connect WalletConnect:", error);
    throw error;
  }
};

// Disconnect WalletConnect session
export const disconnectWalletConnect = async (topic: string): Promise<void> => {
  const client = getWalletConnectClient();
  if (!client) {
    console.warn("WalletConnect client not initialized, skipping disconnect");
    return;
  }

  try {
    // Check if session exists before attempting to disconnect
    const session = client.session.get(topic);
    if (!session) {
      console.warn(
        `WalletConnect session ${topic} not found, already disconnected`
      );
      return;
    }

    await client.disconnect({
      topic,
      reason: {
        code: 6000,
        message: "User disconnected",
      },
    });
  } catch (error) {
    console.error("Failed to disconnect WalletConnect:", error);
    // Don't throw error to prevent blocking the disconnect flow
    // The local state will still be cleared
  }
};

// Sign Stellar transaction via WalletConnect
export const signStellarTransaction = async (
  topic: string,
  xdr: string,
  publicKey: string,
  network: "pubnet" | "testnet" = "pubnet"
): Promise<string> => {
  const client = getWalletConnectClient();
  if (!client) {
    throw new Error("WalletConnect client not initialized");
  }

  try {
    const result = await client.request({
      topic,
      chainId: `stellar:${network}`,
      request: {
        method: "stellar_signXDR",
        params: {
          xdr,
          publicKey,
          network,
        },
      },
    });

    return result as string;
  } catch (error) {
    console.error("Failed to sign Stellar transaction:", error);
    throw error;
  }
};

// Sign and submit Stellar transaction via WalletConnect
export const signAndSubmitStellarTransaction = async (
  topic: string,
  xdr: string,
  publicKey: string,
  network: "pubnet" | "testnet" = "pubnet"
): Promise<string> => {
  const client = getWalletConnectClient();
  if (!client) {
    throw new Error("WalletConnect client not initialized");
  }

  try {
    const result = await client.request({
      topic,
      chainId: `stellar:${network}`,
      request: {
        method: "stellar_signAndSubmitXDR",
        params: {
          xdr,
          publicKey,
          network,
        },
      },
    });

    return result as string;
  } catch (error) {
    console.error("Failed to sign and submit Stellar transaction:", error);
    throw error;
  }
};

// Get active WalletConnect sessions
export const getActiveSessions = (): SessionTypes.Struct[] => {
  const client = getWalletConnectClient();
  if (!client) {
    return [];
  }

  return Object.values(client.session.getAll());
};

// Get session by topic
export const getSessionByTopic = (
  topic: string
): SessionTypes.Struct | undefined => {
  const client = getWalletConnectClient();
  if (!client) {
    return undefined;
  }

  return client.session.get(topic);
};

// Check if session supports Stellar
export const sessionSupportsStellar = (
  session: SessionTypes.Struct
): boolean => {
  return Object.keys(session.namespaces).includes("stellar");
};

// Check if session supports EVM
export const sessionSupportsEVM = (session: SessionTypes.Struct): boolean => {
  return Object.keys(session.namespaces).includes("eip155");
};

// Get Stellar accounts from session
export const getStellarAccounts = (session: SessionTypes.Struct): string[] => {
  const stellarNamespace = session.namespaces.stellar;
  if (!stellarNamespace) {
    return [];
  }

  return stellarNamespace.accounts
    .map((account) => {
      // Account format: "stellar:pubnet:GXXXXXXX" or "stellar:testnet:GXXXXXXX"
      const parts = account.split(":");
      return parts[2] || "";
    })
    .filter(Boolean);
};

// Get EVM accounts from session
export const getEVMAccounts = (session: SessionTypes.Struct): string[] => {
  const evmNamespace = session.namespaces.eip155;
  if (!evmNamespace) {
    return [];
  }

  return evmNamespace.accounts
    .map((account) => {
      // Account format: "eip155:1:0xXXXXXX"
      const parts = account.split(":");
      return parts[2] || "";
    })
    .filter(Boolean);
};
