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
  walletAddress: string;
  status: "completed" | "pending" | "failed" | "expired";
}

export interface BridgeHistoryStorage {
  [walletAddress: string]: BridgeHistoryItem[];
}

export const ROZO_BRIDGE_HISTORY_STORAGE_KEY = "rozo_bridge_history";

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
  walletAddress: string;
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
    const existingWalletHistory = existingData[walletAddress] || [];

    // Check if payment already exists for this wallet using paymentId
    const existingIndex = existingWalletHistory.findIndex(
      (item) => item.paymentId === paymentId
    );

    let updatedHistory: BridgeHistoryItem[];

    if (existingIndex !== -1) {
      // Update existing transaction, preserving all source/destination info
      const existing = existingWalletHistory[existingIndex];
      updatedHistory = [...existingWalletHistory];
      updatedHistory[existingIndex] = {
        ...existing,
        // Update fields that may have new information
        rozoPaymentId: rozoPaymentId || existing.rozoPaymentId,
        amount: amount || existing.amount,
        sourceTxHash: sourceTxHash || existing.sourceTxHash,
        destinationTxHash: destinationTxHash || existing.destinationTxHash,
        status: status || existing.status,
        // Preserve source and destination info (these shouldn't change)
        sourceChainId: existing.sourceChainId,
        sourceChainName: existing.sourceChainName,
        sourceTokenSymbol: existing.sourceTokenSymbol,
        destinationChainId: existing.destinationChainId,
        destinationChainName: existing.destinationChainName,
        destinationTokenSymbol: existing.destinationTokenSymbol,
        destinationAddress: existing.destinationAddress,
        // Update completedAt only if status changed to completed
        completedAt:
          status === "completed" && existing.status !== "completed"
            ? new Date().toISOString()
            : existing.completedAt,
      };
    } else {
      // Create new transaction with all source and destination info
      const newTransaction: BridgeHistoryItem = {
        id: `${walletAddress}_${Date.now()}_${paymentId}`,
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
      updatedHistory = [newTransaction, ...existingWalletHistory];
    }

    const updatedData: BridgeHistoryStorage = {
      ...existingData,
      [walletAddress]: updatedHistory,
    };

    localStorage.setItem(
      ROZO_BRIDGE_HISTORY_STORAGE_KEY,
      JSON.stringify(updatedData)
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
  const updatedHistory: BridgeHistoryStorage = {};
  let hasChanges = false;

  Object.entries(history).forEach(([walletAddress, transactions]) => {
    const updatedTransactions = transactions.map((transaction) => {
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

    updatedHistory[walletAddress] = updatedTransactions;
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
    const parsedData = data ? JSON.parse(data) : {};
    // Automatically expire pending transactions older than 1 hour
    return expirePendingTransactions(parsedData);
  } catch {
    return {};
  }
};

export const getMergedBridgeHistories = (): BridgeHistoryItem[] => {
  const allHistory = Array.from(Object.values(getBridgeHistory())).flat();

  // If no session history, nothing to merge
  if (allHistory.length === 0) return [];

  allHistory.forEach((sessionItem) => {
    const existingIndex = allHistory.findIndex(
      (item) => item.paymentId === sessionItem.paymentId
    );

    if (existingIndex === -1) {
      // Add session item to wallet history
      allHistory.push(sessionItem);
    }
  });

  // Sort by date descending
  allHistory.sort(
    (a, b) =>
      new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
  );

  return allHistory;
};

/**
 * Get bridge history for a specific wallet
 */
export const getBridgeHistoryForWallet = (
  walletAddress: string
): BridgeHistoryItem[] => {
  const allHistory = getBridgeHistory();
  const walletHistory = allHistory[walletAddress] || [];
  // Sort by date descending (newest first)
  return walletHistory.sort(
    (a, b) =>
      new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
  );
};

/**
 * Clear bridge history for a specific wallet
 */
export const clearBridgeHistoryForWallet = (walletAddress: string): void => {
  try {
    const existingData = getBridgeHistory();
    const updatedData = { ...existingData };
    delete updatedData[walletAddress];
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
 * Remove duplicate bridge payments based on paymentId
 */
export const removeDuplicateBridgePayments = (walletAddress: string): void => {
  try {
    const existingData = getBridgeHistory();
    const walletHistory = existingData[walletAddress] || [];

    // Remove duplicates based on paymentId, keeping the most recent one
    const uniquePayments = walletHistory.reduce((acc, current) => {
      const existingIndex = acc.findIndex(
        (item) => item.paymentId === current.paymentId
      );
      if (existingIndex === -1) {
        acc.push(current);
      } else {
        // Keep the more recent one
        const existing = acc[existingIndex];
        if (new Date(current.completedAt) > new Date(existing.completedAt)) {
          acc[existingIndex] = current;
        }
      }
      return acc;
    }, [] as BridgeHistoryItem[]);

    if (uniquePayments.length !== walletHistory.length) {
      const updatedData = {
        ...existingData,
        [walletAddress]: uniquePayments,
      };
      localStorage.setItem(
        ROZO_BRIDGE_HISTORY_STORAGE_KEY,
        JSON.stringify(updatedData)
      );
    }
  } catch (error) {
    console.error("Failed to remove duplicate bridge payments:", error);
    throw error;
  }
};

/**
 * Update bridge transaction status
 */
export const updateBridgeTransactionStatus = (
  walletAddress: string,
  paymentId: string,
  status: "completed" | "pending" | "failed" | "expired",
  destinationTxHash?: string
): void => {
  try {
    const existingData = getBridgeHistory();
    const walletHistory = existingData[walletAddress] || [];
    const transactionIndex = walletHistory.findIndex(
      (item) => item.paymentId === paymentId
    );

    if (transactionIndex !== -1) {
      walletHistory[transactionIndex].status = status;
      if (destinationTxHash) {
        walletHistory[transactionIndex].destinationTxHash = destinationTxHash;
      }
      const updatedData = {
        ...existingData,
        [walletAddress]: walletHistory,
      };
      localStorage.setItem(
        ROZO_BRIDGE_HISTORY_STORAGE_KEY,
        JSON.stringify(updatedData)
      );
      window.dispatchEvent(new CustomEvent("bridge-payment-completed"));
    }
  } catch (error) {
    console.error("Failed to update bridge transaction status:", error);
    throw error;
  }
};
