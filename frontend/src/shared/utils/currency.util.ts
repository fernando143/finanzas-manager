/**
 * Configuración de formateo para moneda argentina
 */
export const ARS_CURRENCY_CONFIG = {
  locale: 'es-AR',
  currency: 'ARS',
  options: {
    style: 'currency' as const,
    currency: 'ARS',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }
}

/**
 * Formatea un número como currency ARS
 * @param amount - Número a formatear
 * @returns String formateado como ARS (ej: "$ 1.234,56")
 */
export const formatCurrencyARS = (amount: number): string => {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return formatCurrencyARS(0)
  }
  
  return new Intl.NumberFormat(ARS_CURRENCY_CONFIG.locale, ARS_CURRENCY_CONFIG.options)
    .format(amount)
}

/**
 * Parse string currency a número
 * @param currencyString - String con formato currency
 * @returns Número parseado
 */
export const parseCurrencyARS = (currencyString: string): number => {
  if (!currencyString) return 0
  
  // Remover símbolos de currency y caracteres no numéricos excepto , y .
  const cleanString = currencyString
    .replace(/[^\d,.-]/g, '') // Remover todo excepto dígitos, comas, puntos y guiones
    .replace(/\./g, '') // Remover separadores de miles (puntos)
    .replace(',', '.') // Convertir coma decimal a punto decimal
  
  return parseFloat(cleanString) || 0
}

/**
 * Valida si un string tiene formato currency válido
 */
export const isValidCurrencyInput = (input: string): boolean => {
  const currencyRegex = /^[$ ]?[\d]{1,3}(\.?\d{3})*(,\d{0,2})?$/
  return currencyRegex.test(input.trim())
}