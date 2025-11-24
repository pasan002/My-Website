// Validation utility functions for form inputs

export interface ValidationResult {
  isValid: boolean;
  message?: string;
}

export interface ValidationRule {
  (value: any): ValidationResult;
}

// Email validation
export const validateEmail = (email: string): ValidationResult => {
  if (!email.trim()) {
    return { isValid: false, message: 'Email is required' };
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, message: 'Please enter a valid email address' };
  }
  
  if (email.length > 254) {
    return { isValid: false, message: 'Email address is too long' };
  }
  
  return { isValid: true };
};

// Password validation
export const validatePassword = (password: string): ValidationResult => {
  if (!password) {
    return { isValid: false, message: 'Password is required' };
  }
  
  if (password.length < 8) {
    return { isValid: false, message: 'Password must be at least 8 characters long' };
  }
  
  if (password.length > 128) {
    return { isValid: false, message: 'Password is too long' };
  }
  
  // Check for at least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one uppercase letter' };
  }
  
  // Check for at least one lowercase letter
  if (!/[a-z]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one lowercase letter' };
  }
  
  // Check for at least one number
  if (!/\d/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one number' };
  }
  
  // Check for at least one special character
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one special character' };
  }
  
  return { isValid: true };
};

// Name validation
export const validateName = (name: string): ValidationResult => {
  if (!name.trim()) {
    return { isValid: false, message: 'Name is required' };
  }
  
  if (name.trim().length < 2) {
    return { isValid: false, message: 'Name must be at least 2 characters long' };
  }
  
  if (name.trim().length > 50) {
    return { isValid: false, message: 'Name is too long (maximum 50 characters)' };
  }
  
  // Check for valid characters (letters, spaces, hyphens, apostrophes)
  const nameRegex = /^[a-zA-Z\s\-']+$/;
  if (!nameRegex.test(name.trim())) {
    return { isValid: false, message: 'Name can only contain letters, spaces, hyphens, and apostrophes' };
  }
  
  return { isValid: true };
};

// Amount validation
export const validateAmount = (amount: string | number): ValidationResult => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount)) {
    return { isValid: false, message: 'Amount must be a valid number' };
  }
  
  if (numAmount < 0) {
    return { isValid: false, message: 'Amount cannot be negative' };
  }
  
  if (numAmount > 999999999.99) {
    return { isValid: false, message: 'Amount is too large (maximum: 999,999,999.99)' };
  }
  
  // Check for more than 2 decimal places
  if (typeof amount === 'string' && amount.includes('.')) {
    const decimalPlaces = amount.split('.')[1]?.length || 0;
    if (decimalPlaces > 2) {
      return { isValid: false, message: 'Amount cannot have more than 2 decimal places' };
    }
  }
  
  return { isValid: true };
};

// Date validation
export const validateDate = (date: string, allowFuture: boolean = true): ValidationResult => {
  if (!date) {
    return { isValid: false, message: 'Date is required' };
  }
  
  const inputDate = new Date(date);
  const today = new Date();
  const minDate = new Date('1900-01-01');
  
  if (isNaN(inputDate.getTime())) {
    return { isValid: false, message: 'Please enter a valid date' };
  }
  
  if (inputDate < minDate) {
    return { isValid: false, message: 'Date cannot be before 1900' };
  }
  
  if (!allowFuture && inputDate > today) {
    return { isValid: false, message: 'Date cannot be in the future' };
  }
  
  return { isValid: true };
};

// Category validation
export const validateCategory = (category: string, validCategories: string[]): ValidationResult => {
  if (!category) {
    return { isValid: false, message: 'Category is required' };
  }
  
  if (!validCategories.includes(category)) {
    return { isValid: false, message: 'Please select a valid category' };
  }
  
  return { isValid: true };
};

// Description validation
export const validateDescription = (description: string, required: boolean = false): ValidationResult => {
  if (required && !description.trim()) {
    return { isValid: false, message: 'Description is required' };
  }
  
  if (description.length > 500) {
    return { isValid: false, message: 'Description is too long (maximum 500 characters)' };
  }
  
  return { isValid: true };
};

// File validation
export const validateFile = (file: File | null, options: {
  maxSize?: number; // in MB
  allowedTypes?: string[];
  required?: boolean;
} = {}): ValidationResult => {
  const { maxSize = 10, allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'], required = false } = options;
  
  if (required && !file) {
    return { isValid: false, message: 'File is required' };
  }
  
  if (file) {
    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      return { isValid: false, message: `File size must be less than ${maxSize}MB` };
    }
    
    // Check file type
    if (!allowedTypes.includes(file.type)) {
      return { isValid: false, message: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}` };
    }
    
    // Check file name length
    if (file.name.length > 255) {
      return { isValid: false, message: 'File name is too long' };
    }
  }
  
  return { isValid: true };
};

// Form validation helper
export const validateForm = (data: Record<string, any>, rules: Record<string, ValidationRule[]>): Record<string, string> => {
  const errors: Record<string, string> = {};
  
  for (const [field, fieldRules] of Object.entries(rules)) {
    const value = data[field];
    
    for (const rule of fieldRules) {
      const result = rule(value);
      if (!result.isValid) {
        errors[field] = result.message || 'Invalid value';
        break; // Stop at first error for this field
      }
    }
  }
  
  return errors;
};

// Real-time validation helper
export const validateField = (value: any, rules: ValidationRule[]): ValidationResult => {
  for (const rule of rules) {
    const result = rule(value);
    if (!result.isValid) {
      return result;
    }
  }
  return { isValid: true };
};
