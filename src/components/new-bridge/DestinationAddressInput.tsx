"use client";

import { cn } from "@/lib/utils";
import {
  arbitrum,
  base,
  bsc,
  ethereum,
  polygon,
  rozoSolana,
  rozoStellar,
  validateAddressForChain,
} from "@rozoai/intent-common";
import { useEffect } from "react";
import {
  Arbitrum,
  Base,
  BinanceSmartChain,
  Ethereum,
  Polygon,
  Solana,
  Stellar,
} from "../icons/chains";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "../ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupTextarea,
} from "../ui/input-group";

interface DestinationAddressInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  onErrorChange?: (error: string) => void;
  chainId?: number;
}

const chainToLogo = {
  [arbitrum.chainId]: <Arbitrum width={20} height={20} />,
  [base.chainId]: <Base width={20} height={20} />,
  [bsc.chainId]: <BinanceSmartChain width={20} height={20} />,
  [ethereum.chainId]: (
    <Ethereum width={20} height={20} className="rounded-full" />
  ),
  [polygon.chainId]: <Polygon width={20} height={20} />,
  [rozoSolana.chainId]: <Solana width={20} height={20} />,
  [rozoStellar.chainId]: (
    <Stellar width={20} height={20} className="rounded-full" />
  ),
};

export function DestinationAddressInput({
  value,
  onChange,
  error,
  onErrorChange,
  chainId,
}: DestinationAddressInputProps) {
  const handleChange = (inputValue: string) => {
    onChange(inputValue);

    if (inputValue.trim() === "") {
      onErrorChange?.("");
      return;
    }
  };

  const handleBlur = () => {
    try {
      if (value.trim() === "") {
        onErrorChange?.("");
        return;
      }

      const validation = validateAddressForChain(Number(chainId), value);
      if (!validation) {
        onErrorChange?.("Invalid address");
      } else {
        onErrorChange?.("");
      }
    } catch {
      onErrorChange?.("Invalid address");
    }
  };

  useEffect(() => {
    handleBlur();
  }, [chainId, error]);

  return (
    <FieldSet>
      <FieldGroup>
        <Field>
          <InputGroup
            className={cn(
              "rounded-xl bg-background",
              error
                ? "border-red-500 focus-visible:border-red-500 dark:border-red-500 dark:focus-visible:border-red-500"
                : ""
            )}
          >
            <InputGroupTextarea
              id="stellar-address"
              placeholder="Enter your address"
              value={value}
              onChange={(e) => handleChange(e.target.value)}
              onBlur={handleBlur}
              rows={2}
              className={`resize-none`}
              style={{ fontSize: "16px" }} // Prevent iOS zoom
            />

            <InputGroupAddon align="block-start" className="border-b">
              {chainToLogo[chainId as keyof typeof chainToLogo] || <></>}
              <FieldLabel
                htmlFor="feedback"
                className="text-neutral-500 dark:text-neutral-400 text-xs sm:text-sm"
              >
                Destination Address{" "}
                <span className="text-red-500 dark:text-red-400">*</span>
              </FieldLabel>
            </InputGroupAddon>
          </InputGroup>
          {error && (
            <FieldDescription>
              <p className="text-xs text-red-500 dark:text-red-400 wrap-break-word">
                {error}
              </p>
            </FieldDescription>
          )}
        </Field>
      </FieldGroup>
    </FieldSet>
  );
}
