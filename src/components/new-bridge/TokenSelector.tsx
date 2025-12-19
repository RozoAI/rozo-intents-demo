"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
    <Select value={currentCurrency} onValueChange={handleValueChange}>
      <SelectTrigger size="sm" className="w-fit h-8 sm:h-9 text-xs sm:text-sm">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="USDC">$ USD</SelectItem>
        <SelectItem value="EURC">€ EUR</SelectItem>
      </SelectContent>
    </Select>
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
