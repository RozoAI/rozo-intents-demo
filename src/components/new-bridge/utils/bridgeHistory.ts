import { Chain, Token } from "@rozoai/intent-common";

export interface BridgeHistoryItem {
  id: string;
  paymentId: string;
  rozoPaymentId?: string;
  amount: string;
  sourceChainId: number;
  sourceChainName: string;
  sourceTokenSymbol: string;
  destinationChainId: number;
  destinationChainName: string;
  destinationTokenSymbol: string;
  destinationAddress: string;
  sourceTxHash?: string;
  destinationTxHash?: string;
  completedAt: string;
  walletAddress: string | null;
  status: "completed" | "pending" | "failed" | "expired";
}

// New flat array structure - all transactions in one array
export type BridgeHistoryStorage = BridgeHistoryItem[];

// New storage key to start fresh
export const ROZO_BRIDGE_HISTORY_STORAGE_KEY = "rozo_bridge_history_v2";

// 1 hour in milliseconds
const PENDING_EXPIRATION_TIME = 60 * 60 * 1000;

/**
 * Save a bridge transaction to history
 */
export const saveBridgeHistory = ({
  walletAddress,
  paymentId,
  rozoPaymentId,
  amount,
  sourceChain,
  sourceToken,
  destinationChain,
  destinationToken,
  destinationAddress,
  sourceTxHash,
  destinationTxHash,
  status = "completed",
}: {
  walletAddress: string | null;
  paymentId: string;
  rozoPaymentId?: string;
  amount: string;
  sourceChain: Chain;
  sourceToken: Token;
  destinationChain: Chain;
  destinationToken: Token;
  destinationAddress: string;
  sourceTxHash?: string;
  destinationTxHash?: string;
  status?: "completed" | "pending" | "failed" | "expired";
}): void => {
  try {
    const existingData = getBridgeHistory();

    // Check if payment already exists using paymentId
    const existingIndex = existingData.findIndex(
      (item) => item.paymentId === paymentId
    );

    let updatedHistory: BridgeHistoryStorage;

    if (existingIndex !== -1) {
      // Update existing transaction, preserving all source/destination info
      const existing = existingData[existingIndex];
      updatedHistory = [...existingData];
      updatedHistory[existingIndex] = {
        ...existing,
        // Update fields that may have new information
        rozoPaymentId: rozoPaymentId || existing.rozoPaymentId,
        amount: amount || existing.amount,
        sourceTxHash: sourceTxHash || existing.sourceTxHash,
        destinationTxHash: destinationTxHash || existing.destinationTxHash,
        status: status || existing.status,
        // Update completedAt only if status changed to completed
        completedAt:
          status === "completed" && existing.status !== "completed"
            ? new Date().toISOString()
            : existing.completedAt,
      };
    } else {
      // Create new transaction with all source and destination info
      const newTransaction: BridgeHistoryItem = {
        id: `${walletAddress || "guest"}_${Date.now()}_${paymentId}`,
        paymentId,
        rozoPaymentId,
        amount,
        sourceChainId: sourceChain.chainId,
        sourceChainName: sourceChain.name,
        sourceTokenSymbol: sourceToken.symbol,
        destinationChainId: destinationChain.chainId,
        destinationChainName: destinationChain.name,
        destinationTokenSymbol: destinationToken.symbol,
        destinationAddress,
        sourceTxHash,
        destinationTxHash,
        completedAt: new Date().toISOString(),
        walletAddress,
        status,
      };
      updatedHistory = [newTransaction, ...existingData];
    }

    localStorage.setItem(
      ROZO_BRIDGE_HISTORY_STORAGE_KEY,
      JSON.stringify(updatedHistory)
    );

    // Dispatch custom event to notify listeners
    window.dispatchEvent(new CustomEvent("bridge-payment-completed"));
  } catch (error) {
    console.error("Failed to save bridge history:", error);
    throw error;
  }
};

/**
 * Expire pending transactions older than 1 hour
 */
