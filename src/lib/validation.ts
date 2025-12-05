import { isAddress, getAddress } from 'viem'
import { type Address } from 'viem'

/**
 * Validates a Solana address (basic validation)
 */
function isSolanaAddress(address: string): boolean {
  // Solana addresses are base58 encoded and typically 32-44 characters
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
  return base58Regex.test(address);
}

/**
 * Validates an Ethereum address with EIP-55 checksum
 */
export function validateAddress(address: string, chainId?: number): { isValid: boolean; checksumAddress?: Address; error?: string } {
  if (!address) {
    return { isValid: false, error: 'Address is required' }
  }

  // Check if it's a Solana chain (chainId 900 or 901)
  if (chainId === 900 || chainId === 901) {
    if (isSolanaAddress(address)) {
      return { isValid: true }
    }
    return { isValid: false, error: 'Invalid Solana address format' }
  }

  // Default to EVM address validation
  if (!isAddress(address)) {
    return { isValid: false, error: 'Invalid Ethereum address format' }
  }

  try {
    const checksumAddress = getAddress(address)
    return { isValid: true, checksumAddress }
  } catch {
    return { isValid: false, error: 'Invalid address checksum' }
  }
}

/**
 * Validates bridge amount
 */
export function validateAmount(
  amount: string,
  balance?: string,
  minAmount?: string
): { isValid: boolean; error?: string } {
  if (!amount || amount === '0') {
    return { isValid: false, error: 'Amount must be greater than 0' }
  }

  const numAmount = parseFloat(amount)
  
  if (isNaN(numAmount) || numAmount <= 0) {
    return { isValid: false, error: 'Invalid amount' }
  }

  if (minAmount && numAmount < parseFloat(minAmount)) {
    return { isValid: false, error: `Minimum amount is ${minAmount}` }
  }

  if (balance && numAmount > parseFloat(balance)) {
    return { isValid: false, error: 'Insufficient balance' }
  }

  return { isValid: true }
}

/**
 * Validates slippage percentage
 */
export function validateSlippage(slippage: number): { isValid: boolean; error?: string } {
  if (slippage < 0.1 || slippage > 5.0) {
    return { isValid: false, error: 'Slippage must be between 0.1% and 5.0%' }
  }

  return { isValid: true }
}

/**
 * Validates that from and to chains are different
 */
export function validateChainSelection(fromChainId?: number | null, toChainId?: number | null): { isValid: boolean; error?: string } {
  if (!fromChainId || !toChainId) {
    return { isValid: false, error: 'Please select both source and destination chains' }
  }

  if (fromChainId === toChainId) {
    return { isValid: false, error: 'Source and destination chains must be different' }
  }

  return { isValid: true }
}

/**
 * Auto-detects and formats pasted addresses
 */
export function formatPastedAddress(input: string): string {
  // Remove whitespace and common prefixes
  const cleaned = input.trim()
  
  // Handle ENS names (keep as-is for now)
  if (cleaned.endsWith('.eth')) {
    return cleaned.toLowerCase()
  }
  
  // Handle Ethereum addresses
  if (cleaned.startsWith('0x')) {
    return cleaned
  }
  
  // If it looks like a hex string without 0x, add it
  if (/^[a-fA-F0-9]{40}$/.test(cleaned)) {
    return `0x${cleaned}`
  }
  
  return cleaned
}

/**
 * Formats token amounts for display
 */
export function formatTokenAmount(amount: string | number, decimals: number = 6): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  
  if (isNaN(num)) return '0'
  
  // For very small amounts, show more decimals
  if (num < 0.01) {
    return num.toFixed(decimals)
  }
  
  // For normal amounts, show fewer decimals
  if (num < 1000) {
    return num.toFixed(Math.min(decimals, 4))
  }
  
  // For large amounts, use compact notation
  if (num >= 1000000) {
    return (num / 1000000).toFixed(2) + 'M'
  }
  
  if (num >= 1000) {
    return (num / 1000).toFixed(2) + 'K'
  }
  
  return num.toFixed(2)
}

/**
 * Formats USD amounts for display
 */
export function formatUsdAmount(amount: string | number): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  
  if (isNaN(num)) return '$0.00'
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  }).format(num)
}

/**
 * Formats time duration for display
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`
  }
  
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) {
    return `${minutes}m`
  }
  
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  
  if (hours < 24) {
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
  }
  
  const days = Math.floor(hours / 24)
  const remainingHours = hours % 24
  
  return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`
}
