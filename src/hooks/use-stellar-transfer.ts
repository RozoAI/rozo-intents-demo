import { useStellarWallet } from "@/contexts/StellarWalletContext";
import { DEFAULT_INTENT_PAY_CONFIG } from "@/lib/intentPay";
import { USDC_ASSET } from "@/lib/stellar";
import { StellarPayNow } from "@/lib/stellar-pay";
import {
  baseUSDC,
  createPayment,
  ethereumUSDC,
  FeeType,
  PaymentResponse,
  polygonUSDC,
  rozoStellarUSDC,
  solanaUSDC,
  Token,
} from "@rozoai/intent-common";
import { Networks, TransactionBuilder } from "@stellar/stellar-sdk";
import { useState } from "react";

type TransferStep =
  | null
  | "create-payment"
  | "sign-transaction"
  | "submit-transaction"
  | "success"
  | "error";

type Payload = {
  feeAmount: string;
  amount: string;
  address: string;
  chainId: number;
};

// Helper function to get the destination token based on chain ID
const getDestinationToken = (chainId: number): Token => {
  switch (chainId) {
    case 8453: // Base
      return baseUSDC;
    case 137: // Polygon
      return polygonUSDC;
    case 1: // Ethereum
      return ethereumUSDC;
    case 900: // Solana
      return solanaUSDC;
    default:
      return baseUSDC; // Default to Base
  }
};

export const useStellarTransfer = (
  isAdmin: boolean = false,
  feeType: FeeType = FeeType.ExactIn
) => {
  const { stellarAddress: publicKey, server, stellarKit } = useStellarWallet();

  const [step, setStep] = useState<TransferStep>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);

  const transfer = async (
    payload: Payload
  ): Promise<{ hash: string; payment: PaymentResponse } | undefined> => {
    if (!publicKey) {
      throw new Error("Please ensure you are logged in and try again");
    }

    if (!stellarKit) {
      throw new Error("Stellar Kit not initialized");
    }

    const account = await server.loadAccount(publicKey);

    try {
      setStep(null);
      setPaymentId(null);
      if (account && publicKey && server) {
        // Bridge mode: Use API flow
        setStep("create-payment");
        const appId = isAdmin
          ? "rozoBridgeStellarAdmin"
          : DEFAULT_INTENT_PAY_CONFIG.appId;

        const payAmount =
          feeType === FeeType.ExactIn
            ? payload.amount
            : (Number(payload.amount) - Number(payload.feeAmount)).toFixed(2);

        // Get destination token based on chain ID
        const destinationToken = getDestinationToken(payload.chainId);

        const payment = await createPayment({
          appId,
          feeType,
          toChain: destinationToken.chainId,
          toToken: destinationToken.token,
          toAddress: payload.address,
          toUnits: payAmount,
          preferredChain: rozoStellarUSDC.chainId,
          preferredTokenAddress: rozoStellarUSDC.token,
          metadata: {
            intent: "Withdraw",
            items: [
              {
                name: "ROZO Intents",
                description: `Transfer USDC from Stellar to ${destinationToken.symbol}`,
              },
            ],
          },
        });

        if (payment.id && payment.source.receiverAddress) {
          setPaymentId(payment.id);
          if (server) {
            try {
              setStep("sign-transaction");
              const transactionXdr = await StellarPayNow({
                account,
                publicKey,
                server,
                token: {
                  key: USDC_ASSET.code,
                  address: USDC_ASSET.issuer,
                },
                order: {
                  address: payment.source.receiverAddress,
                  pay_amount: Number(payment.source.amount ?? 0),
                  salt: payment.source.receiverMemo,
                },
              });
              const signedXdr = await stellarKit.signTransaction(
                transactionXdr
              );

              const signedTx = TransactionBuilder.fromXDR(
                signedXdr.signedTxXdr,
                Networks.PUBLIC
              );

              setStep("submit-transaction");
              const result = await server.submitTransaction(signedTx);

              if (result.hash && payment.id) {
                setStep("success");
                return {
                  hash: result.hash,
                  payment,
                };
              } else {
                setStep("error");
                throw new Error("Transaction failed");
              }
            } catch (error) {
              setStep("error");
              throw error;
            }
          }
        } else {
          setStep("error");
          throw new Error("Transaction failed");
        }
      }
    } catch (error) {
      setStep("error");
      throw error;
    }
  };

  return {
    transfer,
    setStep,
    step,
    paymentId,
  };
};
