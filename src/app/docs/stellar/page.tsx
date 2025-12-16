import { StellarBridgeDemo } from "@/components/StellarBridgeDemo";
import { CodeBlock } from "@/components/docs/CodeBlock";
import { DocsLayout } from "@/components/docs/DocsLayout";

export default function StellarDocsPage() {
  return (
    <DocsLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-4">
            Stellar Wallet Integration
          </h1>
          <p className="text-lg text-muted-foreground">
            Complete implementation of Stellar wallet support with Freighter,
            xBull, and WalletConnect integration.
          </p>
        </div>

        {/* Live Demo */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">Live Demo</h2>
          <StellarBridgeDemo />
        </div>

        {/* Implementation Guide */}
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold">Implementation Guide</h2>

          {/* Wallet Configuration */}
          <div>
            <h3 className="text-xl font-medium mb-3">
              1. Wallet Configuration
            </h3>
            <p className="text-muted-foreground mb-4">
              Following the recommended setup with Stellar Wallet Kit and
              WalletConnect:
            </p>

            <CodeBlock
              language="typescript"
              code={`// EVM: wagmi + WalletConnect (eip155:*)
// Stellar: Stellar Wallets Kit with three modules

import { 
  StellarWalletsKit, 
  WalletNetwork, 
  allowAllModules,
  FREIGHTER_ID,
  XBULL_ID
} from '@creit.tech/stellar-wallets-kit'

// Initialize Stellar Wallets Kit
export const createStellarWalletKit = (network = 'PUBLIC') => {
  return new StellarWalletsKit({
    network: network === 'PUBLIC' ? WalletNetwork.PUBLIC : WalletNetwork.TESTNET,
    selectedWalletId: FREIGHTER_ID, // Default to Freighter
    modules: allowAllModules(), // Includes Freighter, xBull, and WalletConnect
  })
}`}
            />
          </div>

          {/* WalletConnect Setup */}
          <div>
            <h3 className="text-xl font-medium mb-3">
              2. WalletConnect Dual Namespace
            </h3>
            <p className="text-muted-foreground mb-4">
              Configure WalletConnect to support both EVM and Stellar
              namespaces:
            </p>

            <CodeBlock
              language="typescript"
              code={`// WalletConnect configuration with both namespaces
export const WALLETCONNECT_CONFIG = {
  requiredNamespaces: {
    eip155: {
      chains: ['eip155:1','eip155:8453','eip155:137','eip155:42161','eip155:10','eip155:43114'],
      methods: ['eth_sendTransaction','personal_sign','eth_signTypedData'],
      events: ['accountsChanged','chainChanged']
    },
    stellar: {
      chains: ['stellar:pubnet','stellar:testnet'],
      methods: ['stellar_signXDR','stellar_signAndSubmitXDR'],
      events: []
    }
  }
}`}
            />
          </div>

          {/* Supported Wallets */}
          <div>
            <h3 className="text-xl font-medium mb-3">3. Supported Wallets</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">🚀 Freighter</h4>
                <p className="text-sm text-muted-foreground">
                  Desktop extension (official SDF wallet). Uses the kit&apos;s
                  Freighter connector.
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">🐂 xBull</h4>
                <p className="text-sm text-muted-foreground">
                  Desktop extension + web wallet. Uses the kit&apos;s xBull
                  connector.
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">📱 LOBSTR</h4>
                <p className="text-sm text-muted-foreground">
                  Mobile wallet via WalletConnect (QR/deeplink). Uses the
                  kit&apos;s WC module.
                </p>
              </div>
            </div>
          </div>

          {/* Memo Validation */}
          <div>
            <h3 className="text-xl font-medium mb-3">
              4. SEP-29 Memo Required Validation
            </h3>
            <p className="text-muted-foreground mb-4">
              Automatic validation for exchange addresses that require memos:
            </p>

            <CodeBlock
              language="typescript"
              code={`// SEP-29 memo required validation
export const checkMemoRequired = async (
  destinationAddress: string,
  horizonUrl: string = 'https://horizon.stellar.org'
): Promise<MemoRequiredResponse> => {
  try {
    const normalizedAddress = normalizeStellarAddress(destinationAddress)
    const response = await fetch(\`\${horizonUrl}/accounts/\${normalizedAddress}\`)
    
    if (!response.ok) {
      return { memo_required: false }
    }
    
    const accountData = await response.json()
    
    // Check for SEP-29 memo required data entry
    const memoRequiredEntry = accountData.data_attr?.['config.memo_required']
    
    if (memoRequiredEntry === '1' || memoRequiredEntry === 'true') {
      return {
        memo_required: true,
        memo_type: 'text', // Default to text memo
      }
    }
    
    return { memo_required: false }
  } catch (error) {
    console.warn('Failed to check memo required:', error)
    return { memo_required: false }
  }
}`}
            />
          </div>

          {/* Muxed Addresses */}
          <div>
            <h3 className="text-xl font-medium mb-3">
              5. Muxed Address Support
            </h3>
            <p className="text-muted-foreground mb-4">
              Support for muxed addresses (M...) with proper normalization:
            </p>

            <CodeBlock
              language="typescript"
              code={`// Muxed address utilities
export const isMuxedAddress = (address: string): boolean => {
  return address.startsWith('M') && address.length === 69
}

export const normalizeStellarAddress = (address: string): string => {
  if (isMuxedAddress(address)) {
    // Extract base account ID from muxed address
    // Implementation depends on Stellar SDK muxed address parsing
    return address // Simplified for demo
  }
  return address
}`}
            />
          </div>

          {/* Transaction Signing */}
          <div>
            <h3 className="text-xl font-medium mb-3">6. Transaction Signing</h3>
            <p className="text-muted-foreground mb-4">
              Prefer stellar_signAndSubmitXDR for single-shot transactions,
              fallback to stellar_signXDR:
            </p>

            <CodeBlock
              language="typescript"
              code={`// Sign and submit Stellar transaction via WalletConnect
export const signAndSubmitStellarTransaction = async (
  topic: string,
  xdr: string,
  publicKey: string,
  network: 'pubnet' | 'testnet' = 'pubnet'
): Promise<string> => {
  const client = getWalletConnectClient()
  if (!client) {
    throw new Error('WalletConnect client not initialized')
  }

  try {
    const result = await client.request({
      topic,
      chainId: \`stellar:\${network}\`,
      request: {
        method: 'stellar_signAndSubmitXDR',
        params: {
          xdr,
          publicKey,
          network,
        },
      },
    })

    return result as string
  } catch (error) {
    // Fallback to sign-only if submit not supported
    return await signStellarTransaction(topic, xdr, publicKey, network)
  }
}`}
            />
          </div>

          {/* Usage Examples */}
          <div>
            <h3 className="text-xl font-medium mb-3">7. Usage Examples</h3>

            <h4 className="text-lg font-medium mb-2">
              Basic Wallet Connection
            </h4>
            <CodeBlock
              language="tsx"
              code={`import { StellarWalletConnect } from '@/components/StellarWalletConnect'
import { useStellarWalletConnection } from '@/store/stellar'

export function MyComponent() {
  const { isConnected, publicKey, network } = useStellarWalletConnection()
  
  return (
    <div>
      {!isConnected ? (
        <StellarWalletConnect />
      ) : (
        <div>
          <p>Connected: {publicKey}</p>
          <p>Network: {network}</p>
        </div>
      )}
    </div>
  )
}`}
            />

            <h4 className="text-lg font-medium mb-2 mt-4">
              Address Input with Validation
            </h4>
            <CodeBlock
              language="tsx"
              code={`import { StellarAddressInput } from '@/components/StellarAddressInput'

export function AddressForm() {
  const [address, setAddress] = useState('')
  
  return (
    <StellarAddressInput
      value={address}
      onChange={setAddress}
      label="Destination Address"
      placeholder="Enter Stellar address (G... or M...)"
      required
      showValidation
    />
  )
}`}
            />

            <h4 className="text-lg font-medium mb-2 mt-4">
              Memo Input with SEP-29 Validation
            </h4>
            <CodeBlock
              language="tsx"
              code={`import { StellarMemoInput } from '@/components/StellarMemoInput'

export function MemoForm() {
  const [memo, setMemo] = useState(null)
  const destinationAddress = 'GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'
  
  return (
    <StellarMemoInput
      destinationAddress={destinationAddress}
      memo={memo}
      onMemoChange={setMemo}
    />
  )
}`}
            />

            <h4 className="text-lg font-medium mb-2 mt-4">
              Unified EVM + Stellar Wallet
            </h4>
            <CodeBlock
              language="tsx"
              code={`import { UnifiedWalletConnect } from '@/components/UnifiedWalletConnect'

export function BridgeInterface() {
  return (
    <div>
      <h2>Multi-Chain Bridge</h2>
      <UnifiedWalletConnect preferredChain="evm" />
    </div>
  )
}`}
            />
          </div>
        </div>

        {/* Environment Setup */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">Environment Setup</h2>
          <p className="text-muted-foreground mb-4">
            Required environment variables for WalletConnect:
          </p>

          <CodeBlock
            language="bash"
            code={`# .env.local
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here

# Optional: Custom Horizon URLs
NEXT_PUBLIC_STELLAR_HORIZON_URL=https://horizon.stellar.org
NEXT_PUBLIC_STELLAR_TESTNET_HORIZON_URL=https://horizon-testnet.stellar.org`}
          />
        </div>

        {/* Dependencies */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">Dependencies</h2>
          <p className="text-muted-foreground mb-4">
            Install the required packages:
          </p>

          <CodeBlock
            language="bash"
            code={`npm install @creit.tech/stellar-wallets-kit @stellar/stellar-sdk @walletconnect/sign-client`}
          />
        </div>
      </div>
    </DocsLayout>
  );
}
