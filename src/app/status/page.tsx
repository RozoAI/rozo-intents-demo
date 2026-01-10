"use client";

import { AnalyticsTxsLineChart } from "@/components/new-bridge/AnalyticsTxsLineChart";
import { BridgeFooter } from "@/components/new-bridge/BridgeFooter";
import { useAnalytics } from "@/hooks/use-analytics";
import { cn } from "@/lib/utils";
import {
  Activity,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Loader2,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";

function StatusBadge({
  status,
}: {
  status: "operational" | "degraded" | "outage";
}) {
  const statusConfig = {
    operational: {
      label: "All Systems Operational",
      bgColor: "bg-green-500/10",
      textColor: "text-green-600 dark:text-green-400",
      dotColor: "bg-green-500",
    },
    degraded: {
      label: "Partial System Outage",
      bgColor: "bg-yellow-500/10",
      textColor: "text-yellow-600 dark:text-yellow-400",
      dotColor: "bg-yellow-500",
    },
    outage: {
      label: "Major Outage",
      bgColor: "bg-red-500/10",
      textColor: "text-red-600 dark:text-red-400",
      dotColor: "bg-red-500",
    },
  };

  const config = statusConfig[status];

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-4 py-2 rounded-full",
        config.bgColor
      )}
    >
      <span
        className={cn(
          "h-2.5 w-2.5 rounded-full animate-pulse",
          config.dotColor
        )}
      />
      <span className={cn("text-sm font-medium", config.textColor)}>
        {config.label}
      </span>
    </div>
  );
}

function SystemStatus({
  name,
  status,
  description,
}: {
  name: string;
  status: "operational" | "degraded" | "outage";
  description?: string;
}) {
  const statusConfig = {
    operational: {
      icon: CheckCircle2,
      color: "text-green-500",
      label: "Operational",
    },
    degraded: {
      icon: Clock,
      color: "text-yellow-500",
      label: "Degraded",
    },
    outage: {
      icon: Activity,
      color: "text-red-500",
      label: "Outage",
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className="flex items-center justify-between py-4 border-b last:border-b-0">
      <div className="flex flex-col">
        <span className="font-medium">{name}</span>
        {description && (
          <span className="text-sm text-muted-foreground">{description}</span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <span className={cn("text-sm", config.color)}>{config.label}</span>
        <Icon className={cn("h-5 w-5", config.color)} />
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  icon: Icon,
  suffix,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  suffix?: string;
}) {
  return (
    <div className="bg-card border rounded-lg p-4">
      <div className="flex items-center gap-2 text-muted-foreground mb-2">
        <Icon className="h-4 w-4" />
        <span className="text-sm">{title}</span>
      </div>
      <p className="text-2xl font-bold">
        {value}
        {suffix && <span className="text-lg font-normal ml-0.5">{suffix}</span>}
      </p>
    </div>
  );
}

export default function StatusPage() {
  const { data, isLoading, error } = useAnalytics();

  const latestTimestamp = useMemo(() => {
    return data?.txs && data.txs.length > 0
      ? data.txs.reduce((latest, tx) => {
          const txDate = new Date(tx.timestamp);
          return txDate > latest ? txDate : latest;
        }, new Date(data.txs[0].timestamp))
      : new Date();
  }, [data]);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/bridge"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Bridge
          </Link>

          <div className="flex items-center gap-3 mb-4">
            <Image
              src="/rozo-logo.png"
              alt="Rozo Logo"
              width={40}
              height={40}
              className="rounded-lg"
            />
            <div>
              <h1 className="text-2xl font-bold">ROZO Status</h1>
              <p className="text-muted-foreground text-sm">
                Real-time system status and performance metrics
              </p>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold mb-4">Performance Metrics</h2>
            <p className="text-sm text-muted-foreground">
              Last updated:{" "}
              {latestTimestamp.toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="text-center py-12 text-muted-foreground">
              Unable to load metrics
            </div>
          ) : data ? (
            <>
              {/* Transaction Timeline Chart */}
              {data.txs && data.txs.length > 0 && (
                <div className="bg-card border rounded-xl p-6">
                  <h3 className="text-sm font-medium text-muted-foreground mb-4">
                    Transaction Performance (Last 50)
                  </h3>
                  <AnalyticsTxsLineChart txs={data.txs} />
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Footer */}
        <BridgeFooter />
      </div>
    </div>
  );
}