const expirePendingTransactions = (
  history: BridgeHistoryStorage
): BridgeHistoryStorage => {
  const now = Date.now();
  let hasChanges = false;

  const updatedHistory = history.map((transaction) => {
    if (transaction.status === "pending") {
      const transactionTime = new Date(transaction.completedAt).getTime();
      const timeDiff = now - transactionTime;

      if (timeDiff > PENDING_EXPIRATION_TIME) {
        hasChanges = true;
        return {
          ...transaction,
          status: "expired" as const,
        };
      }
    }
    return transaction;
  });

  // Save back to localStorage if there were changes
  if (hasChanges) {
    try {
      localStorage.setItem(
        ROZO_BRIDGE_HISTORY_STORAGE_KEY,
        JSON.stringify(updatedHistory)
      );
      window.dispatchEvent(new CustomEvent("bridge-payment-completed"));
    } catch (error) {
      console.error("Failed to update expired transactions:", error);
    }
  }

  return updatedHistory;
};

/**
 * Get all bridge history
 */
export const getBridgeHistory = (): BridgeHistoryStorage => {
  try {
    const data = localStorage.getItem(ROZO_BRIDGE_HISTORY_STORAGE_KEY);
    const parsedData: BridgeHistoryStorage = data ? JSON.parse(data) : [];
    // Automatically expire pending transactions older than 1 hour
    return expirePendingTransactions(parsedData);
  } catch {
    return [];
  }
};

/**
 * Get all bridge history sorted by date (newest first)
 * This replaces getMergedBridgeHistories as we now have a flat structure
 */
export const getAllBridgeHistory = (): BridgeHistoryItem[] => {
  const allHistory = getBridgeHistory();

  // Sort by date descending (newest first)
  return allHistory.sort(
    (a, b) =>
      new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
  );
};

/**
 * Get bridge history for a specific wallet
 */
export const getBridgeHistoryForWallet = (
  walletAddress: string | null
): BridgeHistoryItem[] => {
  const allHistory = getBridgeHistory();

  // Filter by wallet address
  const walletHistory = allHistory.filter(
    (item) => item.walletAddress === walletAddress
  );

  // Sort by date descending (newest first)
  return walletHistory.sort(
    (a, b) =>
      new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
  );
};

/**
 * Clear bridge history for a specific wallet (or all if walletAddress is null)
 */
export const clearBridgeHistoryForWallet = (
  walletAddress: string | null
): void => {
  try {
    const existingData = getBridgeHistory();

    // Filter out transactions for the specified wallet
    const updatedData = existingData.filter(
      (item) => item.walletAddress !== walletAddress
    );

    localStorage.setItem(
      ROZO_BRIDGE_HISTORY_STORAGE_KEY,
      JSON.stringify(updatedData)
    );
    window.dispatchEvent(new CustomEvent("bridge-payment-completed"));
  } catch (error) {
    console.error("Failed to clear bridge history:", error);
    throw error;
  }
};

/**
 * Clear all bridge history
 */
export const clearAllBridgeHistory = (): void => {
  try {
    localStorage.setItem(ROZO_BRIDGE_HISTORY_STORAGE_KEY, JSON.stringify([]));
    window.dispatchEvent(new CustomEvent("bridge-payment-completed"));
  } catch (error) {
    console.error("Failed to clear all bridge history:", error);
    throw error;
  }
};

/**
 * Update bridge transaction status
 */
export const updateBridgeTransactionStatus = (
  paymentId: string,
  status: "completed" | "pending" | "failed" | "expired",
  destinationTxHash?: string
): void => {
  try {
    const existingData = getBridgeHistory();
    const transactionIndex = existingData.findIndex(
      (item) => item.paymentId === paymentId
    );

    if (transactionIndex !== -1) {
      existingData[transactionIndex].status = status;
      if (destinationTxHash) {
        existingData[transactionIndex].destinationTxHash = destinationTxHash;
      }

      localStorage.setItem(
        ROZO_BRIDGE_HISTORY_STORAGE_KEY,
        JSON.stringify(existingData)
      );
      window.dispatchEvent(new CustomEvent("bridge-payment-completed"));
    }
  } catch (error) {
    console.error("Failed to update bridge transaction status:", error);
    throw error;
  }
};
