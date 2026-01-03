import { useQuery } from "@tanstack/react-query";

export interface RewardsData {
  address: string;
  seeds: number;
  totalVolumeUsdc: number;
  totalVolumeEurc: number;
  transactionUsdcCount: number;
  transactionEurcCount: number;
  lastUpdatedAt: string;
  createdAt: string;
}

const fetchRewards = async (address: string): Promise<RewardsData> => {
  if (!address) {
    throw new Error("Address is required");
  }

  const response = await fetch(
    `https://intentapiv4.rozo.ai/functions/v1/payment-api/rewards/${address}`
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch rewards: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();
  return data;
};

export const useGetRewards = (
  address: string,
  options?: {
    enabled?: boolean;
    refetchInterval?: number;
  }
) => {
  return useQuery({
    queryKey: ["rewards", address],
    queryFn: () => fetchRewards(address),
    enabled: (options?.enabled ?? true) && !!address,
    refetchInterval: options?.refetchInterval,
    staleTime: 60000, // 1 minute
  });
};
