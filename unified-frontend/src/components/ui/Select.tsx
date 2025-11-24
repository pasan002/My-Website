import { useState, useEffect } from 'react';
import { type ValidationRule, validateField } from '../../lib/validation';

interface SelectProps {
  name: string;
  label: string;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
  required?: boolean;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  validation?: ValidationRule[];
  error?: string;
  disabled?: boolean;
  className?: string;
}

export default function Select({
  name,
  label,
  options,
  placeholder = 'Select an option',
  required = false,
  value,
  defaultValue,
  onChange,
  onBlur,
  validation = [],
  error: externalError,
  disabled = false,
  className = '',
}: SelectProps) {
  const [internalValue, setInternalValue] = useState(value || defaultValue || '');
  const [validationError, setValidationError] = useState<string>('');
  const [touched, setTouched] = useState(false);

  // Use external value if provided, otherwise use internal state
  const currentValue = value !== undefined ? value : internalValue;

  useEffect(() => {
    if (validation.length > 0 && touched) {
      const result = validateField(currentValue, validation);
      setValidationError(result.isValid ? '' : (result.message || ''));
    }
  }, [currentValue, validation, touched]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value;
    setInternalValue(newValue);
    onChange?.(newValue);
    
    // Clear validation error on change
    if (validationError) {
      setValidationError('');
    }
  };

  const handleBlur = () => {
    setTouched(true);
    onBlur?.();
    
    // Validate on blur
    if (validation.length > 0) {
      const result = validateField(currentValue, validation);
      setValidationError(result.isValid ? '' : (result.message || ''));
    }
  };

  const displayError = externalError || validationError;
  const hasError = Boolean(displayError);

  const baseClasses = `mt-1 w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 ${
    hasError 
      ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
      : 'border-gray-300 focus:ring-emerald-500 focus:border-emerald-500'
  } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''} ${className}`;

  return (
    <div>
      <label className="block text-sm text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <select
        name={name}
        required={required}
        value={currentValue}
        onChange={handleChange}
        onBlur={handleBlur}
        disabled={disabled}
        className={baseClasses}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {hasError && (
        <p className="mt-1 text-sm text-red-600">{displayError}</p>
      )}
    </div>
  );
}
