/**
 * Format currency with Indian Rupee symbol
 */
export const formatCurrency = (amount: number | string): string => {
  const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(numAmount)) return "₹0";
  
  // Format with Indian number system (lakhs, crores)
  if (numAmount >= 10000000) {
    // Crores
    return `₹${(numAmount / 10000000).toFixed(2)}Cr`;
  } else if (numAmount >= 100000) {
    // Lakhs
    return `₹${(numAmount / 100000).toFixed(2)}L`;
  } else if (numAmount >= 1000) {
    // Thousands
    return `₹${(numAmount / 1000).toFixed(1)}K`;
  }
  
  return `₹${numAmount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
};

/**
 * Format currency with unit (e.g., ₹100/kg)
 */
export const formatCurrencyWithUnit = (amount: number | string, unit: string = ""): string => {
  const formatted = formatCurrency(amount);
  return unit ? `${formatted}/${unit}` : formatted;
};

