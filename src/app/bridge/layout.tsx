import { PoweredBy } from "@/components/PoweredBy";
import { Providers } from "@/components/Providers";
import { RewardsBadge } from "@/components/RewardsBadge";
import { StellarWalletConnect } from "@/components/StellarWalletConnect";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { StellarWalletProvider } from "@/contexts/StellarWalletContext";
import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "ROZO Intents - Stellar",
  description:
    "Transfer USDC between Stellar and other chains with fast, secure, and gasless transactions",
};

const ScfLogo = ({ className }: { className: string }) => {
  return (
    <svg viewBox="0 0 337 436" fill="currentColor" className={className}>
      <g clipPath="url(#clip0_2_12)">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M337 71.6327V100.782C333.282 102.663 329.571 104.557 325.844 106.419C320.288 109.197 316.042 113.233 313.473 118.973C312.009 122.243 311.035 125.615 311.026 129.207C311.019 131.702 311.092 134.201 311.255 136.691C311.741 144.124 311.334 151.531 310.546 158.915C309.819 165.716 308.537 172.428 306.802 179.05C304.428 188.113 301.211 196.865 297.116 205.29C291.973 215.868 285.634 225.676 278.076 234.693C274.117 239.419 269.89 243.891 265.312 248.016C264.329 248.901 264.02 249.728 264.193 251.007C264.729 254.971 265.165 258.947 265.606 262.924C266.027 266.732 266.4 270.544 266.805 274.353C267.245 278.505 267.702 282.656 268.145 286.807C268.55 290.616 268.941 294.427 269.345 298.235C269.716 301.726 270.104 305.213 270.468 308.704C270.851 312.37 271.203 316.04 271.593 319.708C272.05 323.999 272.544 328.288 273.002 332.581C273.459 336.877 273.881 341.177 274.336 345.474C274.795 349.799 275.288 354.121 275.739 358.449C276.192 362.782 276.591 367.12 277.053 371.451C277.574 376.337 278.16 381.214 278.682 386.1C279.442 393.227 280.162 400.359 280.908 407.487C281.574 413.848 282.246 420.209 282.931 426.567C283.269 429.714 283.645 432.855 284.004 436H283.369C283.145 435.865 282.936 435.681 282.693 435.603C280.823 435.004 278.914 434.512 277.078 433.826C272.647 432.172 268.249 430.432 263.838 428.723C253.611 424.761 243.387 420.792 233.159 416.834C223.452 413.077 213.743 409.33 204.034 405.578C194.654 401.954 185.271 398.342 175.9 394.695C175.015 394.349 174.259 394.356 173.385 394.731C171.582 395.503 169.733 396.168 167.903 396.875C159.013 400.306 150.121 403.73 141.234 407.167C130.35 411.377 119.473 415.605 108.589 419.815C96.7301 424.403 84.8674 428.982 73.0056 433.561C71.863 434.002 70.7133 434.425 69.5627 434.844C68.484 435.237 67.3994 435.615 66.3178 436H65.6834C66.0426 432.855 66.4179 429.713 66.757 426.566C67.4464 420.173 68.1138 413.775 68.7952 407.379C69.6657 399.203 70.5422 391.026 71.4157 382.85C72.2482 375.056 73.0867 367.263 73.9111 359.469C74.7096 351.92 75.487 344.369 76.2865 336.821C77.245 327.77 78.2256 318.721 79.1831 309.669C79.9886 302.052 80.765 294.431 81.5735 286.812C82.3109 279.857 83.0774 272.905 83.8218 265.952C84.0679 263.645 84.297 261.336 84.5072 259.027C84.5532 258.512 84.6933 258.306 85.2536 258.119C86.3352 257.757 87.3468 257.176 88.3714 256.652C95.7996 252.858 103.219 249.049 110.662 245.285C111.003 245.112 111.62 245.203 111.984 245.4C118.739 249.074 125.764 252.097 133.094 254.43C140.36 256.741 147.786 258.302 155.348 259.179C162.525 260.01 169.74 260.153 176.938 259.602C190.39 258.574 203.322 255.395 215.685 249.934C225.66 245.528 234.864 239.875 243.233 232.905C255.478 222.708 265.264 210.509 272.556 196.32C277.812 186.092 281.489 175.32 283.543 164.018C285.093 155.494 285.836 146.885 285.299 138.209C285.095 134.915 284.774 131.629 284.499 128.34C284.486 128.173 284.415 128.011 284.349 127.761C189.588 175.997 94.8801 224.208 0.0230372 272.494V271.394C0.0230372 262.382 0.0340435 253.369 0.00400101 244.358C0.00400101 243.572 0.264175 243.199 0.951566 242.849C52.662 216.554 104.362 190.238 156.065 163.926L214.856 134.022C224.654 129.036 234.45 124.048 244.244 119.055C262.24 109.879 280.197 100.623 298.186 91.4326C310.777 84.9998 323.394 78.618 335.998 72.2102C336.342 72.036 336.667 71.8258 337 71.6327ZM239.75 267.024C197.12 289.925 153.703 291.928 109.185 273.146C104.822 314.317 100.459 355.473 96.0848 396.75C96.534 396.585 96.8292 396.482 97.1203 396.369C106.69 392.68 116.261 388.992 125.83 385.297C141.719 379.16 157.61 373.029 173.485 366.855C174.455 366.478 175.242 366.538 176.172 366.9C188.045 371.53 199.929 376.134 211.814 380.732C223.672 385.322 235.537 389.901 247.399 394.484C249.42 395.264 251.443 396.037 253.562 396.852C248.946 353.457 244.345 310.212 239.75 267.024ZM177.065 0.28237C204.482 2.06599 229.419 10.872 251.82 26.8124C251.986 26.9305 252.145 27.0566 252.398 27.2488C252.025 27.459 251.735 27.6372 251.434 27.7903C243.174 31.9981 234.907 36.1959 226.655 40.4218C225.996 40.7601 225.495 40.8021 224.819 40.4308C213.837 34.3983 202.172 30.2515 189.856 27.9905C180.131 26.2039 170.326 25.6504 160.446 26.355C146.538 27.3479 133.225 30.6819 120.522 36.4111C107.203 42.4176 95.3964 50.626 85.1685 61.0665C71.8379 74.6738 62.3746 90.6003 56.7614 108.809C54.5711 115.911 53.1743 123.175 52.3488 130.557C51.4613 138.493 51.4964 146.432 52.1888 154.375C52.2978 155.628 52.4889 156.873 52.655 158.22C53.0562 158.032 53.4024 157.882 53.7386 157.711C79.5303 144.589 105.332 131.488 131.108 118.337C161.016 103.078 190.89 87.7527 220.798 72.4958C259.361 52.825 297.945 33.1942 336.52 13.5474C336.676 13.4683 336.84 13.4053 337 13.3342V42.4836C313.623 54.3824 290.244 66.2782 266.867 78.179C241.372 91.1578 215.87 104.128 190.384 117.126C127.305 149.301 64.2316 181.491 1.15568 213.673C0.821492 213.843 0.476295 213.992 0.0230372 214.204V213.057C0.0230372 204.08 0.0370452 195.103 0 186.126C0 185.287 0.27418 184.904 0.999593 184.54C4.92583 182.577 8.9171 180.717 12.7073 178.513C21.5583 173.364 26.0359 165.567 25.9958 155.299C25.9788 150.868 25.5596 146.436 25.6066 142.007C25.8998 114.56 33.249 89.1519 48.0614 66.016C63.6043 41.739 84.6673 23.8237 110.992 12.1151C122.246 7.10956 133.987 3.70447 146.144 1.77773C156.39 0.153253 166.707 -0.39124 177.065 0.28237Z"
        />
      </g>
      <defs>
        <clipPath id="clip0_2_12">
          <rect width="337" height="436" />
        </clipPath>
      </defs>
    </svg>
  );
};

