import { useQuery } from "@tanstack/react-query";

export interface AnalyticsData {
  today: {
    date: string;
    total_payments: number;
    total_volume_usdc: number;
    avg_seconds: number;
  };
  last_7_days: {
    start_date: string;
    end_date: string;
    total_payments: number;
    total_volume_usdc: number;
    avg_seconds: number;
  };
}

const fetchAnalytics = async (): Promise<AnalyticsData> => {
  const response = await fetch(
    "https://intentapiv4.rozo.ai/functions/v1/analytics"
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch analytics: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();
  return data;
};

export const useAnalytics = () => {
  return useQuery({
    queryKey: ["analytics"],
    queryFn: fetchAnalytics,
    staleTime: 60000, // 1 minute
  });
};
