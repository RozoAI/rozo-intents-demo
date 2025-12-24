import { ArrowUpDown } from "lucide-react";

interface BridgeSwapButtonProps {
  isSwitched: boolean;
  onSwitch: () => void;
}

export function BridgeSwapButton({
  isSwitched,
  onSwitch,
}: BridgeSwapButtonProps) {
  return (
    <div className="flex justify-center -my-3 relative z-10">
      <button
        onClick={onSwitch}
        className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:hover:bg-neutral-200 transition-all duration-300 flex items-center justify-center shadow-lg border border-neutral-300 dark:border-neutral-600 group cursor-pointer"
      >
        <ArrowUpDown
          className={`size-4 sm:size-5 text-neutral-100 dark:text-neutral-900 transition-transform duration-300 ${
            isSwitched ? "rotate-180" : "rotate-0"
          }`}
        />
      </button>
    </div>
  );
}
