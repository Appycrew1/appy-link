// src/utils/validation.js

/**
 * Validate email format
 */
export function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

/**
 * Validate URL format
 */
export function isValidUrl(url) {
  try {
    const u = new URL(url);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Validate submission form
 */
export function validateSubmission(values) {
  const errors = {};
  
  // Company name validation
  if (!values.name?.trim()) {
    errors.name = 'Company name is required';
  } else if (values.name.length < 2) {
    errors.name = 'Company name must be at least 2 characters';
  } else if (values.name.length > 100) {
    errors.name = 'Company name must be less than 100 characters';
  }
  
  // Website validation (optional but must be valid if provided)
  if (values.website && !isValidUrl(values.website)) {
    errors.website = 'Please enter a valid URL starting with http:// or https://';
  }
  
  // Description validation
  if (!values.description?.trim()) {
    errors.description = 'Description is required';
  } else if (values.description.length < 10) {
    errors.description = 'Description must be at least 10 characters';
  } else if (values.description.length > 500) {
    errors.description = 'Description must be less than 500 characters';
  }
  
  // Discount validation (optional)
  if (values.discount && values.discount.length > 100) {
    errors.discount = 'Discount description must be less than 100 characters';
  }
  
  return errors;
}

/**
 * Validate contact form
 */
export function validateContact(values) {
  const errors = {};
  
  // Name validation
  if (!values.name?.trim()) {
    errors.name = 'Name is required';
  } else if (values.name.length > 100) {
    errors.name = 'Name must be less than 100 characters';
  }
  
  // Email validation
  if (!values.email?.trim()) {
    errors.email = 'Email is required';
  } else if (!isValidEmail(values.email)) {
    errors.email = 'Please enter a valid email address';
  }
  
  // Message validation
  if (!values.message?.trim()) {
    errors.message = 'Message is required';
  } else if (values.message.length < 10) {
    errors.message = 'Message must be at least 10 characters';
  } else if (values.message.length > 1000) {
    errors.message = 'Message must be less than 1000 characters';
  }
  
  return errors;
}

/**
 * Validate provider data
 */
export function validateProvider(values) {
  const errors = {};
  
  if (!values.name?.trim()) {
    errors.name = 'Provider name is required';
  }
  
  if (!values.category_id) {
    errors.category_id = 'Category is required';
  }
  
  if (values.website && !isValidUrl(values.website)) {
    errors.website = 'Invalid URL format';
  }
  
  if (values.logo && !isValidUrl(values.logo)) {
    errors.logo = 'Invalid logo URL';
  }
  
  return errors;
}

/**
 * Validate category data
 */
export function validateCategory(values) {
  const errors = {};
  
  if (!values.id?.trim()) {
    errors.id = 'Category ID is required';
  } else if (!/^[a-z][a-z0-9_]*$/.test(values.id)) {
    errors.id = 'Category ID must start with a letter and contain only lowercase letters, numbers, and underscores';
  } else if (values.id.length > 50) {
    errors.id = 'Category ID must be less than 50 characters';
  }
  
  if (!values.label?.trim()) {
    errors.label = 'Category label is required';
  } else if (values.label.length > 100) {
    errors.label = 'Category label must be less than 100 characters';
  }
  
  return errors;
}

/**
 * Rate limiting check
 */
export function checkRateLimit(key, limitMs = 30000) {
  const now = Date.now();
  const lastSubmit = parseInt(localStorage.getItem(`rateLimit_${key}`) || '0');
  
  if (now - lastSubmit < limitMs) {
    return {
      allowed: false,
      remainingMs: limitMs - (now - lastSubmit)
    };
  }
  
  return { allowed: true };
}

/**
 * Set rate limit timestamp
 */
export function setRateLimit(key) {
  localStorage.setItem(`rateLimit_${key}`, Date.now().toString());
}
