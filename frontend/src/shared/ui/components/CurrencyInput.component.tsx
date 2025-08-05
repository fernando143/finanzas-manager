import { forwardRef } from 'react'
import { useCurrencyInput } from '../../hooks/useCurrencyInput.hook'

interface CurrencyInputProps {
  value?: number
  onChange?: (value: number) => void
  placeholder?: string
  className?: string
  required?: boolean
  disabled?: boolean
  error?: string
  label?: string
  maxDigits?: number
}

export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(({
  value = 0,
  onChange,
  placeholder = "$ 0,00",
  className = "",
  required = false,
  disabled = false,
  error,
  label,
  maxDigits = 10,
  ...props
}, ref) => {
  const {
    displayValue,
    numericValue,
    handleInputChange,
    handleBlur,
    handleFocus,
    isEditing
  } = useCurrencyInput({
    initialValue: value,
    onChange,
    maxDigits
  })

  const inputClasses = `
    w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors
    ${error ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'}
    ${disabled ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'}
    ${className}
  `.trim()

  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        <input
          ref={ref}
          type="text"
          value={displayValue}
          onChange={handleInputChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          placeholder={placeholder}
          className={inputClasses}
          required={required}
          disabled={disabled}
          {...props}
        />
        
        {/* Indicator visual del currency */}
        {!isEditing && numericValue > 0 && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            <span className="text-gray-400 text-sm">ARS</span>
          </div>
        )}
      </div>
      
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  )
})

CurrencyInput.displayName = 'CurrencyInput'