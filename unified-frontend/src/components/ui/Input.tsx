import { useState, useEffect } from 'react';
import { type ValidationRule, validateField } from '../../lib/validation';

interface InputProps {
  name: string;
  label: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'date' | 'file';
  placeholder?: string;
  required?: boolean;
  value?: string | number;
  defaultValue?: string | number;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  validation?: ValidationRule[];
  error?: string;
  disabled?: boolean;
  min?: number | string;
  max?: number | string;
  step?: string;
  accept?: string;
  className?: string;
}

export default function Input({
  name,
  label,
  type = 'text',
  placeholder,
  required = false,
  value,
  defaultValue,
  onChange,
  onBlur,
  validation = [],
  error: externalError,
  disabled = false,
  min,
  max,
  step,
  accept,
  className = '',
}: InputProps) {
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        value={currentValue}
        onChange={handleChange}
        onBlur={handleBlur}
        disabled={disabled}
        min={min}
        max={max}
        step={step}
        accept={accept}
        className={baseClasses}
      />
      {hasError && (
        <p className="mt-1 text-sm text-red-600">{displayError}</p>
      )}
    </div>
  );
}
