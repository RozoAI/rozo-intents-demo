# BridgeProvider Usage Example

Here's how to use the BridgeProvider in your application:

## 1. Wrap your app with BridgeProvider

```tsx
import { BridgeProvider } from '@/components/new-bridge/providers/BridgeProvider';

function App() {
  return (
    <BridgeProvider>
      <YourBridgeComponent />
    </BridgeProvider>
  );
}
```

## 2. Use the dedicated hooks

```tsx
import { useSourceSelector, useDestinationSelector } from './providers/hooks';

function BridgeComponent() {
  const sourceSelector = useSourceSelector();
  const destinationSelector = useDestinationSelector();

  return (
    <div>
      {/* Source selector */}
      <TokenSelectorTrigger 
        selectedChain={sourceSelector.selectedChain}
        selectedToken={sourceSelector.selectedToken}
        onSelectChain={sourceSelector.onSelectChain}
        onSelectToken={sourceSelector.onSelectToken}
        availableChains={sourceSelector.availableChains}
        availableTokens={sourceSelector.availableTokens}
      />

      {/* Destination selector */}
      <TokenSelectorTrigger 
        selectedChain={destinationSelector.selectedChain}
        selectedToken={destinationSelector.selectedToken}
        onSelectChain={destinationSelector.onSelectChain}
        onSelectToken={destinationSelector.onSelectToken}
        availableChains={destinationSelector.availableChains}
        availableTokens={destinationSelector.availableTokens}
      />
    </div>
  );
}
```

## 3. Or use the main hook directly

```tsx
import { useBridge } from './providers/BridgeProvider';

function BridgeComponent() {
  const {
    sourceChain,
    sourceToken,
    destinationChain,
    destinationToken,
    availableSourceChains,
    availableDestinationChains,
    setSourceChain,
    setDestinationChain,
    swapSourceAndDestination,
    resetSelection,
  } = useBridge();

  // Your component logic here
}
```

## Features

- **Any-to-any chains**: Support bridging between any supported chains
- **Automatic filtering**: Prevents selecting the same chain for source and destination
- **Smart defaults**: Automatically selects the first available token when a chain is selected
- **Type safety**: Full TypeScript support
- **Easy to use**: Simple hooks for common operations

## Available Chains and Tokens

The provider automatically gets available chains and tokens from the `@rozoai/intent-common` package's `supportedTokens` map.