export default function NewPageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <StellarWalletProvider>
      <Providers>
        <div className="min-h-screen flex flex-col p-4 sm:p-8">
          {/* Header */}
          <div className="container mx-auto flex items-start justify-between h-min mb-8">
            <div className="flex items-center gap-2">
              <Image
                src="/rozo-logo.png"
                alt="Rozo Logo"
                width={28}
                height={28}
                className="rounded-md"
              />
              <span className="text-2xl font-bold">ROZO</span>
            </div>

            <div className="flex items-center gap-2">
              <ThemeSwitcher />
              <RewardsBadge />
              <StellarWalletConnect />
            </div>
          </div>

          <div className="mx-auto mb-4 flex w-fit max-w-xl items-center justify-center gap-2 rounded-lg">
            {children}
          </div>

          {/* Footer - Fixed at Bottom */}
          <div className="container mx-auto w-full mt-auto">
            <div className="flex flex-col md:flex-row items-center md:justify-between gap-4 py-6">
              <div className="flex flex-col md:flex-row items-center gap-4">
                <div className="flex flex-row items-center gap-4">
                  <div className="flex">
                    <a
                      href="https://x.com/StellarOrg/status/2001332873937457395"
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Stellar Community Fund"
                      className="group relative"
                    >
                      <ScfLogo className="h-4 h-4 w-auto transition-opacity group-hover:opacity-80" />
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-neutral-800 dark:bg-neutral-200 text-white dark:text-neutral-900 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
                        Stellar Community Fund
                      </div>
                    </a>
                  </div>
                  <div className="flex">
                    <a
                      href="https://www.coinbase.com/developer-platform/discover/launches/summer-builder-grants"
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Base - Coinbase's L2 Network"
                      className="group relative"
                    >
                      <img
                        src="/base.svg"
                        alt="Base"
                        className="h-4 w-auto transition-opacity group-hover:opacity-80"
                      />
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-neutral-800 dark:bg-neutral-200 text-white dark:text-neutral-900 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
                        Base - Coinbase&apos;s L2 Network
                      </div>
                    </a>
                  </div>
                  <div className="flex">
                    <a
                      href="https://x.com/draper_u/status/1940908242412183926"
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Draper University - Entrepreneurship Program"
                      className="group relative"
                    >
                      <img
                        src="/draper.webp"
                        alt="Draper University"
                        className="h-4 w-auto transition-opacity group-hover:opacity-80"
                      />
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-neutral-800 dark:bg-neutral-200 text-white dark:text-neutral-900 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
                        Draper University - Entrepreneurship Program
                      </div>
                    </a>
                  </div>
                  <div className="flex">
                    <a
                      href="https://partners.circle.com/partner/rozo"
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Circle - USDC Issuer & Partner"
                      className="group relative"
                    >
                      <img
                        src="/circle.svg"
                        alt="Circle"
                        className="h-4 w-auto transition-opacity group-hover:opacity-80"
                      />
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-neutral-800 dark:bg-neutral-200 text-white dark:text-neutral-900 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
                        Circle - USDC Issuer & Partner
                      </div>
                    </a>
                  </div>
                  <a
                    href="https://discord.com/invite/EfWejgTbuU"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <svg
                      className="h-4 w-4"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419-.019 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1568 2.4189Z" />
                    </svg>
                  </a>
                  <a
                    href="https://x.com/rozoai"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <svg
                      className="size-4"
                      xmlns="http://www.w3.org/2000/svg"
                      width="1em"
                      height="1em"
                      viewBox="0 0 24 24"
                    >
                      <path
                        fill="currentColor"
                        d="M10.488 14.651L15.25 21h7l-7.858-10.478L20.93 3h-2.65l-5.117 5.886L8.75 3h-7l7.51 10.015L2.32 21h2.65zM16.25 19L5.75 5h2l10.5 14z"
                      ></path>
                    </svg>
                  </a>
                </div>

                <div className="flex flex-row items-center gap-4">
                  <Link
                    href="/faq"
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    FAQs
                  </Link>

                  <Link
                    href="https://docs.rozo.ai"
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Docs
                  </Link>

                  <Link
                    href="/terms"
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Terms of Service
                  </Link>
                </div>
              </div>

              <PoweredBy />
            </div>
          </div>
        </div>
      </Providers>
    </StellarWalletProvider>
  );
}
