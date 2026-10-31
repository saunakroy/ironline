export const formatUsd = (amount: number) =>
  amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
