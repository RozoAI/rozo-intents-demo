"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { isMuxedAddress, normalizeStellarAddress } from "@/lib/stellar";
import { cn } from "@/lib/utils";
import { useStellarMemoValidation } from "@/store/stellar";
import { isValidStellarAddress } from "@rozoai/intent-common";
import { AlertTriangle, CheckCircle, Info } from "lucide-react";
import { useEffect, useState } from "react";
// Define MemoType enum locally to avoid dependency issues
enum MemoType {
  MemoNone = 0,
  MemoText = 1,
  MemoId = 2,
  MemoHash = 3,
  MemoReturn = 4,
}

interface StellarMemoInputProps {
  destinationAddress: string;
  memo: { type: MemoType; value: string } | null;
  onMemoChange: (memo: { type: MemoType; value: string } | null) => void;
  className?: string;
}

export function StellarMemoInput({
  destinationAddress,
  memo,
  onMemoChange,
  className,
}: StellarMemoInputProps) {
  const [memoType, setMemoType] = useState<MemoType>(MemoType.MemoText);
  const [memoValue, setMemoValue] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [memoRequired, setMemoRequired] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const { validateMemoRequired } = useStellarMemoValidation();

  // Validate destination address and check memo requirements
  useEffect(() => {
    const validateDestination = async () => {
      if (!destinationAddress || !isValidStellarAddress(destinationAddress)) {
        setMemoRequired(false);
        setValidationError(null);
        return;
      }

      setIsValidating(true);
      setValidationError(null);

      try {
        const normalizedAddress = normalizeStellarAddress(destinationAddress);
        const result = await validateMemoRequired(normalizedAddress);

        setMemoRequired(result.memo_required);

        if (result.memo_required && result.memo_type) {
          // Set default memo type based on validation result
          const defaultMemoType = (() => {
            switch (result.memo_type) {
              case "text":
                return MemoType.MemoText;
              case "id":
                return MemoType.MemoId;
              case "hash":
                return MemoType.MemoHash;
              default:
                return MemoType.MemoText;
            }
          })();
          setMemoType(defaultMemoType);
        }
      } catch (error) {
        console.error("Failed to validate memo requirement:", error);
        setValidationError("Failed to validate destination address");
      } finally {
        setIsValidating(false);
      }
    };

    validateDestination();
  }, [destinationAddress, validateMemoRequired]);

  // Update parent component when memo changes
  useEffect(() => {
    if (memoValue.trim()) {
      onMemoChange({ type: memoType, value: memoValue.trim() });
    } else {
      onMemoChange(null);
    }
  }, [memoType, memoValue, onMemoChange]);

  // Initialize from existing memo
  useEffect(() => {
    if (memo) {
      setMemoType(memo.type);
      setMemoValue(memo.value);
    }
  }, [memo]);

  const handleMemoTypeChange = (value: string) => {
    const newMemoType = parseInt(value) as MemoType;
    setMemoType(newMemoType);
  };

  const handleMemoValueChange = (value: string) => {
    setMemoValue(value);
  };

  const clearMemo = () => {
    setMemoValue("");
    onMemoChange(null);
  };

  const getMemoTypeLabel = (type: MemoType): string => {
    switch (type) {
      case MemoType.MemoText:
        return "Text";
      case MemoType.MemoId:
        return "ID";
      case MemoType.MemoHash:
        return "Hash";
      case MemoType.MemoReturn:
        return "Return";
      default:
        return "Text";
    }
  };

  const getMemoPlaceholder = (type: MemoType): string => {
    switch (type) {
      case MemoType.MemoText:
        return "Enter memo text (max 28 characters)";
      case MemoType.MemoId:
        return "Enter memo ID (number)";
      case MemoType.MemoHash:
        return "Enter memo hash (32 bytes hex)";
      case MemoType.MemoReturn:
        return "Enter return hash (32 bytes hex)";
      default:
        return "Enter memo";
    }
  };

  const validateMemoValue = (type: MemoType, value: string): string | null => {
    if (!value.trim()) return null;

    switch (type) {
      case MemoType.MemoText:
        if (value.length > 28) return "Text memo must be 28 characters or less";
        break;
      case MemoType.MemoId:
        if (!/^\d+$/.test(value)) return "ID memo must be a number";
        if (BigInt(value) > BigInt("18446744073709551615"))
          return "ID memo too large";
        break;
      case MemoType.MemoHash:
      case MemoType.MemoReturn:
        if (!/^[0-9a-fA-F]{64}$/.test(value))
          return "Hash memo must be 64 hex characters";
        break;
    }
    return null;
  };

  const memoValidationError = validateMemoValue(memoType, memoValue);
  const showMemoRequired = memoRequired && !memoValue.trim();
  const showMemoValid = memoValue.trim() && !memoValidationError;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Memo Required Warning */}
      {memoRequired && (
        <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-400 mb-2">
            <AlertTriangle className="h-4 w-4" />
            <span className="font-medium">Memo Required</span>
            <Badge variant="secondary" className="text-xs">
              SEP-29
            </Badge>
          </div>
          <p className="text-sm text-yellow-700 dark:text-yellow-500">
            This destination address requires a memo. Transactions without a
            memo may be lost.
          </p>
          {isMuxedAddress(destinationAddress) && (
            <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
              Note: This is a muxed address (M...) which may have built-in
              routing.
            </p>
          )}
        </div>
      )}

      {/* Validation Error */}
      {validationError && (
        <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
          <div className="flex items-center gap-2 text-red-800 dark:text-red-400">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm font-medium">Validation Error</span>
          </div>
          <p className="text-sm text-red-700 dark:text-red-500 mt-1">
            {validationError}
          </p>
        </div>
      )}

      {/* Memo Input */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label htmlFor="memo-input" className="text-sm font-medium">
            Transaction Memo
            {memoRequired && <span className="text-red-500 ml-1">*</span>}
          </Label>
          {isValidating && (
            <Badge variant="secondary" className="text-xs">
              Validating...
            </Badge>
          )}
          {showMemoValid && (
            <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
              <CheckCircle className="h-3 w-3" />
              <span className="text-xs">Valid</span>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Select
            value={memoType.toString()}
            onValueChange={handleMemoTypeChange}
          >
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={MemoType.MemoText.toString()}>Text</SelectItem>
              <SelectItem value={MemoType.MemoId.toString()}>ID</SelectItem>
              <SelectItem value={MemoType.MemoHash.toString()}>Hash</SelectItem>
              <SelectItem value={MemoType.MemoReturn.toString()}>
                Return
              </SelectItem>
            </SelectContent>
          </Select>

          <div className="flex-1 relative">
            <Input
              id="memo-input"
              type="text"
              value={memoValue}
              onChange={(e) => handleMemoValueChange(e.target.value)}
              placeholder={getMemoPlaceholder(memoType)}
              className={cn(
                "pr-20",
                showMemoRequired && "border-yellow-300 focus:border-yellow-500",
                memoValidationError && "border-red-300 focus:border-red-500",
                showMemoValid && "border-green-300 focus:border-green-500"
              )}
            />
            {memoValue && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearMemo}
                className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
              >
                ×
              </Button>
            )}
          </div>
        </div>

        {/* Memo Type Info */}
        <div className="text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Info className="h-3 w-3" />
            <span>
              {getMemoTypeLabel(memoType)} memo
              {memoType === MemoType.MemoText && " (up to 28 characters)"}
              {memoType === MemoType.MemoId && " (numeric ID)"}
              {(memoType === MemoType.MemoHash ||
                memoType === MemoType.MemoReturn) &&
                " (32-byte hex)"}
            </span>
          </div>
        </div>

        {/* Validation Error for Memo Value */}
        {memoValidationError && (
          <div className="text-xs text-red-600 dark:text-red-400">
            {memoValidationError}
          </div>
        )}

        {/* Character/Length Counter */}
        {memoValue && (
          <div className="text-xs text-muted-foreground text-right">
            {memoType === MemoType.MemoText &&
              `${memoValue.length}/28 characters`}
            {memoType === MemoType.MemoId && `Value: ${memoValue}`}
            {(memoType === MemoType.MemoHash ||
              memoType === MemoType.MemoReturn) &&
              `${memoValue.length}/64 hex characters`}
          </div>
        )}
      </div>
    </div>
  );
}
