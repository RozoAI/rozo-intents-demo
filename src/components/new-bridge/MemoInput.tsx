"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { HelpCircle } from "lucide-react";

interface MemoInputProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function MemoInput({ value, onChange, className }: MemoInputProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-1.5">
        <Label
          htmlFor="memo"
          className="text-neutral-600 dark:text-neutral-400"
        >
          Memo{" "}
          <span className="text-neutral-400 dark:text-neutral-500">
            (Optional)
          </span>
        </Label>
        <Tooltip>
          <TooltipTrigger asChild>
            <HelpCircle className="size-3.5 text-neutral-400 dark:text-neutral-500 cursor-help" />
          </TooltipTrigger>
          <TooltipContent side="right" className="max-w-xs">
            <p>
              Add an optional memo to your transfer. This can be useful for
              identifying the transaction or including additional information.
            </p>
          </TooltipContent>
        </Tooltip>
      </div>
      <Input
        id="memo"
        placeholder="Enter memo"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 sm:h-12 bg-white border-neutral-300 text-base text-neutral-900 placeholder:text-neutral-400 dark:bg-neutral-800 dark:border-neutral-700 dark:text-white dark:placeholder:text-neutral-500"
        style={{ fontSize: "16px" }} // Prevent iOS zoom
      />
    </div>
  );
}
