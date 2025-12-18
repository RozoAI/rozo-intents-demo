"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TokenLogo } from "@rozoai/intent-common";
import Image from "next/image";
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
      <SelectTrigger className="w-fit min-w-[90px] sm:min-w-[110px] h-8 sm:h-9 text-xs sm:text-sm px-2 sm:px-3 rounded-lg sm:rounded-xl">
        <SelectValue placeholder="Select Token" />
      </SelectTrigger>
      <SelectContent className="rounded-xl border-neutral-200 dark:border-neutral-800">
        <SelectItem value="USDC" className="rounded-lg text-xs sm:text-sm">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Image
              src={TokenLogo.USDC}
              alt="USDC"
              width={16}
              height={16}
              className="rounded-full sm:w-5 sm:h-5"
            />
            <span className="font-medium">USDC</span>
          </div>
        </SelectItem>
        <SelectItem value="EURC" className="rounded-lg text-xs sm:text-sm">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Image
              src={TokenLogo.EURC}
              alt="EURC"
              width={16}
              height={16}
              className="rounded-full sm:w-5 sm:h-5"
            />
            <span className="font-medium">EURC</span>
          </div>
        </SelectItem>
      </SelectContent>
    </Select>
  );
}

export function TokenSelector() {
  return (
    <Suspense
      fallback={
        <div className="w-[90px] sm:w-[110px] h-8 sm:h-9 bg-neutral-100 dark:bg-neutral-800 animate-pulse rounded-lg sm:rounded-xl" />
      }
    >
      <TokenSelectorContent />
    </Suspense>
  );
}
