# ROZO Intents - Any chain. Any stablecoin. Seconds.

Intent-based USDC transfers across multiple chains including Ethereum, Base, Arbitrum, Optimism, Polygon, BSC (Binance Smart Chain), and Stellar. Supported chains are dynamically determined from the Intent Pay SDK's `supportedPayoutTokens` configuration.

## Features

- 🌐 **Multi-Chain Support**: Transfer stablecoins across Ethereum, Base, Arbitrum, Optimism, Polygon, BSC (Binance Smart Chain), Stellar, and more. All supported chains are determined by the Intent Pay SDK's `supportedPayoutTokens` configuration.
- 💰 **Any Stablecoin**: Support for USDC, USDT, DAI and other major stablecoins
- ⚡ **Seconds**: Lightning-fast transfers with intent-based technology
- 🔒 **Secure**: Native token burning and minting - no wrapped tokens
- 📱 **Mobile-Friendly**: Responsive design that works on all devices
- 🌙 **Dark Mode**: Beautiful dark theme by default
- ♿ **Accessible**: Full keyboard navigation and screen reader support
- 🔄 **Real-time Status**: Live tracking of intent transactions with detailed stepper UI

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **State Management**: Zustand
- **Wallet Integration**: wagmi v2 + viem
- **Supported Wallets**: WalletConnect v2, Coinbase Wallet, Browser Extensions
- **Bridge SDK**: @rozoai/intent-pay@latest
- **Notifications**: Sonner (toast notifications)

## Getting Started

**Available Endpoints:**

- Production: `https://intentapiv2.rozo.ai/`
- Development: `https://dev-api.rozo.ai/` (if available)
- Local: `http://localhost:8000/api/` (for local development)

**Note:** The `NEXT_PUBLIC_` prefix is required for environment variables used in client-side code.

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd rozo-intents-demo
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Run the development server**

   ```bash
   npm run dev
   ```

4. **Open your browser**

   Navigate to [http://localhost:3000](http://localhost:3000) to see the application.

## Usage

### Basic Bridge Flow

1. **Connect Wallet**: Click "Connect Wallet" and choose your preferred wallet
2. **Select Chains**: Choose source and destination chains from the dropdowns
3. **Enter Details**:
   - Amount of stablecoin to bridge
   - Recipient address on the destination chain
4. **Get Quote**: The app automatically fetches a quote when all fields are complete
5. **Review & Confirm**: Review the quote details including fees and estimated time
6. **Execute Bridge**:
   - Approve stablecoin spending (if needed)
   - Submit the bridge transaction
   - Track progress through the stepper UI

### Advanced Features

- **Slippage Control**: Adjust slippage tolerance in advanced settings
- **Saved Recipients**: Save frequently used addresses for quick access
- **Chain Switching**: Automatic prompts to switch to the correct network
- **Transaction Recovery**: Copy recovery data for support if needed
- **Real-time Status**: Live updates on bridge transaction progress

## Architecture

### State Management

- **Zustand Store** (`store/bridge.ts`): Manages all bridge-related state
- **Persistent Storage**: Form data and saved recipients persist across sessions
- **Real-time Updates**: Status polling for active bridge transactions

### SDK Integration

- **Intent Pay Adapter** (`lib/intentPay.ts`): Wrapper around @rozoai/intent-pay SDK
- **Mock Implementation**: Currently uses mock data for development
- **Easy Swapping**: Isolated adapter makes it easy to switch to real SDK calls

## Development

### Project Structure

```text
src/
├── app/                    # Next.js app router pages
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── Bridge.tsx        # Main bridge component
│   ├── ChainSelect.tsx   # Chain selection
│   ├── AmountInput.tsx   # Amount input
│   ├── AddressInput.tsx  # Address input
│   ├── QuoteCard.tsx     # Quote display
│   ├── BridgeStepper.tsx # Status tracking
│   └── WalletConnect.tsx # Wallet integration
├── lib/                  # Utility libraries
│   ├── chains.ts         # Chain configurations
│   ├── intentPay.ts      # Intent Pay SDK adapter
│   ├── wagmi.ts          # Wallet configuration
│   ├── validation.ts     # Form validation utilities
│   └── analytics.ts      # Event tracking
└── store/                # State management
    └── bridge.ts         # Zustand store
```

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript checks
```

### Customization

#### Adding New Chains

Supported chains are determined by the Intent Pay SDK's `supportedPayoutTokens` configuration from `@rozoai/intent-common`. To add support for a new chain:

1. Ensure the chain is included in the Intent Pay SDK's `supportedPayoutTokens`
2. Add chain configuration to `lib/chains.ts` (if needed for UI/logos)
3. Update the wagmi config in `lib/wagmi.ts` (if it's an EVM chain)
4. Add RPC URL environment variable (recommended for better performance)
5. Add chain logo/icon to the components if needed

#### Styling

- Uses Tailwind CSS with shadcn/ui components
- Dark mode enabled by default
- Customize colors in `tailwind.config.js`
- Component styles in individual component files

#### Analytics

- Event tracking built-in with `lib/analytics.ts`
- Tracks user interactions, errors, and transaction flows
- Easy to integrate with your analytics service

## Production Deployment

### Environment Setup

1. Set up production environment variables
2. Configure proper RPC endpoints (not public ones)
3. Set up analytics tracking
4. Configure error monitoring (Sentry, etc.)

### Performance Optimizations

- Server-side rendering with Next.js
- Automatic code splitting
- Image optimization
- Bundle analysis with `npm run analyze`

### Security Considerations

- All private keys handled by user's wallet
- No sensitive data stored in localStorage
- HTTPS required for WalletConnect
- Input validation and sanitization

## Troubleshooting

### Common Issues

1. **WalletConnect not working**

   - Ensure `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` is set
   - Check that the project ID is valid

2. **RPC errors**

   - Verify RPC URLs are correct and have sufficient rate limits
   - Consider using dedicated RPC providers for production

3. **Transaction failures**
   - Check network connectivity
   - Ensure sufficient gas and token balances
   - Verify contract addresses are correct

### Getting Help

- Check the [Intent Pay documentation](https://github.com/RozoAI/intent-pay)
- Open an issue on GitHub
- Contact support through the app

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please read our contributing guidelines and submit pull requests to the main branch.

---

Built with ❤️ using Intent Pay SDK
