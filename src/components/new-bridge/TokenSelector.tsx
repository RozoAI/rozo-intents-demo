"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function TokenSelectorContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentCurrency = searchParams.get("currency") || "USDC";

  const handleValueChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("currency", value);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <Tabs
      value={currentCurrency}
      onValueChange={handleValueChange}
      className="w-fit"
    >
      <TabsList className="h-8 sm:h-9 p-1 rounded-lg sm:rounded-xl bg-neutral-100 dark:bg-neutral-800/50 border border-neutral-200/50 dark:border-neutral-700/50">
        <TabsTrigger
          value="USDC"
          className="rounded-md sm:rounded-lg px-2.5 sm:px-3.5 h-full text-xs sm:text-sm transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-700 data-[state=active]:shadow-sm"
        >
          $ USD
        </TabsTrigger>
        <TabsTrigger
          value="EURC"
          className="rounded-md sm:rounded-lg px-2.5 sm:px-3.5 h-full text-xs sm:text-sm transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-700 data-[state=active]:shadow-sm"
        >
          € EUR
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}

export function TokenSelector() {
  return (
    <Suspense
      fallback={
        <div className="w-[100px] h-8 sm:h-9 bg-neutral-100 dark:bg-neutral-800/50 animate-pulse rounded-lg sm:rounded-xl" />
      }
    >
      <TokenSelectorContent />
    </Suspense>
  );
}
