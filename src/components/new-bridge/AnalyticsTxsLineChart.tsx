"use client";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, LabelList, XAxis } from "recharts";

interface TransactionData {
  timestamp: string;
  duration: number;
  color: "green" | "yellow" | "red";
}

interface AnalyticsTxsLineChartProps {
  txs: TransactionData[];
}

const chartConfig = {
  count: {
    label: "Transactions",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

export function AnalyticsTxsLineChart({ txs }: AnalyticsTxsLineChartProps) {
  if (!txs || txs.length === 0) {
    return null;
  }

  // Count transactions by color
  const greenCount = txs.filter((tx) => tx.color === "green").length;
  const yellowCount = txs.filter((tx) => tx.color === "yellow").length;
  const redCount = txs.filter((tx) => tx.color === "red").length;

  const chartData = [
    {
      category: "Fast",
      count: greenCount,
    },
    {
      category: "Medium",
      count: yellowCount,
    },
    {
      category: "Slow",
      count: redCount,
    },
  ];

  return (
    <ChartContainer config={chartConfig} className="h-[120px] w-full">
      <BarChart
        accessibilityLayer
        data={chartData}
        margin={{
          top: 20,
          left: 0,
          right: 0,
          bottom: 0,
        }}
      >
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="category"
          tickLine={false}
          tickMargin={8}
          axisLine={false}
          tick={{ fontSize: 11 }}
        />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent hideLabel />}
        />
        <Bar dataKey="count" fill="var(--color-count)" radius={6}>
          <LabelList
            position="top"
            offset={8}
            className="fill-foreground"
            fontSize={11}
          />
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
