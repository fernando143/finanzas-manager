import { useState, useCallback } from 'react'
import { formatCurrencyARS, parseCurrencyARS } from '../utils/currency.util'

interface UseCurrencyInputOptions {
  initialValue?: number
  onChange?: (value: number) => void
  maxDigits?: number
}

interface UseCurrencyInputReturn {
  displayValue: string
  numericValue: number
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleBlur: () => void
  handleFocus: () => void
  setValue: (value: number) => void
  isEditing: boolean
}

/**
 * Hook para manejar inputs de currency con masking automático
 */
export const useCurrencyInput = ({
  initialValue = 0,
  onChange,
  maxDigits = 10
}: UseCurrencyInputOptions = {}): UseCurrencyInputReturn => {
  const [numericValue, setNumericValue] = useState<number>(initialValue)
  const [displayValue, setDisplayValue] = useState<string>(
    initialValue > 0 ? formatCurrencyARS(initialValue) : ''
  )
  const [isEditing, setIsEditing] = useState<boolean>(false)

  const setValue = useCallback((value: number) => {
    setNumericValue(value)
    setDisplayValue(value > 0 ? formatCurrencyARS(value) : '')
    onChange?.(value)
  }, [onChange])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    setDisplayValue(inputValue)

    // Parse numeric value for real-time validation
    const parsed = parseCurrencyARS(inputValue)
    if (!isNaN(parsed) && parsed.toString().length <= maxDigits) {
      setNumericValue(parsed)
    }
  }, [maxDigits])

  const handleBlur = useCallback(() => {
    setIsEditing(false)
    const parsed = parseCurrencyARS(displayValue)
    
    if (!isNaN(parsed)) {
      setNumericValue(parsed)
      setDisplayValue(parsed > 0 ? formatCurrencyARS(parsed) : '')
      onChange?.(parsed)
    } else {
      // Revert to last valid value
      setDisplayValue(numericValue > 0 ? formatCurrencyARS(numericValue) : '')
    }
  }, [displayValue, numericValue, onChange])

  const handleFocus = useCallback(() => {
    setIsEditing(true)
    // Mostrar valor numérico para edición fácil
    if (numericValue > 0) {
      setDisplayValue(numericValue.toString().replace('.', ','))
    }
  }, [numericValue])

  return {
    displayValue,
    numericValue,
    handleInputChange,
    handleBlur,
    handleFocus,
    setValue,
    isEditing
  }
}