import { FeeType } from "@rozoai/intent-common";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

export interface GetFeeParams {
  amount: number;
  type?: FeeType;
  appId?: string;
  currency?: string;
}

export interface GetFeeResponse {
  appId: string;
  amount: number;
  currency: string;
  fee: number;
  feePercentage: string;
  minimumFee: string;
  amountIn: number;
  amountOut: number;
}

export interface GetFeeError {
  error: string;
  message: string;
  received: number;
  maxAllowed: number;
}

const fetchFee = async (params: GetFeeParams): Promise<GetFeeResponse> => {
  if (params.amount <= 0) {
    throw new Error("Amount must be greater than 0");
  }

  const queryParams = new URLSearchParams({
    amount: params.amount.toString(),
    type: params.type ?? FeeType.ExactOut,
    ...(params.appId && { appId: params.appId }),
    ...(params.currency && { currency: params.currency }),
  });

  const response = await fetch(
    `https://intentapi.rozo.ai/getFee?${queryParams.toString()}`
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);

    if (errorData && errorData.error) {
      // Throw the error data so we can access it in the component
      throw errorData;
    }

    throw new Error(
      `Failed to fetch fee: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();

  if (!data) {
    throw new Error("Invalid response: data is undefined");
  }

  return data;
};

export const useGetFee = (
  params: GetFeeParams,
  options?: {
    enabled?: boolean;
    refetchInterval?: number;
    debounceMs?: number;
  }
) => {
  const [debouncedParams, setDebouncedParams] = useState(params);
  const debounceMs = options?.debounceMs ?? 500;

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedParams(params);
    }, debounceMs);

    return () => {
      clearTimeout(handler);
    };
  }, [params.amount, params.appId, params.currency, params.type, debounceMs]);

  return useQuery({
    queryKey: [
      "fee",
      debouncedParams.amount,
      debouncedParams.appId,
      debouncedParams.currency,
      debouncedParams.type,
    ],
    queryFn: () => fetchFee(debouncedParams),
    enabled: (options?.enabled ?? true) && debouncedParams.amount > 0,
    refetchInterval: options?.refetchInterval,
    staleTime: 30000, // 30 seconds
    retry: false, // Don't retry on error
  });
};
